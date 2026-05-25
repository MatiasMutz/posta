/** Traduce errores técnicos de DB/runtime a mensajes legibles para el usuario. */
export function mensajeErrorImportacion(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes('duplicate key') && msg.includes('idx_productos_tenant_sku')) {
    return 'Ya existe un producto con ese SKU. Si estás re-importando, contactá soporte — esto no debería ocurrir.';
  }
  if (msg.includes('duplicate key')) {
    return 'Hay datos duplicados que chocan con registros existentes.';
  }
  if (msg.includes('Failed query')) {
    return 'No se pudieron guardar algunos datos. Revisá el archivo e intentá de nuevo.';
  }

  return 'Error inesperado al procesar el archivo. Intentá de nuevo.';
}
