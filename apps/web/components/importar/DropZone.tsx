'use client';
import { useState, useRef } from 'react';

const EXTENSIONES_VALIDAS = ['.xlsx', '.xls', '.csv'];
const MAX_MB = 10;

interface DropZoneProps {
  onArchivo: (file: File) => void;
  cargando?: boolean;
}

export function DropZone({ onArchivo, cargando = false }: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function validarArchivo(file: File): string | null {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!EXTENSIONES_VALIDAS.includes(ext)) {
      return `Formato no válido. Usá ${EXTENSIONES_VALIDAS.join(', ')}.`;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `El archivo no puede superar ${MAX_MB} MB.`;
    }
    return null;
  }

  function handleFile(file: File) {
    const err = validarArchivo(file);
    if (err) { setError(err); return; }
    setError('');
    onArchivo(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !cargando && inputRef.current?.click()}
        className={[
          'flex flex-col items-center justify-center gap-3 px-6 py-12 rounded-[2px] border-2 border-dashed',
          'cursor-pointer transition-colors',
          dragging ? 'border-accent bg-accent-soft' : 'border-rule hover:border-ink-soft bg-card',
          cargando ? 'opacity-50 cursor-not-allowed' : '',
        ].join(' ')}
      >
        <span className="font-sans text-4xl text-muted">↑</span>
        <p className="font-sans text-sm text-ink text-center">
          {cargando
            ? 'Analizando archivo...'
            : 'Arrastrá tu Excel o CSV acá, o hacé clic para seleccionar'}
        </p>
        <p className="font-mono text-[11px] text-muted uppercase tracking-wider">
          {EXTENSIONES_VALIDAS.join(' · ')} · máx. {MAX_MB} MB
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleChange}
        disabled={cargando}
      />

      {error && (
        <p className="font-sans text-sm text-err mt-2">{error}</p>
      )}
    </div>
  );
}
