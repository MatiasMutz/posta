'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import { DropZone } from './DropZone';
import { MapeadorColumnas } from './MapeadorColumnas';
import { ABtn } from '@/components/ui';
import type { ColumnaMapeo } from '@posta/validation';

type TipoImport = 'inventario' | 'clientes' | 'proveedores';
type Paso = 'seleccion' | 'mapeando' | 'confirmando' | 'error';

interface Sugerencia {
  headerArchivo: string;
  campoSugerido: string | null;
  confianza: number;
}

interface AnalizarResponse {
  headers: string[];
  sugerencias: Sugerencia[];
  camposDisponibles: string[];
}

interface FlujoImportacionProps {
  token: string;
}

const TIPO_LABELS: Record<TipoImport, string> = {
  inventario: 'Inventario (productos)',
  clientes: 'Clientes',
  proveedores: 'Proveedores (saldos iniciales)',
};

export function FlujoImportacion({ token }: FlujoImportacionProps) {
  const router = useRouter();
  const [paso, setPaso] = useState<Paso>('seleccion');
  const [tipo, setTipo] = useState<TipoImport>('inventario');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [storagePath, setStoragePath] = useState('');
  const [analisis, setAnalisis] = useState<AnalizarResponse | null>(null);
  const [mapeo, setMapeo] = useState<ColumnaMapeo[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function handleArchivo(file: File) {
    setCargando(true);
    setError('');
    setArchivo(file);

    try {
      // 1. Obtener URL firmada de subida
      const { data: uploadData } = await apiClient<{ data: { uploadUrl: string; storagePath: string } }>(
        `/imports/upload-url?filename=${encodeURIComponent(file.name)}&tipo=${tipo}`,
        { token },
      );
      const { uploadUrl, storagePath: path } = uploadData;

      // 2. Subir archivo directo a Supabase Storage con la URL firmada
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      });
      if (!uploadRes.ok) throw new Error('No se pudo subir el archivo. Intentá de nuevo.');
      setStoragePath(path);

      // 3. Analizar encabezados y obtener sugerencias de mapeo
      const { data: datos } = await apiClient<{ data: AnalizarResponse }>('/imports/analizar', {
        method: 'POST',
        token,
        body: JSON.stringify({ storagePath: path, tipo }),
      });
      setAnalisis(datos);

      // Inicializar el mapeo con las sugerencias
      const mapeoInicial: ColumnaMapeo[] = datos.sugerencias.map(s => ({
        headerArchivo: s.headerArchivo,
        campo: s.campoSugerido,
      }));
      setMapeo(mapeoInicial);
      setPaso('mapeando');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo.');
    } finally {
      setCargando(false);
    }
  }

  async function handleConfirmar() {
    setCargando(true);
    setError('');
    try {
      const { data } = await apiClient<{ data: { jobId: string } }>('/imports', {
        method: 'POST',
        token,
        body: JSON.stringify({ storagePath, tipo, columnMap: mapeo }),
      });
      router.push(`/importar/${data.jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar la importación.');
      setCargando(false);
    }
  }

  function handleVolver() {
    setPaso('seleccion');
    setArchivo(null);
    setStoragePath('');
    setAnalisis(null);
    setMapeo([]);
    setError('');
  }

  return (
    <div className="space-y-6">
      {paso === 'seleccion' && (
        <>
          {/* Selector de tipo */}
          <div>
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted mb-2">¿Qué vas a importar?</p>
            <div className="flex gap-2">
              {(Object.entries(TIPO_LABELS) as [TipoImport, string][]).map(([t, label]) => (
                <button
                  key={t}
                  onClick={() => setTipo(t)}
                  className={[
                    'px-4 py-2 font-sans text-sm rounded-[2px] border transition-colors',
                    tipo === t
                      ? 'bg-ink text-card border-ink'
                      : 'bg-card text-muted border-rule hover:border-ink-soft',
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <DropZone onArchivo={handleArchivo} cargando={cargando} />

          {error && (
            <div
              role="alert"
              className="font-sans text-sm px-4 py-3 rounded-[2px]"
              style={{ color: 'var(--color-err)', background: 'var(--color-err-soft)', border: '1px solid var(--color-err)' }}
            >
              {error}
            </div>
          )}
        </>
      )}

      {paso === 'mapeando' && analisis && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-sans text-sm text-ink font-medium">{archivo?.name}</p>
              <p className="font-sans text-xs text-muted">{analisis.headers.length} columnas encontradas · {TIPO_LABELS[tipo]}</p>
            </div>
            <button onClick={handleVolver} className="font-sans text-xs text-muted hover:text-ink transition-colors">
              ← Cambiar archivo
            </button>
          </div>

          <MapeadorColumnas
            sugerencias={analisis.sugerencias}
            camposDisponibles={analisis.camposDisponibles}
            mapeoActual={mapeo}
            onChange={setMapeo}
          />

          {error && (
            <div
              role="alert"
              className="font-sans text-sm px-4 py-3 rounded-[2px]"
              style={{ color: 'var(--color-err)', background: 'var(--color-err-soft)', border: '1px solid var(--color-err)' }}
            >
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <ABtn
              variant="primary"
              onClick={handleConfirmar}
              disabled={cargando || mapeo.every(m => m.campo === null)}
            >
              {cargando ? 'Iniciando...' : 'Importar'}
            </ABtn>
            <ABtn variant="ghost" onClick={handleVolver} disabled={cargando}>
              Cancelar
            </ABtn>
          </div>
        </>
      )}
    </div>
  );
}
