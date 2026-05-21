import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { UsersModule } from '../users/users.module';
import { PlacesModule } from '../places/places.module';

@Module({
  imports: [UsersModule, PlacesModule],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
