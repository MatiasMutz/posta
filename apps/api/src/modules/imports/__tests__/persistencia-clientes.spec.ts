import { describe, it, expect } from 'vitest';
import { buscarClienteExistente, type IndiceClientes } from '../persistencia-clientes';

const cliente = (overrides: Partial<{ id: string; cuit: string | null; email: string | null }>) => ({
  id: overrides.id ?? 'uuid-1',
  tenant_id: 'tenant-1',
  nombre: 'Test',
  email: overrides.email ?? null,
  telefono: null,
  cuit: overrides.cuit ?? null,
  direccion: null,
  activo: true,
  saldo_deudor: '0',
  created_by: null,
  created_at: new Date(),
  updated_at: new Date(),
});

describe('buscarClienteExistente', () => {
  it('prioriza match por CUIT sobre email', () => {
    const porCuit = new Map([['20123456789', cliente({ id: 'por-cuit', cuit: '20123456789' })]]);
    const porEmail = new Map([['a@test.com', cliente({ id: 'por-email', email: 'a@test.com' })]]);
    const indice: IndiceClientes = { porCuit, porEmail };

    const found = buscarClienteExistente(
      { cuit: '20123456789', email: 'a@test.com' },
      indice,
    );
    expect(found?.id).toBe('por-cuit');
  });

  it('busca por email si no hay CUIT', () => {
    const indice: IndiceClientes = {
      porCuit: new Map(),
      porEmail: new Map([['b@test.com', cliente({ id: 'por-email', email: 'b@test.com' })]]),
    };
    const found = buscarClienteExistente({ email: 'b@test.com' }, indice);
    expect(found?.id).toBe('por-email');
  });

  it('devuelve null si no hay claves de match', () => {
    const indice: IndiceClientes = { porCuit: new Map(), porEmail: new Map() };
    expect(buscarClienteExistente({ nombre: 'Sin clave' }, indice)).toBeNull();
  });
});
