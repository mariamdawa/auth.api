import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from 'src/common/filter/global-exception.filter';
import { LoggingInterceptor } from 'src/common/logger/interceptor/logging.interceptor';
import { LoggerModule } from 'src/common/logger/logger.module';
import { DataModule } from '../data/data.module';
import { AuthModule } from '../feature/auth/auth.module';
import { UsersModule } from '../feature/users/users.module';
import config from './app-config/config';


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
    }
  ],
})
export class AppModule {}
