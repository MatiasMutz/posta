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

const PERFIL_CACHE_KEY = 'posta-nav-perfil';

export function leerPerfilCache(): PerfilUsuario | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PERFIL_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PerfilUsuario;
    if (!parsed.email || !parsed.nombreTenant || !parsed.rol) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function guardarPerfilCache(perfil: PerfilUsuario) {
  sessionStorage.setItem(PERFIL_CACHE_KEY, JSON.stringify(perfil));
}

/** Precarga el cache de nav antes de un redirect post-login (evita layout shift inicial). */
export async function precargarPerfilDesdeToken(accessToken: string, email: string) {
  try {
    const { data } = await apiClient<{ data: TenantMe }>('/tenants/me', { token: accessToken });
    guardarPerfilCache({ email, nombreTenant: data.nombre, rol: data.rol });
  } catch {
    // El nav refrescará el perfil en el primer mount
  }
}

export function limpiarPerfilCache() {
  sessionStorage.removeItem(PERFIL_CACHE_KEY);
}

export async function cerrarSesion() {
  limpiarPerfilCache();
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

const claseBtnCerrarSesion =
  'w-full text-left font-sans font-medium rounded-[2px] border border-transparent px-2 py-1.5 cursor-pointer transition-colors ' +
  'text-muted hover:text-err hover:bg-err-soft hover:border-err/25 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-err/40 focus-visible:ring-offset-1';

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

export function NavPerfilSidebarSkeleton() {
  return (
    <div className="flex flex-col gap-2 px-1" aria-hidden>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-paper-warm shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="h-3 bg-paper-warm rounded-[2px] w-full" />
          <div className="h-2.5 bg-paper-warm rounded-[2px] w-4/5" />
        </div>
      </div>
      <div className="h-3 bg-paper-warm rounded-[2px] w-24 mx-1" />
    </div>
  );
}

export function NavPerfilMobileSkeleton() {
  return (
    <div className="fixed top-4 right-4 z-50 md:hidden" aria-hidden>
      <div className="flex items-center gap-2 bg-card border border-rule rounded-[2px] px-2 py-1.5 shadow-[var(--shadow)] w-[148px]">
        <div className="w-8 h-8 rounded-full bg-paper-warm shrink-0" />
        <div className="h-3 bg-paper-warm rounded-[2px] flex-1" />
      </div>
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
        className={`${claseBtnCerrarSesion} text-[11px]`}
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
            className={`${claseBtnCerrarSesion} text-sm`}
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export function usePerfilUsuario() {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(leerPerfilCache);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        limpiarPerfilCache();
        setPerfil(null);
        return;
      }
      const email = session.user.email ?? '';
      try {
        const { data } = await apiClient<{ data: TenantMe }>('/tenants/me', {
          token: session.access_token,
        });
        const next = { email, nombreTenant: data.nombre, rol: data.rol };
        guardarPerfilCache(next);
        setPerfil(next);
      } catch {
        const fallback = session.user.app_metadata?.rol as Rol | undefined;
        if (fallback) {
          const next = { email, nombreTenant: 'Mi negocio', rol: fallback };
          guardarPerfilCache(next);
          setPerfil(next);
        }
      }
    });
  }, []);

  return perfil;
}
