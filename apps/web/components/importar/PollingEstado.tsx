'use client';
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import { BarraProgreso } from './BarraProgreso';
import { GrillaRevision } from './GrillaRevision';
import { ABtn } from '@/components/ui';
import Link from 'next/link';

interface EstadoJob {
  jobId: string;
  tipo: string;
  estado: string;
  fase?: string | null;
  progreso: number;
  total: number;
  filasOk: number;
  filasError: number;
  errores?: FilaConError[];
}

interface FilaConError {
  numero: number;
  datos: Record<string, string | undefined>;
  problemas: Array<{ campo: string; valor: unknown; motivo: string }>;
}

const POLL_INTERVAL_MS = 2000;
const ESTADOS_FINALES = new Set(['completado', 'error']);

interface PollingEstadoProps {
  jobId: string;
  token: string;
}

export function PollingEstado({ jobId, token }: PollingEstadoProps) {
  const [estado, setEstado] = useState<EstadoJob | null>(null);
  const [errorPoll, setErrorPoll] = useState('');
  const [reimportados, setReimportados] = useState(0);

  const fetchEstado = useCallback(async () => {
    try {
      const data = await apiClient<EstadoJob>(`/imports/${jobId}/estado`, { token });
      setEstado(data);
      return data;
    } catch (err) {
      setErrorPoll(err instanceof Error ? err.message : 'Error al obtener el estado.');
      return null;
    }
  }, [jobId, token]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const data = await fetchEstado();
      if (data && !ESTADOS_FINALES.has(data.estado)) {
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    poll();
    return () => clearTimeout(timer);
  }, [fetchEstado]);

  if (errorPoll) {
    return (
      <div
        role="alert"
        className="font-sans text-sm px-4 py-3 rounded-[2px]"
        style={{ color: 'var(--color-err)', background: 'var(--color-err-soft)', border: '1px solid var(--color-err)' }}
      >
        {errorPoll}
      </div>
    );
  }

  if (!estado) {
    return <p className="font-sans text-sm text-muted animate-pulse">Iniciando importación...</p>;
  }

  const finalizado = ESTADOS_FINALES.has(estado.estado);
  const exitoTotal = estado.estado === 'completado' && (estado.filasError + (estado.errores?.length ?? 0)) === 0;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-rule rounded-[2px] p-6" style={{ boxShadow: 'var(--shadow-flat)' }}>
        <BarraProgreso
          estado={estado.estado}
          fase={estado.fase}
          progreso={estado.progreso}
          total={estado.total}
          filasOk={estado.filasOk + reimportados}
          filasError={estado.filasError}
        />
      </div>

      {/* Resultado exitoso */}
      {exitoTotal && (
        <div
          className="font-sans text-sm px-4 py-3 rounded-[2px]"
          style={{ color: 'var(--color-ok)', background: 'var(--color-ok-soft)', border: '1px solid var(--color-ok)' }}
        >
          Se importaron {estado.filasOk + reimportados} registros correctamente.
        </div>
      )}

      {/* Grilla de corrección */}
      {finalizado && estado.errores && estado.errores.length > 0 && (
        <GrillaRevision
          jobId={jobId}
          token={token}
          errores={estado.errores}
          onExito={(n) => {
            setReimportados(prev => prev + n);
            setEstado(prev => prev ? { ...prev, errores: [] } : prev);
          }}
        />
      )}

      {/* Acciones al finalizar */}
      {finalizado && (
        <div className="flex gap-3">
          <Link href={estado.tipo === 'inventario' ? '/inventario' : '/inventario'}>
            <ABtn variant="primary" size="sm">Ver {estado.tipo}</ABtn>
          </Link>
          <Link href="/importar">
            <ABtn variant="secondary" size="sm">Nueva importación</ABtn>
          </Link>
        </div>
      )}
    </div>
  );
}
