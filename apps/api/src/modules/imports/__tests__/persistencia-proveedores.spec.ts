import { describe, it, expect } from 'vitest';
import { buscarProveedorExistente, type IndiceProveedores } from '../persistencia-proveedores';

describe('buscarProveedorExistente', () => {
  const indice: IndiceProveedores = {
    porCuit: new Map([
      ['30123456789', {
        id: 'p1',
        tenant_id: 't1',
        nombre: 'Prov',
        cuit: '30123456789',
        saldo_acreedor: '0',
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
      } as never],
    ]),
    porEmail: new Map(),
  };

  it('encuentra por CUIT', () => {
    const found = buscarProveedorExistente({ cuit: '30123456789', nombre: 'X' }, indice);
    expect(found?.id).toBe('p1');
  });

  it('devuelve null si no hay match', () => {
    expect(buscarProveedorExistente({ nombre: 'Nuevo' }, indice)).toBeNull();
  });
});
