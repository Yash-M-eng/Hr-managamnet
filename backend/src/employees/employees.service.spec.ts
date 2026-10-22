import { Test, TestingModule } from '@nestjs/testing';
import { EmployeesService } from './employees.service';
import { PrismaService } from '../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    employee: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return paginated list of employees with meta', async () => {
    mockPrismaService.employee.count.mockResolvedValue(100);
    mockPrismaService.employee.findMany.mockResolvedValue([
      {
        id: 'emp-1',
        employeeCode: 'ACM-00001',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@acme.corp',
        jobTitle: 'Software Engineer',
        status: 'ACTIVE',
        hireDate: new Date(),
        createdAt: new Date(),
        department: { name: 'Engineering' },
        country: { name: 'USA', currency: 'USD' },
        salaries: [{ baseSalary: 100000, currency: 'USD', normalizedUSD: 100000 }],
      },
    ]);

    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.data.length).toBe(1);
    expect(result.meta.total).toBe(100);
    expect(result.meta.totalPages).toBe(10);
  });

  it('should throw ConflictException if creating employee with duplicate email or code', async () => {
    mockPrismaService.employee.findFirst.mockResolvedValue({ id: 'emp-existing' });

    await expect(
      service.create({
        employeeCode: 'ACM-00001',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'duplicate@acme.corp',
        jobTitle: 'Product Manager',
        departmentId: 'dept-1',
        countryId: 'country-1',
        hireDate: new Date().toISOString(),
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('should throw NotFoundException if employee does not exist', async () => {
    mockPrismaService.employee.findUnique.mockResolvedValue(null);

    await expect(service.findOne('non-existent-id')).rejects.toThrow(NotFoundException);
  });
});
