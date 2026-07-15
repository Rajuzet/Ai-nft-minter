import { NestFactory } from '@nestjs/core';
import { IndexerModule } from './indexer.module';
import { IndexerService } from './indexer.service';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { validateEnv } from '../common/env.validation';

dotenv.config();
validateEnv();

async function bootstrap() {
  const logger = new Logger('StandaloneIndexer');
  logger.log('Starting standalone WCOS Blockchain Event Indexer process...');

  const app = await NestFactory.createApplicationContext(IndexerModule);
  const indexerService = app.get(IndexerService);

  logger.log('Standalone indexer initialized successfully. Press Ctrl+C to terminate.');

  const runLoop = async () => {
    try {
      const res = await indexerService.syncEvents();
      if (res.newEventsCount > 0) {
        logger.log(`Indexed ${res.newEventsCount} new event(s) across blocks ${res.scannedFromBlock} -> ${res.scannedToBlock}`);
      }
    } catch (err: any) {
      logger.error(`Indexer error: ${err.message}`);
    }
  };

  // Initial sync
  await runLoop();

  // Polling loop every 10 seconds
  setInterval(runLoop, 10000);
}

bootstrap();
