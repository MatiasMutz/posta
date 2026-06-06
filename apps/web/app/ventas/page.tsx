import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { POS } from '@/components/ventas/POS';
import type { ApiResponse } from '@posta/shared-types';

interface Producto {
  id: string;
  nombre: string;
  sku?: string | null;
  precio: string;
  stock_actual: number;
}

interface Cliente {
  id: string;
  nombre: string;
  cuit?: string | null;
  saldo_deudor: string;
}

interface VentasPageProps {
  searchParams: Promise<{ buscar?: string; cliente?: string }>;
}

export default async function VentasPage({ searchParams }: VentasPageProps) {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;
  const { buscar: buscarProducto, cliente: buscarCliente } = await searchParams;

  if (rol === 'contador') redirect('/ventas/historial');

  let productos: Producto[] = [];
  let clientes: Cliente[] = [];
  let errorMensaje: string | null = null;

  const productosQuery = new URLSearchParams({ pagina: '1', limite: '200' });
  if (buscarProducto) productosQuery.set('buscar', buscarProducto);

  const clientesQuery = new URLSearchParams({ pagina: '1', limite: '200' });
  if (buscarCliente) clientesQuery.set('buscar', buscarCliente);

  try {
    const [productosRes, clientesRes] = await Promise.all([
      apiClient<ApiResponse<Producto[]>>(`/inventario/productos?${productosQuery}`, { token: accessToken }),
      apiClient<ApiResponse<Cliente[]>>(`/clientes?${clientesQuery}`, { token: accessToken }),
    ]);
    productos = productosRes.data;
    clientes = clientesRes.data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    errorMensaje = err instanceof Error ? err.message : 'Error al cargar el catálogo.';
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl text-ink">Punto de venta</h1>
          {rol !== 'vendedor' && (
            <Link href="/ventas/historial" className="font-sans text-xs text-muted hover:text-accent transition-colors">
              Ver historial →
            </Link>
          )}
        </div>

        {errorMensaje && (
          <div className="bg-err-soft border border-err rounded-[2px] px-4 py-3 mb-4">
            <p className="font-sans text-sm text-err">{errorMensaje}</p>
          </div>
        )}

        <POS
          productos={productos}
          clientes={clientes}
          token={accessToken}
          buscarInicial={buscarProducto ?? ''}
        />
      </div>
    </div>
  );
}
