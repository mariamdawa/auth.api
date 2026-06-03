import { Module } from '@nestjs/common';
import { WinstonAdapterService } from './adapter/winston/winston.service';
import { LoggerAdapter } from './adapter/logger.adapter';

@Module({
  providers: [
    {
      provide: LoggerAdapter,
      useClass: WinstonAdapterService,
    },
  ],
  exports: [LoggerAdapter],
})
export class LoggerModule {}
