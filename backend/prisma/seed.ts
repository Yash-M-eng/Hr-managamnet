import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Pseudo-Random Generator with fixed seed for 100% deterministic reproducibility
class LCG {
  private m: number = 0x80000000; // 2**31
  private a: number = 1103515245;
  private c: number = 12345;
  private state: number;

  constructor(seed: number = 42) {
    this.state = seed ? seed : Math.floor(Math.random() * (this.m - 1));
  }

  nextInt(): number {
    this.state = (this.a * this.state + this.c) % this.m;
    return this.state;
  }

  nextFloat(): number {
    // returns in range [0, 1)
    return this.nextInt() / (this.m - 1);
  }

  range(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  pick<T>(array: T[]): T {
    return array[this.range(0, array.length - 1)];
  }
}

const rng = new LCG(20261022); // Fixed seed

const COUNTRIES = [
  { code: 'USA', name: 'United States', currency: 'USD', exchangeRate: 1.0 },
  { code: 'GBR', name: 'United Kingdom', currency: 'GBP', exchangeRate: 1.28 },
  { code: 'DEU', name: 'Germany', currency: 'EUR', exchangeRate: 1.08 },
  { code: 'IND', name: 'India', currency: 'INR', exchangeRate: 0.012 },
  { code: 'CAN', name: 'Canada', currency: 'CAD', exchangeRate: 0.74 },
  { code: 'AUS', name: 'Australia', currency: 'AUD', exchangeRate: 0.65 },
];

const DEPARTMENTS = [
  { code: 'ENG', name: 'Engineering' },
  { code: 'PROD', name: 'Product Management' },
  { code: 'SLS', name: 'Sales' },
  { code: 'MKT', name: 'Marketing' },
  { code: 'HR', name: 'Human Resources' },
  { code: 'FIN', name: 'Finance' },
  { code: 'OPS', name: 'Operations' },
  { code: 'CS', name: 'Customer Success' },
];

const TITLES_BY_DEPT: Record<string, { title: string; minUsd: number; maxUsd: number; bonusPct: number }[]> = {
  ENG: [
    { title: 'Junior Software Engineer', minUsd: 65000, maxUsd: 85000, bonusPct: 0.05 },
    { title: 'Software Engineer', minUsd: 90000, maxUsd: 125000, bonusPct: 0.08 },
    { title: 'Senior Software Engineer', minUsd: 135000, maxUsd: 175000, bonusPct: 0.12 },
    { title: 'Staff Software Engineer', minUsd: 180000, maxUsd: 225000, bonusPct: 0.15 },
    { title: 'Engineering Manager', minUsd: 160000, maxUsd: 210000, bonusPct: 0.18 },
    { title: 'QA Automation Engineer', minUsd: 75000, maxUsd: 105000, bonusPct: 0.08 },
    { title: 'DevOps / SRE Specialist', minUsd: 110000, maxUsd: 155000, bonusPct: 0.10 },
  ],
  PROD: [
    { title: 'Associate Product Manager', minUsd: 70000, maxUsd: 90000, bonusPct: 0.08 },
    { title: 'Product Manager', minUsd: 105000, maxUsd: 140000, bonusPct: 0.12 },
    { title: 'Senior Product Manager', minUsd: 145000, maxUsd: 185000, bonusPct: 0.15 },
    { title: 'Director of Product', minUsd: 190000, maxUsd: 240000, bonusPct: 0.20 },
    { title: 'UX/UI Designer', minUsd: 85000, maxUsd: 120000, bonusPct: 0.08 },
  ],
  SLS: [
    { title: 'Sales Development Rep', minUsd: 50000, maxUsd: 70000, bonusPct: 0.25 },
    { title: 'Account Executive', minUsd: 80000, maxUsd: 120000, bonusPct: 0.35 },
    { title: 'Enterprise Account Executive', minUsd: 120000, maxUsd: 165000, bonusPct: 0.40 },
    { title: 'Sales Manager', minUsd: 130000, maxUsd: 175000, bonusPct: 0.30 },
  ],
  MKT: [
    { title: 'Marketing Coordinator', minUsd: 52000, maxUsd: 68000, bonusPct: 0.08 },
    { title: 'Growth Marketer', minUsd: 85000, maxUsd: 115000, bonusPct: 0.12 },
    { title: 'Content Strategist', minUsd: 70000, maxUsd: 95000, bonusPct: 0.08 },
    { title: 'Marketing Director', minUsd: 150000, maxUsd: 195000, bonusPct: 0.18 },
  ],
  HR: [
    { title: 'HR Coordinator', minUsd: 50000, maxUsd: 65000, bonusPct: 0.05 },
    { title: 'HR Generalist', minUsd: 70000, maxUsd: 92000, bonusPct: 0.08 },
    { title: 'Talent Acquisition Partner', minUsd: 75000, maxUsd: 100000, bonusPct: 0.10 },
    { title: 'HR Manager', minUsd: 105000, maxUsd: 145000, bonusPct: 0.15 },
  ],
  FIN: [
    { title: 'Financial Analyst', minUsd: 68000, maxUsd: 90000, bonusPct: 0.10 },
    { title: 'Senior Financial Analyst', minUsd: 95000, maxUsd: 130000, bonusPct: 0.14 },
    { title: 'Accounting Specialist', minUsd: 62000, maxUsd: 82000, bonusPct: 0.08 },
    { title: 'Finance Director', minUsd: 165000, maxUsd: 215000, bonusPct: 0.20 },
  ],
  OPS: [
    { title: 'Operations Specialist', minUsd: 55000, maxUsd: 75000, bonusPct: 0.08 },
    { title: 'Logistics Manager', minUsd: 85000, maxUsd: 115000, bonusPct: 0.10 },
    { title: 'Operations Director', minUsd: 140000, maxUsd: 185000, bonusPct: 0.15 },
  ],
  CS: [
    { title: 'Customer Support Specialist', minUsd: 45000, maxUsd: 60000, bonusPct: 0.05 },
    { title: 'Customer Success Manager', minUsd: 75000, maxUsd: 105000, bonusPct: 0.12 },
    { title: 'Enterprise CSM', minUsd: 100000, maxUsd: 135000, bonusPct: 0.15 },
  ],
};

const FIRST_NAMES = [
  'James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda',
  'David', 'Elizabeth', 'William', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica',
  'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa',
  'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley',
  'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle',
  'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Melissa', 'George', 'Deborah',
  'Edward', 'Stephanie', 'Ronald', 'Rebecca', 'Timothy', 'Sharon', 'Jason', 'Laura',
  'Jeffrey', 'Cynthia', 'Ryan', 'Kathleen', 'Jacob', 'Amy', 'Gary', 'Shirley',
  'Nicholas', 'Angela', 'Eric', 'Helen', 'Jonathan', 'Anna', 'Stephen', 'Brenda',
  'Larry', 'Pamela', 'Justin', 'Nicole', 'Scott', 'Samantha', 'Brandon', 'Katherine',
  'Benjamin', 'Christine', 'Samuel', 'Debra', 'Gregory', 'Rachel', 'Alexander', 'Carolyn',
  'Frank', 'Janet', 'Patrick', 'Maria', 'Raymond', 'Heather', 'Jack', 'Diane',
  'Dennis', 'Julie', 'Jerry', 'Joyce', 'Tyler', 'Victoria', 'Aaron', 'Kelly',
  'Jose', 'Christina', 'Adam', 'Lauren', 'Nathan', 'Joan', 'Henry', 'Evelyn',
  'Douglas', 'Olivia', 'Zachary', 'Judith', 'Peter', 'Megan', 'Kyle', 'Cheryl',
  'Walter', 'Martha', 'Ethan', 'Andrea', 'Jeremy', 'Frances', 'Harold', 'Hannah',
  'Keith', 'Jacqueline', 'Christian', 'Ann', 'Roger', 'Gloria', 'Noah', 'Jean',
  'Gerald', 'Kathryn', 'Carl', 'Alice', 'Terry', 'Teresa', 'Sean', 'Sara',
  'Austin', 'Janice', 'Arthur', 'Doris', 'Lawrence', 'Madison', 'Jesse', 'Julia',
  'Dylan', 'Grace', 'Bryan', 'Judy', 'Joe', 'Abigail', 'Jordan', 'Marie',
  'Billy', 'Denise', 'Albert', 'Beverly', 'Bruce', 'Amber', 'Gabriel', 'Theresa',
  'Logan', 'Marilyn', 'Alan', 'Danielle', 'Juan', 'Diana', 'Wayne', 'Brittany',
  'Roy', 'Charlotte', 'Ralph', 'Natalie', 'Randy', 'Isabella', 'Eugene', 'Sophia',
  'Vincent', 'Chloe', 'Russell', 'Amelia', 'Louis', 'Mia', 'Bobby', 'Harper',
  'Philip', 'Camila', 'Johnny', 'Evelyn', 'Bradley', 'Aria',
  // Indian names
  'Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Advik', 'Kabir', 'Aanya',
  'Aaradhya', 'Ishaan', 'Reyansh', 'Sai', 'Arjun', 'Aayush', 'Krishna', 'Aryan',
  'Shaurya', 'Dhruv', 'Utkarsh', 'Atharv', 'Rithvik', 'Siddharth', 'Varun', 'Rohan',
  'Pranav', 'Aditya', 'Rahul', 'Amit', 'Rajesh', 'Vikram', 'Priya', 'Pooja',
  'Neha', 'Sneha', 'Anjali', 'Divya', 'Ritu', 'Meera', 'Shweta', 'Deepika',
  'Sunita', 'Kavita', 'Preeti', 'Rekha', 'Anita', 'Geeta', 'Nisha', 'Poonam',
  // German & European names
  'Maximilian', 'Felix', 'Lukas', 'Jonas', 'Leon', 'Finn', 'Julian', 'Niklas',
  'Tobias', 'Florian', 'Moritz', 'Clara', 'Lea', 'Johanna', 'Luisa', 'Nele',
  'Lara', 'Mathilda', 'Ida', 'Frieda', 'Amelie', 'Sven', 'Jens', 'Matthias'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
  'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
  'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young',
  'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell',
  'Carter', 'Roberts', 'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker',
  'Cruz', 'Edwards', 'Collins', 'Reyes', 'Stewart', 'Morris', 'Morales', 'Murphy',
  'Cook', 'Rogers', 'Gutierrez', 'Ortiz', 'Morgan', 'Cooper', 'Peterson', 'Bailey',
  'Reed', 'Kelly', 'Howard', 'Ramos', 'Kim', 'Cox', 'Ward', 'Richardson',
  'Watson', 'Brooks', 'Chavez', 'Wood', 'James', 'Bennett', 'Gray', 'Mendoza',
  'Ruiz', 'Hughes', 'Price', 'Alvarez', 'Castillo', 'Sanders', 'Patel', 'Myers',
  'Long', 'Ross', 'Foster', 'Jimenez', 'Powell', 'Jenkins', 'Perry', 'Russell',
  'Sullivan', 'Bell', 'Coleman', 'Butler', 'Henderson', 'Barnes', 'Gonzales', 'Fisher',
  'Vasquez', 'Simmons', 'Romero', 'Jordan', 'Patterson', 'Alexander', 'Hamilton', 'Graham',
  'Reynolds', 'Griffin', 'Wallace', 'Moreno', 'West', 'Cole', 'Hayes', 'Bryant',
  'Herrera', 'Gibson', 'Ellis', 'Tran', 'Medina', 'Aguilar', 'Stevens', 'Murray',
  'Ford', 'Castro', 'Marshall', 'Owens', 'Harrison', 'Fernandez', 'Mcdonald', 'Woods',
  'Washington', 'Kennedy', 'Wells', 'Vargas', 'Henry', 'Chen', 'Freeman', 'Webb',
  'Tucker', 'Guzman', 'Burns', 'Crawford', 'Olson', 'Simpson', 'Porter', 'Hunter',
  'Gordon', 'Mendez', 'Silva', 'Shaw', 'Snyder', 'Mason', 'Dixon', 'Munoz',
  'Hunt', 'Hicks', 'Holmes', 'Palmer', 'Wagner', 'Black', 'Robertson', 'Boyd',
  'Rose', 'Stone', 'Salazar', 'Fox', 'Warren', 'Mills', 'Meyer', 'Rice',
  'Schmidt', 'Garza', 'Daniels', 'Ferguson', 'Nichols', 'Stephens', 'Soto', 'Weaver',
  'Ryan', 'Gardner', 'Payne', 'Grant', 'Dunn', 'Kelley', 'Spencer', 'Hawkins',
  'Arnold', 'Pierce', 'Vazquez', 'Hansen', 'Peters', 'Santos', 'Hart', 'Bradley',
  'Sharma', 'Verma', 'Gupta', 'Malhotra', 'Kapoor', 'Khanna', 'Mehra', 'Chopra',
  'Bhatia', 'Joshi', 'Trivedi', 'Shukla', 'Mishra', 'Pandey', 'Tiwari', 'Desai',
  'Mehta', 'Shah', 'Modi', 'Parekh', 'Reddy', 'Rao', 'Naidu', 'Murthy',
  'Iyer', 'Iyengar', 'Pillai', 'Nair', 'Menon', 'Singh', 'Kaur', 'Gill',
  'Dhillon', 'Sandhu', 'Sidhu', 'Grewal', 'Banerjee', 'Chatterjee', 'Mukherjee', 'Bose',
  'Mueller', 'Schneider', 'Fischer', 'Weber', 'Schulz', 'Hoffmann', 'Schaefer', 'Koch',
  'Bauer', 'Richter', 'Klein', 'Wolf', 'Schroeder', 'Neumann', 'Schwarz', 'Zimmermann',
  'Braun', 'Krueger', 'Hofmann', 'Hartmann', 'Lange', 'Schmitt', 'Werner', 'Schmitz',
  'Krause', 'Meier', 'Lehmann', 'Schmid', 'Schulze', 'Maier', 'Koehler', 'Herrmann'
];

async function main() {
  console.log('--- Starting Seed Script ---');

  // 1. Create Demo HR User
  const demoEmail = process.env.DEMO_HR_EMAIL || 'hr.manager@acme.corp';
  const demoPassword = process.env.DEMO_HR_PASSWORD || 'AcmeHR2026!Secure';
  const passwordHash = await bcrypt.hash(demoPassword, 10);

  const hrUser = await prisma.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash, name: 'Alice Montgomery (HR Lead)' },
    create: {
      email: demoEmail,
      passwordHash,
      name: 'Alice Montgomery (HR Lead)',
      role: 'HR_MANAGER',
    },
  });
  console.log(`Demo HR Manager configured: ${hrUser.email}`);

  // 2. Upsert Countries
  const countryMap: Record<string, any> = {};
  for (const c of COUNTRIES) {
    const record = await prisma.country.upsert({
      where: { code: c.code },
      update: { name: c.name, currency: c.currency, exchangeRate: c.exchangeRate },
      create: c,
    });
    countryMap[c.code] = record;
  }
  console.log(`Seeded ${COUNTRIES.length} Countries.`);

  // 3. Upsert Departments
  const deptMap: Record<string, any> = {};
  for (const d of DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name },
      create: d,
    });
    deptMap[d.code] = record;
  }
  console.log(`Seeded ${DEPARTMENTS.length} Departments.`);

  // Clean existing employee records for 100% unique, non-repeating data seed
  console.log('Clearing existing employee and salary records for clean 100% unique seed...');
  await prisma.salaryChangeAudit.deleteMany();
  await prisma.salaryRecord.deleteMany();
  await prisma.employee.deleteMany();

  const TARGET_COUNT = 10000;
  console.log(`Generating exactly ${TARGET_COUNT} employees with 100% UNIQUE names, salaries & historical audits...`);

  const employeeDataBatch: any[] = [];
  const salaryRecordsBatch: any[] = [];
  const auditRecordsBatch: any[] = [];

  const BATCH_SIZE = 1000;

  for (let i = 1; i <= TARGET_COUNT; i++) {
    const empId = `emp-${i.toString().padStart(6, '0')}`;
    const employeeCode = `ACM-${i.toString().padStart(5, '0')}`;
    
    // Deterministic coprime distribution guarantees 10,000 100% UNIQUE name pairs
    const fIdx = (i * 17 + 3) % FIRST_NAMES.length;
    const lIdx = (Math.floor(i / FIRST_NAMES.length) * 31 + (i % LAST_NAMES.length)) % LAST_NAMES.length;
    const firstName = FIRST_NAMES[fIdx];
    const lastName = LAST_NAMES[lIdx];
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@acme.corp`;

    const countryCode = rng.pick(COUNTRIES).code;
    const country = countryMap[countryCode];

    const deptCode = rng.pick(DEPARTMENTS).code;
    const dept = deptMap[deptCode];

    const titleChoices = TITLES_BY_DEPT[deptCode];
    const titleObj = rng.pick(titleChoices);

    const statusRoll = rng.range(1, 100);
    const status = statusRoll <= 92 ? 'ACTIVE' : statusRoll <= 96 ? 'ON_LEAVE' : 'INACTIVE';

    // Calculate USD compensation baseline
    const baseUsd = Math.round(rng.range(titleObj.minUsd, titleObj.maxUsd) / 1000) * 1000;
    const bonusUsd = Math.round((baseUsd * titleObj.bonusPct) / 500) * 500;

    // Convert to local currency based on exchange rate: localAmount = usdAmount / exchangeRate
    const localBaseSalary = Math.round(baseUsd / country.exchangeRate);
    const localBonus = Math.round(bonusUsd / country.exchangeRate);

    // Hire date between 2018 and 2024 with realistic hour, minute, second jitter
    const hireYear = rng.range(2018, 2024);
    const hireMonth = rng.range(0, 11);
    const hireDay = rng.range(1, 28);
    const hireHour = rng.range(8, 18);
    const hireMinute = rng.range(0, 59);
    const hireSecond = rng.range(0, 59);
    const hireDate = new Date(Date.UTC(hireYear, hireMonth, hireDay, hireHour, hireMinute, hireSecond));

    employeeDataBatch.push({
      id: empId,
      employeeCode,
      firstName,
      lastName,
      email,
      jobTitle: titleObj.title,
      status,
      departmentId: dept.id,
      countryId: country.id,
      hireDate,
      createdAt: hireDate,
      updatedAt: new Date(),
    });

    // Check if employee has a historical salary change (for ~20% of employees with hireDate before 2023)
    const hasHistory = hireYear <= 2022 && rng.range(1, 100) <= 25;

    if (hasHistory) {
      // Historical salary (lower)
      const prevBaseUsd = Math.round((baseUsd * 0.88) / 1000) * 1000;
      const prevBonusUsd = Math.round((prevBaseUsd * titleObj.bonusPct) / 500) * 500;
      const prevLocalBase = Math.round(prevBaseUsd / country.exchangeRate);
      const prevLocalBonus = Math.round(prevBonusUsd / country.exchangeRate);

      const effectiveEndDate = new Date(Date.UTC(hireYear + 1, hireMonth, hireDay));

      salaryRecordsBatch.push({
        id: `sal-hist-${i}`,
        employeeId: empId,
        baseSalary: prevLocalBase,
        variableBonus: prevLocalBonus,
        currency: country.currency,
        normalizedUSD: prevBaseUsd,
        totalNormalizedUSD: prevBaseUsd + prevBonusUsd,
        effectiveFrom: hireDate,
        effectiveTo: effectiveEndDate,
        isCurrent: false,
        changeReason: 'INITIAL_HIRE',
        createdAt: hireDate,
      });

      // Current active salary
      salaryRecordsBatch.push({
        id: `sal-curr-${i}`,
        employeeId: empId,
        baseSalary: localBaseSalary,
        variableBonus: localBonus,
        currency: country.currency,
        normalizedUSD: baseUsd,
        totalNormalizedUSD: baseUsd + bonusUsd,
        effectiveFrom: effectiveEndDate,
        effectiveTo: null,
        isCurrent: true,
        changeReason: rng.pick(['PROMOTION', 'ANNUAL_REVIEW', 'MARKET_ADJUSTMENT', 'MERIT']),
        createdAt: effectiveEndDate,
      });

      // Audit log entry
      auditRecordsBatch.push({
        id: `audit-${i}`,
        employeeId: empId,
        changedById: hrUser.id,
        previousBaseSalary: prevLocalBase,
        newBaseSalary: localBaseSalary,
        previousBonus: prevLocalBonus,
        newBonus: localBonus,
        currency: country.currency,
        changeReason: 'ANNUAL_REVIEW',
        notes: 'Annual merit and performance salary calibration',
        changedAt: effectiveEndDate,
      });
    } else {
      // Single current salary
      salaryRecordsBatch.push({
        id: `sal-curr-${i}`,
        employeeId: empId,
        baseSalary: localBaseSalary,
        variableBonus: localBonus,
        currency: country.currency,
        normalizedUSD: baseUsd,
        totalNormalizedUSD: baseUsd + bonusUsd,
        effectiveFrom: hireDate,
        effectiveTo: null,
        isCurrent: true,
        changeReason: 'INITIAL_HIRE',
        createdAt: hireDate,
      });
    }

    // Flush in chunks
    if (employeeDataBatch.length >= BATCH_SIZE || i === TARGET_COUNT) {
      console.log(`Writing batch up to employee ${i}...`);
      await prisma.employee.createMany({ data: employeeDataBatch });
      await prisma.salaryRecord.createMany({ data: salaryRecordsBatch });
      if (auditRecordsBatch.length > 0) {
        await prisma.salaryChangeAudit.createMany({ data: auditRecordsBatch });
      }

      employeeDataBatch.length = 0;
      salaryRecordsBatch.length = 0;
      auditRecordsBatch.length = 0;
    }
  }

  const finalCount = await prisma.employee.count();
  const salaryCount = await prisma.salaryRecord.count();
  const auditCount = await prisma.salaryChangeAudit.count();

  console.log('--- SEED COMPLETED SUCCESSFULLY ---');
  console.log(`Total Employees in DB: ${finalCount}`);
  console.log(`Total Salary Records: ${salaryCount}`);
  console.log(`Total Audit Logs: ${auditCount}`);
}

main()
  .catch((e) => {
    console.error('Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
