import { NestFactory } from '@nestjs/core';
import { NewsModule } from './news.module';
import { NewsService } from './news.service';
import { Logger } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { validateEnv } from '../common/env.validation';

dotenv.config();
validateEnv();

async function bootstrap() {
  const logger = new Logger('StandaloneNewsSync');
  logger.log('Starting standalone WCOS Daily News RSS Sync runner...');

  const app = await NestFactory.createApplicationContext(NewsModule);
  const newsService = app.get(NewsService);

  try {
    const result = await newsService.syncNewsFeeds();
    logger.log(`✓ Daily news sync completed cleanly! Synced ${result.syncedSources} source(s), imported ${result.newArticlesCount} new article(s).`);
  } catch (err: any) {
    logger.error(`✗ Daily news sync failed: ${err.message}`);
  } finally {
    await app.close();
    process.exit(0);
  }
}

bootstrap();
