import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { GlobalExceptionFilter } from 'src/common/filter/global-exception.filter';
import { LoggingInterceptor } from 'src/common/logger/interceptor/logging.interceptor';
import { LoggerModule } from 'src/common/logger/logger.module';
import { DataModule } from '../data/data.module';
import { AuthModule } from '../feature/auth/auth.module';
import { UsersModule } from '../feature/users/users.module';
import config from './app-config/config';
import { throttlerConfig } from './app-config/throttler.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
      cache: true,
    }),
    DataModule,
    AuthModule,
    UsersModule,
    LoggerModule,
    ThrottlerModule.forRoot(throttlerConfig),
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
