import { ApiResponse } from '@nestjs/swagger';

const errorBodySchema = {
  type: 'object' as const,
  properties: {
    statusCode: { type: 'number', example: 400 },
    mensaje: { type: 'string', example: 'Revisá los datos enviados.' },
    errores: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          campo: { type: 'string', example: 'nombre' },
          motivo: { type: 'string', example: 'El nombre es requerido' },
        },
        required: ['campo', 'motivo'],
      },
    },
  },
  required: ['statusCode', 'mensaje'],
};

/** Respuesta estándar de error de la API (HttpExceptionFilter + ZodValidationPipe). */
export const ApiErrorUnauthorized = () =>
  ApiResponse({
    status: 401,
    description: 'No autenticado o token inválido',
    schema: {
      example: { statusCode: 401, mensaje: 'No autorizado.' },
    },
  });

export const ApiErrorForbidden = () =>
  ApiResponse({
    status: 403,
    description: 'Rol sin permiso para esta operación',
    schema: {
      example: { statusCode: 403, mensaje: 'No tenés permiso para esta acción.' },
    },
  });

export const ApiErrorNotFound = () =>
  ApiResponse({
    status: 404,
    description: 'Recurso no encontrado',
    schema: {
      example: { statusCode: 404, mensaje: 'Recurso no encontrado.' },
    },
  });

export const ApiErrorBadRequest = () =>
  ApiResponse({
    status: 400,
    description: 'Datos inválidos (Zod) o regla de negocio',
    schema: {
      ...errorBodySchema,
      example: {
        statusCode: 400,
        mensaje: 'Datos inválidos',
        errores: [{ campo: 'nombre', motivo: 'El nombre es requerido' }],
      },
    },
  });
