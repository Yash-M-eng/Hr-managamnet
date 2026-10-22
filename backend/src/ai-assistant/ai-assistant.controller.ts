import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AiAssistantService } from './ai-assistant.service';
import { AskAiDto } from './dto/ask-ai.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiAssistantController {
  constructor(private readonly aiService: AiAssistantService) {}

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ask natural-language questions about ACME salary and payroll data' })
  @ApiResponse({ status: 200, description: 'AI assistant structured answer grounded in database data' })
  async ask(@Body() dto: AskAiDto) {
    return this.aiService.ask(dto.question);
  }
}
