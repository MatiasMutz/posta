'use client';
import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CreateClienteSchema, type CreateClienteDto } from '@posta/validation';
import { apiClient } from '@/lib/api-client';
import { ABtn } from '@/components/ui';

interface FormClienteProps {
  token: string;
  clienteInicial?: Partial<CreateClienteDto> & { id?: string };
}

export function FormCliente({ token, clienteInicial }: FormClienteProps) {
  const router = useRouter();
  const [error, setError] = useState('');
  const editando = !!clienteInicial?.id;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CreateClienteDto>({
    resolver: zodResolver(editando ? CreateClienteSchema.partial() : CreateClienteSchema) as Resolver<CreateClienteDto>,
    defaultValues: clienteInicial,
  });

  async function onSubmit(data: CreateClienteDto) {
    setError('');
    try {
      if (editando) {
        await apiClient(`/clientes/${clienteInicial!.id}`, { method: 'PATCH', body: JSON.stringify(data), token });
      } else {
        await apiClient('/clientes', { method: 'POST', body: JSON.stringify(data), token });
      }
      router.push('/clientes');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    }
  }

  const inputClass = 'w-full px-3 py-2 font-sans text-sm text-ink bg-card border border-rule rounded-[2px] focus:outline-none focus:border-accent';
  const labelClass = 'block font-mono text-[11px] uppercase tracking-wider text-muted mb-1';
  const errorClass = 'font-sans text-xs text-err mt-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-lg">
      <div>
        <label className={labelClass}>Nombre / Razón social *</label>
        <input {...register('nombre')} className={inputClass} placeholder="Ej: Juan Pérez" />
        {errors.nombre && <p className={errorClass}>{errors.nombre.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>CUIT</label>
          <input {...register('cuit')} className={inputClass} placeholder="20123456789" />
          {errors.cuit && <p className={errorClass}>{errors.cuit.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Teléfono</label>
          <input {...register('telefono')} className={inputClass} placeholder="1122334455" />
        </div>
      </div>

      <div>
        <label className={labelClass}>Email</label>
        <input type="email" {...register('email')} className={inputClass} placeholder="juan@example.com" />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Dirección</label>
        <input {...register('direccion')} className={inputClass} placeholder="Av. Corrientes 1234" />
      </div>

      {error && (
        <p className="font-sans text-sm text-err bg-err-soft px-3 py-2 rounded-[2px]">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <ABtn type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : editando ? 'Guardar cambios' : 'Crear cliente'}
        </ABtn>
        <ABtn type="button" variant="ghost" onClick={() => router.back()} disabled={isSubmitting}>
          Cancelar
        </ABtn>
      </div>
    </form>
  );
}
