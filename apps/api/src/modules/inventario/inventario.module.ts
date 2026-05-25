import { Module } from '@nestjs/common';
import { ProductosController } from './productos/productos.controller';
import { ProductosService } from './productos/productos.service';
import { MovimientosService } from './movimientos/movimientos.service';

@Module({
  controllers: [ProductosController],
  providers: [ProductosService, MovimientosService],
  exports: [ProductosService, MovimientosService],
})
export class InventarioModule {}
