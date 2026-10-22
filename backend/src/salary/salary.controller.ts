import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SalaryService } from './salary.service';
import { CreateSalaryRecordDto } from './dto/salary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('salary')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Get('employees/:id/salaries')
  @ApiOperation({ summary: 'Get full compensation history for an employee' })
  async getEmployeeSalaries(@Param('id') id: string) {
    return this.salaryService.getEmployeeSalaries(id);
  }

  @Post('employees/:id/salaries')
  @ApiOperation({ summary: 'Add a new active salary record (closes previous salary atomically and creates audit log)' })
  @ApiResponse({ status: 201, description: 'Salary updated' })
  async addSalaryRecord(
    @Param('id') id: string,
    @Body() dto: CreateSalaryRecordDto,
    @Request() req: any,
  ) {
    return this.salaryService.addSalaryRecord(id, dto, req.user.id);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get recent salary change audit logs' })
  async getAuditLogs(@Query('employeeId') employeeId?: string) {
    return this.salaryService.getAuditHistory(employeeId);
  }
}
