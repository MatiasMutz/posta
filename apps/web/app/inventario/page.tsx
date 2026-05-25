import Link from 'next/link';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import { apiClient, ApiError } from '@/lib/api-client';
import { LIMITE_PAGINA_DEFAULT, parsePagina } from '@/lib/paginacion';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { TablaProductos } from '@/components/inventario/TablaProductos';
import { BuscadorProductos } from '@/components/inventario/BuscadorProductos';
import { ABtn, APaginacion } from '@/components/ui';
import type { ApiResponse, Rol } from '@posta/shared-types';

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

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: Promise<{ solo_bajo_stock?: string; buscar?: string; pagina?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect('/login');

  const params = await searchParams;
  const pagina = parsePagina(params.pagina);
  const query = new URLSearchParams({
    pagina: String(pagina),
    limite: String(LIMITE_PAGINA_DEFAULT),
    ...(params.solo_bajo_stock === '1' ? { solo_bajo_stock: 'true' } : {}),
    ...(params.buscar ? { buscar: params.buscar } : {}),
  });

  let productos: Producto[] = [];
  let total = 0;
  let errorMensaje: string | null = null;

  try {
    const result = await apiClient<ApiResponse<Producto[]>>(
      `/inventario/productos?${query}`,
      { token: session.access_token },
    );
    productos = result.data;
    total = result.meta?.total ?? productos.length;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      const msg = encodeURIComponent(err.message);
      redirect(`/login?error=${msg}`);
    }
    errorMensaje = err instanceof Error ? err.message : 'Error al cargar el inventario.';
  }

  const rol = (session.user.app_metadata?.rol ?? 'vendedor') as Rol;
  const soloBajoStock = params.solo_bajo_stock === '1';

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />

      <div className="max-w-5xl mx-auto px-4 pt-8">
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">Inventario</h1>
            <p className="font-sans text-sm text-muted">
              {total} producto{total !== 1 ? 's' : ''}
            </p>
          </div>
          {rol === 'dueno' && (
            <Link href="/inventario/nuevo">
              <ABtn variant="primary" size="sm">+ Nuevo producto</ABtn>
            </Link>
          )}
        </div>

        {/* Error al cargar */}
        {errorMensaje && (
          <div className="bg-err-soft border border-err rounded-[2px] px-4 py-3 mb-4">
            <p className="font-sans text-sm text-err">{errorMensaje}</p>
          </div>
        )}

        {/* Barra de herramientas: filtros + búsqueda */}
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <div className="flex gap-2">
            <Link
              href="/inventario"
              className={[
                'font-sans text-xs px-3 py-1 rounded-[2px] border transition-colors',
                !soloBajoStock
                  ? 'bg-ink text-card border-ink'
                  : 'bg-card text-muted border-rule hover:border-ink-soft',
              ].join(' ')}
            >
              Todos
            </Link>
            <Link
              href="/inventario?solo_bajo_stock=1"
              className={[
                'font-sans text-xs px-3 py-1 rounded-[2px] border transition-colors',
                soloBajoStock
                  ? 'bg-ink text-card border-ink'
                  : 'bg-card text-muted border-rule hover:border-ink-soft',
              ].join(' ')}
            >
              Stock bajo
            </Link>
          </div>

          {/* BuscadorProductos usa useSearchParams → necesita Suspense */}
          <Suspense fallback={null}>
            <BuscadorProductos />
          </Suspense>
        </div>

        {/* Tabla */}
        <div
          className="bg-card rounded-[2px] border border-rule"
          style={{ boxShadow: 'var(--shadow-flat)' }}
        >
          <TablaProductos productos={productos} rol={rol} token={session.access_token} />
          <Suspense fallback={null}>
            <APaginacion pagina={pagina} limite={LIMITE_PAGINA_DEFAULT} total={total} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
