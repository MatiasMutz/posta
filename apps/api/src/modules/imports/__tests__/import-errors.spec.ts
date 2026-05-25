import { describe, it, expect } from 'vitest';
import { mensajeErrorImportacion } from '../import-errors';

describe('mensajeErrorImportacion', () => {
  it('humaniza errores de query de Drizzle', () => {
    const msg = mensajeErrorImportacion(new Error('Failed query: insert into productos...'));
    expect(msg).not.toContain('Failed query');
    expect(msg).toContain('No se pudieron guardar');
  });

  it('humaniza duplicate key de SKU', () => {
    const msg = mensajeErrorImportacion(
      new Error('duplicate key value violates unique constraint "idx_productos_tenant_sku"'),
    );
    expect(msg).toContain('SKU');
  });
});
