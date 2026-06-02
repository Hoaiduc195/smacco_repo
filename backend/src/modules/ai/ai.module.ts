import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

import { AiController } from './ai.controller';
import { NlpService } from './nlp.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { ChatService } from './chat.service';
import { ConversationStoreService } from './conversation-store.service';
import { ConversationsService } from './conversations.service';
import { SearchModule } from '../search/search.module';
import { PlacesModule } from '../places/places.module';

// Interfaces
import { ILlmClient } from './interfaces/llm-client.interface';
import { ITaskRouter } from './interfaces/task-router.interface';
import { IResponseComposer } from './interfaces/response-composer.interface';
import { IAiOrchestrator } from './interfaces/ai-orchestrator.interface';

// Concrete Providers
import { GroqLlmClientService } from './providers/groq-llm-client.service';
import { CloudflareAiLlmClientService } from './providers/cloudflare-ai-llm-client.service';
import { LlmTaskRouterService } from './orchestration/router/llm-task-router.service';
import { LlmResponseComposerService } from './orchestration/composer/llm-response-composer.service';
import { AiOrchestratorService } from './orchestration/ai-orchestrator.service';

// Engine & Tools
import { WorkflowEngineService } from './orchestration/engine/workflow-engine.service';
import { SearchResultContextBuilder } from './orchestration/composer/search-result-context.builder';
import { ToolRegistryService } from '../../common/tools/tool-registry.service';
import { SearchPlacesTool } from '../../common/tools/search-places.tool';
import { GeocodeAnchorTool } from '../../common/tools/geocode-anchor.tool';
import { RecommendPlacesTool } from '../../common/tools/recommend-places.tool';

@Module({
  imports: [RecommendationsModule, SearchModule, PlacesModule, HttpModule],
  controllers: [AiController],
  providers: [
    NlpService, 
    ChatService, 
    ConversationStoreService,
    ConversationsService,

    // Concrete LLM Clients
    GroqLlmClientService,
    CloudflareAiLlmClientService,

    // Interface providers
    {
      provide: ILlmClient,
      useFactory: (
        configService: ConfigService,
        groq: GroqLlmClientService,
        cloudflare: CloudflareAiLlmClientService,
      ) => {
        const provider = configService.get<string>('groq.provider') || 'groq';
        return provider === 'cloudflare' ? cloudflare : groq;
      },
      inject: [ConfigService, GroqLlmClientService, CloudflareAiLlmClientService],
    },
    {
      provide: ITaskRouter,
      useClass: LlmTaskRouterService,
    },
    {
      provide: IResponseComposer,
      useClass: LlmResponseComposerService,
    },
    {
      provide: IAiOrchestrator,
      useClass: AiOrchestratorService,
    },

    // Tools & engine
    ToolRegistryService,
    SearchPlacesTool,
    GeocodeAnchorTool,
    RecommendPlacesTool,
    WorkflowEngineService,
    SearchResultContextBuilder,
  ],
  exports: [NlpService, ChatService],
})
export class AiModule {
  constructor(
    private readonly toolRegistry: ToolRegistryService,
    private readonly searchPlacesTool: SearchPlacesTool,
    private readonly geocodeAnchorTool: GeocodeAnchorTool,
    private readonly recommendPlacesTool: RecommendPlacesTool,
  ) {
    // Register tools on app start
    this.toolRegistry.registerTool(this.searchPlacesTool);
    this.toolRegistry.registerTool(this.geocodeAnchorTool);
    this.toolRegistry.registerTool(this.recommendPlacesTool);
  }
}
