import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSesionAutenticada } from '@/lib/sesion';
import { rutaInicioPorRol } from '@/lib/auth';

export default async function HomePage() {
  const sesion = await getSesionAutenticada();
  if (sesion) {
    redirect(rutaInicioPorRol(sesion.rol));
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-paper px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl text-ink">Posta</h1>
          <p className="font-sans text-muted text-sm">Hub de gestión para PyMEs argentinas</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/login"
            className="inline-flex items-center justify-center font-sans font-medium border rounded-[2px] px-5 py-2.5 text-sm bg-accent text-card hover:bg-accent-deep border-transparent transition-colors"
          >
            Ingresar
          </Link>
          <Link
            href="/login?tab=registro"
            className="inline-flex items-center justify-center font-sans font-medium border rounded-[2px] px-5 py-2.5 text-sm bg-card text-ink border-rule hover:bg-paper transition-colors"
          >
            Crear cuenta
          </Link>
        </div>
      </div>
    </main>
  );
}
