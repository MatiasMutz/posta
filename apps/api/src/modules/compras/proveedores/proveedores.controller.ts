import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../../auth/guards/jwt.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import {
  CreateProveedorSchema, UpdateProveedorSchema, ListProveedoresQuerySchema,
} from '@posta/validation';
import type {
  CreateProveedorDto, UpdateProveedorDto, ListProveedoresQuery,
} from '@posta/validation';
import { ProveedoresService } from './proveedores.service';
import type { TenantUser } from '@posta/shared-types';
import { ApiAuthController, ApiGetAuth, ApiPostAuth, ApiPatchAuth } from '../../../common/swagger/controller-docs';

@Controller('proveedores')
@ApiAuthController('proveedores')
@UseGuards(JwtGuard, RolesGuard)
export class ProveedoresController {
  constructor(private readonly service: ProveedoresService) {}

  @Get()
  @ApiGetAuth('Listar proveedores')
  @Roles('dueno', 'contador')
  findAll(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ListProveedoresQuerySchema)) query: ListProveedoresQuery,
  ) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiGetAuth('Detalle de proveedor')
  @Roles('dueno', 'contador')
  async findOne(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    const data = await this.service.findOne(user.tenantId, id);
    return { data };
  }

  @Post()
  @ApiPostAuth('Crear proveedor')
  @Roles('dueno')
  async create(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CreateProveedorSchema)) dto: CreateProveedorDto,
  ) {
    const data = await this.service.create(user.tenantId, user.userId, dto);
    return { data };
  }

  @Patch(':id')
  @ApiPatchAuth('Actualizar proveedor')
  @Roles('dueno')
  async update(
    @CurrentUser() user: TenantUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProveedorSchema)) dto: UpdateProveedorDto,
  ) {
    const data = await this.service.update(user.tenantId, id, dto);
    return { data };
  }
}
