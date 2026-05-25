'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { MovimientoStockSchema, type MovimientoStockDto } from '@posta/validation';
import { apiClient } from '@/lib/api-client';
import { ABtn } from '@/components/ui';

interface FormMovimientoProps {
  productoId: string;
  token: string;
}

const TIPOS = [
  { value: 'entrada', label: 'Entrada (compra / reposición)' },
  { value: 'salida', label: 'Salida (venta / merma)' },
  { value: 'ajuste', label: 'Ajuste (nuevo stock absoluto)' },
] as const;

export function FormMovimiento({ productoId, token }: FormMovimientoProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MovimientoStockDto>({
    resolver: zodResolver(MovimientoStockSchema),
    defaultValues: { tipo: 'entrada', cantidad: 1 },
  });

  const tipoActual = watch('tipo');

  async function onSubmit(data: MovimientoStockDto) {
    setError('');
    setExito('');
    try {
      await apiClient(`/inventario/productos/${productoId}/movimientos`, {
        method: 'POST',
        body: JSON.stringify(data),
        token,
      });
      const labels: Record<string, string> = {
        entrada: 'Entrada registrada.',
        salida: 'Salida registrada.',
        ajuste: 'Stock ajustado.',
      };
      setExito(labels[data.tipo] ?? 'Movimiento registrado.');
      reset({ tipo: 'entrada', cantidad: 1 });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar el movimiento.');
    }
  }

  const inputClass =
    'w-full px-3 py-2 font-sans text-sm text-ink bg-card border border-rule rounded-[2px] focus:outline-none focus:border-accent';
  const labelClass = 'block font-mono text-[11px] uppercase tracking-wider text-muted mb-1';
  const errorClass = 'font-sans text-xs text-err mt-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className={labelClass}>Tipo de movimiento</label>
        <select {...register('tipo')} className={inputClass}>
          {TIPOS.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>
          {tipoActual === 'ajuste' ? 'Nuevo stock (unidades)' : 'Cantidad (unidades)'}
        </label>
        <input
          {...register('cantidad', { valueAsNumber: true })}
          type="number"
          min="1"
          className={inputClass}
        />
        {errors.cantidad && <p className={errorClass}>{errors.cantidad.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Motivo (opcional)</label>
        <input
          {...register('motivo')}
          className={inputClass}
          placeholder={
            tipoActual === 'entrada' ? 'Ej: Compra a proveedor' :
            tipoActual === 'salida'  ? 'Ej: Venta mostrador' :
            'Ej: Recuento físico'
          }
        />
        {errors.motivo && <p className={errorClass}>{errors.motivo.message}</p>}
      </div>

      {error && (
        <div
          role="alert"
          className="font-sans text-sm px-3 py-2 rounded-[2px]"
          style={{ color: 'var(--color-err)', background: 'var(--color-err-soft)', border: '1px solid var(--color-err)' }}
        >
          {error}
        </div>
      )}

      {exito && (
        <div
          role="status"
          className="font-sans text-sm px-3 py-2 rounded-[2px]"
          style={{ color: 'var(--color-ok)', background: 'var(--color-ok-soft)', border: '1px solid var(--color-ok)' }}
        >
          {exito}
        </div>
      )}

      <ABtn type="submit" variant="primary" disabled={isSubmitting}>
        {isSubmitting ? 'Registrando...' : 'Registrar movimiento'}
      </ABtn>
    </form>
  );
}
