'use client';
import { useEffect, useRef, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';
import type { Rol, TenantMe } from '@posta/shared-types';

const ROL_LABEL: Record<Rol, string> = {
  dueno: 'Dueño',
  vendedor: 'Vendedor',
  contador: 'Contador',
};

export interface PerfilUsuario {
  email: string;
  nombreTenant: string;
  rol: Rol;
}

export async function cerrarSesion() {
  const supabase = createSupabaseBrowser();
  await supabase.auth.signOut();
  window.location.assign('/');
}

function iniciales(email: string): string {
  const parte = email.split('@')[0] ?? email;
  return parte.slice(0, 2).toUpperCase();
}

function Avatar({ email }: { email: string }) {
  return (
    <div
      className="w-8 h-8 rounded-full bg-accent-soft text-accent flex items-center justify-center font-sans font-semibold text-xs shrink-0"
      aria-hidden
    >
      {iniciales(email)}
    </div>
  );
}

function PerfilDetalle({ perfil }: { perfil: PerfilUsuario }) {
  return (
    <div className="min-w-0 flex-1">
      <p className="font-sans text-xs text-ink font-medium truncate">{perfil.email}</p>
      <p className="font-sans text-[11px] text-muted truncate">
        {perfil.nombreTenant} · {ROL_LABEL[perfil.rol]}
      </p>
    </div>
  );
}

export function NavPerfilSidebar({ perfil }: { perfil: PerfilUsuario }) {
  return (
    <div className="flex flex-col gap-2 px-1">
      <div className="flex items-center gap-2">
        <Avatar email={perfil.email} />
        <PerfilDetalle perfil={perfil} />
      </div>
      <button
        type="button"
        onClick={() => void cerrarSesion()}
        className="w-full text-left font-sans text-[11px] text-muted hover:text-err transition-colors py-1 px-1"
      >
        Cerrar sesión
      </button>
    </div>
  );
}

export function NavPerfilMobile({ perfil }: { perfil: PerfilUsuario }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [abierto]);

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50 md:hidden">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="flex items-center gap-2 bg-card border border-rule rounded-[2px] px-2 py-1.5 shadow-[var(--shadow)]"
        aria-expanded={abierto}
        aria-haspopup="true"
        aria-label="Menú de usuario"
      >
        <Avatar email={perfil.email} />
        <span className="font-sans text-xs text-ink max-w-[120px] truncate">
          {perfil.nombreTenant}
        </span>
      </button>
      {abierto && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-card border border-rule rounded-[2px] p-3 shadow-[var(--shadow)]"
          role="menu"
        >
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-rule-soft">
            <Avatar email={perfil.email} />
            <PerfilDetalle perfil={perfil} />
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => void cerrarSesion()}
            className="w-full text-left font-sans text-sm text-muted hover:text-err transition-colors py-1"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export function usePerfilUsuario() {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      const email = session.user.email ?? '';
      try {
        const { data } = await apiClient<{ data: TenantMe }>('/tenants/me', {
          token: session.access_token,
        });
        setPerfil({ email, nombreTenant: data.nombre, rol: data.rol });
      } catch {
        const fallback = session.user.app_metadata?.rol as Rol | undefined;
        if (fallback) {
          setPerfil({ email, nombreTenant: 'Mi negocio', rol: fallback });
        }
      }
    });
  }, []);

  return perfil;
}
