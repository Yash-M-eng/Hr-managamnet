# System Architecture: ACME Salary Management System

## 1. System Overview
The ACME Salary Management System is designed as a high-performance **modular monolith** supporting 10,000 employees distributed across 6 countries and 8 departments. The system provides atomic salary tracking, historical compensation audits, SQL-level aggregate reporting, and an AI conversational salary assistant with strict database query grounding.

```mermaid
graph TD
    User([HR Manager Browser]) -->|HTTPS / Next.js 16 UI| Frontend[Next.js App Router Client]
    Frontend -->|JWT Bearer REST Calls| Backend[NestJS Application Server]
    
    subgraph "NestJS Modular Monolith"
        AuthMod[Auth Module / Passport JWT]
        EmpMod[Employees Module]
        SalMod[Salary & Audit Module]
        AnMod[Analytics Aggregation Module]
        AiMod[AI Assistant Module]
    end

    Backend --> AuthMod
    Backend --> EmpMod
    Backend --> SalMod
    Backend --> AnMod
    Backend --> AiMod

    AiMod -->|Intent Schema / Grounding| GeminiAPI([Google Gemini 3.8 Flash])
    AiMod -->|Structured Parametric Queries| AnMod

    subgraph "Persistence Layer"
        PrismaORM[Prisma ORM Client]
        SQLiteDB[(SQLite Database / 10,000 Employees)]
    end

    EmpMod --> PrismaORM
    SalMod --> PrismaORM
    AnMod --> PrismaORM
    PrismaORM --> SQLiteDB
```

---

## 2. Component Responsibilities

### Next.js Frontend (`frontend/`)
* **State & Authentication:** `AuthProvider` with token storage and automatic HTTP 401 interceptors.
* **Dashboard View:** Executive KPI summary cards (headcount, base payroll, average, median, range) and Recharts distribution graphs.
* **Employee Management:** Server-side paginated data table (25 per page), multi-attribute debounce search, filters (department, country, status), and new profile modal.
* **Employee Compensation Timeline:** Historical salary cards, atomic salary revision modal with effective dates and justification, and immutable change audit log.
* **Analytics Explorer:** Country and departmental salary spreads with visual charts.
* **AI Query Assistant:** Natural language query chat with parsed intent badges and expandable SQL JSON fact inspectors.

### NestJS Backend (`backend/`)
* **`AuthModule`:** User password authentication using bcrypt, JWT token signing, and Passport bearer strategy.
* **`EmployeesModule`:** Paginated, filtered, and sorted employee querying over indexed database columns.
* **`SalaryModule`:** Atomic `$transaction` updates closing existing salary records (`isCurrent = false`), creating new active salary records, and appending immutable `SalaryChangeAudit` entries.
* **`AnalyticsModule`:** Real-time SQL aggregations (`COUNT`, `AVG`, `SUM`, `MIN`, `MAX`) computing departmental benchmarks, country pay averages, and salary tier distributions with fixed reporting exchange rates.
* **`AiAssistantModule`:** Safe natural language understanding interface invoking Google Gemini 3.8 Flash with structured JSON schemas and fallbacks to deterministic heuristics. Strictly executes validated SQL services (zero arbitrary SQL execution).

---

## 3. Data Model & Entity Relationships

```mermaid
erDiagram
    USERS ||--o{ SALARY_CHANGE_AUDITS : "records"
    COUNTRIES ||--o{ EMPLOYEES : "located in"
    DEPARTMENTS ||--o{ EMPLOYEES : "belongs to"
    EMPLOYEES ||--o{ SALARY_RECORDS : "receives"
    EMPLOYEES ||--o{ SALARY_CHANGE_AUDITS : "has history"

    USERS {
        string id PK
        string email UK
        string passwordHash
        string name
        string role
    }

    COUNTRIES {
        string id PK
        string code UK
        string name UK
        string currency
        float exchangeRate
    }

    DEPARTMENTS {
        string id PK
        string code UK
        string name UK
    }

    EMPLOYEES {
        string id PK
        string employeeCode UK
        string firstName
        string lastName
        string email UK
        string jobTitle
        string status
        string departmentId FK
        string countryId FK
        datetime hireDate
    }

    SALARY_RECORDS {
        string id PK
        string employeeId FK
        float baseSalary
        float variableBonus
        string currency
        float normalizedUSD
        float totalNormalizedUSD
        datetime effectiveFrom
        datetime effectiveTo
        boolean isCurrent
        string changeReason
    }

    SALARY_CHANGE_AUDITS {
        string id PK
        string employeeId FK
        string changedById FK
        float previousBaseSalary
        float newBaseSalary
        float previousBonus
        float newBonus
        string currency
        string changeReason
        string notes
        datetime changedAt
    }
```

---

## 4. AI Query Safety & Grounding Flow

```mermaid
sequenceDiagram
    autonumber
    actor HR as HR Manager
    participant UI as Next.js Assistant Page
    participant AI as AiAssistantService (NestJS)
    participant Gemini as Google Gemini 3.8 Flash
    participant Analytics as AnalyticsService (SQL)
    participant DB as SQLite DB

    HR->>UI: Types: "What is the average salary in India?"
    UI->>AI: POST /ai/ask { question }
    AI->>Gemini: Intent classification prompt with JSON Schema
    Gemini-->>AI: {"intent": "COUNTRY_AVERAGE", "countryCode": "IND"}
    AI->>AI: Validate intent against approved allowlist
    AI->>Analytics: getByCountry()
    Analytics->>DB: Parameterized SQL Aggregation
    DB-->>Analytics: Return computed average, headcount, min/max
    Analytics-->>AI: Ground truth JSON facts
    AI->>Gemini: Prompt with user question + JSON facts (Strict grounding)
    Gemini-->>AI: "In India (IND), the average annual base salary is $82,450 USD..."
    AI-->>UI: Return answer, intent badge, and ground truth facts
    UI-->>HR: Displays grounded answer with database inspection drawer
```
