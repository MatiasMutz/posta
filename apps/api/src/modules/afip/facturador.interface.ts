/**
 * Puerto del adaptador AFIP.
 * El dominio de ventas solo conoce esta interfaz.
 * La implementación (mock o real) se inyecta en AfipModule.
 * Ver skill afip-adapter para el patrón completo.
 */

export interface VentaParaFacturar {
  ventaId: string;
  tipo: 'factura_b' | 'factura_a';
  total: string; // NUMERIC string
  clienteCuit?: string | null;
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: string;
    subtotal: string;
  }>;
}

export interface ResultadoFacturacion {
  cae: string;
  caeVencimiento: Date;
  numeroComprobante: number;
}

export const FACTURADOR_TOKEN = 'FACTURADOR_ELECTRONICO';

export interface FacturadorElectronico {
  emitirComprobante(venta: VentaParaFacturar): Promise<ResultadoFacturacion>;
}
