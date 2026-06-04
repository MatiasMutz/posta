/**
 * Schemas Zod compartidos entre apps/api y apps/web (D-14).
 * Un schema por entidad de dominio. Importar desde acá, nunca duplicar.
 */

export * from './common';
export * from './auth';
export * from './tenants';
export * from './inventario';
export * from './clientes';
export * from './imports';
export * from './ventas';
export * from './proveedores';
export * from './compras';
