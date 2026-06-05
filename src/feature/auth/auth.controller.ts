import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HeaderToken } from 'src/common/decorators/header-token.decorator';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from './decorators/get-current-user.decorator';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/refresh.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import { LogoutGuard } from './guards/logout.guard';
import { AuthService } from './services/auth.service';
import type { CurrentUser } from './types/current-user.type';
import { Tokens } from './types/tokens.type';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 409, description: 'Conflict. User already exists.' })
  async signup(@Body() createUserDto: CreateUserDto): Promise<Tokens> {
    return this.authService.signup(createUserDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log in a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully logged in.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async login(@Body() loginDto: LoginDto): Promise<Tokens> {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  @UseGuards(LogoutGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out a user' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully logged out.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async logout(@Body() logoutDto: LogoutDto, @HeaderToken() accessToken: string): Promise<void> {
    const refreshTokenId = logoutDto.jti; // Assuming refresh token is sent in the body

    // We proceed with logout even if tokens are invalid, to ensure cleanup.
    // The service should handle cases where jti might be null.
    return this.authService.logout(accessToken, refreshTokenId);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh the access token' })
  @ApiResponse({
    status: 200,
    description: 'The access token has been successfully refreshed.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async refresh(
    @User() user: CurrentUser,
    @HeaderToken() refreshToken: string,
  ): Promise<Tokens> {
       return this.authService.refresh(refreshToken, user);
  }

}
