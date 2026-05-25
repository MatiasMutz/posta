import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../db';
import { tenants, usuariosTenant } from '../../db/schema';
import type { RegistroDto, LoginDto } from '@posta/validation';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly supabaseAdmin: SupabaseClient,
    private readonly db: Database,
  ) {}

  async registro(dto: RegistroDto): Promise<{ access_token: string; refresh_token: string }> {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await this.supabaseAdmin.auth.admin.createUser({
      email: dto.email,
      password: dto.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      if (authError?.message?.toLowerCase().includes('already registered')) {
        throw new ConflictException('El email ya está en uso');
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }

    const userId = authData.user.id;

    try {
      // 2. Crear tenant (operación admin, sin contexto de tenant)
      const [tenant] = await this.db
        .insert(tenants)
        .values({ nombre: dto.nombreTenant })
        .returning();

      // 3. Crear membership con rol dueño
      await this.db
        .insert(usuariosTenant)
        .values({ tenant_id: tenant.id, user_id: userId, rol: 'dueno' })
        .returning();

      // 4. Guardar tenant_id y rol en app_metadata del JWT
      await this.supabaseAdmin.auth.admin.updateUserById(userId, {
        app_metadata: { tenant_id: tenant.id, rol: 'dueno' },
      });
    } catch (err) {
      // Limpiar usuario huérfano si falla la creación del tenant
      this.logger.error(`Error post-creación de usuario ${userId}, limpiando`, err);
      await this.supabaseAdmin.auth.admin.deleteUser(userId).catch(() => null);
      throw new InternalServerErrorException('Error al configurar el negocio');
    }

    // 5. Sign in para devolver la sesión con JWT ya actualizado
    const { data: session, error: sessionError } =
      await this.supabaseAdmin.auth.signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (sessionError || !session.session) {
      throw new InternalServerErrorException('Error al iniciar sesión post-registro');
    }

    return {
      access_token: session.session.access_token,
      refresh_token: session.session.refresh_token,
    };
  }

  async login(dto: LoginDto): Promise<{ access_token: string; refresh_token: string }> {
    const { data, error } = await this.supabaseAdmin.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Email o contraseña incorrectos');
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    };
  }
}
