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

/** Respuesta de GET /tenants/me — tenant + contexto del usuario autenticado. */
export interface TenantMe {
  id: string;
  nombre: string;
  created_at: string;
  rol: Rol;
  userId: string;
}

/** Detalle de un campo inválido (ZodValidationPipe + front). */
export interface CampoError {
  campo: string;
  motivo: string;
}

/** Cuerpo JSON de error HTTP de la API (HttpExceptionFilter). */
export interface ApiErrorResponse {
  statusCode: number;
  mensaje: string;
  errores?: CampoError[];
}

/** Error lanzado por `apiClient` cuando la API responde con status ≥ 400. */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errores?: CampoError[],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static isApiError(value: unknown): value is ApiError {
    return value instanceof ApiError;
  }
}
