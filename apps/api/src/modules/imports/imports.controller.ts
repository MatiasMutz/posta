import {
  Controller, Get, Post, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  AnalizarImportSchema, CrearImportSchema, ReintentarImportSchema, UploadUrlQuerySchema,
  type AnalizarImportDto, type CrearImportDto, type ReintentarImportDto, type UploadUrlQuery,
} from '@posta/validation';
import { ImportsService } from './imports.service';
import type { TenantUser } from '@posta/shared-types';
import { ApiAuthController, ApiGetAuth, ApiPostAuth } from '../../common/swagger/controller-docs';

@Controller('imports')
@ApiAuthController('imports')
@UseGuards(JwtGuard, RolesGuard)
@Roles('dueno')
export class ImportsController {
  constructor(private readonly service: ImportsService) {}

  @Get('upload-url')
  @ApiGetAuth('URL firmada para subir archivo a Storage')
  async uploadUrl(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(UploadUrlQuerySchema)) query: UploadUrlQuery,
  ) {
    const data = await this.service.generarUrlSubida(user.tenantId, query.filename);
    return { data };
  }

  @Post('analizar')
  @ApiPostAuth('Analizar encabezados y sugerir mapeo de columnas')
  async analizar(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(AnalizarImportSchema)) dto: AnalizarImportDto,
  ) {
    const data = await this.service.analizar(user.tenantId, dto);
    return { data };
  }

  @Post()
  @ApiPostAuth('Crear job de importación')
  async crear(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CrearImportSchema)) dto: CrearImportDto,
  ) {
    const data = await this.service.crear(user.tenantId, user.userId, dto);
    return { data };
  }

  @Get(':jobId/estado')
  @ApiGetAuth('Estado del job de importación (polling)')
  async estado(
    @CurrentUser() user: TenantUser,
    @Param('jobId') jobId: string,
  ) {
    const data = await this.service.estado(user.tenantId, jobId);
    return { data };
  }

  @Post(':jobId/reintento')
  @ApiPostAuth('Reimportar filas corregidas')
  async reintentar(
    @CurrentUser() user: TenantUser,
    @Param('jobId') jobId: string,
    @Body(new ZodValidationPipe(ReintentarImportSchema)) dto: ReintentarImportDto,
  ) {
    const data = await this.service.reintentar(user.tenantId, user.userId, jobId, dto.correcciones);
    return { data };
  }
}
