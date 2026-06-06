import { redirect } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { redirectPorRol } from '@/lib/auth';
import { LIMITE_PAGINA_DEFAULT, parsePagina } from '@/lib/paginacion';
import { NavFlotante } from '@/components/nav/NavFlotante';
import { PanelContador } from '@/components/dashboard/PanelContador';
import type { ApiResponse } from '@posta/shared-types';

interface ResumenContador {
  periodo: { desde: string; hasta: string };
  ventas: {
    neto_gravado: string;
    iva_debito: string;
    total_facturado: string;
    comprobantes: number;
    pendientes_cae: number;
  };
  compras: {
    neto_gravado: string;
    iva_credito: string;
    total: string;
    comprobantes: number;
  };
}

interface Comprobante {
  id: string;
  fecha: string;
  tipo: string;
  estado: string;
  numero_comprobante: number | null;
  cae: string | null;
  cliente: string;
  cuit: string | null;
  neto: string;
  iva: string;
  total: string;
}

export default async function ContadorPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const sesion = await requireSesion();
  const bloqueo = redirectPorRol('/contador', sesion.rol);
  if (bloqueo) redirect(bloqueo);

  const params = await searchParams;
  const pagina = parsePagina(params.pagina);

  let resumen: ResumenContador | null = null;
  let comprobantes: Comprobante[] = [];
  let totalComprobantes = 0;
  let tenantNombre = '';
  let errorCarga: string | null = null;

  try {
    const [meRes, resumenRes, compRes] = await Promise.all([
      apiClient<{ data: { nombre: string } }>('/tenants/me', { token: sesion.accessToken }),
      apiClient<{ data: ResumenContador }>('/contador/resumen', { token: sesion.accessToken }),
      apiClient<ApiResponse<Comprobante[]>>(
        `/contador/comprobantes?pagina=${pagina}&limite=${LIMITE_PAGINA_DEFAULT}`,
        { token: sesion.accessToken },
      ),
    ]);
    tenantNombre = meRes.data.nombre;
    resumen = resumenRes.data;
    comprobantes = compRes.data;
    totalComprobantes = compRes.meta?.total ?? 0;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    errorCarga = err instanceof Error ? err.message : 'No se pudo cargar la vista contador.';
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <NavFlotante />
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {errorCarga && (
          <div className="bg-err-soft border border-err rounded-[2px] px-4 py-3 mb-6">
            <p className="font-sans text-sm text-err">{errorCarga}</p>
          </div>
        )}
        {resumen && (
          <PanelContador
            resumen={resumen}
            comprobantes={comprobantes}
            totalComprobantes={totalComprobantes}
            pagina={pagina}
            token={sesion.accessToken}
            tenantNombre={tenantNombre}
          />
        )}
      </div>
    </div>
  );
}
