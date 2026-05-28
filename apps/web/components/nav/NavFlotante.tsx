'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createSupabaseBrowser } from '@/lib/supabase/client';
import { apiClient } from '@/lib/api-client';
import { rutaInicioPorRol } from '@/lib/auth';
import type { Rol, TenantMe } from '@posta/shared-types';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: Rol[];
}

const navItems: NavItem[] = [
  { href: '/ventas', label: 'Ventas', icon: '⊕', roles: ['dueno', 'vendedor'] },
  { href: '/inventario', label: 'Inventario', icon: '▣', roles: ['dueno', 'vendedor'] },
  { href: '/clientes', label: 'Clientes', icon: '◎', roles: ['dueno', 'contador'] },
  { href: '/ventas/historial', label: 'Historial', icon: '≡', roles: ['dueno', 'contador'] },
  { href: '/importar', label: 'Importar', icon: '↑', roles: ['dueno'] },
  { href: '/configuracion/equipo', label: 'Equipo', icon: '◈', roles: ['dueno'] },
];

function NavLink({
  href,
  label,
  icon,
  active,
  compact,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      className={[
        'flex flex-col items-center gap-0.5 transition-colors',
        compact ? 'min-w-[48px]' : 'px-2 gap-1',
        active ? 'text-accent' : 'text-muted hover:text-card',
      ].join(' ')}
    >
      <span className={compact ? 'text-lg leading-none' : 'text-xl leading-none'}>{icon}</span>
      <span className={`font-mono uppercase tracking-wider ${compact ? 'text-[10px]' : 'text-[9px]'}`}>
        {label}
      </span>
    </Link>
  );
}

export function NavFlotante() {
  const pathname = usePathname();
  const [rol, setRol] = useState<Rol | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) return;
      try {
        const { data } = await apiClient<{ data: TenantMe }>('/tenants/me', {
          token: session.access_token,
        });
        setRol(data.rol);
      } catch {
        const fallback = session.user.app_metadata?.rol as Rol | undefined;
        if (fallback) setRol(fallback);
      }
    });
  }, []);

  const items = navItems.filter((item) => !rol || item.roles.includes(rol));
  const inicioHref = rutaInicioPorRol(rol ?? undefined);

  return (
    <>
      <nav className="fixed bottom-4 left-4 right-4 md:hidden z-50">
        <div
          className="flex items-center justify-around bg-ink rounded-[2px] px-2 py-3"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          {items.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname.startsWith(href)}
              compact
            />
          ))}
          <NavLink
            href={inicioHref}
            label="Inicio"
            icon="◉"
            active={pathname === inicioHref}
            compact
          />
        </div>
      </nav>

      <nav className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-1">
        <div
          className="bg-ink rounded-[2px] py-4 px-3 flex flex-col gap-4"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <span className="font-serif text-card text-sm text-center mb-2">Posta</span>
          {items.map(({ href, label, icon }) => (
            <NavLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={pathname.startsWith(href)}
            />
          ))}
          <NavLink
            href={inicioHref}
            label="Inicio"
            icon="◉"
            active={pathname === inicioHref}
          />
        </div>
      </nav>
    </>
  );
}
