import { Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { SqlValidationResult } from './ai-assistant.types';

export class AiGeminiClient {
  private readonly logger = new Logger(AiGeminiClient.name);
  private aiClient: GoogleGenAI | null = null;
  private readonly modelName: string;
  public isQuotaExhausted = false;
  public quotaCooldownUntil: number = 0;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (apiKey) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey });
        this.logger.log(`Google GenAI client initialized with model: ${this.modelName}`);
      } catch (err: any) {
        this.logger.warn(`Failed to initialize Google GenAI client: ${err.message}`);
      }
    } else {
      this.logger.warn('GEMINI_API_KEY not found in environment. Running in offline fallback mode.');
    }
  }

  public get hasClient(): boolean {
    return this.aiClient !== null;
  }

  public checkCooldown() {
    if (this.isQuotaExhausted && Date.now() > this.quotaCooldownUntil) {
      this.isQuotaExhausted = false;
      this.logger.log('Gemini quota cooldown expired. Enabling LLM attempts again.');
    }
  }

  public checkQuotaError(err: any) {
    const errMsg = err?.message || JSON.stringify(err);
    if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
      this.isQuotaExhausted = true;
      this.quotaCooldownUntil = Date.now() + 15 * 60 * 1000;
      this.logger.warn('Gemini API daily quota limit reached (429 RESOURCE_EXHAUSTED). Enabled 15-minute cooldown.');
    }
  }

  public async generateSqlFromQuestion(question: string): Promise<string | null> {
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

  public validateSqlSafety(sql: string): SqlValidationResult {
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

  public async synthesizeAnswer(question: string, queryResults: any): Promise<string> {
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

  public formatDirectResults(results: any): string {
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
