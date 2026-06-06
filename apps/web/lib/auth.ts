import type { Rol } from '@posta/shared-types';

/** Ruta de inicio según rol del usuario autenticado. */
export function rutaInicioPorRol(rol: string | undefined): string {
  switch (rol as Rol | undefined) {
    case 'vendedor':
      return '/ventas';
    case 'contador':
      return '/contador';
    default:
      return '/dashboard';
  }
}

function esRutaSoloDueno(pathname: string): boolean {
  return pathname.startsWith('/importar') || pathname.startsWith('/configuracion');
}

function esRutaEscrituraClientes(pathname: string): boolean {
  return pathname === '/clientes/nuevo' || pathname.endsWith('/editar');
}

function esRutaEscrituraInventario(pathname: string): boolean {
  return pathname === '/inventario/nuevo' || pathname.includes('/editar');
}

function esRutaMovimientosInventario(pathname: string): boolean {
  return pathname.includes('/movimientos');
}

/** Si la ruta no es accesible para el rol, devuelve la URL de redirect; si no, null. */
export function redirectPorRol(pathname: string, rol: string | undefined): string | null {
  const r = rol as Rol | undefined;

  if (esRutaSoloDueno(pathname) && r !== 'dueno') {
    return rutaInicioPorRol(r);
  }

  if (pathname.startsWith('/clientes')) {
    if (r === 'vendedor') return '/ventas';
    if (r !== 'dueno' && esRutaEscrituraClientes(pathname)) return '/clientes';
  }

  if (pathname.startsWith('/dashboard')) {
    if (r !== 'dueno') return rutaInicioPorRol(r);
  }

  if (pathname.startsWith('/contador')) {
    if (r === 'vendedor') return '/ventas';
  }

  if (pathname.startsWith('/inventario')) {
    if (r === 'contador') return rutaInicioPorRol(r);
    if (r === 'vendedor' && (esRutaMovimientosInventario(pathname) || esRutaEscrituraInventario(pathname))) {
      return '/inventario';
    }
    if (r !== 'dueno' && esRutaEscrituraInventario(pathname)) return '/inventario';
  }

  if (pathname.startsWith('/ventas/historial') && r === 'vendedor') {
    return '/ventas';
  }

  if (pathname === '/ventas' && r === 'contador') {
    return '/contador';
  }

  if (pathname.startsWith('/proveedores') || pathname.startsWith('/compras')) {
    if (r === 'vendedor') return '/ventas';
    if (r !== 'dueno' && (pathname === '/proveedores/nuevo' || pathname.endsWith('/editar') || pathname === '/compras/nueva')) {
      return pathname.startsWith('/proveedores') ? '/proveedores' : '/compras/historial';
    }
  }

  if (pathname.startsWith('/caja')) {
    if (r === 'vendedor') return '/ventas';
  }

  return null;
}
