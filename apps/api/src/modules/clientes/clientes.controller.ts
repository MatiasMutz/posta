import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { PaginacionSchema, CreateClienteSchema, UpdateClienteSchema } from '@posta/validation';
import { z } from 'zod';
import { ClientesService } from './clientes.service';
import type { TenantUser } from '@posta/shared-types';

const ListClientesQuerySchema = PaginacionSchema.extend({
  buscar: z.string().max(200).optional(),
});

@Controller('clientes')
@UseGuards(JwtGuard, RolesGuard)
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Get()
  @Roles('dueno', 'vendedor', 'contador')
  findAll(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(ListClientesQuerySchema)) query: z.infer<typeof ListClientesQuerySchema>,
  ) {
    return this.service.findAll(user.tenantId, query);
  }

  @Get(':id')
  @Roles('dueno', 'vendedor', 'contador')
  findOne(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    return this.service.findOne(user.tenantId, id);
  }

  @Post()
  @Roles('dueno')
  create(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(CreateClienteSchema)) dto: z.infer<typeof CreateClienteSchema>,
  ) {
    return this.service.create(user.tenantId, dto);
  }

  @Patch(':id')
  @Roles('dueno')
  update(
    @CurrentUser() user: TenantUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateClienteSchema)) dto: z.infer<typeof UpdateClienteSchema>,
  ) {
    return this.service.update(user.tenantId, id, dto);
  }
}
