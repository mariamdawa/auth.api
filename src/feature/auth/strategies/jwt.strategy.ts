import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from 'src/base/app-config/app.config';
import { AccessTokenDenyListService } from '../services/accessTokenDenyList.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly accessTokenDenyListService: AccessTokenDenyListService,
    private readonly appConfig: AppConfig,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: appConfig.config.jwt.accessTokenSecret,
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    jti: string;
  }): Promise<{ userId: string; email: string }> {
    const isDenylisted = await this.accessTokenDenyListService.isDenylisted(
      payload.jti,
    );
    if (isDenylisted) {
      throw new UnauthorizedException('Token is expired or revoked');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
