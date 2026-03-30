import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiIntegrationService } from './ai-integration.service';
import { AiQueryDto } from './dto/ai-query.dto';

@ApiTags('AI')
@ApiBearerAuth()
@Controller('ai')
export class AiIntegrationController {
  constructor(private readonly aiService: AiIntegrationService) {}

  @Post('query')
  @ApiOperation({ summary: 'Send natural language query for AI-powered recommendations' })
  query(@Body() aiQueryDto: AiQueryDto) {
    return this.aiService.processQuery(aiQueryDto);
  }
}
