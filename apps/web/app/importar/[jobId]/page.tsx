import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireSesion } from '@/lib/sesion';
import { rutaInicioPorRol } from '@/lib/auth';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { PollingEstado } from '@/components/importar/PollingEstado';

export default async function ImportarJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const sesion = await requireSesion();
  const { rol, accessToken } = sesion;

  if (rol !== 'dueno') redirect(rutaInicioPorRol(rol));

  const { jobId } = await params;

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-3xl mx-auto px-4 pt-8">
        {/* Migas */}
        <div className="flex items-center gap-2 font-sans text-xs text-muted mb-6">
          <Link href="/importar" className="hover:text-accent transition-colors">
            Importar
          </Link>
          <span>/</span>
          <span className="font-mono text-ink">{jobId.slice(0, 8)}…</span>
        </div>

        <h1 className="font-serif text-2xl text-ink mb-6">Estado de la importación</h1>

        <PollingEstado jobId={jobId} token={accessToken} />
      </div>
    </div>
  );
}
