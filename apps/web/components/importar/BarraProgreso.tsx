interface BarraProgresoProps {
  estado: string;
  fase?: string | null;
  progreso: number;
  total: number;
  filasOk: number;
  filasError: number;
}

const FASE_LABEL: Record<string, string> = {
  parseando: 'Leyendo el archivo...',
  validando: 'Validando filas...',
  importando: 'Guardando datos...',
};

const ESTADO_LABEL: Record<string, string> = {
  pendiente: 'En cola...',
  procesando: 'Procesando...',
  completado: '¡Importación completada!',
  error: 'Error en la importación.',
};

export function BarraProgreso({ estado, fase, progreso, total, filasOk, filasError }: BarraProgresoProps) {
  const porcentaje = total > 0 ? Math.round((progreso / total) * 100) : 0;
  const label = fase ? FASE_LABEL[fase] : ESTADO_LABEL[estado] ?? 'Procesando...';
  const completado = estado === 'completado';
  const error = estado === 'error';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-sans text-sm text-ink">{label}</p>
        {total > 0 && (
          <p className="font-mono text-xs text-muted">{progreso} / {total}</p>
        )}
      </div>

      <div className="h-2 bg-paper-deep rounded-full overflow-hidden">
        <div
          className={[
            'h-full rounded-full transition-all duration-500',
            completado ? 'bg-ok' : error ? 'bg-err' : 'bg-accent',
          ].join(' ')}
          style={{ width: `${completado ? 100 : porcentaje}%` }}
        />
      </div>

      {(filasOk > 0 || filasError > 0) && (
        <div className="flex gap-4">
          {filasOk > 0 && (
            <span className="font-sans text-xs text-ok">
              ✓ {filasOk} importada{filasOk !== 1 ? 's' : ''}
            </span>
          )}
          {filasError > 0 && (
            <span className="font-sans text-xs text-err">
              ✗ {filasError} con error{filasError !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
