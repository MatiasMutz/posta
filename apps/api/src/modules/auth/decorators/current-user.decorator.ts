import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import type { TenantUser } from '@posta/shared-types';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TenantUser => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: TenantUser }>();
    return request.user;
  },
);
