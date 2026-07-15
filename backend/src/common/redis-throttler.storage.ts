import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';
import Redis from 'ioredis';

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage, OnModuleDestroy {
  private redis: Redis | null = null;
  private memoryStorage = new Map<string, { hits: number; expiresAt: number; blockedUntil?: number }>();

  constructor() {
    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
      } catch (err) {
        console.error('Failed to connect to Redis for rate limiting, falling back to memory:', err);
      }
    }
  }

  async increment(
    key: string,
    ttl: number, // in milliseconds
    limit: number,
    blockDuration: number, // in milliseconds
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const now = Date.now();

    if (this.redis) {
      const hitsKey = `throttler:${throttlerName}:${key}:hits`;
      const blockKey = `throttler:${throttlerName}:${key}:blocked`;

      // Check if blocked
      const blockedUntilStr = await this.redis.get(blockKey);
      if (blockedUntilStr) {
        const blockedUntil = parseInt(blockedUntilStr, 10);
        return {
          totalHits: limit + 1,
          timeToExpire: Math.max(0, blockedUntil - now),
          isBlocked: true,
          timeToBlockExpire: Math.max(0, blockedUntil - now),
        };
      }

      // Increment hits
      const totalHits = await this.redis.incr(hitsKey);
      if (totalHits === 1) {
        await this.redis.pexpire(hitsKey, ttl);
      }

      const timeToExpire = await this.redis.pttl(hitsKey);

      // Check if limit exceeded
      if (totalHits > limit) {
        const blockedUntil = now + blockDuration;
        await this.redis.set(blockKey, blockedUntil.toString(), 'PX', blockDuration);
        return {
          totalHits,
          timeToExpire: blockDuration,
          isBlocked: true,
          timeToBlockExpire: blockDuration,
        };
      }

      return {
        totalHits,
        timeToExpire: Math.max(0, timeToExpire),
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }

    // Fallback to in-memory storage if Redis is not configured
    let record = this.memoryStorage.get(key);
    if (!record || record.expiresAt < now) {
      record = { hits: 0, expiresAt: now + ttl };
      this.memoryStorage.set(key, record);
    }

    if (record.blockedUntil && record.blockedUntil > now) {
      return {
        totalHits: limit + 1,
        timeToExpire: Math.max(0, record.blockedUntil - now),
        isBlocked: true,
        timeToBlockExpire: Math.max(0, record.blockedUntil - now),
      };
    }

    record.hits++;

    if (record.hits > limit) {
      record.blockedUntil = now + blockDuration;
      return {
        totalHits: record.hits,
        timeToExpire: blockDuration,
        isBlocked: true,
        timeToBlockExpire: blockDuration,
      };
    }

    return {
      totalHits: record.hits,
      timeToExpire: Math.max(0, record.expiresAt - now),
      isBlocked: false,
      timeToBlockExpire: 0,
    };
  }

  onModuleDestroy() {
    if (this.redis) {
      this.redis.disconnect();
    }
  }
}
