import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppConfigModule } from 'src/base/app-config/app-config.module';
import { AppConfig } from 'src/base/app-config/app.config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [AppConfigModule],
      useFactory: async (appConfig: AppConfig) => {
        const {userName , password, host, port, dbName} = appConfig.config.dataBase;
        const auth = userName && password ? `${encodeURIComponent(userName)}:${encodeURIComponent(password)}@` : '';
        return {
          uri: `mongodb://${auth}${host}:${port}/${dbName}`,
          sanitizeFilter: true
        };
      },
      inject: [AppConfig],
    }),
  ],
  exports: [MongooseModule],
})
export class DataModule {}
