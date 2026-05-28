import {
  Controller, Get, Post, Patch, Delete, Body, Param, UseGuards,
} from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsUsuariosService } from './tenants-usuarios.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { InvitarUsuarioSchema, CambiarRolUsuarioSchema } from '@posta/validation';
import type { InvitarUsuarioDto, CambiarRolUsuarioDto } from '@posta/validation';
import type { TenantUser } from '@posta/shared-types';
import {
  ApiAuthController, ApiGetAuth, ApiPostAuth, ApiPatchAuth, ApiDeleteAuth,
} from '../../common/swagger/controller-docs';

@Controller('tenants')
@ApiAuthController('tenants')
@UseGuards(JwtGuard, RolesGuard)
export class TenantsController {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly usuariosService: TenantsUsuariosService,
  ) {}

  @Get('me')
  @ApiGetAuth('Tenant actual y rol del usuario autenticado')
  async getTenantActual(@CurrentUser() user: TenantUser) {
    const tenant = await this.tenantsService.getTenantActual(user.tenantId);
    return {
      data: {
        ...tenant,
        rol: user.rol,
        userId: user.userId,
      },
    };
  }

  @Get('usuarios')
  @ApiGetAuth('Listar miembros e invitaciones pendientes')
  @Roles('dueno')
  async listarUsuarios(@CurrentUser() user: TenantUser) {
    const data = await this.usuariosService.listar(user.tenantId);
    return { data };
  }

  @Post('usuarios/invitar')
  @ApiPostAuth('Invitar usuario al tenant')
  @Roles('dueno')
  async invitar(
    @CurrentUser() user: TenantUser,
    @Body(new ZodValidationPipe(InvitarUsuarioSchema)) dto: InvitarUsuarioDto,
  ) {
    const data = await this.usuariosService.invitar(user.tenantId, user.userId, dto);
    return { data, mensaje: 'Invitación enviada por email.' };
  }

  @Patch('usuarios/:id/rol')
  @ApiPatchAuth('Cambiar rol de un miembro')
  @Roles('dueno')
  async cambiarRol(
    @CurrentUser() user: TenantUser,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CambiarRolUsuarioSchema)) dto: CambiarRolUsuarioDto,
  ) {
    const data = await this.usuariosService.cambiarRol(user.tenantId, id, dto);
    return { data };
  }

  @Delete('usuarios/:id')
  @ApiDeleteAuth('Revocar acceso de un miembro')
  @Roles('dueno')
  async revocar(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    const data = await this.usuariosService.revocar(user.tenantId, id);
    return { data };
  }

  @Delete('usuarios/invitaciones/:id')
  @ApiDeleteAuth('Revocar invitación pendiente')
  @Roles('dueno')
  async revocarInvitacion(@CurrentUser() user: TenantUser, @Param('id') id: string) {
    const data = await this.usuariosService.revocarInvitacion(user.tenantId, id);
    return { data };
  }
}
