import { IsString, IsNotEmpty, IsEmail, IsDateString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'ACM-10001', description: 'Unique employee ID code' })
  @IsString()
  @IsNotEmpty()
  employeeCode: string;

  @ApiProperty({ example: 'Jane', description: 'First name' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'jane.doe@acme.corp', description: 'Unique work email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Senior Software Engineer', description: 'Designation' })
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @ApiProperty({ description: 'Department UUID' })
  @IsString()
  @IsNotEmpty()
  departmentId: string;

  @ApiProperty({ description: 'Country UUID' })
  @IsString()
  @IsNotEmpty()
  countryId: string;

  @ApiProperty({ example: '2023-01-15T00:00:00.000Z', description: 'Hire Date ISO' })
  @IsDateString()
  @IsNotEmpty()
  hireDate: string;

  @ApiPropertyOptional({ example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])
  status?: string;
}

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ example: 'Jane' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: 'Staff Software Engineer' })
  @IsOptional()
  @IsString()
  jobTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  departmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  countryId?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])
  status?: string;
}

export class UpdateEmployeeStatusDto {
  @ApiProperty({ enum: ['ACTIVE', 'INACTIVE', 'ON_LEAVE'] })
  @IsNotEmpty()
  @IsIn(['ACTIVE', 'INACTIVE', 'ON_LEAVE'])
  status: string;
}

import { Type } from 'class-transformer';

export class QueryEmployeesDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 25, default: 25 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 25;

  @ApiPropertyOptional({ description: 'Search term for name, email, or code' })
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by Department ID' })
  @IsOptional()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by Country ID' })
  @IsOptional()
  countryId?: string;

  @ApiPropertyOptional({ description: 'Filter by Status (ACTIVE, INACTIVE, ON_LEAVE)' })
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'employeeCode', default: 'employeeCode' })
  @IsOptional()
  sortBy?: string = 'employeeCode';

  @ApiPropertyOptional({ example: 'asc', default: 'asc' })
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'asc';
}
