'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { rutaInicioPorRol } from '@/lib/auth';
import type { Rol } from '@posta/shared-types';
import { NavPerfilMobile, NavPerfilSidebar, usePerfilUsuario } from './NavPerfil';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  roles: Rol[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Panel', icon: '▦', roles: ['dueno'] },
  { href: '/contador', label: 'Contador', icon: '⊡', roles: ['dueno', 'contador'] },
  { href: '/ventas', label: 'Ventas', icon: '⊕', roles: ['dueno', 'vendedor'] },
  { href: '/inventario', label: 'Inventario', icon: '▣', roles: ['dueno', 'vendedor'] },
  { href: '/clientes', label: 'Clientes', icon: '◎', roles: ['dueno', 'contador'] },
  { href: '/proveedores', label: 'Proveedores', icon: '◇', roles: ['dueno', 'contador'] },
  { href: '/compras/historial', label: 'Compras', icon: '⊟', roles: ['dueno', 'contador'] },
  { href: '/caja', label: 'Caja', icon: '◫', roles: ['dueno', 'contador'] },
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
        'pointer-events-auto flex flex-col items-center rounded-[2px] transition-colors',
        compact ? 'min-w-[44px] gap-0.5 py-1' : 'px-2 py-1.5 gap-1',
        active
          ? 'text-accent bg-accent-soft'
          : 'text-muted hover:text-ink hover:bg-paper-warm',
      ].join(' ')}
    >
      <span className={compact ? 'text-base leading-none' : 'text-lg leading-none'}>{icon}</span>
      <span className={`font-mono uppercase tracking-wider ${compact ? 'text-[9px]' : 'text-[9px]'}`}>
        {label}
      </span>
    </Link>
  );
}

export function NavFlotante() {
  const pathname = usePathname();
  const perfil = usePerfilUsuario();
  const rol = perfil?.rol ?? null;

  const items = navItems.filter((item) => !rol || item.roles.includes(rol));
  const inicioHref = rutaInicioPorRol(rol ?? undefined);

  return (
    <>
      {perfil && <NavPerfilMobile perfil={perfil} />}

      <nav className="fixed bottom-4 left-4 right-4 md:hidden z-40 pointer-events-none">
        <div
          className="flex items-center justify-around bg-card border border-rule rounded-[2px] px-1 py-2 pointer-events-none"
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

      <nav className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col pointer-events-none">
        <div
          className="bg-card border border-rule rounded-[2px] py-4 px-2 flex flex-col gap-1 max-h-[calc(100vh-3rem)] pointer-events-none"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <span className="font-serif text-ink text-sm text-center mb-2 px-1">Posta</span>
          <div className="flex flex-col gap-0.5 overflow-y-auto">
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
          {perfil && (
            <div className="mt-3 pt-3 border-t border-rule shrink-0 pointer-events-auto">
              <NavPerfilSidebar perfil={perfil} />
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
