import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { FastifyReply } from 'fastify';

/**
 * Captura cualquier excepción y normaliza al formato { statusCode, mensaje, errores? }.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const reply = ctx.getResponse<FastifyReply>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const mensaje =
        typeof res === 'string'
          ? res
          : ((res as Record<string, unknown>).mensaje as string)
            ?? ((res as Record<string, unknown>).message as string)
            ?? 'Error inesperado';
      const errores = typeof res === 'object'
        ? (res as Record<string, unknown>).errores
        : undefined;
      reply.status(status).send({ statusCode: status, mensaje, errores });
      return;
    }

    this.logger.error('Excepción no controlada', exception);
    reply.status(HttpStatus.INTERNAL_SERVER_ERROR).send({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      mensaje: 'Ocurrió un error interno. Intentá de nuevo en unos minutos.',
    });
  }
}
