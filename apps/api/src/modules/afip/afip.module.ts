import { Module } from '@nestjs/common';
import { FacturadorMock } from './facturador-mock';
import { FacturadorHttp } from './facturador-http';
import { FACTURADOR_TOKEN } from './facturador.interface';

function createFacturador() {
  if (process.env.AFIP_SERVICE_URL) {
    return new FacturadorHttp();
  }
  return new FacturadorMock();
}

@Module({
  providers: [
    FacturadorMock,
    { provide: FACTURADOR_TOKEN, useFactory: createFacturador },
  ],
  exports: [FACTURADOR_TOKEN],
})
export class AfipModule {}
