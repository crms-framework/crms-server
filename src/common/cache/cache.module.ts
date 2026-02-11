import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisEnabled = config.get<string>('REDIS_ENABLED', 'true') !== 'false';

        if (!redisEnabled) {
          return {
            store: 'memory',
            ttl: 300000, // 5 minutes in milliseconds
          };
        }

        return {
          store: await redisStore({
            socket: {
              host: config.get<string>('REDIS_HOST', 'localhost'),
              port: config.get<number>('REDIS_PORT', 6379),
            },
          }),
          ttl: 300000, // 5 minutes
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class CacheConfigModule {}
