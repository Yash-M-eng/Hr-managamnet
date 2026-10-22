import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma/prisma.service';

export interface AiResponse {
  answer: string;
  intent: string;
  groundedData: any;
  providerStatus: 'ONLINE' | 'FALLBACK_OFFLINE';
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private aiClient: GoogleGenAI | null = null;
  private readonly modelName: string;

  constructor(
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
        this.logger.log(`Google GenAI client initialized with model: ${this.modelName}`);
      } catch (err) {
        this.logger.warn(`Failed to initialize Google GenAI client: ${err.message}`);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY not found in environment. Running in offline heuristic mode.');
    }
  }

  /**
   * Safe Intent Interpretation via Gemini or deterministic heuristic fallback
   */
  async ask(question: string): Promise<AiResponse> {
    const cleanQuestion = question.trim();

    // 1. Determine structured intent
    const intentObj = await this.interpretIntent(cleanQuestion);

    // 2. Execute approved analytical query based strictly on intent
    const groundedData = await this.executeIntentQuery(intentObj);

    // 3. Generate grounded answer
    const answer = await this.generateGroundedAnswer(cleanQuestion, intentObj, groundedData);

    return {
      answer,
      intent: intentObj.intent,
      groundedData,
      providerStatus: this.aiClient ? 'ONLINE' : 'FALLBACK_OFFLINE',
    };
  }

  private async interpretIntent(question: string): Promise<{
    intent: string;
    countryCode?: string;
    departmentCode?: string;
    threshold?: number;
    operator?: 'gt' | 'lt';
  }> {
    const systemPrompt = `You are a strict HR Analytics Query Parser for ACME Organization.
Classify the user's natural language question into exactly ONE of the following valid analytical intents:
- OVERVIEW: Total annual payroll, overall headcount, organization-wide median/min/max.
- COUNTRY_AVERAGE: Questions asking for average, min, or max salary in a specific country or highest paying country.
- DEPARTMENT_AVERAGE: Questions asking for average salary in a department (Engineering, Sales, etc.) or highest paying department.
- SALARY_DISTRIBUTION: Questions about salary brackets, tiers, or distribution across the org.
- THRESHOLD_COUNT: Questions asking how many employees earn more or less than a specific dollar amount (e.g. "how many engineers earn more than 100000 USD?").
- UNSUPPORTED: Any question asking to modify data, write SQL, unrelated questions, or questions outside salary data.

Return ONLY valid JSON matching this schema:
{
  "intent": "OVERVIEW" | "COUNTRY_AVERAGE" | "DEPARTMENT_AVERAGE" | "SALARY_DISTRIBUTION" | "THRESHOLD_COUNT" | "UNSUPPORTED",
  "countryCode": "USA" | "GBR" | "DEU" | "IND" | "CAN" | "AUS" | null,
  "departmentCode": "ENG" | "PROD" | "SLS" | "MKT" | "HR" | "FIN" | "OPS" | "CS" | null,
  "threshold": number | null,
  "operator": "gt" | "lt" | null
}`;

    if (this.aiClient) {
      try {
        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: `${systemPrompt}\n\nUser Question: "${question}"`,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const text = response.text || '';
        const parsed = JSON.parse(text);
        if (parsed.intent) {
          return parsed;
        }
      } catch (err) {
        this.logger.error(`Gemini intent extraction error: ${err.message}. Using heuristic fallback.`);
      }
    }

    // Heuristic intent classification fallback (ensures 100% determinism & offline resilience)
    return this.heuristicIntent(question);
  }

  private heuristicIntent(question: string): {
    intent: string;
    countryCode?: string;
    departmentCode?: string;
    threshold?: number;
    operator?: 'gt' | 'lt';
  } {
    const q = question.toLowerCase();

    if (q.includes('distribut') || q.includes('bracket') || q.includes('range')) {
      return { intent: 'SALARY_DISTRIBUTION' };
    }

    // Threshold check
    const matchThreshold = q.match(/(\d+[\d,]*)\s*(usd|dollars|\$)?/i);
    if ((q.includes('more than') || q.includes('greater than') || q.includes('above') || q.includes('less than') || q.includes('below')) && matchThreshold) {
      const numStr = matchThreshold[1].replace(/,/g, '');
      const val = parseInt(numStr, 10);
      const isGt = q.includes('more than') || q.includes('greater than') || q.includes('above');

      let deptCode: string | undefined;
      if (q.includes('engineer')) deptCode = 'ENG';
      if (q.includes('sales')) deptCode = 'SLS';
      if (q.includes('product')) deptCode = 'PROD';
      if (q.includes('marketing')) deptCode = 'MKT';

      return {
        intent: 'THRESHOLD_COUNT',
        threshold: val,
        operator: isGt ? 'gt' : 'lt',
        departmentCode: deptCode,
      };
    }

    // Country check
    if (q.includes('india') || q.includes('ind')) return { intent: 'COUNTRY_AVERAGE', countryCode: 'IND' };
    if (q.includes('germany') || q.includes('deu')) return { intent: 'COUNTRY_AVERAGE', countryCode: 'DEU' };
    if (q.includes('united kingdom') || q.includes('uk') || q.includes('gbr')) return { intent: 'COUNTRY_AVERAGE', countryCode: 'GBR' };
    if (q.includes('united states') || q.includes('us') || q.includes('usa')) return { intent: 'COUNTRY_AVERAGE', countryCode: 'USA' };
    if (q.includes('canada') || q.includes('can')) return { intent: 'COUNTRY_AVERAGE', countryCode: 'CAN' };
    if (q.includes('australia') || q.includes('aus')) return { intent: 'COUNTRY_AVERAGE', countryCode: 'AUS' };
    if (q.includes('country') && (q.includes('highest') || q.includes('top'))) return { intent: 'COUNTRY_AVERAGE' };

    // Department check
    if (q.includes('engineer') || q.includes('eng')) return { intent: 'DEPARTMENT_AVERAGE', departmentCode: 'ENG' };
    if (q.includes('product') || q.includes('prod')) return { intent: 'DEPARTMENT_AVERAGE', departmentCode: 'PROD' };
    if (q.includes('sales') || q.includes('sls')) return { intent: 'DEPARTMENT_AVERAGE', departmentCode: 'SLS' };
    if (q.includes('market') || q.includes('mkt')) return { intent: 'DEPARTMENT_AVERAGE', departmentCode: 'MKT' };
    if (q.includes('human resources') || q.includes('hr')) return { intent: 'DEPARTMENT_AVERAGE', departmentCode: 'HR' };
    if (q.includes('finance') || q.includes('fin')) return { intent: 'DEPARTMENT_AVERAGE', departmentCode: 'FIN' };
    if (q.includes('operation') || q.includes('ops')) return { intent: 'DEPARTMENT_AVERAGE', departmentCode: 'OPS' };
    if (q.includes('department') && (q.includes('highest') || q.includes('top'))) return { intent: 'DEPARTMENT_AVERAGE' };

    if (q.includes('total') || q.includes('overall') || q.includes('average') || q.includes('median') || q.includes('how many employees')) {
      return { intent: 'OVERVIEW' };
    }

    return { intent: 'UNSUPPORTED' };
  }

  private async executeIntentQuery(intentObj: any): Promise<any> {
    switch (intentObj.intent) {
      case 'OVERVIEW':
        return this.analyticsService.getOverview();

      case 'COUNTRY_AVERAGE': {
        const countries = await this.analyticsService.getByCountry();
        if (intentObj.countryCode) {
          const match = countries.find((c) => c.countryCode === intentObj.countryCode);
          return match || { message: `No data found for country code ${intentObj.countryCode}`, allCountries: countries };
        }
        return {
          highestPayingCountry: countries[0],
          allCountries: countries,
        };
      }

      case 'DEPARTMENT_AVERAGE': {
        const departments = await this.analyticsService.getByDepartment();
        if (intentObj.departmentCode) {
          const match = departments.find((d) => d.departmentCode === intentObj.departmentCode);
          return match || { message: `No data found for department code ${intentObj.departmentCode}`, allDepartments: departments };
        }
        return {
          highestPayingDepartment: departments[0],
          allDepartments: departments,
        };
      }

      case 'SALARY_DISTRIBUTION':
        return this.analyticsService.getDistribution();

      case 'THRESHOLD_COUNT': {
        const threshold = intentObj.threshold || 100000;
        const operator = intentObj.operator || 'gt';
        const count = await this.analyticsService.getThresholdCount(
          threshold,
          operator,
          intentObj.departmentCode,
          intentObj.countryCode,
        );
        return {
          thresholdUSD: threshold,
          operator,
          departmentCode: intentObj.departmentCode || 'ALL',
          countryCode: intentObj.countryCode || 'ALL',
          matchingEmployeeCount: count,
        };
      }

      case 'UNSUPPORTED':
      default:
        return {
          supportedQueries: [
            'What is the average salary in India?',
            'Which department has the highest average salary?',
            'How many engineers earn more than 100,000 USD?',
            'Which country has the highest average salary?',
            'What is the total annual base compensation?',
            'Show salary distribution across the organization.',
          ],
        };
    }
  }

  private async generateGroundedAnswer(question: string, intentObj: any, data: any): Promise<string> {
    if (intentObj.intent === 'UNSUPPORTED') {
      return "I can only answer analytical questions regarding organizational salaries, country benchmarks, departmental averages, and compensation distributions. Supported questions include: 'What is the average salary in India?', 'Which department pays the highest?', or 'How many employees earn over 100,000 USD?'";
    }

    if (this.aiClient) {
      try {
        const response = await this.aiClient.models.generateContent({
          model: this.modelName,
          contents: `You are an executive HR compensation analytics assistant at ACME.
Answer the user's question concisely in 2-3 professional sentences.
Strict rule: GROUND your response ENTIRELY on the provided database facts below. Do NOT hallucinate or compute any numbers outside this JSON.

User Question: "${question}"
Database Ground Truth Facts:
${JSON.stringify(data, null, 2)}`,
        });

        if (response.text) {
          return response.text.trim();
        }
      } catch (err) {
        this.logger.error(`Gemini explanation generation failed: ${err.message}. Using grounded fallback template.`);
      }
    }

    // Deterministic grounded response generator
    switch (intentObj.intent) {
      case 'OVERVIEW':
        return `ACME currently employs ${data.totalActiveEmployees.toLocaleString()} active staff members with a total normalized annual base payroll of $${data.totalAnnualBaseSalaryUSD.toLocaleString()} USD and total compensation of $${data.totalAnnualCompensationUSD.toLocaleString()} USD. The organization-wide average base salary is $${data.averageAnnualBaseSalaryUSD.toLocaleString()} USD, with a median of $${data.medianAnnualBaseSalaryUSD.toLocaleString()} USD.`;

      case 'COUNTRY_AVERAGE':
        if (data.countryName) {
          return `In ${data.countryName} (${data.countryCode}), the average annual base salary is $${data.avgSalaryUSD.toLocaleString()} USD (paid in ${data.currency}) across ${data.employeeCount.toLocaleString()} active employees. Salaries range between $${data.minSalaryUSD.toLocaleString()} USD and $${data.maxSalaryUSD.toLocaleString()} USD.`;
        }
        return `The highest average paying country is ${data.highestPayingCountry.countryName} (${data.highestPayingCountry.countryCode}) with an average salary of $${data.highestPayingCountry.avgSalaryUSD.toLocaleString()} USD across ${data.highestPayingCountry.employeeCount.toLocaleString()} employees.`;

      case 'DEPARTMENT_AVERAGE':
        if (data.departmentName) {
          return `The ${data.departmentName} department employs ${data.employeeCount.toLocaleString()} team members with an average annual base salary of $${data.avgSalaryUSD.toLocaleString()} USD and average total compensation of $${data.avgTotalCompUSD.toLocaleString()} USD.`;
        }
        return `The department with the highest average compensation is ${data.highestPayingDepartment.departmentName} with an average annual base salary of $${data.highestPayingDepartment.avgSalaryUSD.toLocaleString()} USD.`;

      case 'SALARY_DISTRIBUTION': {
        const summary = data.map((d: any) => `${d.tier}: ${d.count} employees`).join(', ');
        return `Organizational salary distribution across active tiers: ${summary}.`;
      }

      case 'THRESHOLD_COUNT':
        return `There are currently ${data.matchingEmployeeCount.toLocaleString()} active employees in ${data.departmentCode === 'ALL' ? 'the organization' : data.departmentCode} earning ${data.operator === 'gt' ? 'more than' : 'less than'} $${data.thresholdUSD.toLocaleString()} USD.`;

      default:
        return 'Query processed successfully based on database records.';
    }
  }
}
