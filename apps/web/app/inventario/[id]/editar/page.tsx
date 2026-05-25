import { redirect, notFound } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import { apiClient } from '@/lib/api-client';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { FormProducto } from '@/components/inventario/FormProducto';
import type { CreateProductoDto } from '@posta/validation';

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect('/login');

  const rol = session.user.app_metadata?.rol;
  if (rol !== 'dueno') redirect('/inventario');

  const { id } = await params;
  const { data: producto } = await apiClient<{ data: CreateProductoDto & { id: string } }>(
    `/inventario/productos/${id}`,
    { token: session.access_token },
  ).catch(() => ({ data: null }));

  if (!producto) notFound();

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-serif text-2xl text-ink mb-6">Editar producto</h1>
        <FormProducto
          token={session.access_token}
          productoInicial={producto}
        />
      </div>
    </div>
  );
}
