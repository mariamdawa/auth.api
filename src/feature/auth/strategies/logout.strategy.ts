import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from 'src/base/app-config/app.config';

type JwtPayload = {
  sub: string;
  email: string;
  jti: string;
};

@Injectable()
export class LogoutStrategy extends PassportStrategy(Strategy, 'logout') {
  constructor(private readonly appConfig: AppConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfig.config.jwt.accessTokenSecret,
      ignoreExpiration: true, // Key change: validate signature even if expired
    });
  }

  validate(payload: JwtPayload): JwtPayload {
    // The token's signature is verified by passport before this method is called.
    // We simply return the payload, which includes the jti needed for denylisting.
    return payload;
  }
}
