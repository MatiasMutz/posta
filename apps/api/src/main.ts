// IMPORTANTE: dotenv debe ser el primer import.
// En CommonJS, los require se ejecutan en orden: esto carga el .env
// ANTES de que db/index.ts lea process.env en tiempo de importación.
import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { validateEnv } from './config/env.schema';

async function bootstrap() {
  validateEnv();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  app.setGlobalPrefix('api/v1');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Posta API')
    .setDescription('API REST del hub de gestión PyME')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document);

  // Normaliza todos los errores al formato { statusCode, mensaje, errores? }
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS: permite llamadas desde el frontend Next.js
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const port = process.env.PORT ?? 3001;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
