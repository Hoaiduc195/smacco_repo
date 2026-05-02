import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { NlpService } from './nlp.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { ChatService } from './chat.service';
import { GroqClientService } from './groq-client.service';
import { ConversationStoreService } from './conversation-store.service';

@Module({
  imports: [RecommendationsModule],
  controllers: [AiController],
  providers: [NlpService, ChatService, GroqClientService, ConversationStoreService],
  exports: [NlpService, ChatService],
})
export class AiModule {}
