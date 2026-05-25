import { Controller, Get, UseGuards } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { TenantUser } from '@posta/shared-types';

@Controller('tenants')
@UseGuards(JwtGuard)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get('me')
  async getTenantActual(@CurrentUser() user: TenantUser) {
    const tenant = await this.tenantsService.getTenantActual(user.tenantId);
    return { data: tenant };
  }
}
