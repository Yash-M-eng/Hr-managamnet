import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma/prisma.service';

// Polyfill BigInt.prototype.toJSON to prevent JSON serialization errors
if (typeof BigInt !== 'undefined') {
  (BigInt.prototype as any).toJSON = function () {
    const intVal = Number(this);
    return Number.isSafeInteger(intVal) ? intVal : this.toString();
  };
}

export interface AiResponse {
  answer: string;
  intent: string;
  source: 'GEMINI_LLM' | 'FALLBACK_ENGINE';
  providerStatus: 'ONLINE' | 'FALLBACK_OFFLINE';
  quotaExhausted: boolean;
  groundedData?: any;
  sqlExecuted?: string;
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private aiClient: GoogleGenAI | null = null;
  private readonly modelName: string;
  private isQuotaExhausted = false;
  private quotaCooldownUntil: number = 0; // Cooldown timestamp to prevent hammering exhausted API

  constructor(
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
        this.logger.log(`Google GenAI client initialized with model: ${this.modelName}`);
      } catch (err: any) {
        this.logger.warn(`Failed to initialize Google GenAI client: ${err.message}`);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY not found in environment. Running in offline heuristic mode.');
    }
  }

  /**
   * Recommended 5-Tier Conversational Architecture:
   * 1. Greetings: Predefined instant warm responses without wasting Gemini API quota.
   * 2. Known Database Inquiries: Directly answered via query builder (Headcounts, Distributions, Countries, Departments, Total Comp).
   * 3. Complex Questions: Sent to Gemini API when quota is available.
   * 4. API Limit / 429 Protection: Safe fallback without hanging, transparent cooldown backoff.
   * 5. Honest Status: If question is complex/unsupported and Gemini is on cooldown, explain honestly without generic repetition.
   */
  async ask(question: string): Promise<AiResponse> {
    const cleanQuestion = question.trim();
    const qLower = cleanQuestion.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').trim();

    // Check if quota cooldown has expired (e.g. after cooldown period, allow retry)
    if (this.isQuotaExhausted && Date.now() > this.quotaCooldownUntil) {
      this.isQuotaExhausted = false;
      this.logger.log('Gemini quota cooldown expired. Enabling LLM attempts again.');
    }

    // 1. GREETINGS & CASUAL COURTESIES (Zero API Quota Used)
    if (this.isCasualGreeting(qLower)) {
      return {
        answer: "Hello! 👋 I'm doing great, thank you for asking! I am your **ACME HR & Payroll AI Assistant**.\n\nI can help you analyze organizational data such as:\n\n- **Employee compensation & salary benchmarks**\n- **Department averages & team headcounts**\n- **Multi-country payroll and exchange rates**\n- **Specific salary ranges or compensation tiers**\n\nHow can I help you today?",
        intent: 'GREETING',
        source: 'FALLBACK_ENGINE',
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
      };
    }

    if (this.isCourtesy(qLower)) {
      return {
        answer: "You're very welcome! Feel free to ask if you need any other compensation insights or department metrics.",
        intent: 'COURTESY',
        source: 'FALLBACK_ENGINE',
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
      };
    }

    // 2. STRICT OUT-OF-SCOPE FILTER: Politely decline non-organization queries
    if (this.isOutOfScope(qLower)) {
      return {
        answer: "I apologize, but I can only answer analytical questions regarding **ACME Organization's HR, payroll, employee compensation, and salary analytics**.\n\nI cannot answer questions about external topics, politics, celebrities, or general world knowledge. Please ask a question related to our internal departments, employees, or payroll data, and I'll be glad to help!",
        intent: 'UNSUPPORTED',
        source: 'FALLBACK_ENGINE',
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
      };
    }

    // 3. KNOWN DATABASE QUESTIONS (Answered directly from Database without wasting Gemini Quota)
    const directDbAnswer = await this.handleKnownDatabaseQuestion(qLower);
    if (directDbAnswer) {
      return directDbAnswer;
    }

    // 4. COMPLEX QUESTIONS: Try Gemini API if quota available
    if (this.aiClient && !this.isQuotaExhausted) {
      try {
        const generatedSql = await this.generateSqlFromQuestion(cleanQuestion);
        if (generatedSql) {
          const validation = this.validateSqlSafety(generatedSql);
          if (validation.isValid) {
            this.logger.log(`Executing safe validated SQL: ${validation.sanitizedSql}`);
            const rawResults = await this.prisma.$queryRawUnsafe(validation.sanitizedSql);
            const queryResults = this.sanitizeBigInt(rawResults);
            const naturalAnswer = await this.synthesizeAnswer(cleanQuestion, queryResults);
            return {
              answer: naturalAnswer,
              intent: 'DYNAMIC_SQL_QUERY',
              source: 'GEMINI_LLM',
              groundedData: queryResults,
              sqlExecuted: validation.sanitizedSql,
              providerStatus: 'ONLINE',
              quotaExhausted: false,
            };
          }
        }
      } catch (err: any) {
        this.checkQuotaError(err);
      }
    }

    // 5. HONEST FALLBACK WHEN GEMINI UNAVAILABLE AND QUESTION IS COMPLEX
    return {
      answer: "I'm temporarily unable to process complex free-form questions because the **Google Gemini AI service has reached its daily usage quota limit (HTTP 429)**.\n\nHowever, our **Verified Database Analytics Engine** is fully active! You can ask any of these supported questions:\n\n- *Show salary distribution across the organization*\n- *What is the total annual base compensation?*\n- *What is the average salary in India / Germany / USA?*\n- *Which department has the highest average salary?*\n- *How many engineers or sales employees are active?*\n- *Give me all department names*",
      intent: 'QUOTA_EXHAUSTED_FALLBACK',
      source: 'FALLBACK_ENGINE',
      providerStatus: 'FALLBACK_OFFLINE',
      quotaExhausted: true,
    };
  }

  private checkQuotaError(err: any) {
    const errMsg = err?.message || JSON.stringify(err);
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      this.isQuotaExhausted = true;
      // Set cooldown for 15 minutes to avoid spamming the rate-limited API
      this.quotaCooldownUntil = Date.now() + 15 * 60 * 1000;
      this.logger.warn('Gemini API daily quota limit reached (429 RESOURCE_EXHAUSTED). Enabled 15-minute cooldown.');
    }
  }

  private isCasualGreeting(q: string): boolean {
    const greetings = [
      'hi', 'hii', 'hiii', 'hello', 'hey', 'heyy', 'hola',
      'good morning', 'good afternoon', 'good evening', 'greetings',
      'whats up', 'sup', 'namaste', 'kaise ho', 'kya hal hai',
      'how are you', 'how r u', 'how are u', 'how do you do', 'who are you',
      'what can you do', 'help', 'help me'
    ];
    return greetings.includes(q) || /^hi+\b/.test(q) || /^hello+\b/.test(q) || /^hey+\b/.test(q) || q.startsWith('how are you');
  }

  private isCourtesy(q: string): boolean {
    const courtesy = ['thanks', 'thank you', 'thx', 'bye', 'goodbye', 'see you', 'ok', 'okay'];
    return courtesy.includes(q);
  }

  private isOutOfScope(q: string): boolean {
    const validTerms = [
      'salary', 'salaries', 'employee', 'employees', 'department', 'departments',
      'payroll', 'country', 'countries', 'bonus', 'staff', 'comp', 'compensation',
      'headcount', 'earning', 'earn', 'pay', 'paid', 'hire', 'hired', 'overview',
      'tier', 'bracket', 'distribution', 'spread', 'active', 'inactive', 'exchange rate',
      'latest', 'recent', 'newest', 'join', 'joined', 'hiring'
    ];
    const words = q.split(/\s+/);
    const hasValidTerm = words.some((w) => validTerms.some((vt) => w.includes(vt)));
    if (hasValidTerm) return false;

    const dbEntities = [
      'engineering', 'engineer', 'sales', 'marketing', 'product', 'finance',
      'operations', 'human resources', 'hr', 'customer success',
      'usa', 'united states', 'uk', 'united kingdom', 'germany', 'india', 'canada', 'australia'
    ];
    const hasEntity = dbEntities.some((entity) => q.includes(entity));
    if (hasEntity) return false;

    return true;
  }

  /**
   * Step 2: Handle Known Database Questions Deterministically
   */
  private async handleKnownDatabaseQuestion(q: string): Promise<AiResponse | null> {
    // 1. SALARY DISTRIBUTION TIERS (E.g., "Show salary distribution across the organization")
    if (q.includes('distribution') || q.includes('tier') || q.includes('bracket')) {
      const dist = await this.analyticsService.getDistribution();
      const list = dist.map((d) => `- **${d.tier}**: ${d.count.toLocaleString()} employees`).join('\n');
      return {
        answer: `Here is the current **Employee Salary Distribution** across ACME compensation brackets:\n\n${list}\n\nMost employees fall in the **$100k - $150k** tier.`,
        intent: 'SALARY_DISTRIBUTION',
        source: 'FALLBACK_ENGINE',
        groundedData: dist,
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
      };
    }

    // 2. TOTAL ANNUAL BASE COMPENSATION (E.g., "What is the total annual base compensation?")
    if (q.includes('total annual base') || q.includes('total base') || q.includes('total payroll') || (q.includes('total') && q.includes('compensation'))) {
      const overview = await this.analyticsService.getOverview();
      return {
        answer: `ACME's total normalized annual base payroll is **$${overview.totalAnnualBaseSalaryUSD.toLocaleString()} USD** across all ${overview.totalActiveEmployees.toLocaleString()} active employees.\n\nTotal annual compensation (Base + Variable Bonuses) is **$${overview.totalAnnualCompensationUSD.toLocaleString()} USD**, with an average base pay of **$${overview.averageAnnualBaseSalaryUSD.toLocaleString()} USD**.`,
        intent: 'OVERVIEW',
        source: 'FALLBACK_ENGINE',
        groundedData: overview,
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
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
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
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
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
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
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
      };
    }

    // 6. ALL COUNTRIES LIST
    if (q.includes('all country') || q.includes('all countries') || q.includes('countries name') || q.includes('list of countr')) {
      const countries = await this.analyticsService.getByCountry();
      const list = countries.map((c) => `- **${c.countryName}** (${c.currency}, ${c.employeeCount.toLocaleString()} employees, Avg Base: $${c.avgSalaryUSD.toLocaleString()} USD)`).join('\n');
      return {
        answer: `ACME operates across **${countries.length} countries**:\n\n${list}`,
        intent: 'ALL_COUNTRIES',
        source: 'FALLBACK_ENGINE',
        groundedData: countries,
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
      };
    }

    // 7. SPECIFIC COUNTRY QUERIES (India, Germany, USA, UK, Canada, Australia)
    if (q.includes('india') || q.includes('ind')) {
      const countries = await this.analyticsService.getByCountry();
      const match = countries.find((c) => c.countryCode === 'IND');
      if (match) {
        return {
          answer: `In **India (IND)**, we have **${match.employeeCount.toLocaleString()} active employees** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD** (paid in INR ₹). Total payroll in India is **$${((match as any).totalSalaryUSD || 0).toLocaleString()} USD**.`,
          intent: 'COUNTRY_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
        };
      }
    }

    // 8. THRESHOLD EARNINGS (e.g., "more than 100,000" or "earn more than")
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
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
      };
    }

    // 9. SPECIFIC DEPARTMENT QUERIES (Engineering, Product, Sales, Marketing, etc.)
    if (q.includes('engineer') || q.includes('eng')) {
      const depts = await this.analyticsService.getByDepartment();
      const match = depts.find((d) => d.departmentCode === 'ENG');
      if (match) {
        return {
          answer: `The **Engineering** department currently comprises **${match.employeeCount.toLocaleString()} team members** with an average annual base salary of **$${match.avgSalaryUSD.toLocaleString()} USD** and total compensation averaging **$${((match as any).avgTotalCompUSD || match.avgSalaryUSD || 0).toLocaleString()} USD**.`,
          intent: 'DEPARTMENT_AVERAGE',
          source: 'FALLBACK_ENGINE',
          groundedData: match,
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
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
          providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
          quotaExhausted: this.isQuotaExhausted,
        };
      }
    }

    // 10. GENERAL OVERVIEW
    if (q.includes('overview') || q.includes('headcount') || q.includes('how many employees') || q.includes('company average') || q.includes('average salary')) {
      const overview = await this.analyticsService.getOverview();
      return {
        answer: `Across ACME globally, there are **${overview.totalActiveEmployees.toLocaleString()} active employees** across 6 countries and 8 departments. Total annual base payroll is **$${overview.totalAnnualBaseSalaryUSD.toLocaleString()} USD** with an average base salary of **$${overview.averageAnnualBaseSalaryUSD.toLocaleString()} USD** and median of **$${overview.medianAnnualBaseSalaryUSD.toLocaleString()} USD**.`,
        intent: 'OVERVIEW',
        source: 'FALLBACK_ENGINE',
        groundedData: overview,
        providerStatus: this.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.isQuotaExhausted,
      };
    }

    return null; // Not a known pattern -> delegate to Gemini or Honest Fallback
  }

  private async generateSqlFromQuestion(question: string): Promise<string | null> {
    if (!this.aiClient) return null;

    const schemaContext = `Database Schema (SQLite):
Tables:
1. employees (id TEXT PRIMARY KEY, employeeCode TEXT, firstName TEXT, lastName TEXT, email TEXT, jobTitle TEXT, status TEXT ['ACTIVE', 'INACTIVE', 'ON_LEAVE'], departmentId TEXT, countryId TEXT, hireDate DATETIME)
2. departments (id TEXT PRIMARY KEY, name TEXT, code TEXT ['ENG', 'PROD', 'SLS', 'MKT', 'HR', 'FIN', 'OPS', 'CS'])
3. countries (id TEXT PRIMARY KEY, code TEXT ['USA', 'GBR', 'DEU', 'IND', 'CAN', 'AUS'], name TEXT, currency TEXT ['USD', 'GBP', 'EUR', 'INR', 'CAD', 'AUD'], exchangeRate REAL)
4. salary_records (id TEXT PRIMARY KEY, employeeId TEXT, baseSalary REAL, variableBonus REAL, currency TEXT, normalizedUSD REAL, totalNormalizedUSD REAL, isCurrent INTEGER [1 or 0], effectiveFrom DATETIME, effectiveTo DATETIME, changeReason TEXT)

Rules:
- Generate a single SQLite SELECT statement to answer the question.
- Output ONLY the raw SQL statement on one line without markdown code fences or commentary.
- Always filter active employees with e.status = 'ACTIVE' and current salaries with s.isCurrent = 1 when computing compensation benchmarks.
- Use JOIN employees e ON s.employeeId = e.id, JOIN departments d ON e.departmentId = d.id, JOIN countries c ON e.countryId = c.id.
- ALWAYS append a LIMIT clause (max LIMIT 50).`;

    try {
      const response = await this.aiClient.models.generateContent({
        model: this.modelName,
        contents: `${schemaContext}\n\nUser Question: "${question}"\nSQLite Query:`,
      });

      const rawSql = response.text ? response.text.trim() : '';
      const cleanSql = rawSql.replace(/```(sql)?/gi, '').replace(/```/g, '').trim();

      if (cleanSql && cleanSql.toUpperCase().startsWith('SELECT')) {
        return cleanSql;
      }
    } catch (err: any) {
      this.checkQuotaError(err);
      this.logger.error(`Gemini SQL generation error: ${err.message}`);
    }

    return null;
  }

  private validateSqlSafety(sql: string): { isValid: boolean; sanitizedSql: string; reason?: string } {
    let clean = sql.trim().replace(/;+$/, '');

    if (!clean.toUpperCase().startsWith('SELECT')) {
      return { isValid: false, sanitizedSql: '', reason: 'Only SELECT statements are permitted.' };
    }

    const forbiddenKeywords = [
      'INSERT', 'UPDATE', 'DELETE', 'DROP', 'ALTER', 'CREATE', 'TRUNCATE',
      'REPLACE', 'EXEC', 'EXECUTE', 'PRAGMA', 'ATTACH', 'DETACH', 'VACUUM',
      'GRANT', 'REVOKE', '--', 'xp_', 'sp_'
    ];

    const uppercaseSql = clean.toUpperCase();
    for (const keyword of forbiddenKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(uppercaseSql)) {
        return { isValid: false, sanitizedSql: '', reason: `Forbidden SQL operation detected: ${keyword}` };
      }
    }

    if (uppercaseSql.includes('SQLITE_') || uppercaseSql.includes('USERS')) {
      return { isValid: false, sanitizedSql: '', reason: 'Access to system or sensitive user tables is restricted.' };
    }

    if (!uppercaseSql.includes('LIMIT')) {
      clean = `${clean} LIMIT 50`;
    }

    return { isValid: true, sanitizedSql: clean };
  }

  private async synthesizeAnswer(question: string, queryResults: any): Promise<string> {
    if (!this.aiClient || this.isQuotaExhausted) {
      return this.formatDirectResults(queryResults);
    }

    try {
      const response = await this.aiClient.models.generateContent({
        model: this.modelName,
        contents: `You are the ACME HR & Payroll AI Assistant.
A user asked: "${question}"
Database verified results:
${JSON.stringify(queryResults, null, 2)}

Provide a natural, conversational, friendly, and executive HR response.
Requirements:
- Answer directly and warmly like a knowledgeable colleague in a modern chatbot.
- Use clean formatting, highlighting key figures (e.g. employee counts, dollar amounts with proper commas and currency symbols).
- If listing multiple items (such as departments, countries, employees, or salary ranges), format each item as a markdown bullet list item starting with "- **Item Name**: Details" on a new line, so it renders as a clean stacked list in the UI.
- Do NOT mention SQL, SELECT, databases, or internal mechanics. Give ONLY the user-friendly response.`,
      });

      if (response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      this.checkQuotaError(err);
      this.logger.error(`Synthesis error: ${err.message}. Formatting direct result.`);
    }

    return this.formatDirectResults(queryResults);
  }

  private formatDirectResults(results: any): string {
    if (!results || (Array.isArray(results) && results.length === 0)) {
      return 'I searched our organization records, but could not find any active data matching your request.';
    }

    if (Array.isArray(results) && results.length > 0 && (results[0].name || results[0].departmentName)) {
      const names = results.map((r: any) => `- **${r.name || r.departmentName}**`).join('\n');
      return `Here are the departments currently active in ACME:\n\n${names}`;
    }

    if (Array.isArray(results) && results.length === 1) {
      const row = results[0];
      const keys = Object.keys(row);
      if (keys.length === 1 && typeof row[keys[0]] === 'number') {
        const val = row[keys[0]];
        const label = keys[0].replace(/([A-Z])/g, ' $1').toLowerCase();
        return `According to our records, the total ${label} is **${val.toLocaleString()}**.`;
      }
      const parts = Object.entries(row).map(([k, v]) => {
        const label = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').toLowerCase();
        const formatted = typeof v === 'number' ? (v > 1000 && !k.toLowerCase().includes('count') ? `$${v.toLocaleString()} USD` : v.toLocaleString()) : v;
        return `**${formatted}** (${label})`;
      });
      return `Here is what our records show: ${parts.join(', ')}.`;
    }

    if (Array.isArray(results)) {
      const preview = results.slice(0, 8).map((r: any) => {
        const name = r.name || r.departmentName || r.countryName || r.firstName || Object.values(r)[0];
        const val = r.avgSalaryUSD || r.employeeCount || r.baseSalary || Object.values(r)[1];
        return `- **${name}**: ${typeof val === 'number' && val > 1000 ? `$${val.toLocaleString()} USD` : val}`;
      }).join('\n');
      return `Here is the data found from your request:\n\n${preview}`;
    }

    return `Based on our payroll data: ${JSON.stringify(this.sanitizeBigInt(results))}`;
  }

  public sanitizeBigInt(data: any): any {
    if (data === null || data === undefined) return data;
    if (typeof data === 'bigint') {
      const num = Number(data);
      return Number.isSafeInteger(num) ? num : data.toString();
    }
    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeBigInt(item));
    }
    if (typeof data === 'object') {
      const res: any = {};
      for (const [key, value] of Object.entries(data)) {
        res[key] = this.sanitizeBigInt(value);
      }
      return res;
    }
    return data;
  }
}
