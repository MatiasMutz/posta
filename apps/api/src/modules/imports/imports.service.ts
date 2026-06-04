import {
  Injectable, BadRequestException, NotFoundException, Inject, Logger, OnModuleInit,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { SupabaseClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
import { eq } from 'drizzle-orm';
import { withTenant } from '../../db';
import { importJobs } from '../../db/schema';
import { mapearColumnas, camposDisponibles } from './column-mapper';
import type { AnalizarImportDto, CrearImportDto, FilaCorreccion, TipoImport, ColumnaMapeo } from '@posta/validation';
import type { FilaConError } from '../../db/schema/imports';
import { INVENTARIO_CAMPOS } from './profiles/inventario.profile';
import { CLIENTES_CAMPOS } from './profiles/clientes.profile';
import { PROVEEDORES_CAMPOS } from './profiles/proveedores.profile';
import type { CampoDefinicion } from './profiles/inventario.profile';
import { guardarFilasInventario } from './persistencia-inventario';
import { guardarFilasClientes } from './persistencia-clientes';
import { guardarFilasProveedores } from './persistencia-proveedores';
import { assertStoragePathDelTenant } from './storage-path';

export const IMPORTS_QUEUE = 'imports';
const IMPORTS_BUCKET = 'imports';

function mensajeErrorStorage(motivo: string): string {
  if (motivo.includes('related resource does not exist') || motivo.includes('Bucket not found')) {
    return 'El almacenamiento de importaciones no está configurado. Reiniciá la API para que cree el bucket automáticamente, o creá el bucket "imports" en Supabase → Storage.';
  }
  return `No se pudo preparar la subida del archivo: ${motivo}`;
}

export interface ImportJobData {
  tenantId: string;
  userId: string;
  jobId: string;
  storagePath: string;
  tipo: TipoImport;
  columnMap: ColumnaMapeo[];
}

@Injectable()
export class ImportsService implements OnModuleInit {
  private readonly logger = new Logger(ImportsService.name);

  constructor(
    @Inject('SUPABASE_ADMIN') private readonly supabase: SupabaseClient,
    @InjectQueue(IMPORTS_QUEUE) private readonly queue: Queue<ImportJobData>,
  ) {}

  async onModuleInit() {
    await this.asegurarBucketImports();
  }

  /** Crea el bucket de Storage si no existe (dev / primer deploy). */
  private async asegurarBucketImports() {
    const { data: buckets, error } = await this.supabase.storage.listBuckets();
    if (error) {
      this.logger.error('No se pudo verificar buckets de Storage', error.message);
      return;
    }
    if (buckets?.some((b) => b.id === IMPORTS_BUCKET)) return;

    const { error: createError } = await this.supabase.storage.createBucket(IMPORTS_BUCKET, {
      public: false,
    });
    if (createError) {
      this.logger.error(`No se pudo crear el bucket "${IMPORTS_BUCKET}"`, createError.message);
      return;
    }
    this.logger.log(`Bucket Storage "${IMPORTS_BUCKET}" creado`);
  }

  async generarUrlSubida(tenantId: string, filename: string): Promise<{ uploadUrl: string; storagePath: string }> {
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `${tenantId}/${Date.now()}-${sanitized}`;
    const { data, error } = await this.supabase.storage
      .from(IMPORTS_BUCKET)
      .createSignedUploadUrl(storagePath);
    if (error || !data) {
      this.logger.error('createSignedUploadUrl falló', error?.message ?? 'sin data');
      throw new BadRequestException(mensajeErrorStorage(error?.message ?? 'error desconocido'));
    }
    return { uploadUrl: data.signedUrl, storagePath };
  }

  async analizar(tenantId: string, dto: AnalizarImportDto) {
    assertStoragePathDelTenant(tenantId, dto.storagePath);
    const buffer = await this.descargarArchivo(tenantId, dto.storagePath);
    const headers = this.extraerHeaders(buffer, dto.storagePath);
    const sugerencias = mapearColumnas(headers, dto.tipo);
    const camposTarget = camposDisponibles(dto.tipo);
    return { headers, sugerencias, camposDisponibles: camposTarget };
  }

  async crear(tenantId: string, userId: string, dto: CrearImportDto): Promise<{ jobId: string }> {
    assertStoragePathDelTenant(tenantId, dto.storagePath);
    const [job] = await withTenant(tenantId, async (tx) =>
      tx.insert(importJobs)
        .values({
          tenant_id: tenantId,
          tipo: dto.tipo,
          estado: 'pendiente',
          archivo_path: dto.storagePath,
          column_map: dto.columnMap,
          created_by: userId,
        })
        .returning(),
    );

    await this.queue.add('procesar', {
      tenantId,
      userId,
      jobId: job.id,
      storagePath: dto.storagePath,
      tipo: dto.tipo,
      columnMap: dto.columnMap,
    });

    return { jobId: job.id };
  }

  async estado(tenantId: string, jobId: string) {
    const [job] = await withTenant(tenantId, async (tx) =>
      tx.select().from(importJobs).where(eq(importJobs.id, jobId)).limit(1),
    );
    if (!job) throw new NotFoundException('Job de importación no encontrado.');
    return {
      jobId: job.id,
      tipo: job.tipo,
      estado: job.estado,
      fase: job.fase,
      progreso: job.progreso,
      total: job.total,
      filasOk: job.filas_ok,
      filasError: job.filas_error,
      errores: job.errores ?? [],
    };
  }

  async reintentar(tenantId: string, userId: string, jobId: string, correcciones: FilaCorreccion[]) {
    const [job] = await withTenant(tenantId, async (tx) =>
      tx.select().from(importJobs).where(eq(importJobs.id, jobId)).limit(1),
    );
    if (!job) throw new NotFoundException('Job de importación no encontrado.');
    if (job.estado !== 'completado' && job.estado !== 'error') {
      throw new BadRequestException('Solo se pueden corregir jobs que ya finalizaron.');
    }

    const perfil = job.tipo === 'inventario'
      ? INVENTARIO_CAMPOS
      : job.tipo === 'proveedores'
        ? PROVEEDORES_CAMPOS
        : CLIENTES_CAMPOS;
    const validas: Record<string, unknown>[] = [];
    const erroresResidual: FilaConError[] = [];

    for (const correccion of correcciones) {
      const { validas: filaValida, invalidas } = this.procesarFilas([correccion.datos], perfil);
      if (filaValida.length > 0) {
        validas.push(filaValida[0]);
      }
      if (invalidas.length > 0) {
        erroresResidual.push({
          numero: correccion.numero,
          datos: correccion.datos,
          problemas: invalidas[0].problemas,
        });
      }
    }

    if (validas.length > 0) {
      await this.guardarFilas(tenantId, userId, job.tipo, validas);
    }

    await withTenant(tenantId, async (tx) =>
      tx.update(importJobs)
        .set({
          filas_ok: (job.filas_ok ?? 0) + validas.length,
          filas_error: erroresResidual.length,
          errores: erroresResidual.length > 0 ? erroresResidual : null,
          estado: erroresResidual.length === 0 ? 'completado' : job.estado,
          updated_at: new Date(),
        })
        .where(eq(importJobs.id, jobId)),
    );

    return { importados: validas.length, erroresResidual: erroresResidual.length };
  }

  // ── Helpers internos ─────────────────────────────────────────

  async descargarArchivo(tenantId: string, storagePath: string): Promise<Buffer> {
    assertStoragePathDelTenant(tenantId, storagePath);
    const { data, error } = await this.supabase.storage.from(IMPORTS_BUCKET).download(storagePath);
    if (error || !data) throw new BadRequestException('No se pudo leer el archivo de Storage.');
    return Buffer.from(await data.arrayBuffer());
  }

  extraerHeaders(buffer: Buffer, _path: string): string[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true, sheetRows: 2 });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];
    if (!rows || rows.length === 0 || !Array.isArray(rows[0])) {
      throw new BadRequestException('El archivo no tiene encabezados o está vacío.');
    }
    return (rows[0] as unknown[]).map(h => String(h).trim()).filter(Boolean);
  }

  parsearArchivo(buffer: Buffer): Record<string, unknown>[] {
    const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  }

  aplicarMapeo(rows: Record<string, unknown>[], columnMap: ColumnaMapeo[]): Record<string, unknown>[] {
    const mappings = columnMap.filter(m => m.campo !== null);
    return rows.map(row => {
      const mapped: Record<string, unknown> = {};
      for (const { headerArchivo, campo } of mappings) {
        if (campo) mapped[campo] = row[headerArchivo] ?? '';
      }
      return mapped;
    });
  }

  procesarFilas(rows: Record<string, unknown>[], perfil: CampoDefinicion[]) {
    const validas: Record<string, unknown>[] = [];
    const invalidas: Array<{ problemas: Array<{ campo: string; valor: unknown; motivo: string }> }> = [];

    for (const row of rows) {
      const sanitizada: Record<string, unknown> = {};
      const problemas: Array<{ campo: string; valor: unknown; motivo: string }> = [];

      for (const def of perfil) {
        const valorRaw = row[def.campo];
        const valorSanitizado = def.sanitizar(valorRaw);

        const valorFinal = valorSanitizado ?? (def.defaultValue ?? null);
        if (valorFinal !== null) {
          sanitizada[def.campo] = valorFinal;
        }

        const error = def.validar ? def.validar(valorFinal as string | null) : null;
        if (error) {
          problemas.push({ campo: def.campo, valor: valorRaw, motivo: error });
        }
      }

      if (problemas.length === 0) {
        validas.push(sanitizada);
      } else {
        invalidas.push({ problemas });
      }
    }

    return { validas, invalidas };
  }

  async guardarFilas(tenantId: string, userId: string, tipo: TipoImport, rows: Record<string, unknown>[]) {
    if (rows.length === 0) return { creados: 0, actualizados: 0 };

    const BATCH = 100;
    let creados = 0;
    let actualizados = 0;

    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const stats = await withTenant(tenantId, async (tx) => {
        if (tipo === 'inventario') {
          return guardarFilasInventario(tx, tenantId, userId, batch);
        }
        if (tipo === 'proveedores') {
          return guardarFilasProveedores(tx, tenantId, batch);
        }
        return guardarFilasClientes(tx, tenantId, batch);
      });
      creados += stats.creados;
      actualizados += stats.actualizados;
    }

    return { creados, actualizados };
  }
}
