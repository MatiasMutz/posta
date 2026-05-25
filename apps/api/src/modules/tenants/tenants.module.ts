import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { db } from '../../db';

@Module({
  controllers: [TenantsController],
  providers: [
    {
      provide: TenantsService,
      useFactory: () => new TenantsService(db),
    },
  ],
  exports: [TenantsService],
})
export class TenantsModule {}
