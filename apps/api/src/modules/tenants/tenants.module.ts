import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { TenantsUsuariosService } from './tenants-usuarios.service';

@Module({
  imports: [AuthModule],
  controllers: [TenantsController],
  providers: [TenantsService, TenantsUsuariosService],
  exports: [TenantsService],
})
export class TenantsModule {}
