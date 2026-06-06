'use client';

import { usePathname } from 'next/navigation';
import { NavFlotante } from './NavFlotante';

const RUTAS_PUBLICAS = ['/', '/login', '/activar-cuenta'];

function esRutaPublica(pathname: string): boolean {
  return RUTAS_PUBLICAS.some((r) => pathname === r || pathname.startsWith(`${r}/`));
}

/**
 * Nav persistente entre rutas autenticadas (vive en el root layout).
 * Evita desmontar/remontar NavFlotante en cada navegación.
 */
export function NavShell() {
  const pathname = usePathname();
  if (esRutaPublica(pathname)) return null;
  return <NavFlotante />;
}
