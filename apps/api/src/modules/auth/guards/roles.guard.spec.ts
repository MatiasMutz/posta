import { describe, it, expect, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import type { Rol, TenantUser } from '@posta/shared-types';

function mockContext(user: TenantUser, rolesRequeridos: Rol[] | undefined) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(rolesRequeridos),
  } as unknown as Reflector;

  const guard = new RolesGuard(reflector);

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  };

  return { guard, context };
}

const dueno: TenantUser = { userId: 'u1', tenantId: 't1', rol: 'dueno' };
const vendedor: TenantUser = { userId: 'u2', tenantId: 't1', rol: 'vendedor' };
const contador: TenantUser = { userId: 'u3', tenantId: 't1', rol: 'contador' };

describe('RolesGuard', () => {
  it('permite cualquier rol si no hay @Roles', () => {
    const { guard, context } = mockContext(vendedor, undefined);
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('permite dueño en endpoints de dueño', () => {
    const { guard, context } = mockContext(dueno, ['dueno']);
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('bloquea vendedor en historial de ventas (dueno, contador)', () => {
    const { guard, context } = mockContext(vendedor, ['dueno', 'contador']);
    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });

  it('permite contador en historial de ventas', () => {
    const { guard, context } = mockContext(contador, ['dueno', 'contador']);
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('bloquea vendedor en exportación IVA', () => {
    const { guard, context } = mockContext(vendedor, ['dueno', 'contador']);
    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });

  it('bloquea vendedor y contador en importación (solo dueño)', () => {
    for (const user of [vendedor, contador]) {
      const { guard, context } = mockContext(user, ['dueno']);
      expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
    }
  });

  it('permite dueño en importación', () => {
    const { guard, context } = mockContext(dueno, ['dueno']);
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('permite vendedor en POST /ventas', () => {
    const { guard, context } = mockContext(vendedor, ['dueno', 'vendedor']);
    expect(guard.canActivate(context as any)).toBe(true);
  });

  it('bloquea contador en POST /ventas', () => {
    const { guard, context } = mockContext(contador, ['dueno', 'vendedor']);
    expect(() => guard.canActivate(context as any)).toThrow(ForbiddenException);
  });
});
