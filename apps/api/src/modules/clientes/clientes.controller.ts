import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CreateClienteSchema, UpdateClienteSchema, ListClientesQuerySchema } from '@posta/validation';
import type { CreateClienteDto, UpdateClienteDto, ListClientesQuery } from '@posta/validation';
import { ClientesService } from './clientes.service';
import type { TenantUser } from '@posta/shared-types';
import { ApiAuthController, ApiGetAuth, ApiPostAuth, ApiPatchAuth } from '../../common/swagger/controller-docs';

@Controller('clientes')
@ApiAuthController('clientes')
@UseGuards(JwtGuard, RolesGuard)
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Get()
  @ApiGetAuth('Listar clientes')
  @Roles('dueno', 'vendedor', 'contador')
  findAll(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ListClientesQuerySchema)) query: ListClientesQuery,
  ) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get(':id')
  @ApiGetAuth('Detalle de cliente')
  @Roles('dueno', 'vendedor', 'contador')
  async findOne(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    const data = await this.service.findOne(user.tenantId, id);
    return { data };
  }

  @Post()
  @ApiPostAuth('Crear cliente')
  @Roles('dueno')
  async create(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CreateClienteSchema)) dto: CreateClienteDto,
  ) {
    const data = await this.service.create(user.tenantId, user.userId, dto);
    return { data };
  }

  @Patch(':id')
  @ApiPatchAuth('Actualizar cliente')
  @Roles('dueno')
  async update(
    @CurrentUser() user: TenantUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateClienteSchema)) dto: UpdateClienteDto,
  ) {
    const data = await this.service.update(user.tenantId, id, dto);
    return { data };
  }
}
