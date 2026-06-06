import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { TenantUser } from '@posta/shared-types';

function canActivate(user: TenantUser, roles: string[] | undefined) {
  const reflector = { getAllAndOverride: () => roles } as unknown as Reflector;
  const guard = new RolesGuard(reflector);
  const ctx = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  };
  return () => guard.canActivate(ctx as never);
}

const vendedor: TenantUser = { userId: 'u-v', tenantId: 't1', rol: 'vendedor', email: 'v@test.com' };
const contador: TenantUser = { userId: 'u-c', tenantId: 't1', rol: 'contador', email: 'c@test.com' };
const dueno: TenantUser = { userId: 'u-d', tenantId: 't1', rol: 'dueno', email: 'd@test.com' };

describe('Acceso por rol — dashboard', () => {
  it('solo dueño accede al dashboard', () => {
    expect(canActivate(dueno, ['dueno'])()).toBe(true);
    expect(canActivate(vendedor, ['dueno'])).toThrow(ForbiddenException);
    expect(canActivate(contador, ['dueno'])).toThrow(ForbiddenException);
  });
});

describe('Acceso por rol — contador', () => {
  it('dueño y contador ven resumen fiscal', () => {
    expect(canActivate(dueno, ['dueno', 'contador'])()).toBe(true);
    expect(canActivate(contador, ['dueno', 'contador'])()).toBe(true);
  });

  it('vendedor no accede a endpoints contador', () => {
    expect(canActivate(vendedor, ['dueno', 'contador'])).toThrow(ForbiddenException);
  });
});
