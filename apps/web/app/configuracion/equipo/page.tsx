import { redirect } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { rutaInicioPorRol } from '@/lib/auth';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { EquipoPanel } from '@/components/configuracion/EquipoPanel';

export default async function EquipoPage() {
  const sesion = await requireSesion();

  if (sesion.rol !== 'dueno') {
    redirect(rutaInicioPorRol(sesion.rol));
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <EquipoPanel token={sesion.accessToken} />
      </div>
    </div>
  );
}
