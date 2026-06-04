import { Module } from '@nestjs/common';
import { ProveedoresController } from './proveedores/proveedores.controller';
import { ProveedoresService } from './proveedores/proveedores.service';
import { ComprasController } from './compras/compras.controller';
import { ComprasService } from './compras/compras.service';

@Module({
  controllers: [ProveedoresController, ComprasController],
  providers: [ProveedoresService, ComprasService],
  exports: [ProveedoresService, ComprasService],
})
export class ComprasModule {}
