import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const databaseUrl = configService.get<string>('database.url');
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool as any);
    super({ adapter } as any);
    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
