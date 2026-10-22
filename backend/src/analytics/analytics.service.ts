import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Top-level KPI overview across all 10,000 employees
   * Using SQL aggregates over current active salary records
   */
  async getOverview() {
    const totalEmployees = await this.prisma.employee.count({
      where: { status: 'ACTIVE' },
    });

    // Aggregates over current active salaries
    const salaryAggregate = await this.prisma.salaryRecord.aggregate({
      where: {
        isCurrent: true,
        employee: { status: 'ACTIVE' },
      },
      _sum: {
        normalizedUSD: true,
        totalNormalizedUSD: true,
      },
      _avg: {
        normalizedUSD: true,
        totalNormalizedUSD: true,
      },
      _min: {
        normalizedUSD: true,
      },
      _max: {
        normalizedUSD: true,
      },
      _count: {
        id: true,
      },
    });

    // Compute median salary using indexed normalizedUSD
    const count = salaryAggregate._count.id;
    let medianUSD = 0;
    if (count > 0) {
      const middleOffset = Math.floor(count / 2);
      const medianRecord = await this.prisma.salaryRecord.findMany({
        where: { isCurrent: true, employee: { status: 'ACTIVE' } },
        orderBy: { normalizedUSD: 'asc' },
        skip: middleOffset,
        take: 1,
        select: { normalizedUSD: true },
      });
      if (medianRecord.length > 0) {
        medianUSD = medianRecord[0].normalizedUSD;
      }
    }

    return {
      reportingCurrency: 'USD',
      totalActiveEmployees: totalEmployees,
      totalAnnualBaseSalaryUSD: Math.round(salaryAggregate._sum.normalizedUSD || 0),
      totalAnnualCompensationUSD: Math.round(salaryAggregate._sum.totalNormalizedUSD || 0),
      averageAnnualBaseSalaryUSD: Math.round(salaryAggregate._avg.normalizedUSD || 0),
      averageAnnualCompensationUSD: Math.round(salaryAggregate._avg.totalNormalizedUSD || 0),
      medianAnnualBaseSalaryUSD: medianUSD,
      minAnnualBaseSalaryUSD: salaryAggregate._min.normalizedUSD || 0,
      maxAnnualBaseSalaryUSD: salaryAggregate._max.normalizedUSD || 0,
    };
  }

  /**
   * Aggregated metrics by country
   */
  async getByCountry() {
    // Group active current salaries by employee country
    const results: any[] = await this.prisma.$queryRaw`
      SELECT 
        c.code as countryCode,
        c.name as countryName,
        c.currency as localCurrency,
        c.exchangeRate,
        COUNT(e.id) as employeeCount,
        ROUND(AVG(s.normalizedUSD)) as avgSalaryUSD,
        ROUND(SUM(s.normalizedUSD)) as totalSalaryUSD,
        ROUND(MIN(s.normalizedUSD)) as minSalaryUSD,
        ROUND(MAX(s.normalizedUSD)) as maxSalaryUSD
      FROM countries c
      JOIN employees e ON e.countryId = c.id
      JOIN salary_records s ON s.employeeId = e.id AND s.isCurrent = 1
      WHERE e.status = 'ACTIVE'
      GROUP BY c.id
      ORDER BY avgSalaryUSD DESC
    `;

    return results.map((r) => ({
      countryCode: r.countryCode,
      countryName: r.countryName,
      currency: r.localCurrency,
      exchangeRate: Number(r.exchangeRate),
      employeeCount: Number(r.employeeCount),
      avgSalaryUSD: Number(r.avgSalaryUSD),
      totalSalaryUSD: Number(r.totalSalaryUSD),
      minSalaryUSD: Number(r.minSalaryUSD),
      maxSalaryUSD: Number(r.maxSalaryUSD),
    }));
  }

  /**
   * Aggregated metrics by department
   */
  async getByDepartment() {
    const results: any[] = await this.prisma.$queryRaw`
      SELECT 
        d.code as departmentCode,
        d.name as departmentName,
        COUNT(e.id) as employeeCount,
        ROUND(AVG(s.normalizedUSD)) as avgSalaryUSD,
        ROUND(AVG(s.totalNormalizedUSD)) as avgTotalCompUSD,
        ROUND(SUM(s.normalizedUSD)) as totalSalaryUSD,
        ROUND(MIN(s.normalizedUSD)) as minSalaryUSD,
        ROUND(MAX(s.normalizedUSD)) as maxSalaryUSD
      FROM departments d
      JOIN employees e ON e.departmentId = d.id
      JOIN salary_records s ON s.employeeId = e.id AND s.isCurrent = 1
      WHERE e.status = 'ACTIVE'
      GROUP BY d.id
      ORDER BY avgSalaryUSD DESC
    `;

    return results.map((r) => ({
      departmentCode: r.departmentCode,
      departmentName: r.departmentName,
      employeeCount: Number(r.employeeCount),
      avgSalaryUSD: Number(r.avgSalaryUSD),
      avgTotalCompUSD: Number(r.avgTotalCompUSD),
      totalSalaryUSD: Number(r.totalSalaryUSD),
      minSalaryUSD: Number(r.minSalaryUSD),
      maxSalaryUSD: Number(r.maxSalaryUSD),
    }));
  }

  /**
   * Distribution of salaries across bracket tiers
   */
  async getDistribution() {
    const brackets = [
      { label: '< $50k', min: 0, max: 49999 },
      { label: '$50k - $75k', min: 50000, max: 74999 },
      { label: '$75k - $100k', min: 75000, max: 99999 },
      { label: '$100k - $150k', min: 100000, max: 149999 },
      { label: '$150k - $200k', min: 150000, max: 199999 },
      { label: '$200k+', min: 200000, max: 10000000 },
    ];

    const distribution = await Promise.all(
      brackets.map(async (b) => {
        const count = await this.prisma.salaryRecord.count({
          where: {
            isCurrent: true,
            employee: { status: 'ACTIVE' },
            normalizedUSD: { gte: b.min, lte: b.max },
          },
        });
        return {
          tier: b.label,
          count,
        };
      }),
    );

    return distribution;
  }

  /**
   * Employees count earning above/below a threshold in normalized USD
   */
  async getThresholdCount(thresholdUSD: number, operator: 'gt' | 'lt' = 'gt', departmentCode?: string, countryCode?: string) {
    const where: any = {
      isCurrent: true,
      employee: {
        status: 'ACTIVE',
        ...(departmentCode && { department: { code: departmentCode } }),
        ...(countryCode && { country: { code: countryCode } }),
      },
      normalizedUSD: operator === 'gt' ? { gt: thresholdUSD } : { lt: thresholdUSD },
    };

    return this.prisma.salaryRecord.count({ where });
  }
}
