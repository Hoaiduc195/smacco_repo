import { Module } from '@nestjs/common';
import { QuestionsController } from './questions.controller';
import { QuestionsService } from './questions.service';
import { PlacesModule } from '../places/places.module';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [PlacesModule, UsersModule, AiModule],
  controllers: [QuestionsController],
  providers: [QuestionsService],
})
export class QuestionsModule {}