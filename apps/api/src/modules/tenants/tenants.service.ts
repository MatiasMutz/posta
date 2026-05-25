import { Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { Database } from '../../db';
import { tenants } from '../../db/schema';

@Injectable()
export class TenantsService {
  constructor(private readonly db: Database) {}

  async getTenantActual(tenantId: string) {
    const [tenant] = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    if (!tenant) throw new NotFoundException('Tenant no encontrado');
    return tenant;
  }
}
