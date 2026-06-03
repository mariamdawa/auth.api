import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AppConfig } from '../../../base/app-config/app.config';
import { User } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import { AccessTokenDenyList } from '../schemas/accessTokenDenyList.schema';
import { RefreshToken } from '../schemas/refreshToken.schema';
import { AccessTokenDenyListService } from './accessTokenDenyList.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let accessTokenDenyListService: AccessTokenDenyListService;

  const mockUsersService = {
    create: jest.fn(),
    findOneByEmail: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    decode: jest.fn(),
  };

  const mockRefreshTokenService = {
    create: jest.fn(),
    findOne: jest.fn(),
    revoke: jest.fn(),
  };

  const mockAccessTokenDenyListService = {
    add: jest.fn(),
    isDenylisted: jest.fn(),
  };

  const mockAppConfig = {
    config: {
      jwt: {
        accessTokenSecret: 'access-secret',
        accessTokenExpiration: '15m',
        refreshTokenSecret: 'refresh-secret',
        refreshTokenExpiration: '7d',
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AppConfig, useValue: mockAppConfig },
        {
          provide: AccessTokenDenyListService,
          useValue: mockAccessTokenDenyListService,
        },
        // We don't need the actual models, so we can provide dummy values
        { provide: getModelToken(User.name), useValue: jest.fn() },
        { provide: getModelToken(RefreshToken.name), useValue: jest.fn() },
        {
          provide: getModelToken(AccessTokenDenyList.name),
          useValue: jest.fn(),
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    accessTokenDenyListService = module.get<AccessTokenDenyListService>(
      AccessTokenDenyListService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signup', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
    };
    const newUser = {
      _id: 'some-user-id',
      ...createUserDto,
    };
    const tokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('should create a new user and return tokens if email is not taken', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue(newUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce(tokens.accessToken)
        .mockResolvedValueOnce(tokens.refreshToken);
      mockRefreshTokenService.create.mockResolvedValue(undefined);

      const result = await service.signup(createUserDto);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockRefreshTokenService.create).toHaveBeenCalled();
      expect(result).toEqual(tokens);
    });

    it('should throw a ConflictException if email is already taken', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(newUser);

      await expect(service.signup(createUserDto)).rejects.toThrow(
        'Email already exists',
      );
    });
  });

  // More tests will be added here for login, logout, refresh
  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };
    const user = {
      _id: 'some-user-id',
      email: 'test@example.com',
      password: 'hashed-password', // In a real scenario, this would be hashed
      name: 'Test User',
    };
    const tokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('should return tokens on successful login', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(user);
      // Mocking the static method of HashUtil
      const HashUtil = require('src/common/utils/hash.util').HashUtil;
      jest.spyOn(HashUtil, 'compareHash').mockResolvedValue(true);

      mockJwtService.signAsync
        .mockResolvedValueOnce(tokens.accessToken)
        .mockResolvedValueOnce(tokens.refreshToken);
      mockRefreshTokenService.create.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        loginDto.email,
      );
      expect(HashUtil.compareHash).toHaveBeenCalledWith(
        loginDto.password,
        user.password,
      );
      expect(result).toEqual(tokens);
    });

    it('should throw an UnauthorizedException for invalid credentials (user not found)', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw an UnauthorizedException for invalid credentials (wrong password)', async () => {
      mockUsersService.findOneByEmail.mockResolvedValue(user);
      const HashUtil = require('src/common/utils/hash.util').HashUtil;
      jest.spyOn(HashUtil, 'compareHash').mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('logout', () => {
    const accessTokenJti = 'at-jti';
    const refreshTokenJti = 'rt-jti';
    const storedRefreshToken = { _id: 'token-id' };

    it('should revoke refresh token and denylist access token', async () => {
      mockRefreshTokenService.findOne.mockResolvedValue(storedRefreshToken);
      mockJwtService.decode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });

      await service.logout(accessTokenJti, refreshTokenJti);

      expect(mockRefreshTokenService.findOne).toHaveBeenCalledWith(
        refreshTokenJti,
      );
      expect(mockRefreshTokenService.revoke).toHaveBeenCalledWith(
        storedRefreshToken._id,
      );
      expect(mockAccessTokenDenyListService.add).toHaveBeenCalledWith(
        accessTokenJti,
        expect.any(Date),
      );
    });

    it('should not throw if refresh token is not found', async () => {
      mockRefreshTokenService.findOne.mockResolvedValue(null);
      mockJwtService.decode.mockReturnValue({ exp: Date.now() / 1000 + 3600 });

      await expect(
        service.logout(accessTokenJti, refreshTokenJti),
      ).resolves.not.toThrow();
      expect(mockRefreshTokenService.revoke).not.toHaveBeenCalled();
      expect(mockAccessTokenDenyListService.add).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    const refreshToken = 'some-refresh-token';
    const user = { _id: 'user-id', email: 'test@test.com' };
    const decodedToken = { jti: 'rt-jti' };
    const storedToken = {
      _id: 'token-id',
      hashedToken: 'hashed-refresh-token',
    };
    const newTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('should return new tokens on successful refresh', async () => {
      mockJwtService.decode.mockReturnValue(decodedToken);
      mockRefreshTokenService.findOne.mockResolvedValue(storedToken);
      const HashUtil = require('src/common/utils/hash.util').HashUtil;
      jest.spyOn(HashUtil, 'compareHash').mockResolvedValue(true);
      mockRefreshTokenService.revoke.mockResolvedValue(undefined);
      // Mock generateTokens internal calls
      mockJwtService.signAsync
        .mockResolvedValueOnce(newTokens.accessToken)
        .mockResolvedValueOnce(newTokens.refreshToken);
      mockRefreshTokenService.create.mockResolvedValue(undefined);

      const result = await service.refresh(refreshToken, user as any);

      expect(mockRefreshTokenService.findOne).toHaveBeenCalledWith(
        decodedToken.jti,
      );
      expect(HashUtil.compareHash).toHaveBeenCalledWith(
        refreshToken,
        storedToken.hashedToken,
      );
      expect(mockRefreshTokenService.revoke).toHaveBeenCalledWith(
        storedToken._id,
      );
      expect(result).toEqual(newTokens);
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      mockJwtService.decode.mockReturnValue(decodedToken);
      mockRefreshTokenService.findOne.mockResolvedValue(null);

      await expect(service.refresh(refreshToken, user as any)).rejects.toThrow(
        'Refresh token not found',
      );
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.decode.mockReturnValue(decodedToken);
      mockRefreshTokenService.findOne.mockResolvedValue(storedToken);
      const HashUtil = require('src/common/utils/hash.util').HashUtil;
      jest.spyOn(HashUtil, 'compareHash').mockResolvedValue(false);

      await expect(service.refresh(refreshToken, user as any)).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });
});
