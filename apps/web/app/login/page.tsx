'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';
import { rutaInicioTrasAuth } from '@/lib/auth-api';
import { ABtn } from '@/components/ui';

// Separado en componente propio porque useSearchParams requiere Suspense en Next.js 15
function LoginForm() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'login' | 'registro'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nombreTenant, setNombreTenant] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Mostrar error pasado por URL (ej: redirect desde /inventario con 401)
  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError) setError(urlError);
  }, [searchParams]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const supabase = createSupabaseBrowser();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        const mensajes: Record<string, string> = {
          'Invalid login credentials': 'Email o contraseña incorrectos.',
          'Email not confirmed': 'Confirmá tu email antes de ingresar.',
          'Too many requests': 'Demasiados intentos. Esperá unos minutos.',
          'Request rate limit reached': 'Demasiados intentos. Esperá unos minutos.',
        };
        throw new Error(mensajes[authError.message] ?? authError.message);
      }

      if (!data.session) {
        throw new Error('No se pudo iniciar sesión. Intentá de nuevo.');
      }

      // Navegación completa: asegura cookies de sesión antes del middleware/RSC
      window.location.assign(await rutaInicioTrasAuth(data.session.access_token));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'Error al iniciar sesión. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegistro(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient<{ data: { access_token: string; refresh_token: string } }>('/auth/registro', {
        method: 'POST',
        body: JSON.stringify({ email, password, nombreTenant }),
      });
      const supabase = createSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
      if (!sessionData.session) throw new Error('No se pudo iniciar sesión tras el registro.');
      window.location.assign(await rutaInicioTrasAuth(sessionData.session.access_token));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setError(msg || 'Error al crear la cuenta. Intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="font-serif text-3xl text-ink mb-1 text-center">Posta</h1>
      <p className="font-sans text-muted text-sm text-center mb-8">
        Gestión para tu negocio
      </p>

      {/* Tabs */}
      <div className="flex border-b border-rule mb-6">
        {(['login', 'registro'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(''); }}
            className={[
              'flex-1 py-2 font-sans text-sm font-medium transition-colors',
              tab === t
                ? 'text-accent border-b-2 border-accent -mb-px'
                : 'text-muted hover:text-ink-soft',
            ].join(' ')}
          >
            {t === 'login' ? 'Ingresar' : 'Crear cuenta'}
          </button>
        ))}
      </div>

      <form onSubmit={tab === 'login' ? handleLogin : handleRegistro} className="space-y-4">
        {tab === 'registro' && (
          <div>
            <label className="block font-sans text-xs text-muted mb-1 uppercase tracking-wide">
              Nombre del negocio
            </label>
            <input
              type="text"
              value={nombreTenant}
              onChange={(e) => setNombreTenant(e.target.value)}
              required
              placeholder="Ej: Kiosco Don Juan"
              className="w-full px-3 py-2 font-sans text-sm text-ink bg-card border border-rule rounded-[2px] focus:outline-none focus:border-accent"
            />
          </div>
        )}
        <div>
          <label htmlFor="login-email" className="block font-sans text-xs text-muted mb-1 uppercase tracking-wide">
            Email
          </label>
          <input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-3 py-2 font-sans text-sm text-ink bg-card border border-rule rounded-[2px] focus:outline-none focus:border-accent"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="block font-sans text-xs text-muted mb-1 uppercase tracking-wide">
            Contraseña
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
            className="w-full px-3 py-2 font-sans text-sm text-ink bg-card border border-rule rounded-[2px] focus:outline-none focus:border-accent"
          />
        </div>

        {error && (
          <div
            role="alert"
            className="font-sans text-sm px-3 py-2 rounded-[2px] bg-err-soft border border-err text-err"
          >
            {error}
          </div>
        )}

        <ABtn type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? 'Cargando...' : tab === 'login' ? 'Ingresar' : 'Crear cuenta'}
        </ABtn>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <Suspense fallback={<div className="font-sans text-muted text-sm">Cargando...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
