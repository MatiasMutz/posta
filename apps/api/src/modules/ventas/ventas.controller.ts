import { Controller, Get, Post, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateVentaSchema, ListVentasQuerySchema, IvaVentasQuerySchema } from '@posta/validation';
import type { CreateVentaDto, ListVentasQuery, IvaVentasQuery } from '@posta/validation';
import { VentasService } from './ventas.service';
import type { TenantUser } from '@posta/shared-types';
import { ApiAuthController, ApiGetAuth, ApiPostAuth } from '../../common/swagger/controller-docs';

@Controller('ventas')
@ApiAuthController('ventas')
@UseGuards(JwtGuard, RolesGuard)
export class VentasController {
  constructor(private readonly service: VentasService) {}

  @Post()
  @ApiPostAuth('Crear venta (POS)')
  @Roles('dueno', 'vendedor')
  async create(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CreateVentaSchema)) dto: CreateVentaDto,
  ) {
    const data = await this.service.create(user.tenantId, user.userId, dto);
    return { data };
  }

  @Get('iva-ventas')
  @ApiGetAuth('Exportar libro IVA Ventas (.xlsx)')
  @Roles('dueno', 'contador')
  async exportarIvaVentas(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(IvaVentasQuerySchema)) query: IvaVentasQuery,
    @Res() reply: any,
  ) {
    const buffer = await this.service.exportarIvaVentas(user.tenantId, query);
    reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', 'attachment; filename="iva-ventas.xlsx"')
      .send(buffer);
  }

  @Get()
  @ApiGetAuth('Historial de ventas paginado')
  @Roles('dueno', 'contador')
  findAll(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ListVentasQuerySchema)) query: ListVentasQuery,
  ) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiGetAuth('Detalle de venta con ítems')
  @Roles('dueno', 'vendedor', 'contador')
  async findOne(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    const data = await this.service.findOne(user.tenantId, id);
    return { data };
  }

  @Post(':id/reintentar-facturacion')
  @ApiPostAuth('Reintento manual de facturación AFIP')
  @Roles('dueno')
  async reintentar(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    const data = await this.service.reintentarManual(user.tenantId, id);
    return { data };
  }
}
