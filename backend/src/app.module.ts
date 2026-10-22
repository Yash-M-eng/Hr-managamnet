import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { SalaryModule } from './salary/salary.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { DepartmentsModule } from './departments/departments.module';
import { CountriesModule } from './countries/countries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../.env'],
    }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    SalaryModule,
    AnalyticsModule,
    AiAssistantModule,
    DepartmentsModule,
    CountriesModule,
  ],
})
export class AppModule {}
