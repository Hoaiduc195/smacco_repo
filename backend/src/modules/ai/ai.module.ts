import { Module } from '@nestjs/common';

import { AiController } from './ai.controller';
import { NlpService } from './nlp.service';
import { RecommendationsModule } from '../recommendations/recommendations.module';
import { ChatService } from './chat.service';
import { GroqClientService } from './groq-client.service';
import { ConversationStoreService } from './conversation-store.service';
import { SearchModule } from '../search/search.module';

// Orchestration
import { GroqTaskRouterService } from './orchestration/router/groq-task-router.service';
import { ToolRegistryService } from './orchestration/tools/tool-registry.service';
import { SearchPlacesTool } from './orchestration/tools/search-places.tool';
import { WorkflowEngineService } from './orchestration/engine/workflow-engine.service';
import { GroqResponseComposerService } from './orchestration/composer/groq-response-composer.service';
import { AiOrchestratorService } from './orchestration/ai-orchestrator.service';

@Module({
  imports: [RecommendationsModule, SearchModule],
  controllers: [AiController],
  providers: [
    NlpService, 
    ChatService, 
    GroqClientService, 
    ConversationStoreService,

    // New Orchestration Providers
    GroqTaskRouterService,
    ToolRegistryService,
    SearchPlacesTool,
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
  ) {
    // Register tools on app start
    this.toolRegistry.registerTool(this.searchPlacesTool);
  }
}
