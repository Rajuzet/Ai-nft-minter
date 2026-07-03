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
    try {
      await this.$connect();
      this._connected = true;
      const provider = process.env.DATABASE_URL?.startsWith('file:') ? 'SQLite' : 'PostgreSQL';
      this.logger.log(`Prisma ORM connected to ${provider} database ✓`);
    } catch (error: unknown) {
      this._connected = false;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Prisma DB connection failed: ${msg}`);
      this.logger.warn('APIs requiring DB persistence will return empty results until a database is available.');
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
