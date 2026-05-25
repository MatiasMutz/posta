import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { withTenant } from '../../db';
import { ventas } from '../../db/schema';
import { VentasService, FACTURACION_QUEUE } from './ventas.service';
import type { FacturacionJobData } from './ventas.service';

@Processor(FACTURACION_QUEUE)
export class FacturacionProcessor extends WorkerHost {
  private readonly logger = new Logger(FacturacionProcessor.name);

  constructor(private readonly ventasService: VentasService) {
    super();
  }

  async process(job: Job<FacturacionJobData>): Promise<void> {
    const { tenantId, ventaId } = job.data;
    this.logger.log(`Reintentando facturación para venta ${ventaId} (intento ${job.attemptsMade + 1})`);

    try {
      await this.ventasService.reintentar(tenantId, ventaId);
      this.logger.log(`Facturación exitosa para venta ${ventaId}`);
    } catch (err) {
      // Si se agotaron los intentos, marcar como error_afip definitivo
      if (job.attemptsMade >= (job.opts.attempts ?? 3) - 1) {
        this.logger.error(`Facturación falló definitivamente para venta ${ventaId}`);
        await withTenant(tenantId, (tx) =>
          tx.update(ventas)
            .set({ estado: 'error_afip', updated_at: new Date() })
            .where(eq(ventas.id, ventaId)),
        );
      }
      throw err; // BullMQ gestiona el retry
    }
  }
}
