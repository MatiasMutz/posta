'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/ventas', label: 'Ventas', icon: '⊕' },
  { href: '/inventario', label: 'Inventario', icon: '▣' },
  { href: '/clientes', label: 'Clientes', icon: '◎' },
  { href: '/importar', label: 'Importar', icon: '↑' },
  { href: '/dashboard', label: 'Inicio', icon: '◉' },
];

export function NavFlotante() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: barra flotante inferior */}
      <nav className="fixed bottom-4 left-4 right-4 md:hidden z-50">
        <div
          className="flex items-center justify-around bg-ink rounded-[2px] px-2 py-3"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          {items.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex flex-col items-center gap-0.5 min-w-[48px] transition-colors',
                  active ? 'text-accent' : 'text-muted hover:text-card',
                ].join(' ')}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop: panel flotante lateral */}
      <nav className="hidden md:flex fixed left-6 top-1/2 -translate-y-1/2 z-50 flex-col gap-1">
        <div
          className="bg-ink rounded-[2px] py-4 px-3 flex flex-col gap-4"
          style={{ boxShadow: 'var(--shadow)' }}
        >
          <span className="font-serif text-card text-sm text-center mb-2">Posta</span>
          {items.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={[
                  'flex flex-col items-center gap-1 transition-colors px-2',
                  active ? 'text-accent' : 'text-muted hover:text-card',
                ].join(' ')}
              >
                <span className="text-xl leading-none">{icon}</span>
                <span className="font-mono text-[9px] uppercase tracking-wider">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
