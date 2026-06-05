import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { PagoClienteSchema, PagoProveedorSchema } from '@posta/validation';
import type { PagoClienteDto, PagoProveedorDto } from '@posta/validation';
import { PagosService } from './pagos.service';
import type { TenantUser } from '@posta/shared-types';
import { ApiAuthController, ApiGetAuth, ApiPostAuth } from '../../../common/swagger/controller-docs';

@Controller('tesoreria/pagos')
@ApiAuthController('tesoreria')
@UseGuards(JwtGuard, RolesGuard)
export class PagosController {
  constructor(private readonly service: PagosService) {}

  @Get('cuentas-corrientes')
  @ApiGetAuth('Clientes y proveedores con saldo pendiente')
  @Roles('dueno', 'contador')
  async listarCuentasCorrientes(@CurrentUser() user: TenantUser) {
    const data = await this.service.listarCuentasCorrientes(user.tenantId);
    return { data };
  }

  @Post('cliente')
  @ApiPostAuth('Registrar cobro de cliente (baja saldo deudor)')
  @Roles('dueno')
  async registrarPagoCliente(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(PagoClienteSchema)) dto: PagoClienteDto,
  ) {
    const data = await this.service.registrarPagoCliente(user.tenantId, user.userId, dto);
    return { data };
  }

  @Post('proveedor')
  @ApiPostAuth('Registrar pago a proveedor (baja saldo acreedor)')
  @Roles('dueno')
  async registrarPagoProveedor(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(PagoProveedorSchema)) dto: PagoProveedorDto,
  ) {
    const data = await this.service.registrarPagoProveedor(user.tenantId, user.userId, dto);
    return { data };
  }
}
