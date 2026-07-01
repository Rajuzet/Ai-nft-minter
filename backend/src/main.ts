import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Allow frontend origins (add your Vercel domain here when deployed)
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://*.vercel.app',
      process.env.FRONTEND_URL || '*',
    ],
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  // Health check route for Railway / load balancers
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/v1/health', (_req: any, res: any) => {
    res.json({
      status: 'ok',
      version: '1.0.0',
      service: 'WCOS Backend',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
    });
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Web3 Creator Operating System (WCOS) Backend')
    .setDescription('WCOS API gateway — AI Studio, Collections, Marketplace, DeFi, DAO, Analytics, Profile')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');
  console.log(`WCOS Backend API gateway running on: http://0.0.0.0:${port}`);
  console.log(`Swagger documentation available at: http://localhost:${port}/api/docs`);
  console.log(`Health check: http://localhost:${port}/api/v1/health`);
}
bootstrap();

