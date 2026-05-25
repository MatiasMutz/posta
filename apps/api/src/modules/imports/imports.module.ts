import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from '../auth/auth.module';
import { ImportsController } from './imports.controller';
import { ImportsService, IMPORTS_QUEUE } from './imports.service';
import { ImportsProcessor } from './imports.processor';

@Module({
  imports: [
    // Exporta SUPABASE_ADMIN para que ImportsService pueda inyectarlo
    AuthModule,
    BullModule.registerQueue({ name: IMPORTS_QUEUE }),
  ],
  controllers: [ImportsController],
  providers: [ImportsService, ImportsProcessor],
})
export class ImportsModule {}
