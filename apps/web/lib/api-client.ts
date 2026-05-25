const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errores?: Array<{ campo: string; motivo: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor() {
    super(
      'No se pudo conectar con el servidor. ' +
      'Verificá que la API esté corriendo y que NEXT_PUBLIC_API_URL esté configurado.',
    );
    this.name = 'NetworkError';
  }
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
    });
  } catch {
    throw new NetworkError();
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as {
      mensaje?: string;
      message?: string; // NestJS usa 'message' por defecto; nuestro filtro lo normaliza a 'mensaje'
      errores?: Array<{ campo: string; motivo: string }>;
    };

    // 'mensaje' viene del HttpExceptionFilter; 'message' es el fallback de NestJS sin filtro
    const mensaje = body.mensaje ?? body.message ?? mensajeDeEstatus(res.status);
    throw new ApiError(res.status, mensaje, body.errores);
  }

  return res.json() as Promise<T>;
}

function mensajeDeEstatus(status: number): string {
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
