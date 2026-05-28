import { redirect } from 'next/navigation';
import { getSesionAutenticada } from '@/lib/sesion';
import { rutaInicioPorRol } from '@/lib/auth';

export default async function HomePage() {
  const sesion = await getSesionAutenticada();
  if (sesion) {
    redirect(rutaInicioPorRol(sesion.rol));
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper">
      <div className="text-center space-y-2">
        <h1 className="font-serif text-4xl text-ink">Posta</h1>
        <p className="font-sans text-muted text-sm">Hub de gestión para PyMEs argentinas</p>
      </div>
    </main>
  );
}
