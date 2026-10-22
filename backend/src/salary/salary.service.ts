import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalaryRecordDto } from './dto/salary.dto';

@Injectable()
export class SalaryService {
  constructor(private prisma: PrismaService) {}

  async getEmployeeSalaries(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    return this.prisma.salaryRecord.findMany({
      where: { employeeId },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  async addSalaryRecord(employeeId: string, dto: CreateSalaryRecordDto, actorUserId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        country: true,
        salaries: {
          where: { isCurrent: true },
          take: 1,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }

    const effectiveDate = new Date(dto.effectiveFrom);
    if (isNaN(effectiveDate.getTime())) {
      throw new BadRequestException('Invalid effectiveFrom date');
    }

    const currentRecord = employee.salaries[0] || null;

    if (currentRecord && effectiveDate <= currentRecord.effectiveFrom) {
      throw new BadRequestException('New effective salary date must be after the current salary effective date');
    }

    // Lookup exchange rate for normalized USD conversion
    const country = await this.prisma.country.findFirst({
      where: { currency: dto.currency.toUpperCase() },
    });

    const exchangeRate = country ? country.exchangeRate : 1.0;
    const baseSalary = Number(dto.baseSalary);
    const variableBonus = Number(dto.variableBonus || 0);

    const normalizedUSD = Math.round(baseSalary * exchangeRate);
    const totalNormalizedUSD = Math.round((baseSalary + variableBonus) * exchangeRate);

    // Atomic transaction: mark old salary as closed, create new salary record, write audit record
    return this.prisma.$transaction(async (tx) => {
      if (currentRecord) {
        await tx.salaryRecord.update({
          where: { id: currentRecord.id },
          data: {
            isCurrent: false,
            effectiveTo: effectiveDate,
          },
        });
      }

      const newRecord = await tx.salaryRecord.create({
        data: {
          employeeId,
          baseSalary,
          variableBonus,
          currency: dto.currency.toUpperCase(),
          normalizedUSD,
          totalNormalizedUSD,
          effectiveFrom: effectiveDate,
          effectiveTo: null,
          isCurrent: true,
          changeReason: dto.changeReason,
        },
      });

      await tx.salaryChangeAudit.create({
        data: {
          employeeId,
          changedById: actorUserId,
          previousBaseSalary: currentRecord ? currentRecord.baseSalary : null,
          newBaseSalary: baseSalary,
          previousBonus: currentRecord ? currentRecord.variableBonus : null,
          newBonus: variableBonus,
          currency: dto.currency.toUpperCase(),
          changeReason: dto.changeReason,
          notes: dto.notes || null,
          changedAt: new Date(),
        },
      });

      return newRecord;
    });
  }

  async getAuditHistory(employeeId?: string) {
    return this.prisma.salaryChangeAudit.findMany({
      where: employeeId ? { employeeId } : undefined,
      orderBy: { changedAt: 'desc' },
      take: 100,
      include: {
        employee: {
          select: { id: true, employeeCode: true, firstName: true, lastName: true, jobTitle: true },
        },
        changedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
