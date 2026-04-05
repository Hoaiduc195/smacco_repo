import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

import { UsersModule } from './modules/users/users.module';
import { PlacesModule } from './modules/places/places.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SearchModule } from './modules/search/search.module';
import { AiIntegrationModule } from './modules/ai-integration/ai-integration.module';
import { HealthModule } from './modules/health/health.module';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import firebaseConfig from './config/firebase.config';
import googleConfig from './config/google.config';
import osmConfig from './config/osm.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, firebaseConfig, googleConfig, osmConfig],
    }),

    // Database
    PrismaModule,

    // Feature modules
    UsersModule,
    PlacesModule,
    ReviewsModule,
    SearchModule,
    AiIntegrationModule,
    HealthModule,
  ],
})
export class AppModule {}
