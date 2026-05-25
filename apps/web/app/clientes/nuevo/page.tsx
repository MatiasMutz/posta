import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { FormCliente } from '@/components/clientes/FormCliente';

export default async function NuevoClientePage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const rol = session.user.app_metadata?.rol;
  if (rol !== 'dueno') redirect('/clientes');

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-serif text-2xl text-ink mb-6">Nuevo cliente</h1>
        <FormCliente token={session.access_token} />
      </div>
    </div>
  );
}
