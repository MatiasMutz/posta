import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuthMembershipService } from './auth-membership.service';
import { JwtGuard } from './guards/jwt.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RegistroSchema, LoginSchema, type RegistroDto, type LoginDto } from '@posta/validation';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { TenantUser } from '@posta/shared-types';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ApiPublicPost, ApiPostAuth } from '../../common/swagger/controller-docs';

@Controller('auth')
@ApiTags('auth')
@Throttle({ default: { limit: 20, ttl: 60_000 } })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly membershipService: AuthMembershipService,
  ) {}

  @Post('registro')
  @ApiPublicPost('Registrar dueño y crear tenant')
  async registro(@Body(new ZodValidationPipe(RegistroSchema)) dto: RegistroDto) {
    const data = await this.authService.registro(dto);
    return { data };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiPublicPost('Iniciar sesión')
  async login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { data };
  }

  @Post('completar-invitacion')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiPostAuth('Sincronizar app_metadata tras aceptar invitación')
  async completarInvitacion(@CurrentUser() user: TenantUser) {
    const data = await this.membershipService.completarInvitacion(user.userId, user.email);
    return { data, mensaje: 'Cuenta activada. Ya podés usar Posta.' };
  }
}
