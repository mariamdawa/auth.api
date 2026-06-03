import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from 'src/base/app-config/app.config';
import { compareHash, hashText } from 'src/common/utils/hash.util';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { UsersService } from '../../users/users.service';
import { LoginDto } from '../dto/login.dto';
import { CurrentUser } from '../types/current-user.type';
import { Tokens } from '../types/tokens.type';
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
  ): Promise<Tokens> {
    const existingUser = await this.usersService.findOneByEmail(
      createUserDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await hashText(createUserDto.password);
    const newUser = await this.usersService.create({
      ...createUserDto,
      password: hashedPassword,
    });
    const payload: CurrentUser = {
      id: newUser._id.toString(),
      name: newUser.name,
      email: newUser.email,
    };

    return this.generateTokens(payload);
  }

  private async generateTokens(
    payload: CurrentUser,
  ): Promise<Tokens> {
    const newRefreshTokenId = uuidv4();
    payload.jti = newRefreshTokenId; // Generate a unique identifier for the refresh token (jti)

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

    const hashedRefreshToken = await hashText(refreshToken);
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() +
        parseInt(this.appConfig.config.jwt.refreshTokenExpiration),
    );

    await this.refreshTokenService.create(
      newRefreshTokenId,
      hashedRefreshToken,
      expiresAt,
    );

    return { accessToken, refreshToken };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<Tokens> {
    const user = await this.usersService.findOneByEmail(loginDto.email);

    if (!user || !(await compareHash(loginDto.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload: CurrentUser = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    return this.generateTokens(payload);
  }

  async logout(accessTokenJti: string, refreshTokenJti: string): Promise<void> {
    if (refreshTokenJti) {
      const storedToken =
        await this.refreshTokenService.findOne(refreshTokenJti);
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
    user: CurrentUser,
  ): Promise<Tokens> {
    const decoded = this.jwtService.decode(refreshToken) as { jti: string };
    const storedToken = await this.refreshTokenService.findOne(decoded.jti);

    if (!storedToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const isMatch = await compareHash(refreshToken, storedToken.hashedToken);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokenService.revoke(storedToken._id);

    return this.generateTokens(user);
  }
}
