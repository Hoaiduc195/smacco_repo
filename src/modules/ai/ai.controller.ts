import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NlpService } from './nlp.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { ParseRequestDto } from './dto/parse-request.dto';
import { ParseResponseDto } from './dto/parse-response.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly nlpService: NlpService,
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Post('parse')
  @ApiOperation({ summary: 'Parse natural language query and get recommendations' })
  async parse(@Body() dto: ParseRequestDto): Promise<ParseResponseDto> {
    try {
      // Step 1: Extract filters from natural language
      const filters = this.nlpService.extractFilters(dto.text);

      // Step 2: Get recommendations (direct service call — no HTTP!)
      const recommendations = await this.recommendationsService.recommend(
        filters.location,
        filters.type,
        filters.budget,
      );

      return {
        query: dto.text,
        extractedFilters: filters,
        recommendations,
      };
    } catch (error) {
      throw new HttpException(
        `AI parse error: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
