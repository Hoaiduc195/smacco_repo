import { Injectable, Logger } from '@nestjs/common';
import { GroqTaskRouterService } from './router/groq-task-router.service';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { GroqResponseComposerService } from './composer/groq-response-composer.service';
import { WORKFLOW_REGISTRY } from './engine/workflow-registry';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { ConversationStoreService } from '../conversation-store.service';
import { ChatResponseDto, StreamChunkDto } from '../dto/chat-response.dto';

@Injectable()
export class AiOrchestratorService {
  private readonly logger = new Logger(AiOrchestratorService.name);

  constructor(
    private readonly router: GroqTaskRouterService,
    private readonly engine: WorkflowEngineService,
    private readonly composer: GroqResponseComposerService,
    private readonly store: ConversationStoreService,
  ) {}

  /**
   * Orchestrates the entire AI flow for a non-streaming request.
   */
  async processQuery(request: ChatRequestDto): Promise<ChatResponseDto> {
    const conversationId = request.conversationId || this.store.createId();
    const history = await this.store.getHistory(conversationId);

    // 1. Task Router: Classify intent and extract params
    const route = await this.router.route(request.text, history);
    
    let searchAction;
    let toolResults: Record<string, any> = {};
    const workflow = WORKFLOW_REGISTRY[route.workflowId];

    // 2. Workflow Engine: Execute tools if steps exist (runs BEFORE composing response)
    if (workflow && workflow.steps.length > 0) {
      const execution = await this.engine.executeWorkflow(workflow, route.parameters);
      toolResults = execution.stepResults;
    }

    if (route.workflowId === 'SEARCH_PLACES') {
      const recommendStep = workflow?.steps?.find(s => s.tool === 'recommend_places');
      const searchStep = workflow?.steps?.find(s => s.tool === 'hybrid_search');

      const recommendedData = recommendStep ? toolResults[recommendStep.id]?.data : null;
      const searchData = searchStep ? toolResults[searchStep.id]?.data : null;

      const places = recommendedData?.items || searchData || [];

      searchAction = {
        isSearch: true,
        query: route.parameters.query || request.text,
        location: route.parameters.location,
        type: route.parameters.type,
        types: route.parameters.types || (typeof route.parameters.type === 'string' ? route.parameters.type.split(/,/) .map((s:string)=>s.trim()).filter(Boolean) : undefined),
        budget: route.parameters.budget,
        results: places,
      };
    }

    // 3. Response Composer: Generate final text
    const composerResult = await this.composer.compose({
      userQuery: request.text,
      workflowId: route.workflowId,
      parameters: route.parameters,
      toolResults
    }, history);

    // Store in history
    await this.store.append(conversationId, { role: 'user', content: request.text });
    await this.store.append(conversationId, { role: 'assistant', content: composerResult.answer });

    return {
      conversationId,
      answer: composerResult.answer,
      searchAction,
      messages: await this.store.getHistory(conversationId),
      finishReason: 'stop'
    };
  }

  /**
   * Orchestrates the entire AI flow with a streaming response.
   */
  async *streamQuery(request: ChatRequestDto): AsyncGenerator<StreamChunkDto> {
    const conversationId = request.conversationId || this.store.createId();
    const history = await this.store.getHistory(conversationId);

    // 1. Task Router
    const route = await this.router.route(request.text, history);

    let toolResults: Record<string, any> = {};
    const workflow = WORKFLOW_REGISTRY[route.workflowId];

    // 2. Workflow Engine (Executes BEFORE yielding anything to frontend)
    if (workflow && workflow.steps.length > 0) {
      const execution = await this.engine.executeWorkflow(workflow, route.parameters);
      toolResults = execution.stepResults;
    }

    // Yield structured search data after tools complete
    if (route.workflowId === 'SEARCH_PLACES') {
      const recommendStep = workflow?.steps?.find(s => s.tool === 'recommend_places');
      const searchStep = workflow?.steps?.find(s => s.tool === 'hybrid_search');

      const recommendedData = recommendStep ? toolResults[recommendStep.id]?.data : null;
      const searchData = searchStep ? toolResults[searchStep.id]?.data : null;

      const places = recommendedData?.items || searchData || [];

      const searchAction = {
        isSearch: true,
        query: route.parameters.query || request.text,
        location: route.parameters.location,
        type: route.parameters.type,
        budget: route.parameters.budget,
        results: places,
      };

      yield {
        conversationId,
        delta: '',
        searchAction,
      } as any;
    }

    // 3. Response Composer Stream
    const stream = this.composer.streamCompose({
      userQuery: request.text,
      workflowId: route.workflowId,
      parameters: route.parameters,
      toolResults
    }, history);

    const assistantParts: string[] = [];
    for await (const chunk of stream) {
      assistantParts.push(chunk);
      yield { conversationId, delta: chunk };
    }

    const fullAnswer = assistantParts.join('');
    await this.store.append(conversationId, { role: 'user', content: request.text });
    await this.store.append(conversationId, { role: 'assistant', content: fullAnswer });

    yield { conversationId, delta: '', finishReason: 'stop' };
  }
}
