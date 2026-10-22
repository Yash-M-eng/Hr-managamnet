# ACME Global Salary Management & AI Analytics System

A production-grade, full-stack Salary Management System designed for **10,000+ employees** across 6 countries and 8 departments. Built specifically for the **HR Manager** to manage multinational compensation, analyze multi-currency payroll, track promotional salary revisions with immutable audit logs, and query organizational pay data via a grounded AI conversational assistant.

---

## 1. Quick Project Setup

Follow these steps to set up the project on your machine from scratch.

### Prerequisites
* **Node.js**: `v18.0.0` or newer (`v20+` recommended)
* **npm**: `v9.0.0` or newer
* **Git**

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd Hr-managamnet
```

### Step 2: Install Dependencies
Install dependencies for both backend and frontend applications:
```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
cd ..
```

### Step 3: Configure Environment Variables
Copy the provided `.env.example` files to create active configuration files:
```bash
# Setup backend environment file
cp backend/.env.example backend/.env

# Setup frontend environment file
cp frontend/.env.example frontend/.env.local
```

### Step 4: Run Database Migrations & 10,000 Employee Seed
Initialize the SQLite relational database and generate the deterministic dataset:
```bash
cd backend
npx prisma db push
npm run prisma:seed
cd ..
```
*The seeding script populates **10,000 employees**, 11,800+ multi-currency salary records, 8 organizational departments, 6 countries, historical promotions, and the demo HR manager account.*

---

## 2. How to Run the Project

You can run the full-stack system in either Development Mode (hot-reload enabled) or Production Mode (optimized compilation).

### Option A: Development Mode

Open two terminal windows:

**Terminal 1 (NestJS Backend — Port 4000):**
```bash
cd backend
npm run start:dev
```
*Backend API starts on `http://localhost:4000` with interactive Swagger docs at `http://localhost:4000/api/docs`.*

**Terminal 2 (Next.js Frontend — Port 3000):**
```bash
cd frontend
npm run dev
```
*Frontend application opens on `http://localhost:3000`.*

---

### Option B: Production Mode

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
*Optimized Next.js production server starts on `http://localhost:3000`.*

---

## 3. Demo Login Credentials

Use the pre-seeded HR Manager credentials to access the application:

| Credential | Value |
| :--- | :--- |
| **Login URL** | [`http://localhost:3000/login`](http://localhost:3000/login) |
| **Role** | Global Compensation & HR Operations Manager |
| **Email** | `hr.manager@acme.corp` |
| **Password** | `AcmeHR2026!Secure` |

> **Tip:** An **"Autofill Demo Credentials"** button is provided directly on the login screen for instant, single-click access.

---

## 4. Key Features & Capabilities

1. **10,000+ Employee Lifecycle Management:**
   * High-performance, server-side paginated data table (25, 50, 100 profiles per page) that never exhausts browser memory.
   * Debounced multi-attribute search across employee name, work email, and employee code (`ACM-XXXXX`).
   * Multi-dimensional filtering by Department, Country, and Employment Status (`ACTIVE`, `ON_LEAVE`, `INACTIVE`).
   * Interactive column sorting by Code, Name, Department, Country, and Salary.
   * Create new employee profile with initial compensation package.
   * Soft employee deactivation and status transitions.

2. **Multi-Currency Compensation Engine:**
   * Support for 6 global currencies: **USD ($)**, **EUR (€)**, **GBP (£)**, **INR (₹)**, **CAD ($)**, and **SGD ($)**.
   * Real-time executive currency switcher in the top navigation bar.
   * Separate tracking of Base Salary, Variable Performance Bonus, and Normalized USD values based on documented institutional reference rates.

3. **Non-Destructive Salary History & Timeline:**
   * Chronological compensation history where past records are **never deleted or overwritten**.
   * Previous active records are safely expired (`isCurrent: false` with `endDate` stamped) and new records are inserted inside an atomic database transaction (`prisma.$transaction`).
   * Visual percentage progression and promotion reasons displayed clearly.

4. **Immutable Salary Audit Trail:**
   * Every compensation update automatically records who made the change (`changedById`), timestamp, previous base/bonus, new base/bonus, currency, change reason (Promotion, Merit, Market Adjustment), and justification notes.

5. **Executive Analytics Dashboard:**
   * Live SQL aggregates: Active Headcount, Total Annual Base Payroll, Variable Bonus Payroll, Average Base Salary, Median Pay, and Minimum/Maximum Salary Range.
   * Departmental compensation comparison horizontal bar charts.
   * Salary tier distribution histogram (`<$50k`, `$50k-$80k`, `$80k-$120k`, `$120k-$160k`, `>$160k`).
   * Multinational jurisdiction breakdown table.

6. **Dual AI Salary Assistant:**
   * **Dedicated View (`/ai-assistant`):** Interactive chat UI with suggested prompt chips and structured response cards.
   * **Floating Widget (`FloatingAiChatbot.tsx`):** Available on every single screen via a convenient bottom-right trigger.
   * Answers questions such as:
     * *"What is the average salary in India?"*
     * *"Which department has the highest average salary?"*
     * *"How many engineers earn more than 100,000 USD?"*
     * *"Who is the latest employee?"*
     * *"Show salary distribution across the organization."*
   * **Zero SQL Injection Risk:** The AI is never permitted to execute arbitrary raw SQL.

---

## 5. AI Free Tier & Gemini Configuration

Google Gemini provides a **100% Free Tier** for developers with no credit card required.

### How to Get a Free Gemini API Key:
1. Navigate to **Google AI Studio**: [https://aistudio.google.com/](https://aistudio.google.com/)
2. Sign in with your Google account.
3. Click on **"Get API key"** -> **"Create API key in new project"**.
4. Copy your API key.
5. Open `backend/.env` and paste your key:
   ```env
   GEMINI_API_KEY="AIzaSyYourCopiedKeyHere..."
   GEMINI_MODEL="gemini-2.5-flash"
   ```

### Built-in Offline Fallback Guarantee:
Even if you **do not provide an API key**, or if Google's daily quota limit is reached (HTTP 429), the chatbot **will not break or hang**. The backend's **Deterministic SQL Query Engine** automatically intercepts queries and computes real, verified figures directly from the SQLite database.

---

## 6. Environment Variables (`.env` Configuration)

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

## 7. Modular Project Structure

To maintain clean code standards and high testability, the codebase is partitioned into focused, single-responsibility components:

```text
Hr-managamnet/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma              # Relational schema (Users, Employees, Salaries, Audits)
│   │   └── seed.ts                    # 10,000 employee seed generator
│   ├── src/
│   │   ├── ai-assistant/              # Modular AI Query Engine
│   │   │   ├── ai-assistant.controller.ts
│   │   │   ├── ai-assistant.service.ts    # Lean 5-tier coordinator (<130 lines)
│   │   │   ├── ai-assistant.types.ts      # Shared interfaces and DTOs
│   │   │   ├── ai-gemini-client.ts        # Gemini API client & SQL safety validator
│   │   │   └── ai-query-engine.ts         # Deterministic heuristic query routing
│   │   ├── analytics/                 # SQL-level aggregate reporting services
│   │   ├── employees/                 # Employee directory controller & service
│   │   ├── salary/                    # Atomic salary transactions & audit logging
│   │   ├── auth/                      # Passport JWT, Bcrypt, and RolesGuard
│   │   ├── common/                    # AllExceptionsFilter & global validation pipes
│   │   └── main.ts                    # Bootstrap with Swagger & BigInt polyfill
│   ├── test/                          # End-to-end integration test suite
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx               # Lean Dashboard Page (~150 lines)
│   │   │   ├── employees/
│   │   │   │   ├── page.tsx           # Lean Directory Page (~250 lines)
│   │   │   │   └── [id]/page.tsx      # Lean Profile & History Page (~250 lines)
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

## 8. API Documentation (Swagger OpenAPI)

The backend provides full Swagger OpenAPI documentation. When the backend server is running, navigate to:

* **Swagger UI URL:** [`http://localhost:4000/api/docs`](http://localhost:4000/api/docs)

### Primary API Endpoints:
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | HR login with credentials, returns JWT |
| `GET` | `/auth/me` | Returns authenticated user profile |
| `GET` | `/employees` | Paginated search, filter, and sort over 10,000 employees |
| `GET` | `/employees/:id` | Returns employee profile with complete salary history |
| `POST` | `/employees` | Creates new employee record with initial compensation |
| `PATCH` | `/employees/:id/status` | Toggles status between `ACTIVE`, `ON_LEAVE`, and `INACTIVE` |
| `POST` | `/employees/:id/salaries` | Atomically adds new salary record and logs audit entry |
| `GET` | `/analytics/overview` | SQL aggregations for headcount, total payroll, and averages |
| `GET` | `/analytics/countries` | Country compensation benchmarks |
| `GET` | `/analytics/departments` | Department compensation benchmarks |
| `GET` | `/analytics/distribution` | Headcount per salary compensation tier |
| `POST` | `/ai/ask` | Natural language question processor with SQL grounding |

---

## 9. Automated Testing & Verification

Both unit test suites and end-to-end integration test suites run deterministically without external network flakiness:

```bash
# 1. Run Backend Unit Tests (4 Test Suites, 12 Tests)
cd backend && npm test

# 2. Run Backend End-to-End Tests (14 Integration Tests)
cd backend && npm run test:e2e

# 3. Verify Production Builds
cd backend && npm run build
cd ../frontend && npm run build
```

### Verified Test Results:
```text
PASS src/salary/salary.service.spec.ts
PASS src/employees/employees.service.spec.ts
PASS src/auth/auth.service.spec.ts
PASS src/ai-assistant/ai-assistant.service.spec.ts
Test Suites: 4 passed, 4 total
Tests:       12 passed, 12 total

PASS test/app.e2e-spec.ts
  ACME Salary Management E2E Integration Suite
    Authentication (/auth)
      ✓ POST /auth/login - should reject invalid credentials with 401
      ✓ POST /auth/login - should authenticate valid demo HR manager
      ✓ GET /auth/me - should return authenticated user profile
      ✓ GET /auth/me - should reject unauthenticated request with 401
    Employee Management (/employees)
      ✓ GET /employees - should reject without authorization token
      ✓ GET /employees - should return paginated list of employees
      ✓ GET /employees - should support search by employee code or name
    Analytics Intelligence (/analytics)
      ✓ GET /analytics/overview - should return calculated organization totals
      ✓ GET /analytics/countries - should return country-level benchmarks
      ✓ GET /analytics/departments - should return department-level benchmarks
      ✓ GET /analytics/distribution - should return salary compensation brackets
    AI Salary Assistant (/ai/ask)
      ✓ POST /ai/ask - should require authentication
      ✓ POST /ai/ask - should answer analytical questions accurately
      ✓ POST /ai/ask - should safely decline out-of-scope non-HR queries
Test Suites: 1 passed, 1 total
Tests:       14 passed, 14 total
```

---

## 10. Tech Stack Overview

* **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Vanilla Tailwind CSS v4, Lucide-React Icons, Recharts, Axios.
* **Backend:** NestJS 10 (Enterprise Modular Monolith), TypeScript, Prisma ORM v5, Passport JWT, Bcrypt (10 salt rounds), Class-Validator, Swagger OpenAPI.
* **Database:** SQLite with B-Tree indexes on foreign keys, compensation values, and status.
* **AI Engine:** Google Gemini 2.5 Flash (`@google/genai` SDK) with 5-Tier Fallback Engine.
* **Testing:** Jest + Supertest (26 Automated Tests, 100% Pass Rate).
