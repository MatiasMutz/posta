import { redirect } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { rutaInicioPorRol } from '@/lib/auth';
import { FlujoImportacion } from '@/components/importar/FlujoImportacion';

export default async function ImportarPage() {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;

  if (rol !== 'dueno') redirect(rutaInicioPorRol(rol));

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <h1 className="font-serif text-2xl text-ink mb-1">Importar datos</h1>
        <p className="font-sans text-sm text-muted mb-8">
          Subí tu Excel o CSV y el sistema te va a guiar para mapear las columnas.
        </p>
        <FlujoImportacion token={accessToken} />
      </div>
    </div>
  );
}
