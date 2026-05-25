'use client';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateProductoSchema, type CreateProductoDto } from '@posta/validation';
import { apiClient } from '@/lib/api-client';
import { ABtn } from '@/components/ui';

interface FormProductoProps {
  token: string;
  productoInicial?: Partial<CreateProductoDto> & { id?: string };
}

export function FormProducto({ token, productoInicial }: FormProductoProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const editando = !!productoInicial?.id;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateProductoDto>({
    resolver: zodResolver(editando ? CreateProductoSchema.partial() : CreateProductoSchema) as Resolver<CreateProductoDto>,
    defaultValues: productoInicial,
  });

  async function onSubmit(data: CreateProductoDto) {
    setError('');
    try {
      if (editando) {
        await apiClient(`/inventario/productos/${productoInicial!.id}`, {
          method: 'PATCH',
          body: JSON.stringify(data),
          token,
        });
      } else {
        await apiClient('/inventario/productos', {
          method: 'POST',
          body: JSON.stringify(data),
          token,
        });
      }
      router.push('/inventario');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  const inputClass =
    'w-full px-3 py-2 font-sans text-sm text-ink bg-card border border-rule rounded-[2px] focus:outline-none focus:border-accent';
  const labelClass = 'block font-mono text-[11px] uppercase tracking-wider text-muted mb-1';
  const errorClass = 'font-sans text-xs text-err mt-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div>
        <label className={labelClass}>Nombre del producto *</label>
        <input {...register('nombre')} className={inputClass} placeholder="Ej: Coca Cola 500ml" />
        {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>SKU</label>
          <input {...register('sku')} className={inputClass} placeholder="Ej: CC500" />
        </div>
        <div>
          <label className={labelClass}>Código de barras</label>
          <input {...register('codigo_barras')} className={inputClass} placeholder="7790001234567" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Costo *</label>
          <input
            {...register('costo')}
            className={inputClass}
            placeholder="0.00"
            inputMode="decimal"
          />
          {errors.costo && <p className={errorClass}>{errors.costo.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Precio de venta *</label>
          <input
            {...register('precio')}
            className={inputClass}
            placeholder="0.00"
            inputMode="decimal"
          />
          {errors.precio && <p className={errorClass}>{errors.precio.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {!editando && (
          <div>
            <label className={labelClass}>Stock inicial</label>
            <input
              {...register('stock_inicial')}
              type="number"
              min="0"
              className={inputClass}
              placeholder="0"
            />
          </div>
        )}
        <div>
          <label className={labelClass}>Stock mínimo</label>
          <input
            {...register('stock_minimo')}
            type="number"
            min="0"
            className={inputClass}
            placeholder="0"
          />
          <p className="font-sans text-[11px] text-muted mt-1">
            Alerta de stock bajo cuando cae por debajo
          </p>
        </div>
      </div>

      {error && (
        <p className="font-sans text-sm text-err bg-err-soft px-3 py-2 rounded-[2px]">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <ABtn type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear producto'}
        </ABtn>
        <ABtn
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancelar
        </ABtn>
      </div>
    </form>
  );
}
