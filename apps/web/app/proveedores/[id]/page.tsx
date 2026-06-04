import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { LIMITE_PAGINA_DEFAULT } from '@/lib/paginacion';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { APrice, ABtn } from '@/components/ui';
import { esPositivo } from '@/lib/money';
import type { ApiResponse } from '@posta/shared-types';

interface Proveedor {
  id: string;
  nombre: string;
  email?: string | null;
  telefono?: string | null;
  cuit?: string | null;
  direccion?: string | null;
  saldo_acreedor: string;
}

interface CompraRow {
  id: string;
  categoria: string;
  total: string;
  metodo_pago: string;
  created_at: string;
}

export default async function ProveedorDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await requireSesion();
  if (sesion.rol === 'vendedor') redirect('/ventas');

  const { id } = await params;

  try {
    const [provRes, comprasRes] = await Promise.all([
      apiClient<ApiResponse<Proveedor>>(`/proveedores/${id}`, { token: sesion.accessToken }),
      apiClient<ApiResponse<CompraRow[]>>(
        `/compras?proveedor_id=${id}&pagina=1&limite=${LIMITE_PAGINA_DEFAULT}`,
        { token: sesion.accessToken },
      ),
    ]);

    const proveedor = provRes.data;
    const compras = comprasRes.data;
    const totalCompras = comprasRes.meta?.total ?? compras.length;

    return (
      <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
        <NavFlotante />
        <div className="max-w-3xl mx-auto px-4 pt-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="font-serif text-2xl text-ink">{proveedor.nombre}</h1>
              {proveedor.cuit && (
                <p className="font-sans text-sm text-muted">CUIT {proveedor.cuit}</p>
              )}
            </div>
            {sesion.rol === 'dueno' && (
              <div className="flex gap-2">
                <Link href={`/compras/nueva?proveedor=${id}`}>
                  <ABtn variant="primary" size="sm">Registrar compra</ABtn>
                </Link>
                <Link href={`/proveedores/${id}/editar`}>
                  <ABtn variant="ghost" size="sm">Editar</ABtn>
                </Link>
              </div>
            )}
          </div>

          <div className="bg-card border border-rule rounded-[2px] p-4 mb-6">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted mb-1">Saldo acreedor</p>
            {esPositivo(proveedor.saldo_acreedor) ? (
              <APrice value={proveedor.saldo_acreedor} className="text-xl text-warn" />
            ) : (
              <p className="font-sans text-sm text-muted">Sin deuda registrada</p>
            )}
            <p className="font-sans text-xs text-muted mt-2">Lo que tu negocio debe a este proveedor.</p>
          </div>

          <h2 className="font-serif text-lg text-ink mb-3">
            Historial de compras ({totalCompras})
          </h2>
          <div className="space-y-2">
            {compras.map((c) => (
              <Link
                key={c.id}
                href={`/compras/historial`}
                className="block bg-card border border-rule rounded-[2px] px-4 py-3 hover:border-ink-soft"
              >
                <div className="flex justify-between items-center">
                  <span className="font-sans text-sm text-ink capitalize">{c.categoria}</span>
                  <APrice value={c.total} className="text-sm" />
                </div>
                <p className="font-sans text-xs text-muted mt-1">
                  {new Date(c.created_at).toLocaleDateString('es-AR')}
                </p>
              </Link>
            ))}
            {compras.length === 0 && (
              <p className="font-sans text-sm text-muted">Sin compras registradas.</p>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) notFound();
    throw err;
  }
}
