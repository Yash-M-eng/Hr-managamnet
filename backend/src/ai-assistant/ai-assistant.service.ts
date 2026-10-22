import { Injectable, Logger } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { PrismaService } from '../prisma/prisma.service';
import { AiResponse } from './ai-assistant.types';
import { AiGeminiClient } from './ai-gemini-client';
import { AiQueryEngine } from './ai-query-engine';

export * from './ai-assistant.types';

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);
  private readonly geminiClient: AiGeminiClient;
  private readonly queryEngine: AiQueryEngine;

  constructor(
    private analyticsService: AnalyticsService,
    private prisma: PrismaService,
  ) {
    this.geminiClient = new AiGeminiClient();
    this.queryEngine = new AiQueryEngine(analyticsService, prisma);
  }

  /**
   * Recommended 5-Tier Conversational Architecture:
   * 1. Greetings: Predefined instant warm responses without wasting Gemini API quota.
   * 2. Known Database Inquiries: Directly answered via query engine (Headcounts, Distributions, Countries, Departments, Total Comp).
   * 3. Complex Questions: Sent to Gemini API when quota is available.
   * 4. API Limit / 429 Protection: Safe fallback without hanging, transparent cooldown backoff.
   * 5. Honest Status: If question is complex/unsupported and Gemini is on cooldown, explain honestly without generic repetition.
   */
  async ask(question: string): Promise<AiResponse> {
    const cleanQuestion = question.trim();
    const qLower = cleanQuestion.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').trim();

    // Check if quota cooldown has expired
    this.geminiClient.checkCooldown();

    // 1. GREETINGS & CASUAL COURTESIES (Zero API Quota Used)
    if (this.queryEngine.isCasualGreeting(qLower)) {
      return {
        answer: "Hello! 👋 I'm doing great, thank you for asking! I am your **ACME HR & Payroll AI Assistant**.\n\nI can help you analyze organizational data such as:\n\n- **Employee compensation & salary benchmarks**\n- **Department averages & team headcounts**\n- **Multi-country payroll and exchange rates**\n- **Specific salary ranges or compensation tiers**\n\nHow can I help you today?",
        intent: 'GREETING',
        source: 'FALLBACK_ENGINE',
        providerStatus: this.geminiClient.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.geminiClient.hasClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.geminiClient.isQuotaExhausted,
      };
    }

    if (this.queryEngine.isCourtesy(qLower)) {
      return {
        answer: "You're very welcome! Feel free to ask if you need any other compensation insights or department metrics.",
        intent: 'COURTESY',
        source: 'FALLBACK_ENGINE',
        providerStatus: this.geminiClient.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.geminiClient.hasClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.geminiClient.isQuotaExhausted,
      };
    }

    // 2. STRICT OUT-OF-SCOPE FILTER: Politely decline non-organization queries
    if (this.queryEngine.isOutOfScope(qLower)) {
      return {
        answer: "I apologize, but I can only answer analytical questions regarding **ACME Organization's HR, payroll, employee compensation, and salary analytics**.\n\nI cannot answer questions about external topics, politics, celebrities, or general world knowledge. Please ask a question related to our internal departments, employees, or payroll data, and I'll be glad to help!",
        intent: 'UNSUPPORTED',
        source: 'FALLBACK_ENGINE',
        providerStatus: this.geminiClient.isQuotaExhausted ? 'FALLBACK_OFFLINE' : (this.geminiClient.hasClient ? 'ONLINE' : 'FALLBACK_OFFLINE'),
        quotaExhausted: this.geminiClient.isQuotaExhausted,
      };
    }

    // 3. KNOWN DATABASE QUESTIONS (Answered directly from Database without wasting Gemini Quota)
    const directDbAnswer = await this.queryEngine.handleKnownDatabaseQuestion(
      qLower,
      this.geminiClient.isQuotaExhausted,
      this.geminiClient.hasClient,
    );
    if (directDbAnswer) {
      return directDbAnswer;
    }

    // 4. COMPLEX QUESTIONS: Try Gemini API if quota available
    if (this.geminiClient.hasClient && !this.geminiClient.isQuotaExhausted) {
      try {
        const generatedSql = await this.geminiClient.generateSqlFromQuestion(cleanQuestion);
        if (generatedSql) {
          const validation = this.geminiClient.validateSqlSafety(generatedSql);
          if (validation.isValid && validation.sanitizedSql) {
            this.logger.log(`Executing safe validated SQL: ${validation.sanitizedSql}`);
            const rawResults = await this.prisma.$queryRawUnsafe(validation.sanitizedSql);
            const queryResults = this.geminiClient.sanitizeBigInt(rawResults);
            const naturalAnswer = await this.geminiClient.synthesizeAnswer(cleanQuestion, queryResults);
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
        this.geminiClient.checkQuotaError(err);
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
}
