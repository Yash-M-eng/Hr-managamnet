import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockUser = {
    id: 'user-1',
    email: 'hr.manager@acme.corp',
    name: 'Alice HR',
    role: 'HR_MANAGER',
    passwordHash: '',
  };

  beforeAll(async () => {
    mockUser.passwordHash = await bcrypt.hash('CorrectPassword123', 10);
  });

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mocked.jwt.token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should authenticate valid credentials and issue JWT', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    const res = await service.login({
      email: 'hr.manager@acme.corp',
      password: 'CorrectPassword123',
    });

    expect(res).toBeDefined();
    expect(res.accessToken).toBe('mocked.jwt.token');
    expect(res.user.email).toBe('hr.manager@acme.corp');
  });

  it('should throw UnauthorizedException on invalid password', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

    await expect(
      service.login({
        email: 'hr.manager@acme.corp',
        password: 'WrongPassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException on non-existent email', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      service.login({
        email: 'nonexistent@acme.corp',
        password: 'SomePassword',
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
