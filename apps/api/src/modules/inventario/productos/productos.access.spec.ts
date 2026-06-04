import { describe, it, expect } from 'vitest';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { RolesGuard } from '../../auth/guards/roles.guard';
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

describe('Acceso por rol — inventario productos', () => {
  it('vendedor puede listar productos', () => {
    expect(canActivate(vendedor, ['dueno', 'vendedor', 'contador'])()).toBe(true);
  });

  it('contador puede listar productos', () => {
    expect(canActivate(contador, ['dueno', 'vendedor', 'contador'])()).toBe(true);
  });

  it('vendedor no registra movimientos de stock', () => {
    expect(canActivate(vendedor, ['dueno'])).toThrow(ForbiddenException);
  });

  it('contador puede ver historial de movimientos', () => {
    expect(canActivate(contador, ['dueno', 'contador'])()).toBe(true);
  });

  it('contador no crea productos', () => {
    expect(canActivate(contador, ['dueno'])).toThrow(ForbiddenException);
  });
});
