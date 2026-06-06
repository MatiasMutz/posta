import { redirect } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { FormProducto } from '@/components/inventario/FormProducto';

export default async function NuevoProductoPage() {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;

  if (rol !== 'dueno') redirect('/inventario');

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-serif text-2xl text-ink mb-6">Nuevo producto</h1>
        <FormProducto token={accessToken} />
      </div>
    </div>
  );
}
