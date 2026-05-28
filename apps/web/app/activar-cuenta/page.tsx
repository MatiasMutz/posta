'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';
import { rutaInicioTrasAuth } from '@/lib/auth-api';
import { ActivarCuentaSchema, type ActivarCuentaDto } from '@posta/validation';
import { ABtn } from '@/components/ui';

async function establecerSesionDesdeUrl(supabase: ReturnType<typeof createSupabaseBrowser>) {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session;

  const hash = window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '';
  if (hash) {
    const params = new URLSearchParams(hash);
    const access_token = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    if (access_token && refresh_token) {
      const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });
      if (!error && data.session) {
        window.history.replaceState(null, '', window.location.pathname);
        return data.session;
      }
    }
  }

  const code = new URLSearchParams(window.location.search).get('code');
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      window.history.replaceState(null, '', window.location.pathname);
      return data.session;
    }
  }

  return null;
}

export default function ActivarCuentaPage() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ActivarCuentaDto>({
    resolver: zodResolver(ActivarCuentaSchema),
  });

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    let cancelled = false;

    establecerSesionDesdeUrl(supabase).then((session) => {
      if (!cancelled && session) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!cancelled && session) setReady(true);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  async function onSubmit({ password }: ActivarCuentaDto) {
    setError('');
    try {
      const supabase = createSupabaseBrowser();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw new Error(updateError.message);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No se pudo obtener la sesión. Abrí el link del email de nuevo.');

      await apiClient('/auth/completar-invitacion', {
        method: 'POST',
        token: session.access_token,
      });

      window.location.assign(await rutaInicioTrasAuth(session.access_token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al activar la cuenta.');
    }
  }

  const inputClass = 'w-full border border-rule rounded-[2px] px-3 py-2 font-sans text-sm';
  const labelClass = 'font-sans text-xs text-muted block mb-1';
  const errorClass = 'font-sans text-xs text-err mt-1';

  return (
    <main className="min-h-screen bg-paper flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-card border border-rule rounded-[2px] p-8">
        <h1 className="font-serif text-2xl text-ink mb-2">Activá tu cuenta</h1>
        <p className="font-sans text-sm text-muted mb-6">
          Elegí una contraseña para empezar a usar Posta con tu equipo.
        </p>
        {!ready ? (
          <p className="font-sans text-sm text-muted">Esperando el link de invitación…</p>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className={labelClass}>Contraseña</label>
              <input
                type="password"
                {...register('password')}
                className={inputClass}
                autoComplete="new-password"
              />
              {errors.password && <p className={errorClass}>{errors.password.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Confirmar contraseña</label>
              <input
                type="password"
                {...register('confirm')}
                className={inputClass}
                autoComplete="new-password"
              />
              {errors.confirm && <p className={errorClass}>{errors.confirm.message}</p>}
            </div>
            {error && <p className="font-sans text-sm text-err">{error}</p>}
            <ABtn type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Activando…' : 'Activar cuenta'}
            </ABtn>
          </form>
        )}
      </div>
    </main>
  );
}
