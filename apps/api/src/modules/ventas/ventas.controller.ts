import { Controller, Get, Post, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateVentaSchema, ListVentasQuerySchema } from '@posta/validation';
import { z } from 'zod';
import type { CreateVentaDto, ListVentasQuery } from '@posta/validation';
import { VentasService } from './ventas.service';
import type { TenantUser } from '@posta/shared-types';

const IvaVentasQuerySchema = z.object({
  desde: z.string().optional(),
  hasta: z.string().optional(),
});

@Controller('ventas')
@UseGuards(JwtGuard, RolesGuard)
export class VentasController {
  constructor(private readonly service: VentasService) {}

  /** POS: crear venta, intentar AFIP, descontar stock. */
  @Post()
  @Roles('dueno', 'vendedor')
  create(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CreateVentaSchema)) dto: CreateVentaDto,
  ) {
    return this.service.create(user.tenantId, user.userId, dto);
  }

  /** Exportación libro IVA Ventas (.xlsx). Debe ir ANTES de /:id para no colisionar. */
  @Get('iva-ventas')
  @Roles('dueno', 'contador')
  async exportarIvaVentas(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(IvaVentasQuerySchema)) query: z.infer<typeof IvaVentasQuerySchema>,
    @Res() reply: any, // FastifyReply — usamos any para evitar import de tipo de fastify
  ) {
    const buffer = await this.service.exportarIvaVentas(user.tenantId, query);
    reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', 'attachment; filename="iva-ventas.xlsx"')
      .send(buffer);
  }

  /** Historial paginado con filtros. */
  @Get()
  @Roles('dueno', 'contador')
  findAll(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ListVentasQuerySchema)) query: ListVentasQuery,
  ) {
    return this.service.findAll(user.tenantId, query);
  }

  /** Detalle de una venta con ítems. */
  @Get(':id')
  @Roles('dueno', 'vendedor', 'contador')
  findOne(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  /** Reintento manual de facturación AFIP. */
  @Post(':id/reintentar-facturacion')
  @Roles('dueno')
  reintentar(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    return this.service.reintentar(user.tenantId, id);
  }
}
