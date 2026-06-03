import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from 'src/base/app-config/app.config';
import { HashUtil } from 'src/common/utils/hash.util';
import { User } from 'src/feature/users/schemas/user.schema';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UsersService } from '../../users/users.service';
import { LoginDto } from '../dto/login.dto';
import { AccessTokenDenyListService } from './accessTokenDenyList.service';
import { RefreshTokenService } from './refreshToken.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfig,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly accessTokenDenyListService: AccessTokenDenyListService,
  ) {}

  async signup(
    createUserDto: CreateUserDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const existingUser = await this.usersService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await HashUtil.hashText(createUserDto.password);
    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.generateTokens(newUser);
  }

  private async generateTokens(
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshTokenId = uuidv4();
    const payload = {
      email: user.email,
      sub: user._id.toString(),
      jti: refreshTokenId, // jti of refresh token is the link
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, jti: uuidv4() }, // Access token gets its own jti
        {
          secret: this.appConfig.config.jwt.accessTokenSecret,
          expiresIn: this.appConfig.config.jwt.accessTokenExpiration,
        },
      ),
      this.jwtService.signAsync(payload, {
        secret: this.appConfig.config.jwt.refreshTokenSecret,
        expiresIn: this.appConfig.config.jwt.refreshTokenExpiration,
      }),
    ]);

    const hashedRefreshToken = await HashUtil.hashText(refreshToken);
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() +
        parseInt(this.appConfig.config.jwt.refreshTokenExpiration),
    );

    await this.refreshTokenService.create(
      refreshTokenId,
      hashedRefreshToken,
      expiresAt,
    );

    return { accessToken, refreshToken };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user || !(await HashUtil.compareHash(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async logout(
    accessTokenJti: string,
    refreshTokenJti: string,
  ): Promise<void> {
    if (refreshTokenJti) {
      const storedToken = await this.refreshTokenService.findOne(
        refreshTokenJti,
      );
      if (storedToken) {
        await this.refreshTokenService.revoke(storedToken._id);
      }
    }

    if (accessTokenJti) {
      const decodedToken = this.jwtService.decode(accessTokenJti) as {
        exp: number;
      };
      if (decodedToken && decodedToken.exp) {
        const expiresAt = new Date(decodedToken.exp * 1000);
        await this.accessTokenDenyListService.add(accessTokenJti, expiresAt);
      }
    }
  }

  async refresh(
    refreshToken: string,
    user: User,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const decoded = this.jwtService.decode(refreshToken) as { jti: string };
    const storedToken = await this.refreshTokenService.findOne(decoded.jti);

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const isMatch = await HashUtil.compareHash(
      refreshToken,
      storedToken.hashedToken,
    );
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokenService.revoke(storedToken._id);

    return this.generateTokens(user);
  }
}
