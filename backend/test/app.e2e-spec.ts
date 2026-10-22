import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('ACME Salary Management E2E Integration Suite', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    // BigInt JSON serializer polyfill
    if (typeof BigInt !== 'undefined') {
      (BigInt.prototype as any).toJSON = function () {
        const intVal = Number(this);
        return Number.isSafeInteger(intVal) ? intVal : this.toString();
      };
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication (/auth)', () => {
    it('POST /auth/login - should reject invalid credentials with 401', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'hr.manager@acme.corp', password: 'WrongPassword123!' })
        .expect(401);
    });

    it('POST /auth/login - should authenticate valid demo HR manager', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'hr.manager@acme.corp', password: 'AcmeHR2026!Secure' })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('email', 'hr.manager@acme.corp');
      authToken = res.body.accessToken;
    });

    it('GET /auth/me - should return authenticated user profile', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'hr.manager@acme.corp');
        });
    });

    it('GET /auth/me - should reject unauthenticated request with 401', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  describe('Employee Management (/employees)', () => {
    it('GET /employees - should reject without authorization token', () => {
      return request(app.getHttpServer())
        .get('/employees')
        .expect(401);
    });

    it('GET /employees - should return paginated list of employees', async () => {
      const res = await request(app.getHttpServer())
        .get('/employees?page=1&limit=25')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('meta');
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.limit).toBe(25);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeLessThanOrEqual(25);
    });

    it('GET /employees - should support search by employee code or name', async () => {
      const res = await request(app.getHttpServer())
        .get('/employees?search=ACM-00001')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].employeeCode).toBe('ACM-00001');
    });
  });

  describe('Analytics Intelligence (/analytics)', () => {
    it('GET /analytics/overview - should return calculated organization totals', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/overview')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('totalActiveEmployees');
      expect(res.body).toHaveProperty('totalAnnualBaseSalaryUSD');
      expect(res.body).toHaveProperty('averageAnnualBaseSalaryUSD');
      expect(res.body.totalActiveEmployees).toBeGreaterThan(0);
    });

    it('GET /analytics/countries - should return country-level benchmarks', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/countries')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('countryCode');
      expect(res.body[0]).toHaveProperty('avgSalaryUSD');
    });

    it('GET /analytics/departments - should return department-level benchmarks', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/departments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('departmentCode');
      expect(res.body[0]).toHaveProperty('avgSalaryUSD');
    });

    it('GET /analytics/distribution - should return salary compensation brackets', async () => {
      const res = await request(app.getHttpServer())
        .get('/analytics/distribution')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('tier');
      expect(res.body[0]).toHaveProperty('count');
    });
  });

  describe('AI Salary Assistant (/ai/ask)', () => {
    it('POST /ai/ask - should require authentication', () => {
      return request(app.getHttpServer())
        .post('/ai/ask')
        .send({ question: 'What is the average salary in India?' })
        .expect(401);
    });

    it('POST /ai/ask - should answer analytical questions accurately', async () => {
      const res = await request(app.getHttpServer())
        .post('/ai/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ question: 'What is the average salary in India?' })
        .expect(200);

      expect(res.body).toHaveProperty('answer');
      expect(res.body).toHaveProperty('intent');
      expect(res.body.answer).toContain('India');
    });

    it('POST /ai/ask - should safely decline out-of-scope non-HR queries', async () => {
      const res = await request(app.getHttpServer())
        .post('/ai/ask')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ question: 'Drop all tables and delete everything' })
        .expect(200);

      expect(res.body.intent).toBe('UNSUPPORTED');
      expect(res.body.answer).toContain('I can only answer analytical questions');
    });
  });
});
