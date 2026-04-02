import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

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
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
    }),

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
