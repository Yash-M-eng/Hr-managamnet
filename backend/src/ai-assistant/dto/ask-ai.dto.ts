import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AskAiDto {
  @ApiProperty({
    example: 'What is the average salary in India?',
    description: 'Natural language question regarding ACME compensation and payroll',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  question: string;
}
