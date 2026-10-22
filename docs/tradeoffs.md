# Engineering Tradeoffs & Architectural Decisions

## 1. Modular Monolith vs. Microservices
* **Decision:** Built a clean modular monolith using NestJS modules (`auth`, `employees`, `salary`, `analytics`, `ai-assistant`).
* **Tradeoff:** Microservices introduce distributed transaction coordination, latency overhead, and deployment complexity. For an organization of 10,000 employees and internal HR tooling, a modular monolith provides single-process performance, atomic ACID transactions via Prisma `$transaction`, and simple continuous deployment while keeping clear domain boundaries.

---

## 2. SQLite vs. PostgreSQL
* **Decision:** Used SQLite for local evaluation and portability, while structuring the schema and Prisma queries for seamless PostgreSQL migration.
* **Tradeoff:** SQLite lacks high concurrent write throughput and row-level locking. However, for assessment reproducibility and zero external database infrastructure dependencies, SQLite runs instantaneously. Read-heavy analytics and paginated queries run in sub-millisecond times with indexed fields. In production, changing `provider = "postgresql"` in `schema.prisma` enables enterprise concurrency.

---

## 3. Strict Schema Intent Routing vs. Direct Text-to-SQL
* **Decision:** Gemini is strictly confined to intent classification (`OVERVIEW`, `COUNTRY_AVERAGE`, `DEPARTMENT_AVERAGE`, `SALARY_DISTRIBUTION`, `THRESHOLD_COUNT`) and explanation formatting. Database queries are executed through parameterized NestJS analytics services.
* **Tradeoff:** Text-to-SQL allows unbounded queries, but introduces severe risks: prompt injection, arbitrary SQL execution (`DROP TABLE`, `UPDATE`), leaking unredacted employee data, and unpredictable syntax errors. Strict intent grounding guarantees 100% SQL safety and deterministic numerical answers.

---

## 4. Multi-Currency Normalization Approach
* **Decision:** Normalized all reporting salaries to USD using documented reference rates stored in the database (`Country.exchangeRate`) and stored `normalizedUSD` directly on salary records.
* **Tradeoff:** Storing normalized amounts requires updating records if historical exchange rates fluctuate. However, for compensation planning and rapid dashboard aggregations across 10,000 rows, pre-computed normalized values enable instant `SUM(normalizedUSD)` and `AVG(normalizedUSD)` without runtime table joins and division overhead.

---

## 5. Structured SQL Aggregations vs. Vector DB / RAG
* **Decision:** Did not use vector databases or embeddings.
* **Tradeoff:** RAG is optimal for unstructured policy documents (e.g., employee handbooks). Salary records are structured relational tables; relational SQL queries calculate exact averages, counts, and sums that embeddings cannot reliably perform.
