'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { BarraProgreso } from './BarraProgreso';
import { GrillaRevision } from './GrillaRevision';
import { ABtn } from '@/components/ui';
import Link from 'next/link';

interface EstadoJob {
  jobId: string;
  tipo: string;
  estado: string;
  fase?: string | null;
  progreso: number;
  total: number;
  filasOk: number;
  filasError: number;
  errores?: FilaConError[];
}

interface FilaConError {
  numero: number;
  datos: Record<string, string | undefined>;
  problemas: Array<{ campo: string; valor: unknown; motivo: string }>;
}

const POLL_INTERVAL_MS = 2000;
const ESTADOS_FINALES = new Set(['completado', 'error']);

interface PollingEstadoProps {
  jobId: string;
  token: string;
}

export function PollingEstado({ jobId, token }: PollingEstadoProps) {
  const [reimportados, setReimportados] = useState(0);
  const queryClient = useQueryClient();

  const { data: estado, error: queryError, isLoading } = useQuery({
    queryKey: ['import-estado', jobId],
    queryFn: async () => {
      const res = await apiClient<{ data: EstadoJob }>(`/imports/${jobId}/estado`, { token });
      return res.data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && ESTADOS_FINALES.has(data.estado)) return false;
      return POLL_INTERVAL_MS;
    },
  });

  if (queryError) {
    const errorPoll = queryError instanceof Error ? queryError.message : 'Error al obtener el estado.';
    return (
      <div
        role="alert"
        className="font-sans text-sm px-4 py-3 rounded-[2px]"
        style={{ color: 'var(--color-err)', background: 'var(--color-err-soft)', border: '1px solid var(--color-err)' }}
      >
        {errorPoll}
      </div>
    );
  }

  if (isLoading || !estado) {
    return <p className="font-sans text-sm text-muted animate-pulse">Iniciando importación...</p>;
  }

  const finalizado = ESTADOS_FINALES.has(estado.estado);
  const tieneErroresPendientes =
    estado.filasError > 0 || (estado.errores?.length ?? 0) > 0;
  const filasOkMostradas = tieneErroresPendientes
    ? estado.filasOk + reimportados
    : estado.filasOk;
  const exitoTotal = estado.estado === 'completado' && !tieneErroresPendientes;

  return (
    <div className="space-y-6">
      <div className="bg-card border border-rule rounded-[2px] p-6" style={{ boxShadow: 'var(--shadow-flat)' }}>
        <BarraProgreso
          estado={estado.estado}
          fase={estado.fase}
          progreso={estado.progreso}
          total={estado.total}
          filasOk={filasOkMostradas}
          filasError={estado.filasError}
        />
      </div>

      {exitoTotal && (
        <div
          className="font-sans text-sm px-4 py-3 rounded-[2px]"
          style={{ color: 'var(--color-ok)', background: 'var(--color-ok-soft)', border: '1px solid var(--color-ok)' }}
        >
          Se importaron {filasOkMostradas} registros correctamente.
        </div>
      )}

      {finalizado && estado.errores && estado.errores.length > 0 && (
        <GrillaRevision
          jobId={jobId}
          token={token}
          errores={estado.errores}
          onExito={(n) => {
            setReimportados(prev => prev + n);
            void queryClient.invalidateQueries({ queryKey: ['import-estado', jobId] });
          }}
        />
      )}

      {finalizado && (
        <div className="flex gap-3">
          <Link href={estado.tipo === 'inventario' ? '/inventario' : '/clientes'}>
            <ABtn variant="primary" size="sm">
              Ver {estado.tipo === 'inventario' ? 'inventario' : 'clientes'}
            </ABtn>
          </Link>
          <Link href="/importar">
            <ABtn variant="secondary" size="sm">Nueva importación</ABtn>
          </Link>
        </div>
      )}
    </div>
  );
}
