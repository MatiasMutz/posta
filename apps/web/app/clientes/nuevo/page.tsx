import { redirect } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { FormCliente } from '@/components/clientes/FormCliente';

export default async function NuevoClientePage() {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;

  if (rol !== 'dueno') redirect('/clientes');

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-serif text-2xl text-ink mb-6">Nuevo cliente</h1>
        <FormCliente token={accessToken} />
      </div>
    </div>
  );
}
