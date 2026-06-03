import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { HeaderToken } from 'src/common/decorators/header-token.decorator';
import { User as UserDto } from 'src/feature/users/schemas/user.schema';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from './decorators/get-current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LogoutGuard } from './guards/logout.guard';
import { AuthService } from './services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly jwtService: JwtService,
  ) {}

  @Public()
  @Post('signup')
  async signup(
    @Body(new ValidationPipe()) createUserDto: CreateUserDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.signup(createUserDto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ValidationPipe()) loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    return this.authService.login(loginDto);
  }

  @UseGuards(LogoutGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @HeaderToken() accessToken: string): Promise<void> {
    const refreshTokenId = req.body.jti; // Assuming refresh token is sent in the body

    // We decode without verification as the token might be expired, which is fine for logout.
    const at = this.jwtService.decode(accessToken) as { jti: string };

    // We proceed with logout even if tokens are invalid, to ensure cleanup.
    // The service should handle cases where jti might be null.
    return this.authService.logout(at?.jti, refreshTokenId);
  }

  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @User() user: UserDto,
    @HeaderToken() refreshToken: string,
  ): Promise<{ accessToken: string; }> {
    return this.authService.refresh(refreshToken, user);
  }
}
