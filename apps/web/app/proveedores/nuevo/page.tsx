import { redirect } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { FormProveedor } from '@/components/proveedores/FormProveedor';

export default async function NuevoProveedorPage() {
  const sesion = await requireSesion();
  if (sesion.rol !== 'dueno') redirect('/proveedores');

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-serif text-2xl text-ink mb-6">Nuevo proveedor</h1>
        <FormProveedor token={sesion.accessToken} />
      </div>
    </div>
  );
}
