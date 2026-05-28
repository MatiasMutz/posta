import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import type { FastifyRequest } from 'fastify';
import { verifySupabaseJwt } from './jwt-verifier';
import { AuthMembershipService } from '../auth-membership.service';

@Injectable()
export class JwtGuard implements CanActivate, OnModuleInit {
  private readonly logger = new Logger(JwtGuard.name);
  private readonly jwtSecret = process.env.SUPABASE_JWT_SECRET ?? '';
  private readonly supabaseUrl = process.env.SUPABASE_URL ?? '';

  constructor(private readonly membershipService: AuthMembershipService) {}

  onModuleInit() {
    if (!this.jwtSecret) {
      this.logger.warn(
        'SUPABASE_JWT_SECRET no está configurado. ' +
        'Los tokens HS256 (legacy) no podrán verificarse.',
      );
    }
    if (!this.supabaseUrl) {
      this.logger.error(
        'SUPABASE_URL no está configurado. ' +
        'Los tokens ES256/RS256 de Supabase no podrán verificarse. ' +
        'Todas las rutas protegidas fallarán con 401.',
      );
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<FastifyRequest>();
    const token = this.extractToken(request);

    if (!token) throw new UnauthorizedException('Token requerido. Iniciá sesión primero.');

    const payload = await verifySupabaseJwt(token, {
      jwtSecret: this.jwtSecret,
      supabaseUrl: this.supabaseUrl,
    });

    const tenantIdJwt = payload.app_metadata?.tenant_id as string | undefined;
    const user = await this.membershipService.resolverMembership(payload.sub, tenantIdJwt);

    (request as FastifyRequest & { user: typeof user }).user = {
      ...user,
      email: payload.email,
    };
    return true;
  }

  private extractToken(request: FastifyRequest): string | null {
    const auth = request.headers.authorization;
    if (!auth?.startsWith('Bearer ')) return null;
    return auth.slice(7);
  }
}
