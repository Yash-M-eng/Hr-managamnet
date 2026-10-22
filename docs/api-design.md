# API Design: ACME Salary Management System

## 1. Overview
The backend exposes RESTful endpoints with consistent JSON payloads, HTTP status codes, centralized error formatting, and Swagger OpenAPI specification available at `/api/docs`.

---

## 2. Authentication Endpoints

### `POST /auth/login`
Authenticates HR credentials and returns JWT bearer token.
* **Request:**
```json
{
  "email": "hr.manager@acme.corp",
  "password": "AcmeHR2026!Secure"
}
```
* **Response (200 OK):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
  "user": {
    "id": "user-uuid",
    "email": "hr.manager@acme.corp",
    "name": "Alice Montgomery (HR Lead)",
    "role": "HR_MANAGER"
  }
}
```

### `GET /auth/me`
* **Headers:** `Authorization: Bearer <token>`
* **Response (200 OK):** Current HR profile.

---

## 3. Employee Management Endpoints

### `GET /employees`
Paginated search and filter across 10,000 employees.
* **Query Parameters:**
  * `page` (number, default: 1)
  * `limit` (number, default: 25, max: 100)
  * `search` (string, searches name, email, employeeCode)
  * `departmentId` (UUID)
  * `countryId` (UUID)
  * `status` (ACTIVE | INACTIVE | ON_LEAVE)
  * `sortBy` (employeeCode | firstName | createdAt)
  * `sortOrder` (asc | desc)
* **Response (200 OK):**
```json
{
  "data": [
    {
      "id": "emp-000001",
      "employeeCode": "ACM-00001",
      "fullName": "David Miller",
      "email": "david.miller.1@acme.corp",
      "jobTitle": "Senior Software Engineer",
      "status": "ACTIVE",
      "hireDate": "2021-04-12T00:00:00.000Z",
      "department": { "id": "...", "name": "Engineering" },
      "country": { "id": "...", "name": "United States", "currency": "USD" },
      "currentSalary": {
        "baseSalary": 145000,
        "variableBonus": 17000,
        "currency": "USD",
        "normalizedUSD": 145000
      }
    }
  ],
  "meta": {
    "total": 10000,
    "page": 1,
    "limit": 25,
    "totalPages": 400
  }
}
```

### `GET /employees/:id`
Retrieves employee profile, complete salary history records, and audit logs.

### `POST /employees`
Creates a new employee record. Validates unique email and employeeCode.

### `PATCH /employees/:id/status`
Soft transitions an employee status between `ACTIVE`, `INACTIVE`, and `ON_LEAVE`.

---

## 4. Salary & Compensation Endpoints

### `GET /employees/:id/salaries`
Retrieves all historical and active compensation records ordered by `effectiveFrom DESC`.

### `POST /employees/:id/salaries`
Atomically closes current active salary, inserts new active record, and appends audit log.
* **Request:**
```json
{
  "baseSalary": 155000,
  "variableBonus": 18000,
  "currency": "USD",
  "effectiveFrom": "2024-04-01T00:00:00.000Z",
  "changeReason": "PROMOTION",
  "notes": "Promoted to Staff Software Engineer"
}
```

---

## 5. Analytics Endpoints

* `GET /analytics/overview`: High-level organizational KPIs (total headcount, base payroll, average, median, min/max).
* `GET /analytics/countries`: SQL aggregated employee counts and average compensation per country.
* `GET /analytics/departments`: SQL aggregated salary metrics and distributions per department.
* `GET /analytics/distribution`: Headcount per salary tier (<$50k, $50k-$75k, $75k-$100k, $100k-$150k, $150k-$200k, $200k+).

---

## 6. AI Assistant Endpoint

### `POST /ai/ask`
* **Request:**
```json
{
  "question": "What is the average salary in India?"
}
```
* **Response (200 OK):**
```json
{
  "answer": "In India (IND), the average annual base salary is $82,450 USD (paid in INR) across 1,642 active employees.",
  "intent": "COUNTRY_AVERAGE",
  "groundedData": {
    "countryCode": "IND",
    "countryName": "India",
    "currency": "INR",
    "employeeCount": 1642,
    "avgSalaryUSD": 82450
  },
  "providerStatus": "ONLINE"
}
```
