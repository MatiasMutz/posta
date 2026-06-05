import { Module } from '@nestjs/common';
import { CajaController, FlujoCajaController } from './caja/caja.controller';
import { CajaService } from './caja/caja.service';
import { PagosController } from './pagos/pagos.controller';
import { PagosService } from './pagos/pagos.service';

@Module({
  controllers: [CajaController, FlujoCajaController, PagosController],
  providers: [CajaService, PagosService],
  exports: [CajaService, PagosService],
})
export class TesoreriaModule {}
