import { redirect, notFound } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { apiClient } from '@/lib/api-client';
import { FormCliente } from '@/components/clientes/FormCliente';
import type { CreateClienteDto } from '@posta/validation';

interface Cliente extends CreateClienteDto {
  id: string;
}

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;

  if (rol !== 'dueno') redirect('/clientes');

  const { id } = await params;
  let cliente: Cliente | null = null;
  try {
    const res = await apiClient<{ data: Cliente }>(`/clientes/${id}`, { token: accessToken });
    cliente = res.data;
  } catch {
    cliente = null;
  }

  if (!cliente) notFound();

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-serif text-2xl text-ink mb-6">Editar cliente</h1>
        <FormCliente
          token={accessToken}
          clienteInicial={{
            id: cliente.id,
            nombre: cliente.nombre,
            email: cliente.email ?? undefined,
            telefono: cliente.telefono ?? undefined,
            cuit: cliente.cuit ?? undefined,
            direccion: cliente.direccion ?? undefined,
          }}
        />
      </div>
    </div>
  );
}
