import { Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiResponse } from './ai-assistant.types';

@Injectable()
export class AiQueryEngine {
  constructor(
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
  ) {}

  public isCasualGreeting(q: string): boolean {
    const greetings = [
      'hi', 'hii', 'hiii', 'hello', 'hey', 'heyy', 'hola',
      'good morning', 'good afternoon', 'good evening', 'greetings',
      'whats up', 'sup', 'namaste', 'kaise ho', 'kya hal hai',
      'how are you', 'how r u', 'how are u', 'how do you do', 'who are you',
      'what can you do', 'help', 'help me',
    ];
    return greetings.includes(q) || /^hi+\b/.test(q) || /^hello+\b/.test(q) || /^hey+\b/.test(q) || q.startsWith('how are you');
  }

  public isCourtesy(q: string): boolean {
    const courtesy = ['thanks', 'thank you', 'thx', 'bye', 'goodbye', 'see you', 'ok', 'okay'];
    return courtesy.includes(q);
  }

  public isOutOfScope(q: string): boolean {
    const validTerms = [
      'salary', 'salaries', 'employee', 'employees', 'department', 'departments',
      'payroll', 'country', 'countries', 'bonus', 'staff', 'comp', 'compensation',
      'headcount', 'earning', 'earn', 'pay', 'paid', 'hire', 'hired', 'overview',
      'tier', 'bracket', 'distribution', 'spread', 'active', 'inactive', 'exchange rate',
      'latest', 'recent', 'newest', 'join', 'joined', 'hiring',
    ];
    const words = q.split(/\s+/);
    const hasValidTerm = words.some((w) => validTerms.some((vt) => w.includes(vt)));
    if (hasValidTerm) return false;

    const dbEntities = [
      'engineering', 'engineer', 'sales', 'marketing', 'product', 'finance',
      'operations', 'human resources', 'hr', 'customer success',
      'usa', 'united states', 'uk', 'united kingdom', 'germany', 'india', 'canada', 'australia',
    ];
    const hasEntity = dbEntities.some((entity) => q.includes(entity));
    if (hasEntity) return false;

    return true;
  }

  public async handleKnownDatabaseQuestion(
    q: string,
    isQuotaExhausted: boolean,
    hasClient: boolean,
  ): Promise<AiResponse | null> {
    const providerStatus = isQuotaExhausted ? 'FALLBACK_OFFLINE' : (hasClient ? 'ONLINE' : 'FALLBACK_OFFLINE');

    // 1. SALARY DISTRIBUTION TIERS
    if (q.includes('distribution') || q.includes('tier') || q.includes('bracket')) {
      const dist = await this.analyticsService.getDistribution();
      const list = dist.map((d) => `- **${d.tier}**: ${d.count.toLocaleString()} employees`).join('\n');
      return {
        answer: `Here is the current **Employee Salary Distribution** across ACME compensation brackets:\n\n${list}\n\nMost employees fall in the **$100k - $150k** tier.`,
        intent: 'SALARY_DISTRIBUTION',
        source: 'FALLBACK_ENGINE',
        groundedData: dist,
        providerStatus,
        quotaExhausted: isQuotaExhausted,
      };
    }

    // 2. TOTAL ANNUAL BASE COMPENSATION
    if (q.includes('total annual base') || q.includes('total base') || q.includes('total payroll') || (q.includes('total') && q.includes('compensation'))) {
      const overview = await this.analyticsService.getOverview();
      return {
        answer: `ACME's total normalized annual base payroll is **$${overview.totalAnnualBaseSalaryUSD.toLocaleString()} USD** across all ${overview.totalActiveEmployees.toLocaleString()} active employees.\n\nTotal annual compensation (Base + Variable Bonuses) is **$${overview.totalAnnualCompensationUSD.toLocaleString()} USD**, with an average base pay of **$${overview.averageAnnualBaseSalaryUSD.toLocaleString()} USD**.`,
        intent: 'OVERVIEW',
        source: 'FALLBACK_ENGINE',
        groundedData: overview,
        providerStatus,
        quotaExhausted: isQuotaExhausted,
      };
    }

    // 3. HIGHEST PAYING DEPARTMENT
    if (q.includes('highest') && q.includes('department')) {
      const depts = await this.analyticsService.getByDepartment();
      const top = depts[0];
      return {
        answer: `The department with the highest average salary is **${top.departmentName}** (${top.departmentCode}), with an average annual base salary of **$${top.avgSalaryUSD.toLocaleString()} USD** and total compensation averaging **$${top.avgTotalCompUSD.toLocaleString()} USD** across ${top.employeeCount.toLocaleString()} employees.`,
        intent: 'HIGHEST_DEPARTMENT',
        source: 'FALLBACK_ENGINE',
        groundedData: top,
        providerStatus,
        quotaExhausted: isQuotaExhausted,
      };
    }

    // 4. HIGHEST PAYING COUNTRY
    if (q.includes('highest') && (q.includes('country') || q.includes('nation'))) {
      const countries = await this.analyticsService.getByCountry();
      const top = countries[0];
      return {
        answer: `The country with the highest average salary is **${top.countryName} (${top.countryCode})**, with an average annual base compensation of **$${top.avgSalaryUSD.toLocaleString()} USD** across ${top.employeeCount.toLocaleString()} active employees.`,
        intent: 'HIGHEST_COUNTRY',
        source: 'FALLBACK_ENGINE',
        groundedData: top,
        providerStatus,
        quotaExhausted: isQuotaExhausted,
      };
    }

    // 5. LATEST & RECENT EMPLOYEES
    if (
      q.includes('latest employees') ||
      q.includes('recent employees') ||
      q.includes('newest employees') ||
      q.includes('recently hired employees')
    ) {
      const recents = await this.prisma.employee.findMany({
        orderBy: [{ hireDate: 'desc' }, { createdAt: 'desc' }],
        take: 5,
        include: { department: true, country: true },
      });
      const list = recents
        .map((e) => {
          const d = new Date(e.hireDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });
          return `- **${e.firstName} ${e.lastName}** (${e.employeeCode}) - ${e.jobTitle} in **${e.department.name}** (${e.country.name}), joined ${d}`;
        })
        .join('\n');
      return {
        answer: `Here are the **${recents.length} most recently hired employees** in ACME:\n\n${list}`,
        intent: 'RECENT_EMPLOYEES_LIST',
        source: 'FALLBACK_ENGINE',
        groundedData: recents,
        providerStatus,
        quotaExhausted: isQuotaExhausted,
      };
    }

