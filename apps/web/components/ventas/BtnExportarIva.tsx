'use client';
import { useState } from 'react';

interface BtnExportarIvaProps {
  token: string;
  apiUrl: string;
}

export function BtnExportarIva({ token, apiUrl }: BtnExportarIvaProps) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  async function handleExportar() {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/v1/ventas/iva-ventas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Error al generar el archivo.');
      const blob = await res.blob();
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
      <button
        onClick={handleExportar}
        disabled={cargando}
        className="font-sans text-xs text-muted hover:text-accent transition-colors disabled:opacity-50"
      >
        {cargando ? 'Generando...' : '↓ Exportar IVA Ventas (.xlsx)'}
      </button>
      {error && <p className="font-sans text-xs text-err mt-1">{error}</p>}
    </div>
  );
}
