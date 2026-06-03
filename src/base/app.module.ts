import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DataModule } from '../data/data.module';
import { AuthModule } from '../feature/auth/auth.module';
import { UsersModule } from '../feature/users/users.module';
import config from './app-config/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';


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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
