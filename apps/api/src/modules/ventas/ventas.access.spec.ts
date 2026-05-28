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

describe('Acceso por rol — ventas', () => {
  it('vendedor no accede al historial (GET /ventas)', () => {
    expect(canActivate(vendedor, ['dueno', 'contador'])).toThrow(ForbiddenException);
  });

  it('vendedor no exporta IVA (GET /ventas/iva-ventas)', () => {
    expect(canActivate(vendedor, ['dueno', 'contador'])).toThrow(ForbiddenException);
  });

  it('contador no crea ventas en POS (POST /ventas)', () => {
    expect(canActivate(contador, ['dueno', 'vendedor'])).toThrow(ForbiddenException);
  });

  it('contador sí accede al historial', () => {
    expect(canActivate(contador, ['dueno', 'contador'])()).toBe(true);
  });
});
