import { rutaInicioPorRol } from '@/lib/auth';
import { apiClient } from '@/lib/api-client';
import type { Rol, TenantMe } from '@posta/shared-types';

/** Rol del usuario autenticado vía API (fuente de verdad). */
export async function fetchRolUsuario(accessToken: string): Promise<Rol> {
  const { data } = await apiClient<{ data: TenantMe }>('/tenants/me', {
    token: accessToken,
  });
  return data.rol;
}

/** Ruta de inicio tras login/registro usando rol de la API. */
export async function rutaInicioTrasAuth(accessToken: string): Promise<string> {
  const rol = await fetchRolUsuario(accessToken);
  return rutaInicioPorRol(rol);
}
