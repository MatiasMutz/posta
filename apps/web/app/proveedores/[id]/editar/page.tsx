import { redirect, notFound } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { FormProveedor } from '@/components/proveedores/FormProveedor';
import type { ApiResponse } from '@posta/shared-types';
import type { CreateProveedorDto } from '@posta/validation';

export default async function EditarProveedorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sesion = await requireSesion();
  if (sesion.rol !== 'dueno') redirect('/proveedores');

  const { id } = await params;

  try {
    const res = await apiClient<ApiResponse<CreateProveedorDto & { id: string }>>(
      `/proveedores/${id}`,
      { token: sesion.accessToken },
    );
    const p = res.data;

    return (
      <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
        <div className="max-w-2xl mx-auto px-4 pt-8">
          <h1 className="font-serif text-2xl text-ink mb-6">Editar proveedor</h1>
          <FormProveedor
            token={sesion.accessToken}
            proveedorInicial={{
              id: p.id,
              nombre: p.nombre,
              email: p.email ?? undefined,
              telefono: p.telefono ?? undefined,
              cuit: p.cuit ?? undefined,
              direccion: p.direccion ?? undefined,
            }}
          />
        </div>
      </div>
    );
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 404) notFound();
    throw err;
  }
}
