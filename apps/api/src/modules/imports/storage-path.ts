import { ForbiddenException } from '@nestjs/common';

/** Valida que un path de Storage pertenezca al tenant (admin client bypass RLS). */
export function assertStoragePathDelTenant(tenantId: string, storagePath: string): void {
  if (!storagePath || storagePath.includes('..') || storagePath.startsWith('/')) {
    throw new ForbiddenException('No tenés acceso a ese archivo.');
  }
  const [firstSegment] = storagePath.split('/');
  if (firstSegment !== tenantId) {
    throw new ForbiddenException('No tenés acceso a ese archivo.');
  }
}
