'use client';
import { useState } from 'react';
import { apiClientBlob } from '@/lib/api-client';
import { ABtn } from '@/components/ui';

interface BtnExportarIvaProps {
  token: string;
}

export function BtnExportarIva({ token }: BtnExportarIvaProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function handleExportar() {
    setCargando(true);
    setError('');
    try {
      const blob = await apiClientBlob('/ventas/iva-ventas', { token });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'iva-ventas.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <ABtn
        variant="ghost"
        size="sm"
        onClick={handleExportar}
        disabled={cargando}
        className="text-muted hover:text-accent px-0"
      >
        {cargando ? 'Generando...' : '↓ Exportar IVA Ventas (.xlsx)'}
      </ABtn>
      {error && <p className="font-sans text-xs text-err mt-1">{error}</p>}
    </div>
  );
}
