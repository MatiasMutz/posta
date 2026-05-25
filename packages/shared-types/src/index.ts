export type Rol = 'dueno' | 'vendedor' | 'contador';

/** Usuario autenticado con contexto de tenant, adjunto a cada request por el JwtGuard. */
export interface TenantUser {
  userId: string;   // UUID de Supabase Auth
  tenantId: string; // UUID del tenant
  rol: Rol;
  email?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    pagina: number;
    limite: number;
    total: number;
  };
}

export interface ApiError {
  statusCode: number;
  mensaje: string;
  errores?: Array<{ campo: string; motivo: string }>;
}
