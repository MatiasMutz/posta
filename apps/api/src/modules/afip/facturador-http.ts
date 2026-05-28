import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import type { FacturadorElectronico, VentaParaFacturar, ResultadoFacturacion } from './facturador.interface';

interface ComprobanteHttpResponse {
  cae: string;
  cae_vencimiento: string;
  numero_comprobante: number;
}

/**
 * Adaptador HTTP al microservicio AFIP (services/afip/).
 * Activar con AFIP_SERVICE_URL=http://localhost:8000
 */
@Injectable()
export class FacturadorHttp implements FacturadorElectronico {
  private readonly logger = new Logger(FacturadorHttp.name);
  private readonly baseUrl: string;

  constructor() {
    const url = process.env.AFIP_SERVICE_URL;
    if (!url) {
      throw new Error('AFIP_SERVICE_URL no está configurada');
    }
    this.baseUrl = url.replace(/\/$/, '');
  }

  async emitirComprobante(venta: VentaParaFacturar): Promise<ResultadoFacturacion> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch(`${this.baseUrl}/v1/comprobantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venta_id: venta.ventaId,
          tipo: venta.tipo,
          total: venta.total,
          cuit_emisor: venta.clienteCuit ?? undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        this.logger.warn(`AFIP HTTP ${res.status} para venta ${venta.ventaId}`);
        throw new ServiceUnavailableException(
          'AFIP no disponible. La venta quedará pendiente de facturación.',
        );
      }

      const body = (await res.json()) as ComprobanteHttpResponse;
      return {
        cae: body.cae,
        caeVencimiento: new Date(body.cae_vencimiento),
        numeroComprobante: body.numero_comprobante,
      };
    } catch (err) {
      if (err instanceof ServiceUnavailableException) throw err;
      this.logger.warn(`AFIP HTTP error para venta ${venta.ventaId}`, err);
      throw new ServiceUnavailableException(
        'AFIP no disponible. La venta quedará pendiente de facturación.',
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
