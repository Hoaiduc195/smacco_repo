import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';

class RecommendRequestDto {
  location?: string;
  type?: string;
  budget?: string;
}

@ApiTags('Recommendations')
@Controller('recommendations')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Post()
  @ApiOperation({ summary: 'Get place recommendations based on filters' })
  async recommend(@Body() dto: RecommendRequestDto) {
    const results = await this.recommendationsService.recommend(
      dto.location,
      dto.type,
      dto.budget,
    );
    return { results };
  }
}
