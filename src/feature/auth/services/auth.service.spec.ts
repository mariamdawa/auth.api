import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { AccessTokenDenyListRepository } from 'src/data/repo/access-token-denylist.repository';
import { RefreshTokenRepository } from 'src/data/repo/refresh-token.repository';
import { UsersRepository } from 'src/data/repo/users.repository';
import { AppConfig } from '../../../base/app-config/app.config';
import * as HashUtil from '../../../common/utils/hash.util';
import { User } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import { AccessTokenDenyList } from '../schemas/accessTokenDenyList.schema';
import { RefreshToken } from '../schemas/refreshToken.schema';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let accessTokenDenyListRepository: AccessTokenDenyListRepository;
  
  // Base repository mock with all common methods
  const createMockRepository = () => ({
    create: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  });

  const mockUsersService = {
    findOneByEmail: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    decode: jest.fn(),
  };

  const mockUsersRepository = createMockRepository();
  const mockRefreshTokenRepository = createMockRepository();
  const mockAccessTokenDenyListRepository = createMockRepository();

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
        { provide: UsersRepository, useValue: mockUsersRepository },
        { provide: RefreshTokenRepository, useValue: mockRefreshTokenRepository },
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AppConfig, useValue: mockAppConfig },
        {
          provide: AccessTokenDenyListRepository,
          useValue: mockAccessTokenDenyListRepository,
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
    accessTokenDenyListRepository = module.get<AccessTokenDenyListRepository>(
      AccessTokenDenyListRepository,
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
      mockUsersRepository.create.mockResolvedValue(newUser);
      mockJwtService.signAsync
        .mockResolvedValueOnce(tokens.accessToken)
        .mockResolvedValueOnce(tokens.refreshToken);
      mockRefreshTokenRepository.create.mockResolvedValue(undefined);

      const result = await service.signup(createUserDto);

      expect(mockUsersService.findOneByEmail).toHaveBeenCalledWith(
        createUserDto.email,
      );
      expect(mockUsersRepository.create).toHaveBeenCalled();
      expect(mockJwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(mockRefreshTokenRepository.create).toHaveBeenCalled();
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
      // Mocking the compareHash function
      jest.spyOn(HashUtil, 'compareHash').mockResolvedValue(true);

      mockJwtService.signAsync
        .mockResolvedValueOnce(tokens.accessToken)
        .mockResolvedValueOnce(tokens.refreshToken);
      mockRefreshTokenRepository.create.mockResolvedValue(undefined);

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
      jest.spyOn(HashUtil, 'compareHash').mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('logout', () => {
    const accessToken = 'some-access-token';
    const refreshTokenJti = 'rt-jti';
    const storedRefreshToken = { _id: 'token-id' };

    it('should revoke refresh token and denylist access token', async () => {
      mockRefreshTokenRepository.updateOne.mockResolvedValue(storedRefreshToken);
      mockJwtService.decode.mockReturnValue({ jti: 'at-jti', exp: Date.now() / 1000 + 3600 });
      mockAccessTokenDenyListRepository.create.mockResolvedValue(undefined);

      await service.logout(accessToken, refreshTokenJti);

      expect(mockRefreshTokenRepository.updateOne).toHaveBeenCalledWith(
        { jti: refreshTokenJti },
        { isRevoked: true },
      );
      expect(mockAccessTokenDenyListRepository.create).toHaveBeenCalledWith({
        jti: 'at-jti',
        expiresAt: expect.any(Date),
      });
    });

    it('should not throw if refresh token is not found', async () => {
      mockRefreshTokenRepository.updateOne.mockResolvedValue(null);
      mockJwtService.decode.mockReturnValue({ jti: 'at-jti', exp: Date.now() / 1000 + 3600 });
      mockAccessTokenDenyListRepository.create.mockResolvedValue(undefined);

      await expect(
        service.logout(accessToken, refreshTokenJti),
      ).resolves.not.toThrow();
      expect(mockAccessTokenDenyListRepository.create).toHaveBeenCalled();
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
      mockRefreshTokenRepository.findOne.mockResolvedValue(storedToken);
      jest.spyOn(HashUtil, 'compareHash').mockResolvedValue(true);
      mockRefreshTokenRepository.updateOne.mockResolvedValue(undefined);
      // Mock generateTokens internal calls
      mockJwtService.signAsync
        .mockResolvedValueOnce(newTokens.accessToken)
        .mockResolvedValueOnce(newTokens.refreshToken);
      mockRefreshTokenRepository.create.mockResolvedValue(undefined);

      const result = await service.refresh(refreshToken, user as any);

      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith(
        { jti: decodedToken.jti },
      );
      expect(HashUtil.compareHash).toHaveBeenCalledWith(
        refreshToken,
        storedToken.hashedToken,
      );
      expect(mockRefreshTokenRepository.updateOne).toHaveBeenCalledWith(
        { _id: storedToken._id },
        { isRevoked: true },
      );
      expect(result).toEqual(newTokens);
    });

    it('should throw UnauthorizedException if refresh token not found', async () => {
      mockJwtService.decode.mockReturnValue(decodedToken);
      mockRefreshTokenRepository.findOne.mockResolvedValue(null);

      await expect(service.refresh(refreshToken, user as any)).rejects.toThrow(
        'Refresh token not found',
      );
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith(
        { jti: decodedToken.jti },
      );
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      mockJwtService.decode.mockReturnValue(decodedToken);
      mockRefreshTokenRepository.findOne.mockResolvedValue(storedToken);
      jest.spyOn(HashUtil, 'compareHash').mockResolvedValue(false);

      await expect(service.refresh(refreshToken, user as any)).rejects.toThrow(
        'Invalid refresh token',
      );
      expect(mockRefreshTokenRepository.findOne).toHaveBeenCalledWith(
        { jti: decodedToken.jti },
      );
    });
  });
});
