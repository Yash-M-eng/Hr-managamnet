# Security & Confidentiality Architecture

## 1. Authentication & Session Security
* **Password Hashing:** Passwords hashed with bcrypt (salt rounds: 10).
* **JWT Tokens:** Signed using a dedicated `JWT_SECRET` with an expiration window (12 hours).
* **Backend Authorization:** `JwtAuthGuard` enforced on all salary and employee modification endpoints; authorization is never solely delegated to the client UI.
* **Token Interceptor:** Automatic token renewal and client logout on HTTP 401 unauthorized responses.

---

## 2. LLM & AI Security Measures
* **Zero Arbitrary SQL Execution:** Google Gemini is never permitted to construct or run raw SQL statements.
* **Prompt Injection Defense:** Strict JSON Schema validation parses incoming natural language into approved enum intents (`OVERVIEW`, `COUNTRY_AVERAGE`, etc.).
* **Data Grounding:** The assistant only summarizes pre-computed JSON returned by backend services.
* **API Key Protection:** The `GEMINI_API_KEY` is loaded exclusively inside the NestJS backend and never sent to or bundled within the client Next.js application.

---

## 3. Auditability of Compensation Revisions
* **`SalaryChangeAudit` Entity:** Every compensation modification atomically records:
  * Actor ID (HR user who authorized the change)
  * Affected Employee ID
  * Previous base salary and previous bonus
  * New base salary and new bonus
  * Currency code
  * Change reason (Promotion, Annual Review, Market Adjustment, etc.)
  * Contextual justification notes
  * Immutable timestamp (`changedAt`)

---

## 4. Production Hardening Checklist
Before deploying to external production environments:
* Enforce HTTPS with TLS 1.3.
* Set `HttpOnly`, `SameSite=Strict`, `Secure` cookies for token storage.
* Enable database column encryption for sensitive employee compensation data at rest.
* Configure IP rate limiting (`@nestjs/throttler`) on `/auth/login` and `/ai/ask`.
