import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { FacturadorElectronico, VentaParaFacturar, ResultadoFacturacion } from './facturador.interface';

/**
 * Implementación mock de FacturadorElectronico.
 * Simula respuestas de AFIP sin hacer llamadas reales.
 *
 * Variables de entorno que controlan el comportamiento:
 *   AFIP_MOCK_FAIL=true    → siempre falla (simula caída de AFIP)
 *   AFIP_MOCK_DELAY_MS=500 → latencia artificial en ms (default 100)
 *
 * En Fase 5+ se enchufa FacturadorAfipReal sin tocar el dominio de ventas.
 */
@Injectable()
export class FacturadorMock implements FacturadorElectronico {
  private readonly logger = new Logger(FacturadorMock.name);
  private contadorComprobantes = 1;

  async emitirComprobante(venta: VentaParaFacturar): Promise<ResultadoFacturacion> {
    const delay = parseInt(process.env.AFIP_MOCK_DELAY_MS ?? '100', 10);
    await new Promise((r) => setTimeout(r, delay));

    if (process.env.AFIP_MOCK_FAIL === 'true') {
      this.logger.warn(`AFIP_MOCK_FAIL activo — simulando caída para venta ${venta.ventaId}`);
      throw new ServiceUnavailableException('AFIP no disponible (mock). La venta quedará pendiente de facturación.');
    }

    const numeroComprobante = this.contadorComprobantes++;
    const cae = `${Date.now()}${String(numeroComprobante).padStart(4, '0')}`.slice(0, 14);
    const caeVencimiento = new Date();
    caeVencimiento.setDate(caeVencimiento.getDate() + 5);

    this.logger.log(`CAE emitido para venta ${venta.ventaId}: ${cae}`);

    return { cae, caeVencimiento, numeroComprobante };
  }
}
