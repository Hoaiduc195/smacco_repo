import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RuntimeConfigService } from '../../config/runtime-config.service';

import { AiController } from './ai.controller';
import { NlpService } from './nlp.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { ChatService } from './chat.service';
import { ConversationStoreService } from './conversation-store.service';
import { ConversationsService } from './conversations.service';
import { PlaceComparisonResultsService } from './place-comparison-results.service';
import { SearchModule } from '../search/search.module';
import { PlacesModule } from '../places/places.module';
import { UsersModule } from '../users/users.module';

// Interfaces
import { ILlmClient } from './interfaces/llm-client.interface';
import { ITaskRouter } from './interfaces/task-router.interface';
import { IResponseComposer } from './interfaces/response-composer.interface';
import { IAiOrchestrator } from './interfaces/ai-orchestrator.interface';

// Concrete Providers
import { GroqLlmClientService } from './providers/groq-llm-client.service';
import { CloudflareAiLlmClientService } from './providers/cloudflare-ai-llm-client.service';
import { FreemodelLlmClientService } from './providers/freemodel-llm-client.service';
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
import { PlaceInsightContextTool } from '../../common/tools/place-insight-context.tool';
import { selectLlmClientByProvider } from './llm-provider.selector';

@Module({
  imports: [RecommendationsModule, SearchModule, PlacesModule, UsersModule, HttpModule],
  controllers: [AiController],
  providers: [
    NlpService, 
    ChatService, 
    ConversationStoreService,
    ConversationsService,
    PlaceComparisonResultsService,

    // Concrete LLM Clients
    GroqLlmClientService,
    CloudflareAiLlmClientService,
    FreemodelLlmClientService,

    // Interface providers
    {
      provide: ILlmClient,
      useFactory: (
        runtimeConfigService: RuntimeConfigService,
        groq: GroqLlmClientService,
        cloudflare: CloudflareAiLlmClientService,
        freemodel: FreemodelLlmClientService,
      ) => selectLlmClientByProvider(runtimeConfigService.ai.provider, groq, cloudflare, freemodel),
      inject: [RuntimeConfigService, GroqLlmClientService, CloudflareAiLlmClientService, FreemodelLlmClientService],
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
    PlaceInsightContextTool,
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
    private readonly placeInsightContextTool: PlaceInsightContextTool,
  ) {
    // Register tools on app start
    this.toolRegistry.registerTool(this.searchPlacesTool);
    this.toolRegistry.registerTool(this.geocodeAnchorTool);
    this.toolRegistry.registerTool(this.recommendPlacesTool);
    this.toolRegistry.registerTool(this.placeInsightContextTool);
  }
}
