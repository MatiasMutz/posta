import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { ContadorController } from './contador.controller';
import { ContadorService } from './contador.service';
import { TesoreriaModule } from '../tesoreria/tesoreria.module';
import { TenantsModule } from '../tenants/tenants.module';

@Module({
  imports: [TesoreriaModule, TenantsModule],
  controllers: [DashboardController, ContadorController],
  providers: [DashboardService, ContadorService],
})
export class DashboardModule {}
