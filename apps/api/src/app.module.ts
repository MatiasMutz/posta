import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ImportsModule } from './modules/imports/imports.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { VentasModule } from './modules/ventas/ventas.module';
import { ComprasModule } from './modules/compras/compras.module';
import { TesoreriaModule } from './modules/tesoreria/tesoreria.module';

const throttleEnabled = process.env.THROTTLE_ENABLED !== '0';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      },
    }),
    HealthModule,
    AuthModule,
    TenantsModule,
    InventarioModule,
    ImportsModule,
    ClientesModule,
    VentasModule,
    ComprasModule,
    TesoreriaModule,
  ],
  providers: [
    ...(throttleEnabled ? [{ provide: APP_GUARD, useClass: ThrottlerGuard }] : []),
  ],
})
export class AppModule {}
