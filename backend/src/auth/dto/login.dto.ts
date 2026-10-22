import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'hr.manager@acme.corp', description: 'HR Manager email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'AcmeHR2026!Secure', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}
