import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { withTenant } from '../../db';
import { tenants } from '../../db/schema';

@Injectable()
export class TenantsService {
  async getTenantActual(tenantId: string) {
    const [tenant] = await withTenant(tenantId, (tx) =>
      tx.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1),
    );

    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }
}
