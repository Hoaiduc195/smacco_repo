import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

// Config
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import firebaseConfig from './config/firebase.config';
import googleConfig from './config/google.config';
import osmConfig from './config/osm.config';
import groqConfig from './config/groq.config';

// Feature modules — existing (from core-service)
import { UsersModule } from './modules/users/users.module';
import { PlacesModule } from './modules/places/places.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SearchModule } from './modules/search/search.module';
import { HealthModule } from './modules/health/health.module';

// Feature modules — ported from Python services
import { ChatModule } from './modules/chat/chat.module';
import { AiModule } from './modules/ai/ai.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';

// Feature modules — new MVP modules
import { RagModule } from './modules/rag/rag.module';
import { PresenceModule } from './modules/presence/presence.module';
import { ContributionsModule } from './modules/contributions/contributions.module';

@Module({
  imports: [
    // ── Configuration ─────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, firebaseConfig, googleConfig, osmConfig, groqConfig],
    }),

    // ── Database ──────────────────────────────────
    PrismaModule,

    // ── Core modules (from core-service) ──────────
    UsersModule,
    PlacesModule,
    ReviewsModule,
    SearchModule,
    HealthModule,

    // ── Ported modules (from Python services) ─────
    ChatModule,
    AiModule,
    RecommendationsModule,

    // ── New MVP modules ───────────────────────────
    RagModule,
    PresenceModule,
    ContributionsModule,
  ],
})
export class AppModule {}
