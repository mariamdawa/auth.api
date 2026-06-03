import { Test, TestingModule } from '@nestjs/testing';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthController } from './auth.controller';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './services/auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  const mockUser = {
    _id: 'someId',
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
  };

  const mockAuthService = {
    signup: jest.fn().mockResolvedValue({
      accessToken: 'test_access_token',
      refreshToken: 'test_refresh_token',
    }),
    login: jest.fn().mockResolvedValue({
      accessToken: 'test_access_token',
      refreshToken: 'test_refresh_token',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('signup', () => {
    it('should call authService.signup and return tokens', async () => {
      const createUserDto: CreateUserDto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123!',
      };
      const result = await controller.signup(createUserDto);
      expect(service.signup).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual({
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
      });
    });
  });

  describe('login', () => {
    it('should call authService.login and return tokens', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123!',
      };
      const result = await controller.login(loginDto);
      expect(service.login).toHaveBeenCalledWith(loginDto);
      expect(result).toEqual({
        accessToken: 'test_access_token',
        refreshToken: 'test_refresh_token',
      });
    });
  });
});
