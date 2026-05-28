import { redirect } from 'next/navigation';
import { getSession } from '@/lib/supabase/server';
import { apiClient, ApiError, NetworkError } from '@/lib/api-client';
import type { Rol, TenantMe } from '@posta/shared-types';
import type { Session } from '@supabase/supabase-js';

export interface SesionAutenticada {
  accessToken: string;
  userId: string;
  rol: Rol;
  email?: string;
  tenant: TenantMe;
}

function sesionDesdeJwt(session: Session): SesionAutenticada | null {
  const rol = session.user.app_metadata?.rol as Rol | undefined;
  const tenantId = session.user.app_metadata?.tenant_id as string | undefined;
  if (!rol || !tenantId) return null;

  return {
    accessToken: session.access_token,
    userId: session.user.id,
    rol,
    email: session.user.email,
    tenant: {
      id: tenantId,
      nombre: '',
      created_at: '',
      rol,
      userId: session.user.id,
    },
  };
}

function esErrorTransitorio(err: unknown): boolean {
  if (err instanceof NetworkError) return true;
  if (err instanceof ApiError) {
    return err.statusCode === 429 || err.statusCode >= 500;
  }
  return false;
}

/**
 * Sesión Supabase + rol desde la API (/tenants/me).
 * La API resuelve el rol en BD; no confiar solo en app_metadata del JWT.
 */
export async function getSesionAutenticada(): Promise<SesionAutenticada | null> {
  const session = await getSession();
  if (!session) return null;

  try {
    const { data: tenant } = await apiClient<{ data: TenantMe }>('/tenants/me', {
      token: session.access_token,
    });

    return {
      accessToken: session.access_token,
      userId: tenant.userId,
      rol: tenant.rol,
      email: session.user.email,
      tenant,
    };
  } catch (err) {
    if (err instanceof ApiError && err.statusCode === 401) return null;
    if (esErrorTransitorio(err)) {
      return sesionDesdeJwt(session);
    }
    throw err;
  }
}

/** Redirige a /login si no hay sesión. */
export async function requireSesion(): Promise<SesionAutenticada> {
  const sesion = await getSesionAutenticada();
  if (!sesion) redirect('/login');
  return sesion;
}
