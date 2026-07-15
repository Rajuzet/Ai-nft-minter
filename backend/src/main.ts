import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/all-exceptions.filter';
import { PrismaService } from './prisma/prisma.service';
import { validateEnv } from './common/env.validation';
import helmet from 'helmet';
import * as dotenv from 'dotenv';

dotenv.config();
validateEnv();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security headers via Helmet
  app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for Swagger UI
    crossOriginEmbedderPolicy: false,
  }));

  // Register Global Exception Filter for clear error logging
  app.useGlobalFilters(new AllExceptionsFilter());

  // Configure CORS allowing frontend origins
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    frontendUrl,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /\.vercel\.app$/.test(origin)
      ) {
        callback(null, true);
      } else if (process.env.NODE_ENV !== 'production') {
        // Allow all origins in non-production for development convenience
        callback(null, true);
      } else {
        callback(new Error(`CORS policy: origin ${origin} is not allowed`), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Register Health & Status Endpoints (GET /health, GET /api/health, GET /api/status, GET /api/v1/health)
  const httpAdapter = app.getHttpAdapter();
  const prismaService = app.get(PrismaService);

  const getHealthPayload = () => ({
    status: 'ok',
    version: '1.0.0',
    service: 'WCOS Backend Gateway',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
    database: prismaService.isConnected ? 'connected' : 'fallback-in-memory',
    chainId: process.env.CHAIN_ID || '84532',
    rpcUrl: process.env.RPC_URL || 'https://sepolia.base.org',
  });

  httpAdapter.get('/health', (_req: any, res: any) => res.json(getHealthPayload()));
  httpAdapter.get('/api/health', (_req: any, res: any) => res.json(getHealthPayload()));
  httpAdapter.get('/api/status', (_req: any, res: any) => res.json({
    ...getHealthPayload(),
    storageProvider: process.env.STORAGE_PROVIDER || 'local',
    contractAddress: process.env.NFT_CONTRACT_ADDRESS || process.env.CONTRACT_ADDRESS || '0x498e82d77C29FAf0605a96E3D4F59E9E0C1BEc3A',
  }));
  httpAdapter.get('/api/v1/health', (_req: any, res: any) => res.json(getHealthPayload()));

  // Swagger Documentation Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Web3 Creator Operating System (WCOS) Backend API')
    .setDescription('WCOS API gateway — AI Studio, Collections, Marketplace, DeFi, DAO, Analytics, Profile, SIWE Auth, Transactions, Indexer, News')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup('api/docs', app, () =>
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port, '0.0.0.0');
  logger.log(`WCOS Backend API gateway running on: http://localhost:${port}`);
  logger.log(`Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`Health check endpoints: http://localhost:${port}/health | http://localhost:${port}/api/health | http://localhost:${port}/api/status`);
}
bootstrap();
