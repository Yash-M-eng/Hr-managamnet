export interface AiResponse {
  answer: string;
  intent: string;
  source: 'GEMINI_LLM' | 'FALLBACK_ENGINE';
  providerStatus: 'ONLINE' | 'FALLBACK_OFFLINE';
  quotaExhausted: boolean;
  groundedData?: any;
  sqlExecuted?: string;
}

export interface SqlValidationResult {
  isValid: boolean;
  sanitizedSql?: string;
  reason?: string;
}
