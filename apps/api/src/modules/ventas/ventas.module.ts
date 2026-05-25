import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AfipModule } from '../afip/afip.module';
import { VentasController } from './ventas.controller';
import { VentasService, FACTURACION_QUEUE } from './ventas.service';
import { FacturacionProcessor } from './facturacion.processor';

@Module({
  imports: [
    AfipModule,
    BullModule.registerQueue({ name: FACTURACION_QUEUE }),
  ],
  controllers: [VentasController],
  providers: [VentasService, FacturacionProcessor],
  exports: [VentasService],
})
export class VentasModule {}
