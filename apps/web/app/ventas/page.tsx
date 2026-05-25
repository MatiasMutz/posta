import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '@/lib/supabase/server';
import { apiClient, ApiError } from '@/lib/api-client';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { POS } from '@/components/ventas/POS';
import type { ApiResponse, Rol } from '@posta/shared-types';

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

export default async function VentasPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const rol = (session.user.app_metadata?.rol ?? 'vendedor') as Rol;
  if (rol === 'contador') redirect('/ventas/historial');

  let productos: Producto[] = [];
  let clientes: Cliente[] = [];

  try {
    const [productosRes, clientesRes] = await Promise.all([
      apiClient<ApiResponse<Producto[]>>('/inventario/productos?pagina=1&limite=200', { token: session.access_token }),
      apiClient<ApiResponse<Cliente[]>>('/clientes?pagina=1&limite=200', { token: session.access_token }),
    ]);
    productos = productosRes.data;
    clientes = clientesRes.data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-5xl mx-auto px-4 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-2xl text-ink">Punto de venta</h1>
          <Link href="/ventas/historial" className="font-sans text-xs text-muted hover:text-accent transition-colors">
            Ver historial →
          </Link>
        </div>
        <POS productos={productos} clientes={clientes} token={session.access_token} />
      </div>
    </div>
  );
}
