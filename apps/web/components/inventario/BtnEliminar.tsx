'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';

interface BtnEliminarProps {
  productoId: string;
  nombreProducto: string;
  token: string;
}

export function BtnEliminar({ productoId, nombreProducto, token }: BtnEliminarProps) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);

  async function handleEliminar() {
    if (!window.confirm(`¿Eliminar "${nombreProducto}"? Esta acción no se puede deshacer.`)) return;
    setEliminando(true);
    try {
      await apiClient(`/inventario/productos/${productoId}`, { method: 'DELETE', token });
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Error al eliminar el producto.');
      setEliminando(false);
    }
  }

  return (
    <button
      onClick={handleEliminar}
      disabled={eliminando}
      className="font-sans text-xs text-err hover:opacity-70 transition-opacity disabled:opacity-40"
    >
      {eliminando ? 'Eliminando...' : 'Eliminar'}
    </button>
  );
}
