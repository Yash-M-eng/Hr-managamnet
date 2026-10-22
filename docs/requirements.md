# Product Requirements Document (PRD): ACME Organization Salary Management System

## 1. Executive Summary & Goal
ACME is a multinational organization with **10,000 employees** distributed across multiple countries and departments. Historically, employee salary records, currency conversions, and compensation revisions were tracked using fragmented spreadsheets, leading to data drift, zero auditability, slow reporting, and high operational friction for the HR leadership.

**Goal:** Deliver a modern, centralized, high-performance web-based Salary Management System empowering the HR Manager to securely manage multinational employee records and salary revisions, analyze global compensation patterns through aggregated SQL analytics, and query real-time organizational payroll questions via an AI-powered conversational assistant.

---

## 2. Primary Persona
* **Target User:** HR Manager / Head of People Operations at ACME.
* **Core Responsibilities:**
  * Oversee multi-country compensation benchmarks and budget allocations.
  * Execute and approve employee base and variable salary updates with auditable justification.
  * Answer executive questions about organizational pay parity, department averages, and global headcount distributions.
  * Rapidly search, filter, and inspect individual compensation timelines across 10,000 staff members.

---

## 3. User Problems & Friction Points
1. **Spreadsheet Inefficiency & Scalability:** Managing 10,000 multi-country rows causes file corruption, concurrency collisions, and sluggish filtering.
2. **Multi-Currency Confusion:** Direct comparisons between USD, EUR, GBP, CAD, AUD, and INR without normalized reporting currencies lead to inaccurate payroll aggregates.
3. **Lack of Audit Trails:** Spreadsheets fail to preserve immutable logs of who changed an employee's salary, when, by how much, and why.
4. **Ad-Hoc Reporting Latency:** Executives frequently ask questions (e.g., *"What is our median engineering salary in Germany?"* or *"Who is earning above 120k USD in APAC?"*), taking hours of manual formula wrangling.

---

## 4. In-Scope Features (MVP / Phase 1)
* **Authentication & RBAC:** Secure HR Manager authentication (JWT + Bcrypt), session management, and protected REST endpoints.
* **Global HR Dashboard:** High-level KPI cards (Total Headcount, Total Annual Base & Variable Payroll in normalized USD, Organization Average/Min/Max) and dynamic distribution charts by department and country.
* **Employee Management:** Paginated data grid (25 per page default) supporting server-side sorting, debounce search (name, email, employee code), filtering by country/department/status, employee creation, profile editing, and soft-deactivation.
* **Salary Management & Audit Timeline:** Atomic salary revisions with base pay, variable bonus, currency, effective start/end dates, change reasons (Promotion, Cost-of-Living, Merit, Market Adjustment), and immutable audit history.
* **Server-Side Aggregated Analytics:** SQL-level aggregations computing departmental benchmarks, country pay averages, and salary tier distributions with transparent currency normalization (fixed reference rates for reporting).
* **Constrained AI Salary Assistant:** Natural language query interface powered by Google Gemini, operating under strict JSON schema intent classification and backend SQL execution safeguards (no arbitrary SQL execution).

---

## 5. Explicitly Excluded Features & Rationale
| Excluded Feature | Rationale for Exclusion |
| :--- | :--- |
| **Direct Banking / Payroll Execution** | System of record for compensation planning; actual disbursements belong in dedicated banking gateways / automated clearing house (ACH) rails. |
| **Localized Tax & Deductions Calculation** | Tax jurisdictions across 10+ countries involve intricate legal withholdings that require dedicated statutory compliance engines. |
| **Attendance & Leave Management** | Focus is strictly scoped to compensation analytics and salary management to keep operational domain bounded. |
| **Employee Self-Service Portal** | Current scope focuses on solving the administrative bottleneck for the HR team before opening access to all 10,000 employees. |
| **Full Performance Review Workflows** | Appraisal pipelines and 360-feedback systems introduce significant peripheral complexity outside core compensation data. |
| **Complex Multi-Tier Approval Chains** | A lean approval flow meets initial organizational needs without over-engineering workflow graph engines. |

---

## 6. Non-Functional Requirements (NFRs)
* **Performance:** Sub-200ms response time on paginated queries and dashboard KPIs over the 10,000 employee dataset via indexed fields (`countryId`, `departmentId`, `email`, `employeeCode`, `status`).
* **Data Integrity:** Database-level transactions for salary promotions and updates ensuring non-overlapping current salary records and complete audit tracking.
* **Security & Confidentiality:** Strict protection of sensitive compensation information; passwords hashed with bcrypt; role-gated backend APIs; strict CORS; LLM sanitization preventing prompt injection or SQL injection.
* **Portability & Reliability:** Standalone SQLite database with Prisma ORM for deterministic local verification, structured migrations, and seed scripts, easily portable to PostgreSQL for enterprise production.

---

## 7. Success Criteria & Key Assumptions
* **Success Criteria:**
  1. Exactly 10,000 synthetic employees deterministically seeded with realistic departmental and multi-currency salary records.
  2. HR Manager can search, filter, and modify salary records within 1-2 clicks with instant audit logging.
  3. AI Assistant correctly interprets supported organizational queries and produces fact-grounded responses validated against backend SQL.
  4. 100% automated test pass rate across critical backend services and frontend components.
* **Key Assumptions:**
  * Currencies supported include USD, EUR, GBP, CAD, AUD, INR.
  * Reporting currency is normalized to USD using documented reference rates for consistent global reporting.
