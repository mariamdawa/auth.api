import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from 'src/base/app-config/app.config';
import { CurrentUser } from '../types/current-user.type';

@Injectable()
export class LogoutStrategy extends PassportStrategy(Strategy, 'logout') {
  constructor(readonly appConfig: AppConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfig.config.jwt.accessTokenSecret,
      ignoreExpiration: true, // Key change: validate signature even if expired
    });
  }

  validate(payload: CurrentUser): CurrentUser {
    // The token's signature is verified by passport before this method is called.
    // We simply return the payload, which includes the jti needed for denylisting.
    return payload;
  }
}
