import Link from 'next/link';
import { APrice } from '@/components/ui';
import { StockBadge } from './StockBadge';
import { BtnEliminar } from './BtnEliminar';
import type { Rol } from '@posta/shared-types';

interface Producto {
  id: string;
  nombre: string;
  sku?: string | null;
  precio: string;
  costo?: string;
  stock_actual: number;
  stock_minimo: number;
  activo: boolean;
}

interface TablaProductosProps {
  productos: Producto[];
  rol: Rol;
  token: string;
  compact?: boolean;
}

const accionClass = 'font-sans text-xs text-muted hover:text-accent transition-colors';

export function TablaProductos({ productos, rol, token, compact = false }: TablaProductosProps) {
  const mostrarCosto = rol === 'dueno';
  const puedeEditar = rol === 'dueno';
  const puedeVerMovimientos = rol === 'dueno' || rol === 'contador';
  const cellPy = compact ? 'py-2' : 'py-3';
  const headPy = compact ? 'py-1.5' : 'py-2';
  const nombreClass = compact ? 'font-sans text-xs text-ink' : 'font-sans text-sm text-ink';
  const precioClass = compact ? 'text-sm' : 'text-base';

  if (productos.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-sans text-muted text-sm">
          No hay productos todavía.{' '}
          {puedeEditar && (
            <Link href="/inventario/nuevo" className="text-accent hover:underline">
              Crear el primero
            </Link>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 md:mx-0">
      <table className="w-full min-w-[640px]">
        <thead>
          <tr className="border-b border-rule">
            <th className={`text-left ${headPy} px-4 font-mono text-[11px] uppercase tracking-wider text-muted`}>
              Producto
            </th>
            <th className={`text-left ${headPy} px-4 font-mono text-[11px] uppercase tracking-wider text-muted`}>
              SKU
            </th>
            <th className={`text-right ${headPy} px-4 font-mono text-[11px] uppercase tracking-wider text-muted`}>
              Precio
            </th>
            {mostrarCosto && (
              <th className={`text-right ${headPy} px-4 font-mono text-[11px] uppercase tracking-wider text-muted`}>
                Costo
              </th>
            )}
            <th className={`text-center ${headPy} px-4 font-mono text-[11px] uppercase tracking-wider text-muted`}>
              Stock
            </th>
            <th className={`text-center ${headPy} px-4 font-mono text-[11px] uppercase tracking-wider text-muted`}>
              Estado
            </th>
            <th className={`${headPy} px-4`} />
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr
              key={p.id}
              className="border-b border-rule-soft hover:bg-paper-warm transition-colors"
            >
              <td className={`${cellPy} px-4`}>
                <span className={nombreClass}>{p.nombre}</span>
              </td>
              <td className={`${cellPy} px-4`}>
                <span className="font-mono text-xs text-muted">{p.sku ?? '—'}</span>
              </td>
              <td className={`${cellPy} px-4 text-right`}>
                <APrice value={p.precio} className={precioClass} />
              </td>
              {mostrarCosto && (
                <td className={`${cellPy} px-4 text-right`}>
                  {p.costo ? <APrice value={p.costo} className="text-sm" /> : '—'}
                </td>
              )}
              <td className={`${cellPy} px-4 text-center`}>
                <span className={`font-mono text-ink ${compact ? 'text-xs' : 'text-sm'}`}>{p.stock_actual}</span>
                {p.stock_minimo > 0 && (
                  <span className="font-mono text-[10px] text-muted ml-1">
                    / {p.stock_minimo}
                  </span>
                )}
              </td>
              <td className={`${cellPy} px-4 text-center`}>
                <StockBadge stockActual={p.stock_actual} stockMinimo={p.stock_minimo} />
              </td>
              <td className={`${cellPy} px-4`}>
                <div className="flex items-center justify-end gap-3">
                  {puedeVerMovimientos && (
                    <Link href={`/inventario/${p.id}/movimientos`} className={accionClass}>
                      Movimientos
                    </Link>
                  )}
                  {puedeEditar && (
                    <>
                      <Link href={`/inventario/${p.id}/editar`} className={accionClass}>
                        Editar
                      </Link>
                      <BtnEliminar
                        productoId={p.id}
                        nombreProducto={p.nombre}
                        token={token}
                      />
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
