import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _connected = false;

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  get isConnected(): boolean {
    return this._connected;
  }

  async onModuleInit() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      const errorMsg = 'DATABASE_URL environment variable is missing!';
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      // 1. Establish connection
      await this.$connect();

      // 2. Ping database to verify responsiveness
      await this.$executeRawUnsafe('SELECT 1;');

      this._connected = true;
      const provider = dbUrl.startsWith('file:') ? 'SQLite' : 'PostgreSQL';
      this.logger.log(`Prisma ORM connected and verified response from ${provider} database ✓`);
    } catch (error: unknown) {
      this._connected = false;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Prisma DB connection failed: ${msg}`);
      
      // Implement fail-fast behavior: throw error to prevent application startup if database is unavailable
      throw new Error(`Database Initialization Failed: ${msg}`);
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // suppress shutdown errors
    }
  }

  /**
   * Execute a DB operation safely — returns null if DB is unavailable.
   * Use this wrapper in services to gracefully degrade instead of crashing.
   */
  async safe<T>(fn: () => Promise<T>): Promise<T | null> {
    if (!this._connected) return null;
    try {
      return await fn();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(`DB operation failed: ${msg}`);
      return null;
    }
  }
}
