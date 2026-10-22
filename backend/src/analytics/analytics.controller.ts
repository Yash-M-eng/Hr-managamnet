import { Controller, Get, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get overall organizational compensation KPIs (headcount, payroll, averages, min/max/median)' })
  @ApiResponse({ status: 200, description: 'Overview metrics retrieved' })
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('countries')
  @ApiOperation({ summary: 'Get aggregated salary metrics and employee distribution by country' })
  async getByCountry() {
    return this.analyticsService.getByCountry();
  }

  @Get('departments')
  @ApiOperation({ summary: 'Get aggregated salary metrics and employee distribution by department' })
  async getByDepartment() {
    return this.analyticsService.getByDepartment();
  }

  @Get('distribution')
  @ApiOperation({ summary: 'Get employee compensation tier distribution' })
  async getDistribution() {
    return this.analyticsService.getDistribution();
  }
}
