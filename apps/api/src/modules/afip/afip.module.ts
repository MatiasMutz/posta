import { Module } from '@nestjs/common';
import { FacturadorMock } from './facturador-mock';
import { FACTURADOR_TOKEN } from './facturador.interface';

/**
 * Para enchufar el facturador real (Fase 5+):
 * 1. Crear FacturadorAfipReal implements FacturadorElectronico
 * 2. Cambiar useClass a FacturadorAfipReal aquí
 * El dominio de ventas no necesita ningún cambio.
 */
@Module({
  providers: [
    FacturadorMock,
    { provide: FACTURADOR_TOKEN, useClass: FacturadorMock },
  ],
  exports: [FACTURADOR_TOKEN],
})
export class AfipModule {}
