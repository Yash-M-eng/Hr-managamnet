import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto, UpdateEmployeeDto, QueryEmployeesDto } from './dto/employee.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryEmployeesDto) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {};

    if (query.search) {
      const s = query.search.trim();
      const parts = s.split(/\s+/).filter(Boolean);

      const orConditions: Prisma.EmployeeWhereInput[] = [
        { employeeCode: { contains: s } },
        { firstName: { contains: s } },
        { lastName: { contains: s } },
        { email: { contains: s } },
        { jobTitle: { contains: s } },
      ];

      if (parts.length >= 2) {
        // Support searching by full name "First Last" or "Last First"
        const first = parts[0];
        const rest = parts.slice(1).join(' ');
        orConditions.push({
          AND: [
            { firstName: { contains: first } },
            { lastName: { contains: rest } },
          ],
        });
        orConditions.push({
          AND: [
            { firstName: { contains: rest } },
            { lastName: { contains: first } },
          ],
        });
      }

      where.OR = orConditions;
    }

    if (query.departmentId) {
      where.departmentId = query.departmentId;
    }

    if (query.countryId) {
      where.countryId = query.countryId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const sortOrder = query.sortOrder === 'desc' ? 'desc' : 'asc';
    let orderBy: Prisma.EmployeeOrderByWithRelationInput[] = [{ employeeCode: 'asc' }];

    if (query.sortBy === 'firstName' || query.sortBy === 'name') {
      orderBy = [{ firstName: sortOrder }, { lastName: sortOrder }, { employeeCode: 'asc' }];
    } else if (query.sortBy === 'lastName') {
      orderBy = [{ lastName: sortOrder }, { firstName: sortOrder }, { employeeCode: 'asc' }];
    } else if (query.sortBy === 'department') {
      orderBy = [{ department: { name: sortOrder } }, { employeeCode: 'asc' }];
    } else if (query.sortBy === 'country') {
      orderBy = [{ country: { name: sortOrder } }, { employeeCode: 'asc' }];
    } else if (['employeeCode', 'jobTitle', 'status', 'hireDate', 'createdAt'].includes(query.sortBy || '')) {
      orderBy = [{ [query.sortBy as string]: sortOrder }, { employeeCode: 'asc' }];
    } else {
      orderBy = [{ employeeCode: 'asc' }];
    }

    const [total, items] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          department: true,
          country: true,
          salaries: {
            where: { isCurrent: true },
            take: 1,
          },
        },
      }),
    ]);

    return {
      data: items.map((emp) => ({
        id: emp.id,
        employeeCode: emp.employeeCode,
        firstName: emp.firstName,
        lastName: emp.lastName,
        fullName: `${emp.firstName} ${emp.lastName}`,
        email: emp.email,
        jobTitle: emp.jobTitle,
        status: emp.status,
        hireDate: emp.hireDate,
        createdAt: emp.createdAt,
        department: emp.department,
        country: emp.country,
        currentSalary: emp.salaries[0] || null,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        country: true,
        salaries: {
          orderBy: { effectiveFrom: 'desc' },
        },
        auditLogs: {
          orderBy: { changedAt: 'desc' },
          include: {
            changedBy: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }

    return employee;
  }

  async create(dto: CreateEmployeeDto) {
    // Check unique email and employeeCode
    const existing = await this.prisma.employee.findFirst({
      where: {
        OR: [{ email: dto.email.toLowerCase().trim() }, { employeeCode: dto.employeeCode.trim() }],
      },
    });

    if (existing) {
      throw new ConflictException('Employee with this email or employee code already exists');
    }

    return this.prisma.employee.create({
      data: {
        employeeCode: dto.employeeCode.trim(),
        firstName: dto.firstName.trim(),
        lastName: dto.lastName.trim(),
        email: dto.email.toLowerCase().trim(),
        jobTitle: dto.jobTitle.trim(),
        status: dto.status || 'ACTIVE',
        departmentId: dto.departmentId,
        countryId: dto.countryId,
        hireDate: new Date(dto.hireDate),
      },
      include: {
        department: true,
        country: true,
      },
    });
  }

  async update(id: string, dto: UpdateEmployeeDto) {
    await this.findOne(id);

    return this.prisma.employee.update({
      where: { id },
      data: {
        ...(dto.firstName && { firstName: dto.firstName.trim() }),
        ...(dto.lastName && { lastName: dto.lastName.trim() }),
        ...(dto.jobTitle && { jobTitle: dto.jobTitle.trim() }),
        ...(dto.departmentId && { departmentId: dto.departmentId }),
        ...(dto.countryId && { countryId: dto.countryId }),
        ...(dto.status && { status: dto.status }),
      },
      include: {
        department: true,
        country: true,
      },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);

    return this.prisma.employee.update({
      where: { id },
      data: { status },
      include: {
        department: true,
        country: true,
      },
    });
  }
}