    if (
      q.includes('latest employee') ||
      q.includes('latest employe') ||
      q.includes('newest employee') ||
      q.includes('recent employee') ||
      q.includes('recently hired') ||
      q.includes('recently joined') ||
      q.includes('last hired') ||
      q.includes('last employee') ||
      q.includes('latest hire') ||
      q.includes('newest hire') ||
      q.includes('latest joiner') ||
      (q.includes('latest') && (q.includes('name') || q.includes('naam')))
    ) {
      const latest = await this.prisma.employee.findFirst({
        orderBy: [{ hireDate: 'desc' }, { createdAt: 'desc' }],
        include: { department: true, country: true },
      });
      if (latest) {
        const hireDateStr = new Date(latest.hireDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        return {
          answer: `The most recently hired employee in our records is **${latest.firstName} ${latest.lastName}** (Employee Code: **${latest.employeeCode}**).\n\n- **Position**: ${latest.jobTitle}\n- **Department**: ${latest.department.name} (${latest.department.code})\n- **Location**: ${latest.country.name} (${latest.country.code})\n- **Hire Date**: ${hireDateStr}\n- **Current Status**: ${latest.status}`,
          intent: 'LATEST_EMPLOYEE',
          source: 'FALLBACK_ENGINE',
          groundedData: latest,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    // 6. ALL DEPARTMENTS LIST
    if (q.includes('all department') || q.includes('department list') || q.includes('departments name') || q.includes('list of department')) {
      const depts = await this.analyticsService.getByDepartment();
      const list = depts.map((d) => `- **${d.departmentName}** (Code: ${d.departmentCode}, Headcount: ${d.employeeCount.toLocaleString()}, Avg Base: $${d.avgSalaryUSD.toLocaleString()} USD)`).join('\n');
      return {
        answer: `ACME currently has **${depts.length} organizational departments**:\n\n${list}`,
        intent: 'ALL_DEPARTMENTS',
        source: 'FALLBACK_ENGINE',
        groundedData: depts,
        providerStatus,
        quotaExhausted: isQuotaExhausted,
      };
    }

    // 7. ALL COUNTRIES LIST
    if (q.includes('all country') || q.includes('all countries') || q.includes('countries name') || q.includes('list of countr')) {
      const countries = await this.analyticsService.getByCountry();
      const list = countries.map((c) => `- **${c.countryName}** (${c.currency}, ${c.employeeCount.toLocaleString()} employees, Avg Base: $${c.avgSalaryUSD.toLocaleString()} USD)`).join('\n');
      return {
        answer: `ACME operates across **${countries.length} countries**:\n\n${list}`,
        intent: 'ALL_COUNTRIES',
        source: 'FALLBACK_ENGINE',
        groundedData: countries,
        providerStatus,
        quotaExhausted: isQuotaExhausted,
      };
    }

    // 8. SPECIFIC COUNTRY QUERIES (India, Germany, USA, UK, Canada, Australia)
    if (q.includes('india') || q.includes('ind')) {
      const countries = await this.analyticsService.getByCountry();
      const match = countries.find((c) => c.countryCode === 'IND');
      if (match) {
        return {
          answer: `In **India (IND)**, we have **${match.employeeCount.toLocaleString()} active employees** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD** (paid in INR ₹). Total payroll in India is **$${((match as any).totalSalaryUSD || 0).toLocaleString()} USD**.`,
          intent: 'COUNTRY_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('germany') || q.includes('deu')) {
      const countries = await this.analyticsService.getByCountry();
      const match = countries.find((c) => c.countryCode === 'DEU');
      if (match) {
        return {
          answer: `In **Germany (DEU)**, we have **${match.employeeCount.toLocaleString()} active employees** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD** (paid in EUR €). Total payroll is **$${((match as any).totalSalaryUSD || 0).toLocaleString()} USD**.`,
          intent: 'COUNTRY_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('united states') || q.includes('usa') || q.includes('america')) {
      const countries = await this.analyticsService.getByCountry();
      const match = countries.find((c) => c.countryCode === 'USA');
      if (match) {
        return {
          answer: `In the **United States (USA)**, we have **${match.employeeCount.toLocaleString()} active employees** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD**. Total annual payroll is **$${((match as any).totalSalaryUSD || 0).toLocaleString()} USD**.`,
          intent: 'COUNTRY_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('united kingdom') || q.includes('uk') || q.includes('gbr') || q.includes('britain')) {
      const countries = await this.analyticsService.getByCountry();
      const match = countries.find((c) => c.countryCode === 'GBR');
      if (match) {
        return {
          answer: `In the **United Kingdom (GBR)**, we have **${match.employeeCount.toLocaleString()} active employees** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD** (paid in GBP £). Total payroll is **$${((match as any).totalSalaryUSD || 0).toLocaleString()} USD**.`,
          intent: 'COUNTRY_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('canada') || q.includes('can')) {
      const countries = await this.analyticsService.getByCountry();
      const match = countries.find((c) => c.countryCode === 'CAN');
      if (match) {
        return {
          answer: `In **Canada (CAN)**, we have **${match.employeeCount.toLocaleString()} active employees** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD** (paid in CAD). Total payroll is **$${((match as any).totalSalaryUSD || 0).toLocaleString()} USD**.`,
          intent: 'COUNTRY_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('australia') || q.includes('aus')) {
      const countries = await this.analyticsService.getByCountry();
      const match = countries.find((c) => c.countryCode === 'AUS');
      if (match) {
        return {
          answer: `In **Australia (AUS)**, we have **${match.employeeCount.toLocaleString()} active employees** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD** (paid in AUD). Total payroll is **$${((match as any).totalSalaryUSD || 0).toLocaleString()} USD**.`,
          intent: 'COUNTRY_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    // 9. THRESHOLD EARNINGS (e.g., "more than 100,000" or "earn more than")
    if (q.includes('more than') || q.includes('less than') || q.includes('greater than') || q.includes('earn over') || q.includes('earn more')) {
      const matchNum = q.match(/\d+[\d,]*/);
      const threshold = matchNum ? parseInt(matchNum[0].replace(/,/g, ''), 10) : 100000;
      const operator = q.includes('less') ? 'lt' : 'gt';
      let deptCode: string | undefined;
      if (q.includes('engineer') || q.includes('eng')) deptCode = 'ENG';
      else if (q.includes('sales')) deptCode = 'SLS';
      else if (q.includes('product')) deptCode = 'PROD';

      const count = await this.analyticsService.getThresholdCount(threshold, operator, deptCode);
      return {
        answer: `There are currently **${count.toLocaleString()} active employees** in ${deptCode ? `the **${deptCode}** department` : 'ACME globally'} earning ${operator === 'gt' ? 'more than' : 'less than'} **$${threshold.toLocaleString()} USD** annually.`,
        intent: 'THRESHOLD_COUNT',
        source: 'FALLBACK_ENGINE',
        groundedData: { thresholdUSD: threshold, operator, count },
        providerStatus,
        quotaExhausted: isQuotaExhausted,
      };
    }

    // 10. SPECIFIC DEPARTMENT QUERIES (Engineering, Product, Sales, Marketing, etc.)
    if (q.includes('engineer') || q.includes('eng')) {
      const depts = await this.analyticsService.getByDepartment();
      const match = depts.find((d) => d.departmentCode === 'ENG');
      if (match) {
        return {
          answer: `The **Engineering** department currently comprises **${match.employeeCount.toLocaleString()} team members** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD** and total compensation averaging **$${((match as any).avgTotalCompUSD || match.avgSalaryUSD || 0).toLocaleString()} USD**.`,
          intent: 'DEPARTMENT_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('product') || q.includes('prod')) {
      const depts = await this.analyticsService.getByDepartment();
      const match = depts.find((d) => d.departmentCode === 'PROD');
      if (match) {
        return {
          answer: `The **Product Management** department employs **${match.employeeCount.toLocaleString()} members** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD** and total compensation averaging **$${match.avgTotalCompUSD.toLocaleString()} USD**.`,
          intent: 'DEPARTMENT_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('sales') || q.includes('sls')) {
      const depts = await this.analyticsService.getByDepartment();
      const match = depts.find((d) => d.departmentCode === 'SLS');
      if (match) {
        return {
          answer: `The **Sales** department has **${match.employeeCount.toLocaleString()} active employees** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD** and total average compensation of **$${match.avgTotalCompUSD.toLocaleString()} USD**.`,
          intent: 'DEPARTMENT_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('marketing') || q.includes('mkt')) {
      const depts = await this.analyticsService.getByDepartment();
      const match = depts.find((d) => d.departmentCode === 'MKT');
      if (match) {
        return {
          answer: `The **Marketing** department employs **${match.employeeCount.toLocaleString()} members** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD**.`,
          intent: 'DEPARTMENT_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('finance') || q.includes('fin')) {
      const depts = await this.analyticsService.getByDepartment();
      const match = depts.find((d) => d.departmentCode === 'FIN');
      if (match) {
        return {
          answer: `The **Finance** department employs **${match.employeeCount.toLocaleString()} members** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD**.`,
          intent: 'DEPARTMENT_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('operation') || q.includes('ops')) {
      const depts = await this.analyticsService.getByDepartment();
      const match = depts.find((d) => d.departmentCode === 'OPS');
      if (match) {
        return {
          answer: `The **Operations** department employs **${match.employeeCount.toLocaleString()} members** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD**.`,
          intent: 'DEPARTMENT_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('human resource') || q.includes('hr department') || q === 'hr') {
      const depts = await this.analyticsService.getByDepartment();
      const match = depts.find((d) => d.departmentCode === 'HR');
      if (match) {
        return {
          answer: `The **Human Resources** department employs **${match.employeeCount.toLocaleString()} members** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD**.`,
          intent: 'DEPARTMENT_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    if (q.includes('customer success') || q.includes('cs department') || q === 'cs') {
      const depts = await this.analyticsService.getByDepartment();
      const match = depts.find((d) => d.departmentCode === 'CS');
      if (match) {
        return {
          answer: `The **Customer Success** department employs **${match.employeeCount.toLocaleString()} members** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD**.`,
          intent: 'DEPARTMENT_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus,
          quotaExhausted: isQuotaExhausted,
        };
      }
    }

    // 11. GENERAL OVERVIEW
    if (q.includes('overview') || q.includes('headcount') || q.includes('how many employees') || q.includes('company average') || q.includes('average salary')) {
      const overview = await this.analyticsService.getOverview();
      return {
        answer: `Across ACME globally, there are **${overview.totalActiveEmployees.toLocaleString()} active employees** across 6 countries and 8 departments. Total annual base payroll is **$${overview.totalAnnualBaseSalaryUSD.toLocaleString()} USD** with an average base salary of **$${overview.averageAnnualBaseSalaryUSD.toLocaleString()} USD** and median of **$${overview.medianAnnualBaseSalaryUSD.toLocaleString()} USD**.`,
        intent: 'OVERVIEW',
        source: 'FALLBACK_ENGINE',
        groundedData: overview,
        providerStatus,
        quotaExhausted: isQuotaExhausted,
      };
    }

    return null;
  }
}
