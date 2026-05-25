'use client';
import type { ColumnaMapeo } from '@posta/validation';

interface Sugerencia {
  headerArchivo: string;
  campoSugerido: string | null;
  confianza: number;
}

interface MapeadorColumnasProps {
  sugerencias: Sugerencia[];
  camposDisponibles: string[];
  onChange: (mapeo: ColumnaMapeo[]) => void;
  mapeoActual: ColumnaMapeo[];
}

const LABEL_CAMPOS: Record<string, string> = {
  nombre: 'Nombre',
  sku: 'SKU',
  codigo_barras: 'Código de barras',
  costo: 'Costo',
  precio: 'Precio de venta',
  stock_inicial: 'Stock inicial',
  stock_minimo: 'Stock mínimo',
  email: 'Email',
  telefono: 'Teléfono',
  cuit: 'CUIT',
  direccion: 'Dirección',
};

function ConfianzaBadge({ confianza, mapeado }: { confianza: number; mapeado: boolean }) {
  if (!mapeado) return <span className="font-sans text-xs text-muted">Sin mapear</span>;
  if (confianza >= 0.95) return <span className="font-sans text-xs text-ok">Auto ✓</span>;
  if (confianza >= 0.80) return <span className="font-sans text-xs text-warn">Sugerido</span>;
  return null;
}

export function MapeadorColumnas({ sugerencias, camposDisponibles, onChange, mapeoActual }: MapeadorColumnasProps) {
  const camposUsados = new Set(mapeoActual.map(m => m.campo).filter(Boolean));

  function handleChange(headerArchivo: string, nuevoCampo: string) {
    const updatedMapeo = mapeoActual.map(m =>
      m.headerArchivo === headerArchivo
        ? { ...m, campo: nuevoCampo === '__skip__' ? null : nuevoCampo }
        : m,
    );
    onChange(updatedMapeo);
  }

  return (
    <div>
      <p className="font-sans text-sm text-muted mb-4">
        Revisá el mapeo de columnas. Las sugerencias automáticas con alta confianza ya están seleccionadas.
      </p>

      <div className="bg-card border border-rule rounded-[2px] overflow-x-auto" style={{ boxShadow: 'var(--shadow-flat)' }}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-rule">
              <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">
                Columna en el archivo
              </th>
              <th className="text-left py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted">
                Campo destino
              </th>
              <th className="py-2 px-4 font-mono text-[11px] uppercase tracking-wider text-muted" />
            </tr>
          </thead>
          <tbody>
            {mapeoActual.map((m) => {
              const sugerencia = sugerencias.find(s => s.headerArchivo === m.headerArchivo);
              const valorSelect = m.campo ?? '__skip__';
              return (
                <tr key={m.headerArchivo} className="border-b border-rule-soft">
                  <td className="py-2 px-4">
                    <span className="font-mono text-sm text-ink">{m.headerArchivo}</span>
                  </td>
                  <td className="py-2 px-4">
                    <select
                      value={valorSelect}
                      onChange={(e) => handleChange(m.headerArchivo, e.target.value)}
                      className="w-full px-2 py-1.5 font-sans text-sm text-ink bg-paper border border-rule rounded-[2px] focus:outline-none focus:border-accent"
                    >
                      <option value="__skip__">No importar</option>
                      {camposDisponibles.map(campo => (
                        <option
                          key={campo}
                          value={campo}
                          disabled={camposUsados.has(campo) && m.campo !== campo}
                        >
                          {LABEL_CAMPOS[campo] ?? campo}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <ConfianzaBadge
                      confianza={sugerencia?.confianza ?? 0}
                      mapeado={m.campo !== null}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
