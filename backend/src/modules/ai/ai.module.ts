import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { NlpService } from './nlp.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { ChatService } from './chat.service';
import { GroqClientService } from './groq-client.service';
import { ConversationStoreService } from './conversation-store.service';
import { ConversationsService } from './conversations.service';
import { SearchModule } from '../search/search.module';
import { HttpModule } from '@nestjs/axios';

// Orchestration
import { GroqTaskRouterService } from './orchestration/router/groq-task-router.service';
import { ToolRegistryService } from '../../common/tools/tool-registry.service';
import { SearchPlacesTool } from '../../common/tools/search-places.tool';
import { GeocodeAnchorTool } from '../../common/tools/geocode-anchor.tool';
import { RecommendPlacesTool } from '../../common/tools/recommend-places.tool';

import { WorkflowEngineService } from './orchestration/engine/workflow-engine.service';
import { GroqResponseComposerService } from './orchestration/composer/groq-response-composer.service';
import { AiOrchestratorService } from './orchestration/ai-orchestrator.service';

@Module({
  imports: [RecommendationsModule, SearchModule, HttpModule],
  controllers: [AiController],
  providers: [
    NlpService, 
    ChatService, 
    GroqClientService, 
    ConversationStoreService,
    ConversationsService,

    // New Orchestration Providers
    GroqTaskRouterService,
    ToolRegistryService,
    SearchPlacesTool,
    GeocodeAnchorTool,
    RecommendPlacesTool,

    WorkflowEngineService,
    GroqResponseComposerService,
    AiOrchestratorService,
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
