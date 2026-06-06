import { redirect } from 'next/navigation';
import { requireSesion } from '@/lib/sesion';
import { apiClient, ApiError } from '@/lib/api-client';
import { redirectPorRol } from '@/lib/auth';
import { PanelCaja } from '@/components/tesoreria/PanelCaja';

export default async function CajaPage() {
  const sesion = await requireSesion();
  const bloqueo = redirectPorRol('/caja', sesion.rol);
  if (bloqueo) redirect(bloqueo);

  const { accessToken, rol } = sesion;

  let estadoInicial = {
    sesion: null,
    saldo_actual: '0',
    totales: null,
    movimientos: [] as Array<{
      id: string; tipo: string; metodo_pago?: string | null;
      monto: string; concepto: string; created_at: string;
    }>,
  };
  let cuentasCorrientes = { clientes: [] as Array<{ id: string; nombre: string; saldo: string; tipo: 'cliente' }>, proveedores: [] as Array<{ id: string; nombre: string; saldo: string; tipo: 'proveedor' }> };
  let flujoCaja = {
    facturacion_bruta: '0',
    cobros_recibidos: '0',
    pagos_realizados: '0',
    costo_mercaderia: '0',
    iva_estimado: '0',
    dinero_neto: '0',
  };
  let errorCarga: string | null = null;

  try {
    const [estadoRes, cuentasRes, flujoRes] = await Promise.all([
      apiClient<{ data: typeof estadoInicial }>('/tesoreria/caja', { token: accessToken }),
      apiClient<{ data: typeof cuentasCorrientes }>('/tesoreria/pagos/cuentas-corrientes', { token: accessToken }),
      apiClient<{ data: typeof flujoCaja }>('/tesoreria/flujo-caja', { token: accessToken }),
    ]);
    estadoInicial = estadoRes.data;
    cuentasCorrientes = cuentasRes.data;
    flujoCaja = flujoRes.data;
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) {
      redirect(`/login?error=${encodeURIComponent(err.message)}`);
    }
    errorCarga = err instanceof Error ? err.message : 'No se pudo cargar la caja.';
  }

  return (
    <div className="min-h-screen bg-paper pb-24 md:pb-8 md:pl-24">
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {errorCarga && (
          <div className="bg-err-soft border border-err rounded-[2px] px-4 py-3 mb-6">
            <p className="font-sans text-sm text-err">{errorCarga}</p>
          </div>
        )}
        <PanelCaja
          token={accessToken}
          rol={rol}
          estadoInicial={estadoInicial}
          cuentasCorrientes={cuentasCorrientes}
          flujoCaja={flujoCaja}
        />
      </div>
    </div>
  );
}
