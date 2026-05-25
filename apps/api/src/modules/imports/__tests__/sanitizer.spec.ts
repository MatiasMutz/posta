import { describe, it, expect } from 'vitest';
import {
  sanitizarTexto,
  sanitizarMonto,
  sanitizarEntero,
  sanitizarFecha,
  sanitizarCuit,
} from '../sanitizer';

describe('sanitizarTexto', () => {
  it('retorna null para vacíos', () => {
    expect(sanitizarTexto('')).toBeNull();
    expect(sanitizarTexto(null)).toBeNull();
    expect(sanitizarTexto('   ')).toBeNull();
  });
  it('trimea espacios', () => {
    expect(sanitizarTexto('  hola mundo  ')).toBe('hola mundo');
  });
  it('convierte a string', () => {
    expect(sanitizarTexto(42)).toBe('42');
  });
});

describe('sanitizarMonto', () => {
  it('acepta float nativo de xlsx', () => {
    expect(sanitizarMonto(1234.56)).toBe('1234.56');
  });
  it('formato argentino: "$ 1.234,56"', () => {
    expect(sanitizarMonto('$ 1.234,56')).toBe('1234.56');
  });
  it('solo coma decimal: "1234,56"', () => {
    expect(sanitizarMonto('1234,56')).toBe('1234.56');
  });
  it('punto decimal estándar: "1234.56"', () => {
    expect(sanitizarMonto('1234.56')).toBe('1234.56');
  });
  it('entero sin decimales: "1500"', () => {
    expect(sanitizarMonto('1500')).toBe('1500');
  });
  it('con símbolo $ sin espacio', () => {
    expect(sanitizarMonto('$900')).toBe('900');
  });
  it('retorna null para texto no numérico', () => {
    expect(sanitizarMonto('precio')).toBeNull();
    expect(sanitizarMonto('')).toBeNull();
  });
});

describe('sanitizarEntero', () => {
  it('acepta entero string', () => {
    expect(sanitizarEntero('20')).toBe('20');
  });
  it('acepta number', () => {
    expect(sanitizarEntero(5)).toBe('5');
  });
  it('redondea float de xlsx', () => {
    expect(sanitizarEntero(20.0)).toBe('20');
  });
  it('retorna null para negativo', () => {
    expect(sanitizarEntero('-1')).toBeNull();
  });
  it('retorna null para texto', () => {
    expect(sanitizarEntero('abc')).toBeNull();
  });
});

describe('sanitizarFecha', () => {
  it('DD/MM/AAAA → ISO', () => {
    expect(sanitizarFecha('15/03/2024')).toBe('2024-03-15');
  });
  it('DD-MM-AAAA → ISO', () => {
    expect(sanitizarFecha('01-12-2023')).toBe('2023-12-01');
  });
  it('objeto Date de xlsx', () => {
    expect(sanitizarFecha(new Date('2024-06-20'))).toBe('2024-06-20');
  });
  it('ISO ya ok', () => {
    expect(sanitizarFecha('2024-01-15')).toBe('2024-01-15');
  });
  it('retorna null para fecha inválida', () => {
    expect(sanitizarFecha('32/13/2024')).toBeNull();
    expect(sanitizarFecha('no es fecha')).toBeNull();
  });
});

describe('sanitizarCuit', () => {
  it('CUIT con guiones → 11 dígitos', () => {
    expect(sanitizarCuit('20-12345678-9')).toBe('20123456789');
  });
  it('CUIT ya limpio', () => {
    expect(sanitizarCuit('20123456789')).toBe('20123456789');
  });
  it('retorna null si no tiene 11 dígitos', () => {
    expect(sanitizarCuit('2012345')).toBeNull();
    expect(sanitizarCuit('')).toBeNull();
  });
});
