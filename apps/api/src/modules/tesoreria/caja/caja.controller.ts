import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  AperturaCajaSchema, CierreCajaSchema, MovimientoCajaSchema,
  FlujoCajaQuerySchema, ListMovimientosCajaQuerySchema,
} from '@posta/validation';
import type {
  AperturaCajaDto, CierreCajaDto, MovimientoCajaDto,
  FlujoCajaQuery, ListMovimientosCajaQuery,
} from '@posta/validation';
import { CajaService } from './caja.service';
import type { TenantUser } from '@posta/shared-types';
import { ApiAuthController, ApiGetAuth, ApiPostAuth } from '../../../common/swagger/controller-docs';

@Controller('tesoreria/caja')
@ApiAuthController('tesoreria')
@UseGuards(JwtGuard, RolesGuard)
export class CajaController {
  constructor(private readonly service: CajaService) {}

  @Get()
  @ApiGetAuth('Estado de la caja del día')
  @Roles('dueno', 'contador')
  async getEstado(@CurrentUser() user: TenantUser) {
    const data = await this.service.getEstado(user.tenantId);
    return { data };
  }

  @Post('apertura')
  @ApiPostAuth('Abrir caja del día')
  @Roles('dueno')
  async abrir(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(AperturaCajaSchema)) dto: AperturaCajaDto,
  ) {
    const data = await this.service.abrir(user.tenantId, user.userId, dto);
    return { data };
  }

  @Post('cierre')
  @ApiPostAuth('Cerrar caja del día')
  @Roles('dueno')
  async cerrar(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CierreCajaSchema)) dto: CierreCajaDto,
  ) {
    const data = await this.service.cerrar(user.tenantId, dto);
    return { data };
  }

  @Post('movimientos')
  @ApiPostAuth('Registrar ingreso o egreso manual')
  @Roles('dueno')
  async registrarMovimiento(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(MovimientoCajaSchema)) dto: MovimientoCajaDto,
  ) {
    const data = await this.service.registrarMovimiento(user.tenantId, user.userId, dto);
    return { data };
  }

  @Get('movimientos')
  @ApiGetAuth('Movimientos de la sesión abierta')
  @Roles('dueno', 'contador')
  listarMovimientos(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ListMovimientosCajaQuerySchema)) query: ListMovimientosCajaQuery,
  ) {
    return this.service.listarMovimientos(user.tenantId, query);
  }
}

@Controller('tesoreria/flujo-caja')
@ApiAuthController('tesoreria')
@UseGuards(JwtGuard, RolesGuard)
export class FlujoCajaController {
  constructor(private readonly service: CajaService) {}

  @Get()
  @ApiGetAuth('Resumen de flujo de caja por período')
  @Roles('dueno', 'contador')
  async flujoCaja(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(FlujoCajaQuerySchema)) query: FlujoCajaQuery,
  ) {
    const data = await this.service.flujoCaja(user.tenantId, query);
    return { data };
  }
}
