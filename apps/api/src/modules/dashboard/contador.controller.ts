import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  ContadorResumenQuerySchema, ContadorComprobantesQuerySchema,
} from '@posta/validation';
import type { ContadorResumenQuery, ContadorComprobantesQuery } from '@posta/validation';
import { ContadorService } from './contador.service';
import type { TenantUser } from '@posta/shared-types';
import { ApiAuthController, ApiGetAuth } from '../../common/swagger/controller-docs';

@Controller('contador')
@ApiAuthController('contador')
@UseGuards(JwtGuard, RolesGuard)
export class ContadorController {
  constructor(private readonly service: ContadorService) {}

  @Get('resumen')
  @ApiGetAuth('Resumen fiscal IVA ventas/compras del período')
  @Roles('dueno', 'contador')
  getResumen(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ContadorResumenQuerySchema)) query: ContadorResumenQuery,
  ) {
    return this.service.getResumen(user.tenantId, query).then((data) => ({ data }));
  }

  @Get('comprobantes')
  @ApiGetAuth('Comprobantes fiscales emitidos (paginado)')
  @Roles('dueno', 'contador')
  listarComprobantes(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ContadorComprobantesQuerySchema)) query: ContadorComprobantesQuery,
  ) {
    return this.service.listarComprobantes(user.tenantId, query);
  }
}
