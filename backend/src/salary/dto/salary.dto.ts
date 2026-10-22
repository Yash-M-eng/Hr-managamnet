import { IsNumber, IsPositive, IsString, IsNotEmpty, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalaryRecordDto {
  @ApiProperty({ example: 85000, description: 'Base annual salary in local currency' })
  @IsNumber()
  @IsPositive()
  baseSalary: number;

  @ApiPropertyOptional({ example: 8000, description: 'Variable bonus in local currency', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  variableBonus?: number;

  @ApiProperty({ example: 'USD', description: 'Currency code (USD, EUR, GBP, INR, CAD, AUD)' })
  @IsString()
  @IsNotEmpty()
  currency: string;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z', description: 'Effective start date' })
  @IsDateString()
  @IsNotEmpty()
  effectiveFrom: string;

  @ApiPropertyOptional({ example: 'PROMOTION', description: 'Reason for salary adjustment' })
  @IsString()
  @IsNotEmpty()
  changeReason: string;

  @ApiPropertyOptional({ example: 'Promoted to Senior Engineer with 15% salary bump' })
  @IsOptional()
  @IsString()
  notes?: string;
}
