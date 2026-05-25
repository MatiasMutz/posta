import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthController } from './auth.controller';
import { UnauthorizedException } from '@nestjs/common';

const mockAuthService = {
  registro: vi.fn(),
  login: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe('AuthController', () => {
  const ctrl = new AuthController(mockAuthService as any);

  it('POST /auth/registro delega al servicio y devuelve sesión', async () => {
    mockAuthService.registro.mockResolvedValue({ access_token: 'jwt', refresh_token: 'r' });
    const dto = { email: 'a@b.com', password: 'pass12345', nombreTenant: 'Mi Negocio' };
    const result = await ctrl.registro(dto);
    expect(result.access_token).toBe('jwt');
    expect(mockAuthService.registro).toHaveBeenCalledWith(dto);
  });

  it('POST /auth/login delega al servicio y devuelve sesión', async () => {
    mockAuthService.login.mockResolvedValue({ access_token: 'jwt', refresh_token: 'r' });
    const result = await ctrl.login({ email: 'a@b.com', password: 'pass12345' });
    expect(result.access_token).toBe('jwt');
  });

  it('propaga excepciones del servicio', async () => {
    mockAuthService.login.mockRejectedValue(new UnauthorizedException());
    await expect(ctrl.login({ email: 'a@b.com', password: 'mal' })).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
