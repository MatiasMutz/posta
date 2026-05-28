import {
  Injectable, UnauthorizedException, Inject, Logger,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db';
import { usuariosTenant, invitaciones } from '../../db/schema';
import type { TenantUser } from '@posta/shared-types';

@Injectable()
export class AuthMembershipService {
  private readonly logger = new Logger(AuthMembershipService.name);

  constructor(@Inject('SUPABASE_ADMIN') private readonly supabaseAdmin: SupabaseClient) {}

  async resolverMembership(userId: string, tenantIdJwt: string | undefined): Promise<TenantUser> {
    const [membership] = tenantIdJwt
      ? await db.select().from(usuariosTenant).where(
          and(eq(usuariosTenant.user_id, userId), eq(usuariosTenant.tenant_id, tenantIdJwt)),
        ).limit(1)
      : await db.select().from(usuariosTenant)
          .where(eq(usuariosTenant.user_id, userId))
          .limit(1);

    if (!membership) {
      throw new UnauthorizedException(
        tenantIdJwt
          ? 'Tu cuenta no está asociada a este negocio. Pedile al dueño que te invite de nuevo.'
          : 'Tu cuenta no tiene un negocio asociado. Registrate con "Crear cuenta" o aceptá una invitación.',
      );
    }

    return {
      userId,
      tenantId: membership.tenant_id,
      rol: membership.rol as TenantUser['rol'],
    };
  }

  async completarInvitacion(userId: string, email?: string): Promise<TenantUser> {
    const [membership] = await db.select().from(usuariosTenant)
      .where(eq(usuariosTenant.user_id, userId))
      .limit(1);

    if (!membership) {
      throw new UnauthorizedException('No encontramos una invitación activa para tu cuenta.');
    }

    await this.supabaseAdmin.auth.admin.updateUserById(userId, {
      app_metadata: { tenant_id: membership.tenant_id, rol: membership.rol },
      email_confirm: true,
    });

    await db.update(invitaciones)
      .set({ estado: 'aceptada' })
      .where(
        and(
          eq(invitaciones.tenant_id, membership.tenant_id),
          eq(invitaciones.supabase_user_id, userId),
          eq(invitaciones.estado, 'pendiente'),
        ),
      );

    return {
      userId,
      tenantId: membership.tenant_id,
      rol: membership.rol as TenantUser['rol'],
      email,
    };
  }
}
