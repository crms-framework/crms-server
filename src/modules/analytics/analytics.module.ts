import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsRepository } from './analytics.repository';
import { AnalyticsCacheInterceptor } from './interceptors/analytics-cache.interceptor';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AnalyticsRepository, AnalyticsCacheInterceptor],
  exports: [AnalyticsService, AnalyticsRepository, AnalyticsCacheInterceptor],
})
export class AnalyticsModule {}
