import { redirect } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { redirectPorRol } from '@/lib/auth';
import { PanelDashboard, type DashboardData } from '@/components/dashboard/PanelDashboard';

export default async function DashboardPage() {
  const sesion = await requireSesion();
  const bloqueo = redirectPorRol('/dashboard', sesion.rol);
  if (bloqueo) redirect(bloqueo);

  let data: DashboardData | null = null;
  let errorCarga: string | null = null;

  try {
    const res = await apiClient<{ data: DashboardData }>('/dashboard', {
      token: sesion.accessToken,
    });
    data = res.data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    errorCarga = err instanceof Error ? err.message : 'No se pudo cargar el dashboard.';
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {errorCarga && (
          <div className="bg-err-soft border border-err rounded-[2px] px-4 py-3 mb-6">
            <p className="font-sans text-sm text-err">{errorCarga}</p>
          </div>
        )}
        {data && <PanelDashboard data={data} />}
      </div>
    </div>
  );
}
