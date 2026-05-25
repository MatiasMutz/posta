import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import type { FastifyReply } from 'fastify';

/**
 * Normaliza todos los errores HTTP al formato { statusCode, mensaje, errores? }.
 * El campo 'mensaje' es el que espera el api-client del frontend.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();
    const status = exception.getStatus();
    const res = exception.getResponse();

    // NestJS puede devolver string o { message, statusCode, ... }
    const mensaje =
      typeof res === 'string'
        ? res
        : (res as Record<string, unknown>).mensaje as string
          ?? (res as Record<string, unknown>).message as string
          ?? 'Error inesperado';

    const errores = typeof res === 'object'
      ? (res as Record<string, unknown>).errores
      : undefined;

    reply.status(status).send({ statusCode: status, mensaje, errores });
  }
}
