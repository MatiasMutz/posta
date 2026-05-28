'use client';
import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { ABtn } from '@/components/ui';

interface Problema {
  campo: string;
  valor: unknown;
  motivo: string;
}

interface FilaConError {
  numero: number;
  datos: Record<string, string | undefined>;
  problemas: Problema[];
}

interface GrillaRevisionProps {
  jobId: string;
  token: string;
  errores: FilaConError[];
  onExito: (importados: number) => void;
}

export function GrillaRevision({ jobId, token, errores, onExito }: GrillaRevisionProps) {
  const [filas, setFilas] = useState<FilaConError[]>(errores);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  if (filas.length === 0) return null;

  const camposConError = Array.from(
    new Set(filas.flatMap(f => f.problemas.map(p => p.campo)))
  );

  function handleEditar(numero: number, campo: string, valor: string) {
    setFilas(prev =>
      prev.map(f =>
        f.numero === numero
          ? { ...f, datos: { ...f.datos, [campo]: valor } }
          : f,
      ),
    );
  }

  async function handleReintento() {
    setEnviando(true);
    setError('');
    try {
      const { data } = await apiClient<{ data: { importados: number; erroresResidual: number } }>(
        `/imports/${jobId}/reintento`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({
            correcciones: filas.map(f => ({ numero: f.numero, datos: f.datos })),
          }),
        },
      );
      const { importados, erroresResidual } = data;
      if (erroresResidual === 0) {
        setFilas([]);
      }
      onExito(importados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reimportar las filas.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="space-y-4" aria-label="Corrección de filas con errores">
      <div className="flex items-center justify-between">
        <p id="grilla-revision-titulo" className="font-sans text-sm text-ink">
          <span className="text-err font-medium">{filas.length}</span> fila{filas.length !== 1 ? 's' : ''} con errores — corregí los campos en rojo y reimportá.
        </p>
      </div>

      <div className="bg-card border border-rule rounded-[2px] overflow-x-auto" style={{ boxShadow: 'var(--shadow-flat)' }}>
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-rule">
              <th className="text-left py-2 px-3 font-mono text-[11px] uppercase tracking-wider text-muted w-12">
                Fila
              </th>
              {camposConError.map(campo => (
                <th key={campo} className="text-left py-2 px-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                  {campo}
                </th>
              ))}
              <th className="text-left py-2 px-3 font-mono text-[11px] uppercase tracking-wider text-muted">
                Problema
              </th>
            </tr>
          </thead>
          <tbody>
            {filas.map(fila => {
              const camposError = new Set(fila.problemas.map(p => p.campo));
              return (
                <tr key={fila.numero} className="border-b border-rule-soft">
                  <td className="py-2 px-3">
                    <span className="font-mono text-xs text-muted">{fila.numero}</span>
                  </td>
                  {camposConError.map(campo => {
                    const tieneError = camposError.has(campo);
                    return (
                      <td key={campo} className="py-2 px-3">
                        <input
                          value={fila.datos[campo] ?? ''}
                          onChange={(e) => handleEditar(fila.numero, campo, e.target.value)}
                          aria-label={`${campo}, fila ${fila.numero}`}
                          aria-invalid={tieneError}
                          aria-describedby={tieneError ? `err-${fila.numero}-${campo}` : undefined}
                          className={[
                            'w-full px-2 py-1 font-sans text-xs rounded-[2px] border focus:outline-none',
                            tieneError
                              ? 'border-err bg-err-soft text-err focus:border-err'
                              : 'border-rule bg-card text-ink focus:border-accent',
                          ].join(' ')}
                        />
                      </td>
                    );
                  })}
                  <td className="py-2 px-3">
                    <ul className="space-y-0.5">
                      {fila.problemas.map((p, i) => (
                        <li
                          key={i}
                          id={i === 0 ? `err-${fila.numero}-${p.campo}` : undefined}
                          className="font-sans text-xs text-err"
                        >
                          <span className="font-medium">{p.campo}:</span> {p.motivo}
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {error && (
        <p className="font-sans text-sm text-err">{error}</p>
      )}

      <ABtn variant="primary" onClick={handleReintento} disabled={enviando}>
        {enviando ? 'Reimportando...' : `Reimportar ${filas.length} fila${filas.length !== 1 ? 's' : ''}`}
      </ABtn>
    </section>
  );
}
