import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { AppConfigModule } from 'src/base/app-config/app-config.module';
import { UsersModule } from 'src/feature/users/users.module';
import { AuthController } from './auth.controller';
import {
  AccessTokenDenyList,
  AccessTokenDenyListSchema,
} from './schemas/accessTokenDenyList.schema';
import {
  RefreshToken,
  RefreshTokenSchema,
} from './schemas/refreshToken.schema';
import { AccessTokenDenyListService } from './services/accessTokenDenyList.service';
import { AuthService } from './services/auth.service';
import { RefreshTokenService } from './services/refreshToken.service';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LogoutStrategy } from './strategies/logout.strategy';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    ConfigModule,
    AppConfigModule,
    JwtModule.register({}),
    MongooseModule.forFeature([
      { name: RefreshToken.name, schema: RefreshTokenSchema },
      { name: AccessTokenDenyList.name, schema: AccessTokenDenyListSchema },
    ]),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtRefreshStrategy,
    LogoutStrategy,
    RefreshTokenService,
    AccessTokenDenyListService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
