# ACME Salary Management & AI Analytics System

A production-grade, full-stack Salary Management System designed for **10,000 employees** across 6 countries and 8 departments. Built for the HR Manager to manage global compensation, analyze multi-currency payroll, track historical salary revisions with an immutable audit log, and query payroll metrics conversationally via a grounded AI assistant.

---

## 1. Tech Stack Overview

* **Frontend:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS, Lucide Icons, Recharts.
* **Backend:** NestJS (Modular Monolith), TypeScript, Prisma ORM, Passport JWT, Bcrypt, Class-Validator, Swagger OpenAPI.
* **Database:** SQLite (local evaluation/portability) with normalized schema, strategic indexing, and easy PostgreSQL migration path.
* **AI Engine:** Google Gemini (`gemini-3.8-flash`) via the official `@google/genai` SDK with strict JSON Schema intent classification, parameterized SQL query grounding, and deterministic heuristic fallback.
* **Testing:** Jest with fast, deterministic unit test coverage for authentication, employee duplicates, salary history transactions, and AI safety.

---

## 2. Project Structure

```text
Hr-managamnet/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Normalized relational schema with audit entities
│   │   ├── migrations/          # SQLite migrations
│   │   └── seed.ts              # Deterministic 10,000-employee seed script
│   ├── src/
│   │   ├── auth/                # JWT auth, bcrypt, passport strategy & guards
│   │   ├── employees/           # Paginated employee directory & CRUD
│   │   ├── salary/              # Atomic salary revisions & audit log service
│   │   ├── analytics/           # SQL-level aggregates & reporting metrics
│   │   ├── ai-assistant/        # Gemini intent classification & grounded query service
│   │   ├── departments/         # Department reference endpoints
│   │   ├── countries/           # Country reference endpoints with exchange rates
│   │   ├── common/              # Centralized exception filters & logging
│   │   └── main.ts              # NestJS entrypoint with CORS & Swagger docs
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # HR Dashboard with SQL KPIs & Recharts
│   │   │   ├── employees/       # Paginated directory with search & filters
│   │   │   │   └── [id]/        # Employee timeline & salary revision modal
│   │   │   ├── analytics/       # Country & Department analytics benchmarks
│   │   │   ├── ai-assistant/    # Conversational AI assistant with SQL fact inspection
│   │   │   └── login/           # HR login with demo credential autofill
│   │   ├── components/layout/   # Sidebar & TopNav navigation components
│   │   └── lib/                 # Axios API client & AuthContext provider
│   └── package.json
├── docs/
│   ├── requirements.md          # 1-page PRD (written prior to implementation)
│   ├── architecture.md          # System diagrams, ERD, and AI flow
│   ├── api-design.md            # REST API contracts & Swagger endpoints
│   ├── tradeoffs.md             # Architectural decisions & alternative rationale
│   ├── performance.md           # Benchmarks over 10,000 employees & indexing strategy
│   ├── security.md              # Auth, audit logging, & prompt injection defense
│   └── ai-prompts.md            # LLM prompts & instructions used
├── .env.example                 # Environment variables specification
└── package.json                 # Root script runner
```

---

## 3. Quick Start & Running Locally

### Prerequisites
* Node.js v18+ (tested on Node v22)
* npm v9+

### Step 1: Environment Setup
Copy the example environment file:
```bash
cp .env.example .env
cp .env backend/.env
cp frontend/.env.local.example frontend/.env.local  # or ensure NEXT_PUBLIC_API_URL=http://localhost:4000
```

### Step 2: Install Dependencies
```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### Step 3: Run Database Migrations & Deterministic Seed
Generate the SQLite database and seed **exactly 10,000 employees** with multi-currency salaries and historical audit logs:
```bash
cd backend
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
cd ..
```
*Output will verify: 10,000 Employees, ~11,700 Salary Records, and ~1,700 Audit Logs created.*

### Step 4: Run Backend & Frontend Servers
In terminal 1 (Backend):
```bash
cd backend
npm run start:dev
```
*Backend runs on `http://localhost:4000` with Swagger docs at `http://localhost:4000/api/docs`.*

In terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*Frontend runs on `http://localhost:3000`.*

---

## 4. Demo HR Credentials
Use the pre-seeded HR Manager credentials to log in:
* **Email:** `hr.manager@acme.corp`
* **Password:** `AcmeHR2026!Secure`
*(A quick one-click autofill button is also available directly on the login page).*

---

## 5. Running Automated Tests

Run the backend unit test suite covering authentication, duplicates, atomic salary updates, and AI query grounding:
```bash
cd backend
npm test
```
*Result: 4 test suites pass, 12 unit tests pass.*

To build both production bundles:
```bash
cd backend && npm run build
cd ../frontend && npm run build
```

---

## 6. Video Demonstration Walkthrough Plan
A full feature verification walkthrough covers:
1. **Authentication:** Secure login with demo credential autofill.
2. **HR Dashboard:** SQL KPI cards (10k headcount, $1.05B base payroll in USD, averages, medians) and Recharts.
3. **Employee Directory:** 25 per page pagination, debounce search, filters (Engineering, India, Active).
4. **Employee Profile & Salary Revisions:** Timeline view of historical compensations and atomic revision modal with audit trail.
5. **Analytics Explorer:** Department and country salary comparisons with normalized exchange rates.
6. **AI Salary Assistant:** Natural language questions (*"What is the average salary in India?"*, *"How many engineers earn more than 100,000 USD?"*) returning grounded answers and inspectable SQL facts.
