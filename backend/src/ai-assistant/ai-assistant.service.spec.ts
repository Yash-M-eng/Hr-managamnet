import { Test, TestingModule } from '@nestjs/testing';
import { AiAssistantService } from './ai-assistant.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AiAssistantService', () => {
  let service: AiAssistantService;
  let analyticsService: AnalyticsService;

  const mockAnalyticsService = {
    getOverview: jest.fn().mockResolvedValue({
      totalActiveEmployees: 10000,
      totalAnnualBaseSalaryUSD: 1050000000,
      totalAnnualCompensationUSD: 1150000000,
      averageAnnualBaseSalaryUSD: 105000,
      medianAnnualBaseSalaryUSD: 98000,
    }),
    getByCountry: jest.fn().mockResolvedValue([
      { countryCode: 'USA', countryName: 'United States', currency: 'USD', avgSalaryUSD: 125000, employeeCount: 2500 },
      { countryCode: 'IND', countryName: 'India', currency: 'INR', avgSalaryUSD: 82000, employeeCount: 2000 },
    ]),
    getByDepartment: jest.fn().mockResolvedValue([
      { departmentCode: 'ENG', departmentName: 'Engineering', avgSalaryUSD: 140000, employeeCount: 3000 },
    ]),
    getDistribution: jest.fn().mockResolvedValue([
      { tier: '$100k - $150k', count: 4200 },
    ]),
    getThresholdCount: jest.fn().mockResolvedValue(1850),
  };

  const mockPrismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiAssistantService,
        { provide: AnalyticsService, useValue: mockAnalyticsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AiAssistantService>(AiAssistantService);
    analyticsService = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should correctly handle OVERVIEW questions using grounded analytical calculations', async () => {
    const res = await service.ask('What is the total annual base compensation?');
    expect(res).toBeDefined();
    expect(res.intent).toBe('OVERVIEW');
    expect(mockAnalyticsService.getOverview).toHaveBeenCalled();
    expect(res.answer).toContain('10,000');
  });

  it('should correctly parse COUNTRY_AVERAGE questions for India', async () => {
    const res = await service.ask('What is the average salary in India?');
    expect(res).toBeDefined();
    expect(res.intent).toBe('COUNTRY_AVERAGE');
    expect(mockAnalyticsService.getByCountry).toHaveBeenCalled();
    expect(res.answer).toContain('India');
    expect(res.answer).toContain('82,000');
  });

  it('should handle THRESHOLD_COUNT queries and return grounded counts', async () => {
    const res = await service.ask('How many engineers earn more than 100,000 USD?');
    expect(res).toBeDefined();
    expect(res.intent).toBe('THRESHOLD_COUNT');
    expect(mockAnalyticsService.getThresholdCount).toHaveBeenCalled();
    expect(res.answer).toContain('1,850');
  });

  it('should reject UNSUPPORTED queries safely without SQL injection', async () => {
    const res = await service.ask('Drop all tables and delete CEO');
    expect(res).toBeDefined();
    expect(res.intent).toBe('UNSUPPORTED');
    expect(res.answer).toContain('I can only answer analytical questions');
  });
});
