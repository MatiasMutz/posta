import type { FilaConError } from '../../db/schema/imports';
import type { TipoImport } from '@posta/validation';

export interface FilaImportable {
  datos: Record<string, unknown>;
  numero: number;
}

/**
 * Detecta SKUs o códigos de barras repetidos dentro del mismo archivo.
 * La primera aparición se conserva; las siguientes se marcan como error.
 */
export function filtrarDuplicadosInventario(filas: FilaImportable[]): {
  filasOk: FilaImportable[];
  errores: FilaConError[];
} {
  const skuPrimeraFila = new Map<string, number>();
  const barrasPrimeraFila = new Map<string, number>();
  const filasOk: FilaImportable[] = [];
  const errores: FilaConError[] = [];

  for (const fila of filas) {
    const sku = fila.datos.sku ? String(fila.datos.sku).trim() : '';
    const barras = fila.datos.codigo_barras ? String(fila.datos.codigo_barras).trim() : '';

    if (sku) {
      const primera = skuPrimeraFila.get(sku);
      if (primera !== undefined) {
        errores.push({
          numero: fila.numero,
          datos: fila.datos,
          problemas: [{
            campo: 'sku',
            valor: sku,
            motivo: `SKU duplicado en el archivo (también en fila ${primera}).`,
          }],
        });
        continue;
      }
      skuPrimeraFila.set(sku, fila.numero);
    }

    if (barras) {
      const primera = barrasPrimeraFila.get(barras);
      if (primera !== undefined) {
        errores.push({
          numero: fila.numero,
          datos: fila.datos,
          problemas: [{
            campo: 'codigo_barras',
            valor: barras,
            motivo: `Código de barras duplicado en el archivo (también en fila ${primera}).`,
          }],
        });
        continue;
      }
      barrasPrimeraFila.set(barras, fila.numero);
    }

    filasOk.push(fila);
  }

  return { filasOk, errores };
}

/** Detecta CUIT o email repetidos dentro del mismo archivo de clientes. */
export function filtrarDuplicadosClientes(filas: FilaImportable[]): {
  filasOk: FilaImportable[];
  errores: FilaConError[];
} {
  const cuitPrimeraFila = new Map<string, number>();
  const emailPrimeraFila = new Map<string, number>();
  const filasOk: FilaImportable[] = [];
  const errores: FilaConError[] = [];

  for (const fila of filas) {
    const cuit = fila.datos.cuit ? String(fila.datos.cuit).trim() : '';
    const email = fila.datos.email ? String(fila.datos.email).trim().toLowerCase() : '';

    if (cuit) {
      const primera = cuitPrimeraFila.get(cuit);
      if (primera !== undefined) {
        errores.push({
          numero: fila.numero,
          datos: fila.datos,
          problemas: [{
            campo: 'cuit',
            valor: cuit,
            motivo: `CUIT duplicado en el archivo (también en fila ${primera}).`,
          }],
        });
        continue;
      }
      cuitPrimeraFila.set(cuit, fila.numero);
    }

    if (email) {
      const primera = emailPrimeraFila.get(email);
      if (primera !== undefined) {
        errores.push({
          numero: fila.numero,
          datos: fila.datos,
          problemas: [{
            campo: 'email',
            valor: email,
            motivo: `Email duplicado en el archivo (también en fila ${primera}).`,
          }],
        });
        continue;
      }
      emailPrimeraFila.set(email, fila.numero);
    }

    filasOk.push(fila);
  }

  return { filasOk, errores };
}

export function filtrarDuplicadosEnArchivo(
  tipo: TipoImport,
  filas: FilaImportable[],
): { filasOk: FilaImportable[]; errores: FilaConError[] } {
  if (tipo === 'inventario') return filtrarDuplicadosInventario(filas);
  if (tipo === 'clientes' || tipo === 'proveedores') return filtrarDuplicadosClientes(filas);
  return { filasOk: filas, errores: [] };
}
