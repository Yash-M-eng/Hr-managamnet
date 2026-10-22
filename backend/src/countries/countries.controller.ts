import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('countries')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active countries with currencies and fixed exchange rates' })
  async findAll() {
    return this.countriesService.findAll();
  }
}
