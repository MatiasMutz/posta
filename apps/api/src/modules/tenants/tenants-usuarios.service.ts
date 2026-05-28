import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
  Logger,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { and, eq } from 'drizzle-orm';
import { db, withTenant } from '../../db';
import { usuariosTenant, invitaciones } from '../../db/schema';
import type { InvitarUsuarioDto, CambiarRolUsuarioDto } from '@posta/validation';

@Injectable()
export class TenantsUsuariosService {
  private readonly logger = new Logger(TenantsUsuariosService.name);

  constructor(@Inject('SUPABASE_ADMIN') private readonly supabaseAdmin: SupabaseClient) {}

  async listar(tenantId: string) {
    const [miembros, pendientes] = await Promise.all([
      withTenant(tenantId, (tx) =>
        tx.select().from(usuariosTenant).where(eq(usuariosTenant.tenant_id, tenantId)),
      ),
      withTenant(tenantId, (tx) =>
        tx.select().from(invitaciones).where(
          and(eq(invitaciones.tenant_id, tenantId), eq(invitaciones.estado, 'pendiente')),
        ),
      ),
    ]);
    return { miembros, invitacionesPendientes: pendientes };
  }

  async invitar(tenantId: string, invitadoPor: string, dto: InvitarUsuarioDto) {
    const email = dto.email.toLowerCase();

    const existente = await withTenant(tenantId, (tx) =>
      tx.select().from(invitaciones).where(
        and(
          eq(invitaciones.tenant_id, tenantId),
          eq(invitaciones.email, email),
          eq(invitaciones.estado, 'pendiente'),
        ),
      ).limit(1),
    );
    if (existente.length > 0) {
      throw new ConflictException('Ya hay una invitación pendiente para ese email.');
    }

    const webUrl = process.env.WEB_URL ?? process.env.CORS_ORIGIN?.split(',')[0] ?? 'http://localhost:3000';
    const redirectTo = `${webUrl}/activar-cuenta`;

    const { data: inviteData, error: inviteError } =
      await this.supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: { tenant_id: tenantId, rol: dto.rol },
      });

    if (inviteError || !inviteData.user) {
      this.logger.error('Error al invitar usuario', inviteError);
      if (inviteError?.message?.toLowerCase().includes('already')) {
        throw new ConflictException('Ese email ya tiene una cuenta en Posta.');
      }
      throw new BadRequestException('No se pudo enviar la invitación. Verificá el email e intentá de nuevo.');
    }

    const userId = inviteData.user.id;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    try {
      await db.insert(usuariosTenant).values({
        tenant_id: tenantId,
        user_id: userId,
        rol: dto.rol,
      });

      const [inv] = await withTenant(tenantId, (tx) =>
        tx.insert(invitaciones).values({
          tenant_id: tenantId,
          email,
          rol: dto.rol,
          invitado_por: invitadoPor,
          supabase_user_id: userId,
          estado: 'pendiente',
          expires_at: expiresAt,
        }).returning(),
      );

      await this.supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { tenant_id: tenantId, rol: dto.rol },
      });

      return { invitacion: inv, userId };
    } catch (err) {
      this.logger.error(`Error post-invitación para ${userId}, limpiando`, err);
      await this.supabaseAdmin.auth.admin.deleteUser(userId).catch(() => null);
      await db.delete(usuariosTenant).where(
        and(eq(usuariosTenant.tenant_id, tenantId), eq(usuariosTenant.user_id, userId)),
      ).catch(() => null);
      throw new BadRequestException('No se pudo completar la invitación.');
    }
  }

  async cambiarRol(tenantId: string, membershipId: string, dto: CambiarRolUsuarioDto) {
    const [membership] = await withTenant(tenantId, (tx) =>
      tx.select().from(usuariosTenant)
        .where(and(eq(usuariosTenant.id, membershipId), eq(usuariosTenant.tenant_id, tenantId)))
        .limit(1),
    );
    if (!membership) throw new NotFoundException('Usuario no encontrado en el equipo.');

    if (membership.rol === 'dueno') {
      throw new BadRequestException('No podés cambiar el rol de un dueño desde acá.');
    }

    await withTenant(tenantId, (tx) =>
      tx.update(usuariosTenant)
        .set({ rol: dto.rol })
        .where(eq(usuariosTenant.id, membershipId)),
    );

    await this.supabaseAdmin.auth.admin.updateUserById(membership.user_id, {
      app_metadata: { tenant_id: tenantId, rol: dto.rol },
    });

    return { ok: true, rol: dto.rol };
  }

  async revocar(tenantId: string, membershipId: string) {
    const [membership] = await withTenant(tenantId, (tx) =>
      tx.select().from(usuariosTenant)
        .where(and(eq(usuariosTenant.id, membershipId), eq(usuariosTenant.tenant_id, tenantId)))
        .limit(1),
    );
    if (!membership) throw new NotFoundException('Usuario no encontrado en el equipo.');
    if (membership.rol === 'dueno') {
      throw new BadRequestException('No podés revocar a un dueño.');
    }

    await withTenant(tenantId, (tx) =>
      tx.delete(usuariosTenant).where(eq(usuariosTenant.id, membershipId)),
    );

    await withTenant(tenantId, (tx) =>
      tx.update(invitaciones)
        .set({ estado: 'revocada' })
        .where(
          and(
            eq(invitaciones.tenant_id, tenantId),
            eq(invitaciones.supabase_user_id, membership.user_id),
            eq(invitaciones.estado, 'pendiente'),
          ),
        ),
    );

    await this.supabaseAdmin.auth.admin.deleteUser(membership.user_id).catch(() => null);

    return { ok: true };
  }

  async revocarInvitacion(tenantId: string, invitacionId: string) {
    const [inv] = await withTenant(tenantId, (tx) =>
      tx.select().from(invitaciones)
        .where(and(eq(invitaciones.id, invitacionId), eq(invitaciones.tenant_id, tenantId)))
        .limit(1),
    );
    if (!inv) throw new NotFoundException('Invitación no encontrada.');
    if (inv.estado !== 'pendiente') {
      throw new BadRequestException('Solo se pueden revocar invitaciones pendientes.');
    }

    await withTenant(tenantId, (tx) =>
      tx.update(invitaciones).set({ estado: 'revocada' }).where(eq(invitaciones.id, invitacionId)),
    );

    if (inv.supabase_user_id) {
      await db.delete(usuariosTenant).where(
        and(eq(usuariosTenant.tenant_id, tenantId), eq(usuariosTenant.user_id, inv.supabase_user_id)),
      );
      await this.supabaseAdmin.auth.admin.deleteUser(inv.supabase_user_id).catch(() => null);
    }

    return { ok: true };
  }
}
