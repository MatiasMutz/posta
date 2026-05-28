import { ApiError, type ApiErrorResponse, type CampoError } from '@posta/shared-types';

export { ApiError };

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class NetworkError extends Error {
  constructor() {
    super(
      'No se pudo conectar con el servidor. ' +
      'Verificá que la API esté corriendo y que NEXT_PUBLIC_API_URL esté configurado.',
    );
    this.name = 'NetworkError';
  }
}

function parseErrorBody(body: Record<string, unknown>): {
  mensaje: string;
  errores?: CampoError[];
} {
  const mensaje =
    (typeof body.mensaje === 'string' ? body.mensaje : undefined) ??
    (typeof body.message === 'string' ? body.message : undefined) ??
    'Error inesperado';

  const rawErrores = body.errores;
  if (!Array.isArray(rawErrores)) {
    return { mensaje };
  }

  const errores = rawErrores
    .filter((e): e is Record<string, unknown> => typeof e === 'object' && e !== null)
    .map((e) => ({
      campo: String(e.campo ?? e.path ?? 'general'),
      motivo: String(e.motivo ?? e.mensaje ?? e.message ?? 'Inválido'),
    }));

  return errores.length > 0 ? { mensaje, errores } : { mensaje };
}

export async function apiClient<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  const hasBody =
    fetchOptions.body !== undefined &&
    fetchOptions.body !== null &&
    fetchOptions.body !== '';
  if (hasBody && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      ...fetchOptions,
      headers,
      cache: 'no-store',
    });
  } catch {
    throw new NetworkError();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    const { mensaje, errores } = parseErrorBody(body);
    throw new ApiError(res.status, mensajeDeEstatus(res.status, mensaje), errores);
  }

  return res.json() as Promise<T>;
}

export async function apiClientBlob(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<Blob> {
  const { token, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/v1${path}`, {
      ...fetchOptions,
      headers,
      cache: 'no-store',
    });
  } catch {
    throw new NetworkError();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    const { mensaje, errores } = parseErrorBody(body);
    throw new ApiError(res.status, mensajeDeEstatus(res.status, mensaje), errores);
  }

  return res.blob();
}

function mensajeDeEstatus(status: number, mensajeApi?: string): string {
  if (mensajeApi && mensajeApi !== 'Error inesperado') {
    return mensajeApi;
  }
  switch (status) {
    case 400: return 'Los datos enviados son inválidos.';
    case 401: return 'Sesión inválida o expirada. Iniciá sesión de nuevo.';
    case 403: return 'No tenés permiso para realizar esta acción.';
    case 404: return 'El recurso solicitado no existe.';
    case 409: return 'Ya existe un registro con esos datos.';
    case 422: return 'Los datos enviados no son válidos.';
    case 500: return 'Error interno del servidor. Intentá de nuevo en unos minutos.';
    default:  return `Error inesperado (código ${status}).`;
  }
}

/** Útil en tests: normaliza un body de error como lo haría el cliente HTTP. */
export function parseApiErrorResponse(body: ApiErrorResponse): ApiError {
  return new ApiError(body.statusCode, body.mensaje, body.errores);
}
