import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { ImportsModule } from './modules/imports/imports.module';
import { ClientesModule } from './modules/clientes/clientes.module';
import { VentasModule } from './modules/ventas/ventas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
})
export class AppModule {}
