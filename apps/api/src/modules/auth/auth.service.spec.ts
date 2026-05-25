import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';

const mockSupabaseAdmin = {
  auth: {
    admin: {
      createUser: vi.fn(),
      updateUserById: vi.fn(),
      deleteUser: vi.fn(),
    },
    signInWithPassword: vi.fn(),
  },
};

const mockDb = {
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  returning: vi.fn(),
};

function makeService() {
  return new AuthService(mockSupabaseAdmin as any, mockDb as any);
}

beforeEach(() => vi.clearAllMocks());

describe('AuthService.registro', () => {
  it('crea usuario, tenant y membership y devuelve la sesión', async () => {
    const tenantId = 'tenant-uuid';
    const userId = 'user-uuid';

    mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
      data: { user: { id: userId } },
      error: null,
    });
    mockDb.returning.mockResolvedValueOnce([{ id: tenantId, nombre: 'Mi Negocio' }]);
    mockDb.returning.mockResolvedValueOnce([{ id: 'mem-uuid' }]);
    mockSupabaseAdmin.auth.admin.updateUserById.mockResolvedValue({ error: null });
    mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'jwt', refresh_token: 'refresh' } },
      error: null,
    });

    const svc = makeService();
    const result = await svc.registro({
      email: 'dueño@negocio.com',
      password: 'pass12345',
      nombreTenant: 'Mi Negocio',
    });

    expect(result.access_token).toBe('jwt');
    expect(mockSupabaseAdmin.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'dueño@negocio.com', email_confirm: true }),
    );
    expect(mockSupabaseAdmin.auth.admin.updateUserById).toHaveBeenCalledWith(
      userId,
      { app_metadata: { tenant_id: tenantId, rol: 'dueno' } },
    );
  });

  it('lanza ConflictException si el email ya existe', async () => {
    mockSupabaseAdmin.auth.admin.createUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'User already registered' },
    });

    const svc = makeService();
    await expect(
      svc.registro({ email: 'ya@existe.com', password: 'pass12345', nombreTenant: 'X' }),
    ).rejects.toThrow(ConflictException);
  });
});

describe('AuthService.login', () => {
  it('devuelve la sesión con credenciales correctas', async () => {
    mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
      data: { session: { access_token: 'jwt', refresh_token: 'refresh' } },
      error: null,
    });

    const svc = makeService();
    const result = await svc.login({ email: 'a@b.com', password: 'pass12345' });
    expect(result.access_token).toBe('jwt');
  });

  it('lanza UnauthorizedException con credenciales incorrectas', async () => {
    mockSupabaseAdmin.auth.signInWithPassword.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });

    const svc = makeService();
    await expect(svc.login({ email: 'a@b.com', password: 'mal' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
