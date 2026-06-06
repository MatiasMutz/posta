import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq } from 'drizzle-orm';
import { withTenant } from '../../db';
import { importJobs } from '../../db/schema';
import { ImportsService, IMPORTS_QUEUE } from './imports.service';
import { INVENTARIO_CAMPOS } from './profiles/inventario.profile';
import { CLIENTES_CAMPOS } from './profiles/clientes.profile';
import { PROVEEDORES_CAMPOS } from './profiles/proveedores.profile';
import type { ImportJobData } from './imports.service';
import type { FilaConError } from '../../db/schema/imports';
import { filtrarDuplicadosEnArchivo, type FilaImportable } from './import-validators';
import { mensajeErrorImportacion } from './import-errors';

const REPORTE_CADA = 50; // actualizar progreso cada N filas
const REINTENTOS_PROGRESO = 3;

async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { intentos: number; etiqueta: string; logger: Logger; critico?: boolean },
): Promise<T | undefined> {
  const { intentos, etiqueta, logger, critico = false } = opts;
  for (let i = 1; i <= intentos; i++) {
    try {
      return await fn();
    } catch (err) {
      logger.warn(`${etiqueta} (intento ${i}/${intentos})`, err);
      if (i === intentos) {
        if (critico) throw err;
        logger.warn(`${etiqueta}: se abandona tras ${intentos} intentos (el job sigue)`);
        return undefined;
      }
      await new Promise((r) => setTimeout(r, 100 * 2 ** (i - 1)));
    }
  }
  return undefined;
}

@Processor(IMPORTS_QUEUE)
export class ImportsProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportsProcessor.name);

  constructor(private readonly service: ImportsService) {
    super();
  }

  async process(job: Job<ImportJobData>): Promise<void> {
    const { tenantId, userId, jobId, storagePath, tipo, columnMap } = job.data;
    this.logger.log(`Procesando job ${jobId} (${tipo})`);

    const setEstado = (
      fase: string,
      progreso = 0,
      total = 0,
      extras: Record<string, unknown> = {},
      critico = false,
    ) =>
      withRetry(
        () => withTenant(tenantId, (tx) =>
          tx.update(importJobs)
            .set({ estado: 'procesando', fase: fase as never, progreso, total, updated_at: new Date(), ...extras })
            .where(eq(importJobs.id, jobId)),
        ),
        {
          intentos: REINTENTOS_PROGRESO,
          etiqueta: `Job ${jobId}: actualizar progreso (${fase})`,
          logger: this.logger,
          critico,
        },
      );

    try {
      // Fase 1: descargar + parsear
      await setEstado('parseando', 0, 0, {}, true);
      const buffer = await this.service.descargarArchivo(tenantId, storagePath);
      const rows = this.service.parsearArchivo(buffer);
      const filasMapeadas = this.service.aplicarMapeo(rows, columnMap);
      const total = filasMapeadas.length;
      await setEstado('validando', 0, total, {}, true);

      // Fase 2: validar fila a fila con reporte periódico de progreso
      const perfil = tipo === 'inventario'
        ? INVENTARIO_CAMPOS
        : tipo === 'proveedores'
          ? PROVEEDORES_CAMPOS
          : CLIENTES_CAMPOS;
      const filasValidadas: FilaImportable[] = [];
      const errores: FilaConError[] = [];

      for (let i = 0; i < filasMapeadas.length; i++) {
        const { validas: v, invalidas: inv } = this.service.procesarFilas([filasMapeadas[i]], perfil);
        if (v.length > 0) {
          filasValidadas.push({ datos: v[0], numero: i + 2 });
        } else {
          errores.push({
            numero: i + 2, // +2: fila 1 es header, índice 0-based
            datos: filasMapeadas[i],
            problemas: inv[0].problemas,
          });
        }

        if ((i + 1) % REPORTE_CADA === 0) {
          await setEstado('validando', i + 1, total);
          await job.updateProgress(Math.round(((i + 1) / total) * 50));
        }
      }

      // Duplicados dentro del mismo archivo (SKU, barras, CUIT, email)
      const { filasOk, errores: erroresDup } = filtrarDuplicadosEnArchivo(tipo, filasValidadas);
      errores.push(...erroresDup);

      // Fase 3: importar filas válidas (upsert: crea o actualiza)
      await setEstado('importando', filasOk.length, total);
      await job.updateProgress(50);

      let stats = { creados: 0, actualizados: 0 };
      if (filasOk.length > 0) {
        stats = await this.service.guardarFilas(
          tenantId,
          userId,
          tipo,
          filasOk.map((f) => f.datos),
        );
      }

      await job.updateProgress(100);

      // Marcar como completado (crítico: si falla, el job no quedó persistido)
      await setEstado('completado', total, total, {
        estado: 'completado',
        fase: null,
        filas_ok: filasOk.length,
        filas_error: errores.length,
        errores: errores.length > 0 ? errores : null,
      }, true);

      this.logger.log(
        `Job ${jobId} completado: ${filasOk.length} ok (${stats.creados} nuevos, ${stats.actualizados} actualizados), ${errores.length} errores`,
      );
    } catch (err) {
      this.logger.error(`Job ${jobId} falló`, err);
      await withRetry(
        () => withTenant(tenantId, (tx) =>
          tx.update(importJobs)
            .set({
              estado: 'error',
              errores: [{
                numero: 0,
                datos: {},
                problemas: [{
                  campo: 'archivo',
                  valor: null,
                  motivo: mensajeErrorImportacion(err),
                }],
              }],
              updated_at: new Date(),
            })
            .where(eq(importJobs.id, jobId)),
        ),
        {
          intentos: REINTENTOS_PROGRESO,
          etiqueta: `Job ${jobId}: marcar error`,
          logger: this.logger,
          critico: true,
        },
      );
      throw err; // BullMQ gestiona el retry
    }
  }
}
