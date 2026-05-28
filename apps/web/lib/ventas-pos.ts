import { CreateVentaSchema, type CreateVentaDto } from '@posta/validation';
import type { CampoError } from '@posta/shared-types';

export interface ItemCarritoPos {
  productoId: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: string;
}

export interface PosVentaInput {
  tipo: string;
  metodoPago: string;
  clienteId: string;
  descuento?: string;
  items: ItemCarritoPos[];
}

export type VentaValidationResult =
  | { ok: true; data: CreateVentaDto }
  | { ok: false; mensaje: string; errores: CampoError[] };

/** Arma el payload REST a partir del estado del POS (snake_case para la API). */
export function buildVentaPayload(input: PosVentaInput): unknown {
  return {
    tipo: input.tipo,
    metodo_pago: input.metodoPago,
    descuento: input.descuento ?? '0',
    ...(input.clienteId ? { cliente_id: input.clienteId } : {}),
    items: input.items.map((i) => ({
      producto_id: i.productoId,
      descripcion: i.descripcion,
      cantidad: i.cantidad,
      precio_unitario: i.precioUnitario,
    })),
  };
}

function zodToCampoErrores(errors: Array<{ path: (string | number)[]; message: string }>): CampoError[] {
  return errors.map((e) => ({
    campo: e.path.length > 0 ? e.path.join('.') : 'general',
    motivo: e.message,
  }));
}

/** Valida la venta del POS con el mismo schema que el backend (`CreateVentaSchema`). */
export function validarVentaPos(input: PosVentaInput): VentaValidationResult {
  if (input.items.length === 0) {
    return {
      ok: false,
      mensaje: 'Agregá al menos un producto al carrito.',
      errores: [{ campo: 'items', motivo: 'La venta debe tener al menos un ítem' }],
    };
  }

  const parsed = CreateVentaSchema.safeParse(buildVentaPayload(input));
  if (parsed.success) {
    return { ok: true, data: parsed.data };
  }

  const errores = zodToCampoErrores(parsed.error.errors);
  return {
    ok: false,
    mensaje: errores[0]?.motivo ?? 'Revisá los datos de la venta.',
    errores,
  };
}

export function mensajeErrorVenta(result: Extract<VentaValidationResult, { ok: false }>): string {
  return result.errores[0]?.motivo ?? result.mensaje;
}
