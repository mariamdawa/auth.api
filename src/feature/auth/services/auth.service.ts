import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from 'src/base/app-config/app.config';
import { compareHash, hashText } from 'src/common/utils/hash.util';
import { parseTimeToMilliseconds } from 'src/common/utils/time.util';
import { UsersRepository } from 'src/data/repo/users.repository';
import { UsersService } from 'src/feature/users/users.service';
import { v4 as uuidv4 } from 'uuid';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { LoginDto } from '../dto/login.dto';
import { CurrentUser } from '../types/current-user.type';
import { Tokens } from '../types/tokens.type';
import { AccessTokenDenyListService } from './accessTokenDenyList.service';
import { RefreshTokenService } from './refreshToken.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly accessTokenDenyService: AccessTokenDenyListService,
    private readonly jwtService: JwtService,
    private readonly appConfig: AppConfig,
    private readonly userService: UsersService,
  ) {}

  async signup(
    createUserDto: CreateUserDto,
  ): Promise<Tokens> {
    const existingUser = await this.userService.findOneByEmail(createUserDto.email);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await hashText(createUserDto.password);
    const newUser = await this.usersRepository.create({
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
    const newUserPayload = {
      id: payload.id,
      name: payload.name,
      email: payload.email,
      jti: newRefreshTokenId, // Add jti to the payload for refresh token
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...newUserPayload, jti: uuidv4() }, // Access token gets its own jti
        {
          secret: this.appConfig.config.jwt.accessTokenSecret,
          expiresIn: this.appConfig.config.jwt.accessTokenExpiration,
        },
      ),
      this.jwtService.signAsync(newUserPayload, {
        secret: this.appConfig.config.jwt.refreshTokenSecret,
        expiresIn: this.appConfig.config.jwt.refreshTokenExpiration,
      }),
    ]);

    const refreshTokenExpirationInMS = parseTimeToMilliseconds(this.appConfig.config.jwt.refreshTokenExpiration);
    await this.refreshTokenService.create(
      newRefreshTokenId,
      new Date(Date.now() + refreshTokenExpirationInMS),
    );

    return { accessToken, refreshToken };
  }

  async login(
    loginDto: LoginDto,
  ): Promise<Tokens> {
    const user = await this.userService.findOneByEmail(loginDto.email);
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

  async logout(accessToken: string, refreshTokenJti: string): Promise<void> {
    if (refreshTokenJti) {
        await this.refreshTokenService.revoke(refreshTokenJti);
    }
    if (accessToken) {
      const decodedToken = this.jwtService.decode(accessToken) as {
        jti: string;
        exp: number;
      };
    console.log('Access Token JTI:', decodedToken);

      if (decodedToken && decodedToken.exp) {
        const expiresAt = new Date(decodedToken.exp * 1000);
        await this.accessTokenDenyService.create( decodedToken.jti, expiresAt );
      }
    }
  }

  async refresh(
    refreshToken: string,
    user: CurrentUser,
  ): Promise<Tokens> {
    const decoded = this.jwtService.decode(refreshToken) as { jti: string };
    const storedToken = await this.refreshTokenService.findOne(decoded.jti);

    if (!storedToken || storedToken?.isRevoked) {
      throw new UnauthorizedException();
    }

    await this.refreshTokenService.revoke(storedToken.jti);

    return this.generateTokens(user);
  }
}
