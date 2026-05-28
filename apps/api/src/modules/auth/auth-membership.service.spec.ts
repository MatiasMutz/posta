import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UnauthorizedException } from '@nestjs/common';

const { mockSupabase, mockDb } = vi.hoisted(() => ({
  mockSupabase: { auth: { admin: { updateUserById: vi.fn().mockResolvedValue({}) } } },
  mockDb: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
  },
}));

vi.mock('../../db', () => ({ db: mockDb }));

import { AuthMembershipService } from './auth-membership.service';

describe('AuthMembershipService', () => {
  let svc: AuthMembershipService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb.select.mockReturnThis();
    mockDb.from.mockReturnThis();
    mockDb.where.mockReturnThis();
    svc = new AuthMembershipService(mockSupabase as never);
  });

  it('resuelve rol desde BD, no del JWT', async () => {
    mockDb.limit.mockResolvedValueOnce([{
      tenant_id: 't1',
      user_id: 'u1',
      rol: 'vendedor',
    }]);
    const user = await svc.resolverMembership('u1', 't1');
    expect(user.rol).toBe('vendedor');
    expect(user.tenantId).toBe('t1');
  });

  it('lanza 401 si no hay membership', async () => {
    mockDb.limit.mockResolvedValueOnce([]);
    await expect(svc.resolverMembership('u1', 't1')).rejects.toThrow(UnauthorizedException);
  });

  it('fallback a membership sin tenant_id en JWT', async () => {
    mockDb.limit.mockResolvedValueOnce([{
      tenant_id: 't1',
      user_id: 'u1',
      rol: 'contador',
    }]);
    const user = await svc.resolverMembership('u1', undefined);
    expect(user.rol).toBe('contador');
  });
});
