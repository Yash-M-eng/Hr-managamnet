# ACME Global Salary Management & AI Analytics System

A production-grade, full-stack Salary Management System designed for **10,000+ employees** across 6 countries and 8 departments. Built specifically for the **HR Manager** to manage multinational compensation, analyze multi-currency payroll, track promotional salary revisions with immutable audit logs, and query organizational pay data via a grounded AI conversational assistant.

---

## 📑 Table of Contents (अनुक्रमणिका)
1. [Tech Stack (हमने क्या-क्या Use किया है)](#1-tech-stack-हमने-क्या-क्या-use-किया-है)
2. [Key Features (क्या-क्या Features हम दे रहे हैं)](#2-key-features-क्या-क्या-features-हम-दे-रहे-हैं)
3. [AI Free Trial & Gemini Setup (AI का Free Trial कैसे लें)](#3-ai-free-trial--gemini-setup-ai-का-free-trial-कैसे-लें)
4. [Environment Variables (`.env` Files का Example)](#4-environment-variables-env-files-का-example)
5. [Project Setup Guide (प्रोजेक्ट कैसे Setup करें)](#5-project-setup-guide-प्रोजेक्ट-कैसे-setup-करें)
6. [How to Run the Project (प्रोजेक्ट कैसे Run करेंगे)](#6-how-to-run-the-project-प्रोजेक्ट-कैसे-run-करेंगे)
7. [Modular Folder Structure (Clean Code Architecture)](#7-modular-folder-structure-clean-code-architecture)
8. [Automated Test Suite (Tests कैसे Run करें)](#8-automated-test-suite-tests-कैसे-run-करें)
9. [API Documentation (Swagger OpenAPI)](#9-api-documentation-swagger-openapi)
10. [Demo Login Credentials](#10-demo-login-credentials)

---

## 1. Tech Stack (हमने क्या-क्या Use किया है)

### Frontend (User Interface)
* **Framework:** **Next.js 16** (App Router architecture with React Server & Client components).
* **Library:** **React 19** with strict TypeScript typing.
* **Styling:** **Vanilla Tailwind CSS v4** with custom design tokens, modern glassmorphism, responsive grid layouts, and accessible high-contrast text.
* **Charts & Visualizations:** **Recharts** for real-time compensation bars and salary tier distributions.
* **Icons:** **Lucide-React** for unified modern icons.
* **HTTP Client:** **Axios** with JWT bearer interceptors and automatic 401 redirect handling.

### Backend (Server & API)
* **Framework:** **NestJS 10** (Enterprise Modular Monolith).
* **Language:** **TypeScript** with strict compiler checks.
* **Database ORM:** **Prisma ORM v5** for type-safe schema definitions, relationships, and raw SQL aggregations.
* **Database Engine:** **SQLite** with B-Tree indexes on foreign keys, employee status, and compensation fields for portability and fast sub-20ms queries.
* **Authentication:** **Passport JWT** + **Bcrypt** (password hashing with 10 salt rounds) + Role-based access control (`@Roles('HR_ADMIN', 'HR_MANAGER')`).
* **Validation:** Centralized `ValidationPipe` with `class-validator` and `class-transformer`.
* **API Documentation:** **Swagger OpenAPI 3.0** with interactive Swagger UI.

### AI Engine (Salary Analytics Assistant)
* **Model:** **Google Gemini 2.5 Flash** via official `@google/genai` SDK.
* **Architecture:** **5-Tier Intelligent Fallback Engine**:
  1. *Tier 1:* Conversational greetings (0 API quota used).
  2. *Tier 2:* Operational lookups (latest employees / recent hires queried directly).
  3. *Tier 3:* Known database analytics questions (pure SQL aggregations).
  4. *Tier 4:* Gemini structured intent classification (extracts parameters into JSON; backend validates and executes SQL).
  5. *Tier 5:* Automatic HTTP 429 quota exhaustion & timeout fallback (presents verified numbers without failing).

### Testing & Tooling
* **Unit & E2E Testing:** **Jest** + **Supertest** with 26 automated tests (100% pass rate).
* **Package Manager:** **npm**.

---

## 2. Key Features (क्या-क्या Features हम दे रहे हैं)

1. **10,000+ Employee Management:**
   * Server-side paginated data table (25, 50, 100 per page) that never loads all 10k rows into browser memory.
   * Multi-attribute debounced search by name, work email, and employee code (`ACM-XXXXX`).
   * Multi-dimensional filtering by Department, Country, and Employment Status (`ACTIVE`, `ON_LEAVE`, `INACTIVE`).
   * Column sorting by Code, Name, Department, Country, and Salary.
   * Add new employee profile with initial compensation modal.
   * Soft employee deactivation and status transitions.

2. **Multi-Currency Salary Management:**
   * Support for 6 global currencies: **USD ($)**, **EUR (€)**, **GBP (£)**, **INR (₹)**, **CAD ($)**, and **SGD ($)**.
   * Real-time executive currency switcher in the top navigation with institutional reference rates.
   * Separate storage of Base Salary, Variable Performance Bonus, and Normalized USD values.

3. **Non-Destructive Salary History & Timeline:**
   * Chronological compensation history where past records are **never destroyed or overwritten**.
   * Previous active records are gracefully closed (`isCurrent: false` with `endDate` stamped) and new records are inserted in an atomic database transaction (`prisma.$transaction`).
   * Progression percentages and promotion reasons displayed clearly.

4. **Immutable Salary Audit Trail:**
   * Every compensation update automatically records who made the change (`changedById`), timestamp, old base/bonus, new base/bonus, currency, change reason (Promotion, Merit, Market Adjustment), and justification notes.

5. **Executive Analytics Dashboard:**
   * Live SQL aggregates: Active Headcount, Total Annual Base Payroll, Variable Bonus Payroll, Average Base Salary, Median Pay, and Minimum/Maximum Salary Range.
   * Departmental compensation comparison horizontal bar charts.
   * Salary tier distribution histogram (`<$50k`, `$50k-$80k`, `$80k-$120k`, `$120k-$160k`, `>$160k`).
   * Multinational jurisdiction breakdown table.

6. **Conversational AI Salary Assistant:**
   * **Dedicated View (`/ai-assistant`):** Interactive chat UI with suggested prompt chips and structured response cards.
   * **Floating Widget (`FloatingAiChatbot.tsx`):** Available on every single screen via a convenient bottom-right trigger.
   * Answers questions like:
     * *"What is the average salary in India?"*
     * *"Which department has the highest average salary?"*
     * *"How many engineers earn more than 100,000 USD?"*
     * *"Who is the latest employee?"*
     * *"Show salary distribution across the organization."*
   * **Zero SQL Injection Risk:** The AI is never permitted to execute arbitrary raw SQL.

---

## 3. AI Free Trial & Gemini Setup (AI का Free Trial कैसे लें)

Google Gemini provides a **100% Free Tier** for developers with no credit card required.

### Free API Key प्राप्त करने के Steps:
1. Go to **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
2. अपने Google Account (Gmail) से Sign in करें.
3. Click on **"Get API key"** -> **"Create API key in new project"**.
4. अपनी API key को Copy करें.
5. `backend/.env` file खोलें और key paste करें:
   ```env
   GEMINI_API_KEY="AIzaSyYourCopiedKeyHere..."
   GEMINI_MODEL="gemini-2.5-flash"
   ```

> [!NOTE]
> **Built-in Fallback Engine:**
> अगर आपके पास Gemini API key **नहीं है**, या Google API quota limit reach हो जाती है (HTTP 429), तो भी हमारा System crash नहीं होगा! Backend का **Deterministic SQL Query Engine** automatically active रहेगा और database से real verified figures निकाल कर answer देगा!

---

## 4. Environment Variables (`.env` Files का Example)

### Backend Environment: [`backend/.env.example`](file:///home/developer/Tasks/Hr-managamnet/backend/.env.example)
```env
# 1. Server Configuration
PORT=4000
WEB_ORIGIN="http://localhost:3000"

# 2. Database Connection (SQLite via Prisma)
DATABASE_URL="file:./dev.db"

# 3. JWT Authentication Secret
JWT_SECRET="acme-salary-super-secret-jwt-key-2026-production"

# 4. Google Gemini AI Key (Free Tier Supported)
GEMINI_API_KEY=""
GEMINI_MODEL="gemini-2.5-flash"
```

### Frontend Environment: [`frontend/.env.example`](file:///home/developer/Tasks/Hr-managamnet/frontend/.env.example)
```env
# Point to the running NestJS backend instance
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## 5. Project Setup Guide (प्रोजेक्ट कैसे Setup करें)

### Prerequisites (आवश्यक चीजें)
* **Node.js**: v18.0.0 or newer (v20+ recommended)
* **npm**: v9.0.0 or newer
* **Git**

### Step 1: Clone & Navigate
```bash
git clone <repository-url>
cd Hr-managamnet
```

### Step 2: Environment Setup
Environment files copy करें:
```bash
# Backend env file
cp backend/.env.example backend/.env

# Frontend env file
cp frontend/.env.example frontend/.env.local
```

### Step 3: Install Dependencies
```bash
# Backend dependencies
cd backend && npm install

# Frontend dependencies
cd ../frontend && npm install
cd ..
```

### Step 4: Run Prisma Database Migrations & 10,000 Employee Seed
```bash
cd backend
npx prisma db push
npm run prisma:seed
cd ..
```
*Seeding script creates **10,000 employees**, 11,800+ salary records, 8 departments, 6 countries, and the demo HR manager account.*

---

## 6. How to Run the Project (प्रोजेक्ट कैसे Run करेंगे)

### Option A: Development Mode (Hot-Reload)

**Terminal 1 (Backend):**
```bash
cd backend
npm run start:dev
```
*Backend runs on `http://localhost:4000` with Swagger docs at `http://localhost:4000/api/docs`.*

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

### Option B: Production Mode (Optimized Build)

**Terminal 1 (Backend Production):**
```bash
cd backend
npm run build
npm run start:prod
```

**Terminal 2 (Frontend Production):**
```bash
cd frontend
npm run build
npm run start
```
*Next.js production server starts on `http://localhost:3000`.*

---

## 7. Modular Folder Structure (Clean Code Architecture)

To ensure high maintainability, code is broken down into small, single-responsibility components and modules rather than large monolithic files:

```text
Hr-managamnet/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Relational schema (Users, Employees, Salaries, Audits)
│   │   └── seed.ts                    # 10,000 employee seed generator
│   ├── src/
│   │   ├── ai-assistant/              # Modular AI Engine
│   │   │   ├── ai-assistant.controller.ts
│   │   │   ├── ai-assistant.service.ts    # Lean 5-tier coordinator (<130 lines)
│   │   │   ├── ai-assistant.types.ts      # Interfaces and DTOs
│   │   │   ├── ai-gemini-client.ts        # Gemini API client & SQL safety validator
│   │   │   └── ai-query-engine.ts         # Deterministic heuristic query routing
│   │   ├── analytics/                 # SQL-level aggregate reporting
│   │   ├── employees/                 # Employee directory controller & service
│   │   ├── salary/                    # Atomic salary transactions & audit logging
│   │   ├── auth/                      # Passport JWT, Bcrypt, guards
│   │   ├── common/                    # AllExceptionsFilter & global pipes
│   │   └── main.ts                    # Bootstrap with Swagger & BigInt polyfill
│   ├── test/                          # End-to-end integration test suite
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Lean Dashboard Page (150 lines)
│   │   │   ├── employees/
│   │   │   │   ├── page.tsx           # Lean Directory Page (200 lines)
│   │   │   │   └── [id]/page.tsx      # Lean Profile Page (220 lines)
│   │   │   ├── analytics/page.tsx     # Analytics Benchmarks Page
│   │   │   ├── ai-assistant/page.tsx  # Dedicated AI Assistant Page
│   │   │   └── login/page.tsx         # HR Manager Login Page
│   │   ├── components/
│   │   │   ├── ai/
│   │   │   │   └── FloatingAiChatbot.tsx  # Floating corner assistant widget
│   │   │   ├── dashboard/
│   │   │   │   ├── DashboardStats.tsx     # 4 Executive KPI cards
│   │   │   │   ├── DashboardCharts.tsx    # Recharts bar graphs
│   │   │   │   └── CountryBenchmarkTable.tsx # Multinational jurisdiction table
│   │   │   ├── employees/
│   │   │   │   ├── EmployeeFilters.tsx    # Search, filters, page-size selector
│   │   │   │   ├── EmployeeTable.tsx      # Data table with sorting & badges
│   │   │   │   ├── EmployeePagination.tsx # Pagination bar with jump-to
│   │   │   │   └── CreateEmployeeModal.tsx # Add employee modal dialog
│   │   │   ├── salary/
│   │   │   │   ├── SalaryHistoryTimeline.tsx # Compensation timeline cards
│   │   │   │   ├── SalaryAuditTrail.tsx      # Immutable audit feed
│   │   │   │   └── SalaryUpdateModal.tsx     # Salary revision dialog
│   │   │   └── layout/
│   │   │       ├── Sidebar.tsx            # Left navigation bar
│   │   │       └── TopNav.tsx             # Top header with Currency dropdown
│   │   └── lib/
│   │       ├── api.ts                     # Axios client & currency formatters
│   │       ├── auth-context.tsx           # Authentication provider
│   │       └── currency-context.tsx       # Real-time currency conversion provider
│   ├── .env.example
│   └── package.json
│
└── docs/
    ├── requirements.md                # 1-page PRD
    ├── architecture.md                # Mermaid diagrams & system architecture
    ├── api-design.md                  # REST endpoint contracts
    ├── ai-prompts.md                  # LLM prompts & intent schemas
    ├── tradeoffs.md                   # Architectural tradeoffs (Monolith vs Microservices, etc.)
    ├── performance.md                 # 10,000 employee benchmark latencies
    └── security.md                    # Security & auditability model
```

---

## 8. Automated Test Suite (Tests कैसे Run करें)

Both unit tests and end-to-end integration tests are included and run fast without flakiness:

```bash
# 1. Backend Unit Tests (4 Test Suites, 12 Tests)
cd backend && npm test

# 2. Backend E2E Integration Tests (14 Tests)
cd backend && npm run test:e2e

# 3. Production Compilation Verification
cd backend && npm run build
cd ../frontend && npm run build
```

**Test Execution Results:**
```text
PASS src/salary/salary.service.spec.ts
PASS src/employees/employees.service.spec.ts
PASS src/auth/auth.service.spec.ts
PASS src/ai-assistant/ai-assistant.service.spec.ts
Test Suites: 4 passed, 4 total
Tests:       12 passed, 12 total

PASS test/app.e2e-spec.ts
  ✓ Authentication (/auth/login, /auth/me)
  ✓ Employees (/employees pagination & search)
  ✓ Analytics (/analytics overview, countries, depts, distribution)
  ✓ AI Assistant (/ai/ask security & verified calculations)
Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
```

---

## 9. API Documentation (Swagger OpenAPI)

Once the backend is running, open the interactive Swagger OpenAPI specification in your browser:
* **Swagger URL:** [`http://localhost:4000/api/docs`](http://localhost:4000/api/docs)

All endpoints, DTO schemas, and JWT Bearer authorization are fully documented.

---

## 10. Demo Login Credentials

Use the pre-seeded demo HR credentials to log in:

| Field | Value |
| :--- | :--- |
| **Login URL** | [`http://localhost:3000/login`](http://localhost:3000/login) |
| **Role** | Global Compensation & HR Manager |
| **Email** | `hr.manager@acme.corp` |
| **Password** | `AcmeHR2026!Secure` |

*(A quick **"Autofill Demo Credentials"** button is also available on the login page for instant access).*
