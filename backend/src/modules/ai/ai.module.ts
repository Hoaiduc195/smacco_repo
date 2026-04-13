import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { NlpService } from './nlp.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';

@Module({
  imports: [RecommendationsModule],
  controllers: [AiController],
  providers: [NlpService],
  exports: [NlpService],
})
export class AiModule {}
