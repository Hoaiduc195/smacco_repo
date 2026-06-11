import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';

// Config
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import firebaseConfig from './config/firebase.config';
import osmConfig from './config/osm.config';
import groqConfig from './config/groq.config';
import r2Config from './config/r2.config';
import cloudflareAiConfig from './config/cloudflare-ai.config';
import freemodelConfig from './config/freemodel.config';
import geminiConfig from './config/gemini.config';
import { RuntimeConfigModule } from './config/runtime-config.module';

// Feature modules — existing (from core-service)
import { UsersModule } from './modules/users/users.module';
import { PlacesModule } from './modules/places/places.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { SearchModule } from './modules/search/search.module';
import { HealthModule } from './modules/health/health.module';

// Feature modules — ported from Python services
import { AiModule } from './modules/ai/ai.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';

// Feature modules — new MVP modules
import { RagModule } from './modules/rag/rag.module';
import { PresenceModule } from './modules/presence/presence.module';
import { ContributionsModule } from './modules/contributions/contributions.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { SavedPlacesModule } from './modules/saved-places/saved-places.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    // ── Configuration ─────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, firebaseConfig, osmConfig, groqConfig, r2Config, cloudflareAiConfig, freemodelConfig, geminiConfig],
    }),
    RuntimeConfigModule,

    // ── Database ──────────────────────────────────
    PrismaModule,

    // ── Core modules (from core-service) ──────────
    UsersModule,
    PlacesModule,
    ReviewsModule,
    SearchModule,
    HealthModule,

    // ── Ported modules (from Python services) ─────
    AiModule,
    RecommendationsModule,

    // ── New MVP modules ───────────────────────────
    RagModule,
    PresenceModule,
    ContributionsModule,
    QuestionsModule,
    SavedPlacesModule,
    UploadModule,
  ],
})
export class AppModule {}
