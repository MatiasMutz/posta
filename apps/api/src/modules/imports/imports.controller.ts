import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AnalizarImportSchema, CrearImportSchema, ReintentarImportSchema,
  type AnalizarImportDto, type CrearImportDto, type ReintentarImportDto,
} from '@posta/validation';
import { z } from 'zod';
import { ImportsService } from './imports.service';
import type { TenantUser } from '@posta/shared-types';

const UploadUrlQuerySchema = z.object({
  filename: z.string().min(1).max(200),
  tipo: z.enum(['inventario', 'clientes']),
});

@Controller('imports')
@UseGuards(JwtGuard)
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  /** Devuelve una URL firmada para que el frontend suba el archivo directamente a Supabase Storage. */
  @Get('upload-url')
  async uploadUrl(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(UploadUrlQuerySchema)) query: z.infer<typeof UploadUrlQuerySchema>,
  ) {
    return this.service.generarUrlSubida(user.tenantId, query.filename);
  }

  /** Extrae encabezados y sugiere el mapeo de columnas sin crear ningún job. */
  @Post('analizar')
  async analizar(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(AnalizarImportSchema)) dto: AnalizarImportDto,
  ) {
    return this.service.analizar(user.tenantId, dto);
  }

  /** Crea el job de importación y lo encola. Devuelve { jobId }. */
  @Post()
  async crear(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CrearImportSchema)) dto: CrearImportDto,
  ) {
    return this.service.crear(user.tenantId, user.userId, dto);
  }

  /** Polling de estado: fase, progreso, errores. */
  @Get(':jobId/estado')
  async estado(
    @CurrentUser() user: TenantUser,
    @Param('jobId') jobId: string,
  ) {
    return this.service.estado(user.tenantId, jobId);
  }

  /** Reimporta solo las filas corregidas por el usuario. */
  @Post(':jobId/reintento')
  async reintentar(
    @CurrentUser() user: TenantUser,
    @Param('jobId') jobId: string,
    @Body(new ZodValidationPipe(ReintentarImportSchema)) dto: ReintentarImportDto,
  ) {
    return this.service.reintentar(user.tenantId, user.userId, jobId, dto.correcciones);
  }
}
