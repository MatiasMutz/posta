import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ProductosService } from './productos.service';
import { MovimientosService } from '../movimientos/movimientos.service';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CreateProductoSchema, UpdateProductoSchema,
  ListProductosQuerySchema, MovimientoStockSchema,
  type CreateProductoDto, type UpdateProductoDto,
  type ListProductosQuery, type MovimientoStockDto,
} from '@posta/validation';
import { respuestaPaginada } from '../../../common/pagination';
import type { TenantUser } from '@posta/shared-types';

@Controller('inventario/productos')
@UseGuards(JwtGuard, RolesGuard)
export class ProductosController {
  constructor(
    private readonly productosService: ProductosService,
    private readonly movimientosService: MovimientosService,
  ) {}

  @Get()
  async findAll(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ListProductosQuerySchema)) query: ListProductosQuery,
  ) {
    const { items, total } = await this.productosService.findAll(user.tenantId, query, user.rol);
    return respuestaPaginada(items, query.pagina, query.limite, total);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    const data = await this.productosService.findOne(user.tenantId, id, user.rol);
    return { data };
  }

  @Post()
  @Roles('dueno')
  async create(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CreateProductoSchema)) dto: CreateProductoDto,
  ) {
    const data = await this.productosService.create(user.tenantId, user.userId, dto);
    return { data };
  }

  @Patch(':id')
  @Roles('dueno')
  async update(
    @CurrentUser() user: TenantUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProductoSchema)) dto: UpdateProductoDto,
  ) {
    const data = await this.productosService.update(user.tenantId, id, dto);
    return { data };
  }

  @Delete(':id')
  @Roles('dueno')
  @HttpCode(HttpStatus.OK)
  async remove(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    await this.productosService.remove(user.tenantId, id);
    return { data: null };
  }

  @Post(':id/movimientos')
  @Roles('dueno')
  async registrarMovimiento(
    @CurrentUser() user: TenantUser,
    @Param('id') productoId: string,
    @Body(new ZodValidationPipe(MovimientoStockSchema)) dto: MovimientoStockDto,
  ) {
    const data = await this.movimientosService.registrar(
      user.tenantId,
      user.userId,
      productoId,
      dto,
    );
    return { data };
  }

  @Get(':id/movimientos')
  @Roles('dueno', 'contador')
  async listarMovimientos(
    @CurrentUser() user: TenantUser,
    @Param('id') productoId: string,
    @Query(new ZodValidationPipe(ListProductosQuerySchema)) query: ListProductosQuery,
  ) {
    const { items, total } = await this.movimientosService.listar(user.tenantId, productoId, query);
    return respuestaPaginada(items, query.pagina, query.limite, total);
  }
}
