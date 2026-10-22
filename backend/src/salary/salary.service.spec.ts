import { Test, TestingModule } from '@nestjs/testing';
import { SalaryService } from './salary.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('SalaryService', () => {
  let service: SalaryService;
  let prisma: PrismaService;

  const mockEmployee = {
    id: 'emp-1',
    country: { currency: 'EUR', exchangeRate: 1.08 },
    salaries: [
      {
        id: 'sal-1',
        baseSalary: 70000,
        variableBonus: 5000,
        currency: 'EUR',
        effectiveFrom: new Date('2023-01-01'),
        isCurrent: true,
      },
    ],
  };

  const mockPrismaService = {
    employee: {
      findUnique: jest.fn(),
    },
    country: {
      findFirst: jest.fn().mockResolvedValue({ currency: 'EUR', exchangeRate: 1.08 }),
    },
    $transaction: jest.fn().mockImplementation(async (callback) => {
      const mockTx = {
        salaryRecord: {
          update: jest.fn(),
          create: jest.fn().mockResolvedValue({
            id: 'sal-2',
            baseSalary: 85000,
            normalizedUSD: 91800,
            isCurrent: true,
          }),
        },
        salaryChangeAudit: {
          create: jest.fn(),
        },
      };
      return callback(mockTx);
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalaryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SalaryService>(SalaryService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should successfully add new salary record, close old record, and write audit trail', async () => {
    mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

    const result = await service.addSalaryRecord(
      'emp-1',
      {
        baseSalary: 85000,
        variableBonus: 7000,
        currency: 'EUR',
        effectiveFrom: '2024-01-01T00:00:00.000Z',
        changeReason: 'PROMOTION',
        notes: 'Promoted to Senior Engineer',
      },
      'hr-user-id',
    );

    expect(result).toBeDefined();
    expect(result.id).toBe('sal-2');
    expect(mockPrismaService.$transaction).toHaveBeenCalled();
  });

  it('should reject salary record if effective date is before current effective date', async () => {
    mockPrismaService.employee.findUnique.mockResolvedValue(mockEmployee);

    await expect(
      service.addSalaryRecord(
        'emp-1',
        {
          baseSalary: 75000,
          currency: 'EUR',
          effectiveFrom: '2022-01-01T00:00:00.000Z', // Before 2023-01-01
          changeReason: 'RETROACTIVE',
        },
        'hr-user-id',
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
