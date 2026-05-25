'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';

export function BuscadorProductos() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [valor, setValor] = useState(searchParams.get('buscar') ?? '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (valor.trim()) {
      params.set('buscar', valor.trim());
    } else {
      params.delete('buscar');
    }
    params.delete('pagina');
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleLimpiar() {
    setValor('');
    const params = new URLSearchParams(searchParams.toString());
    params.delete('buscar');
    params.delete('pagina');
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        placeholder="Buscar producto..."
        className="px-3 py-1.5 font-sans text-sm text-ink bg-card border border-rule rounded-[2px] focus:outline-none focus:border-accent w-48"
      />
      <button
        type="submit"
        className="px-3 py-1.5 font-sans text-xs font-medium bg-ink text-card rounded-[2px] hover:opacity-80 transition-opacity"
      >
        Buscar
      </button>
      {searchParams.get('buscar') && (
        <button
          type="button"
          onClick={handleLimpiar}
          className="font-sans text-xs text-muted hover:text-ink transition-colors"
        >
          Limpiar
        </button>
      )}
    </form>
  );
}
