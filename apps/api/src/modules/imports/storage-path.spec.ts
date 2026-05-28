import { describe, it, expect } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { assertStoragePathDelTenant } from './storage-path';

describe('assertStoragePathDelTenant', () => {
  const tenantId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

  it('acepta path con prefijo del tenant', () => {
    expect(() =>
      assertStoragePathDelTenant(tenantId, `${tenantId}/1234-datos.csv`),
    ).not.toThrow();
  });

  it('rechaza path de otro tenant', () => {
    expect(() =>
      assertStoragePathDelTenant(tenantId, 'otro-tenant/archivo.csv'),
    ).toThrow(ForbiddenException);
  });

  it('rechaza path traversal', () => {
    expect(() =>
      assertStoragePathDelTenant(tenantId, `${tenantId}/../otro/archivo.csv`),
    ).toThrow(ForbiddenException);
  });

  it('rechaza path vacío o absoluto', () => {
    expect(() => assertStoragePathDelTenant(tenantId, '')).toThrow(ForbiddenException);
    expect(() => assertStoragePathDelTenant(tenantId, '/absoluto.csv')).toThrow(ForbiddenException);
  });

  it('no confunde tenant-1 con tenant-10', () => {
    expect(() =>
      assertStoragePathDelTenant('tenant-1', 'tenant-10/archivo.csv'),
    ).toThrow(ForbiddenException);
  });
});
