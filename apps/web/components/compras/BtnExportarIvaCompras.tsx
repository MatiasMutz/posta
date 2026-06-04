'use client';
import { useState } from 'react';
import { apiClientBlob } from '@/lib/api-client';
import { ABtn } from '@/components/ui';

interface BtnExportarIvaComprasProps {
  token: string;
}

export function BtnExportarIvaCompras({ token }: BtnExportarIvaComprasProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  async function handleExportar() {
    setCargando(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (desde) params.set('desde', desde);
      if (hasta) params.set('hasta', hasta);
      const qs = params.toString();
      const path = qs ? `/compras/iva-compras?${qs}` : '/compras/iva-compras';

      const blob = await apiClientBlob(path, { token });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'iva-compras.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al exportar IVA Compras.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-end gap-2 justify-end">
        <label className="font-sans text-xs text-muted">
          Desde
          <input
            type="date"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            className="block mt-1 border border-rule rounded-[2px] px-2 py-1 font-sans text-xs text-ink bg-card"
          />
        </label>
        <label className="font-sans text-xs text-muted">
          Hasta
          <input
            type="date"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            className="block mt-1 border border-rule rounded-[2px] px-2 py-1 font-sans text-xs text-ink bg-card"
          />
        </label>
        <ABtn
          variant="ghost"
          size="sm"
          onClick={handleExportar}
          disabled={cargando}
          className="text-muted hover:text-accent px-0"
        >
          {cargando ? 'Generando...' : '↓ Exportar IVA Compras (.xlsx)'}
        </ABtn>
      </div>
      {error && <p className="font-sans text-xs text-err">{error}</p>}
    </div>
  );
}
