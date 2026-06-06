import { redirect, notFound } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { apiClient } from '@/lib/api-client';
import { FormProducto } from '@/components/inventario/FormProducto';
import type { CreateProductoDto } from '@posta/validation';

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;

  if (rol !== 'dueno') redirect('/inventario');

  const { id } = await params;
  const { data: producto } = await apiClient<{ data: CreateProductoDto & { id: string } }>(
    `/inventario/productos/${id}`,
    { token: accessToken },
  ).catch(() => ({ data: null }));

  if (!producto) notFound();

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-serif text-2xl text-ink mb-6">Editar producto</h1>
        <FormProducto
          token={accessToken}
          productoInicial={producto}
        />
      </div>
    </div>
  );
}
