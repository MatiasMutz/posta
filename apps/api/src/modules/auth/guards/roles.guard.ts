import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { FastifyRequest } from 'fastify';
import type { Rol, TenantUser } from '@posta/shared-types';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<Rol[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Sin decorador @Roles, cualquier usuario autenticado puede pasar
    if (!rolesRequeridos?.length) return true;

    const request = context.switchToHttp().getRequest<FastifyRequest & { user: TenantUser }>();
    const { rol } = request.user;

    if (!rolesRequeridos.includes(rol)) {
      throw new ForbiddenException('No tenés permiso para esta acción');
    }

    return true;
  }
}
