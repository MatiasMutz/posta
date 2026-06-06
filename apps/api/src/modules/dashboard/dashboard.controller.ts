import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { DashboardQuerySchema } from '@posta/validation';
import type { DashboardQuery } from '@posta/validation';
import { DashboardService } from './dashboard.service';
import { TenantsService } from '../tenants/tenants.service';
import type { TenantUser } from '@posta/shared-types';
import { ApiAuthController, ApiGetAuth } from '../../common/swagger/controller-docs';

@Controller('dashboard')
@ApiAuthController('dashboard')
@UseGuards(JwtGuard, RolesGuard)
export class DashboardController {
  constructor(
    private readonly service: DashboardService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Get()
  @ApiGetAuth('Resumen del dashboard del dueño (KPIs, gráficos, alertas)')
  @Roles('dueno')
  async getResumen(
    @CurrentUser() user: TenantUser,
    @Query(new ZodValidationPipe(DashboardQuerySchema)) query: DashboardQuery,
  ) {
    const tenant = await this.tenantsService.getTenantActual(user.tenantId);
    const data = await this.service.getResumen(user.tenantId, user, query, tenant.nombre);
    return { data };
  }
}
