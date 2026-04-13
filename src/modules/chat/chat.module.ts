import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { GroqClientService } from './groq-client.service';
import { ConversationStoreService } from './conversation-store.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, GroqClientService, ConversationStoreService],
  exports: [ChatService],
})
export class ChatModule {}
