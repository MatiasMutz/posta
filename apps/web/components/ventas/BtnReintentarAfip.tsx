'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface BtnReintentarAfipProps {
  ventaId: string;
  token: string;
}

export function BtnReintentarAfip({ ventaId, token }: BtnReintentarAfipProps) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function handleReintentar() {
    setCargando(true);
    setError('');
    try {
      await apiClient(`/ventas/${ventaId}/reintentar-facturacion`, { method: 'POST', token });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al reintentar.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleReintentar}
        disabled={cargando}
        className="font-sans text-xs text-accent hover:underline disabled:opacity-50"
      >
        {cargando ? 'Reintentando...' : 'Reintentar'}
      </button>
      {error && <p className="font-sans text-xs text-err mt-0.5">{error}</p>}
    </div>
  );
}
