import { PipeTransform, BadRequestException } from '@nestjs/common';
import type { ZodSchema } from 'zod';

export class ZodValidationPipe<T> implements PipeTransform {
  constructor(private readonly schema: ZodSchema<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException({
        mensaje: 'Datos inválidos',
        errores: result.error.errors.map((e: { path: (string | number)[]; message: string }) => ({
          campo: e.path.join('.'),
          motivo: e.message,
        })),
      });
    }
    return result.data;
  }
}
