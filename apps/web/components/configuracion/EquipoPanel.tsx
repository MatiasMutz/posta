'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, ApiError } from '@/lib/api-client';
import { ABtn } from '@/components/ui';
import type { Rol } from '@posta/shared-types';

interface Miembro {
  id: string;
  user_id: string;
  rol: Rol;
}

interface Invitacion {
  id: string;
  email: string;
  rol: Rol;
  estado: string;
}

interface EquipoPanelProps {
  token: string;
}

export function EquipoPanel({ token }: EquipoPanelProps) {
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [email, setEmail] = useState('');
  const [rolInvitar, setRolInvitar] = useState<'vendedor' | 'contador'>('vendedor');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [loading, setLoading] = useState(false);

  async function cargar() {
    const res = await apiClient<{
      data: { miembros: Miembro[]; invitacionesPendientes: Invitacion[] };
    }>('/tenants/usuarios', { token });
    setMiembros(res.data.miembros);
    setInvitaciones(res.data.invitacionesPendientes);
  }

  useEffect(() => {
    cargar().catch((err) => {
      setError(err instanceof ApiError ? err.message : 'No se pudo cargar el equipo.');
    });
  }, [token]);

  async function handleInvitar(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMensaje('');
    try {
      await apiClient('/tenants/usuarios/invitar', {
        method: 'POST',
        token,
        body: JSON.stringify({ email, rol: rolInvitar }),
      });
      setMensaje('Invitación enviada por email.');
      setEmail('');
      await cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Error al invitar.');
    } finally {
      setLoading(false);
    }
  }

  async function revocarInvitacion(id: string) {
    await apiClient(`/tenants/usuarios/invitaciones/${id}`, { method: 'DELETE', token });
    await cargar();
  }

  return (
    <>
      <h1 className="font-serif text-2xl text-ink mb-2">Equipo</h1>
      <p className="font-sans text-sm text-muted mb-6">
        Invitá vendedores o contadores a tu negocio.
      </p>

      <form onSubmit={handleInvitar} className="bg-card border border-rule rounded-[2px] p-4 mb-8 space-y-3">
        <h2 className="font-sans text-sm font-medium text-ink">Invitar por email</h2>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@ejemplo.com"
          className="w-full border border-rule rounded-[2px] px-3 py-2 font-sans text-sm"
          required
        />
        <select
          value={rolInvitar}
          onChange={(e) => setRolInvitar(e.target.value as 'vendedor' | 'contador')}
          className="w-full border border-rule rounded-[2px] px-3 py-2 font-sans text-sm"
        >
          <option value="vendedor">Vendedor</option>
          <option value="contador">Contador</option>
        </select>
        <ABtn type="submit" disabled={loading}>{loading ? 'Enviando…' : 'Enviar invitación'}</ABtn>
        {mensaje && <p className="font-sans text-sm text-ok">{mensaje}</p>}
        {error && <p className="font-sans text-sm text-err">{error}</p>}
      </form>

      <section className="mb-8">
        <h2 className="font-sans text-sm font-medium text-ink mb-3">Miembros</h2>
        <ul className="space-y-2">
          {miembros.map((m) => (
            <li key={m.id} className="flex justify-between items-center bg-card border border-rule rounded-[2px] px-3 py-2">
              <span className="font-mono text-xs text-muted">{m.user_id.slice(0, 8)}…</span>
              <span className="font-sans text-sm capitalize">{m.rol}</span>
            </li>
          ))}
        </ul>
      </section>

      {invitaciones.length > 0 && (
        <section>
          <h2 className="font-sans text-sm font-medium text-ink mb-3">Invitaciones pendientes</h2>
          <ul className="space-y-2">
            {invitaciones.map((inv) => (
              <li key={inv.id} className="flex justify-between items-center bg-card border border-rule rounded-[2px] px-3 py-2">
                <div>
                  <p className="font-sans text-sm">{inv.email}</p>
                  <p className="font-mono text-xs text-muted capitalize">{inv.rol}</p>
                </div>
                <button
                  type="button"
                  onClick={() => revocarInvitacion(inv.id)}
                  className="font-sans text-xs text-muted hover:text-err"
                >
                  Revocar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 font-sans text-xs text-muted">
        <Link href="/ventas" className="hover:text-accent">← Volver</Link>
      </p>
    </>
  );
}
