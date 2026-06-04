import { Controller, Get, Post, Body, Param, Query, Res, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CreateCompraSchema, ListComprasQuerySchema, IvaComprasQuerySchema,
} from '@posta/validation';
import type { CreateCompraDto, ListComprasQuery, IvaComprasQuery } from '@posta/validation';
import { ComprasService } from './compras.service';
import type { TenantUser } from '@posta/shared-types';
import { ApiAuthController, ApiGetAuth, ApiPostAuth } from '../../../common/swagger/controller-docs';

@Controller('compras')
@ApiAuthController('compras')
@UseGuards(JwtGuard, RolesGuard)
export class ComprasController {
  constructor(private readonly service: ComprasService) {}

  @Post()
  @ApiPostAuth('Registrar compra o gasto')
  @Roles('dueno')
  async create(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CreateCompraSchema)) dto: CreateCompraDto,
  ) {
    const data = await this.service.create(user.tenantId, user.userId, dto);
    return { data };
  }

  @Get('iva-compras')
  @ApiGetAuth('Exportar libro IVA Compras (.xlsx)')
  @Roles('dueno', 'contador')
  async exportarIvaCompras(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(IvaComprasQuerySchema)) query: IvaComprasQuery,
    @Res() reply: any,
  ) {
    const buffer = await this.service.exportarIvaCompras(user.tenantId, query);
    reply
      .header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .header('Content-Disposition', 'attachment; filename="iva-compras.xlsx"')
      .send(buffer);
  }

  @Get()
  @ApiGetAuth('Historial de compras paginado')
  @Roles('dueno', 'contador')
  findAll(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ListComprasQuerySchema)) query: ListComprasQuery,
  ) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiGetAuth('Detalle de compra con ítems')
  @Roles('dueno', 'contador')
  async findOne(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    const data = await this.service.findOne(user.tenantId, id);
    return { data };
  }
}
