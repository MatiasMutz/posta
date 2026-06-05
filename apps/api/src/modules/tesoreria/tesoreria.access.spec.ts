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

const vendedor: TenantUser = { userId: 'u-v', tenantId: 't1', rol: 'vendedor' };
const contador: TenantUser = { userId: 'u-c', tenantId: 't1', rol: 'contador' };
const dueno: TenantUser = { userId: 'u-d', tenantId: 't1', rol: 'dueno' };

describe('Acceso por rol — tesorería', () => {
  it('vendedor no ve estado de caja', () => {
    expect(canActivate(vendedor, ['dueno', 'contador'])).toThrow(ForbiddenException);
  });

  it('vendedor no abre caja', () => {
    expect(canActivate(vendedor, ['dueno'])).toThrow(ForbiddenException);
  });

  it('vendedor no registra pagos', () => {
    expect(canActivate(vendedor, ['dueno'])).toThrow(ForbiddenException);
  });

  it('contador ve estado de caja', () => {
    expect(canActivate(contador, ['dueno', 'contador'])()).toBe(true);
  });

  it('contador ve flujo de caja', () => {
    expect(canActivate(contador, ['dueno', 'contador'])()).toBe(true);
  });

  it('contador no abre caja', () => {
    expect(canActivate(contador, ['dueno'])).toThrow(ForbiddenException);
  });

  it('contador no registra pagos', () => {
    expect(canActivate(contador, ['dueno'])).toThrow(ForbiddenException);
  });

  it('dueño abre caja y registra pagos', () => {
    expect(canActivate(dueno, ['dueno'])()).toBe(true);
  });
});
