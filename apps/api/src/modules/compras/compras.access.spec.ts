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

describe('Acceso por rol — compras y proveedores', () => {
  it('vendedor no lista proveedores', () => {
    expect(canActivate(vendedor, ['dueno', 'contador'])).toThrow(ForbiddenException);
  });

  it('vendedor no registra compras', () => {
    expect(canActivate(vendedor, ['dueno'])).toThrow(ForbiddenException);
  });

  it('vendedor no exporta IVA Compras', () => {
    expect(canActivate(vendedor, ['dueno', 'contador'])).toThrow(ForbiddenException);
  });

  it('contador no crea compras', () => {
    expect(canActivate(contador, ['dueno'])).toThrow(ForbiddenException);
  });

  it('contador sí exporta IVA Compras', () => {
    expect(canActivate(contador, ['dueno', 'contador'])()).toBe(true);
  });

  it('contador sí lista compras', () => {
    expect(canActivate(contador, ['dueno', 'contador'])()).toBe(true);
  });
});
