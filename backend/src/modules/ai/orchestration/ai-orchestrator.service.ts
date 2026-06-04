import { Injectable, Logger } from '@nestjs/common';
import { IAiOrchestrator } from '../interfaces/ai-orchestrator.interface';
import { ITaskRouter } from '../interfaces/task-router.interface';
import { IResponseComposer } from '../interfaces/response-composer.interface';
import { WorkflowEngineService } from './engine/workflow-engine.service';
import { WORKFLOW_REGISTRY } from './engine/workflow-registry';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { ConversationStoreService } from '../conversation-store.service';
import { ChatResponseDto, StreamChunkDto } from '../dto/chat-response.dto';
import { SearchResultContextBuilder } from './composer/search-result-context.builder';

@Injectable()
export class AiOrchestratorService implements IAiOrchestrator {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(
    private readonly router: ITaskRouter,
    private readonly engine: WorkflowEngineService,
    private readonly composer: IResponseComposer,
    private readonly store: ConversationStoreService,
    private readonly searchResultContextBuilder: SearchResultContextBuilder,
  ) {}

  /**
   * Orchestrates the entire AI flow for a non-streaming request.
   */
  async processQuery(request: ChatRequestDto): Promise<ChatResponseDto> {
    const conversationId = this.resolveConversationId(request.conversationId);
    const history = await this.store.getHistory(conversationId);
    await this.store.append(conversationId, { role: 'user', content: request.text });

    // 1. Task Router: Classify intent and extract params
    const route = await this.resolveRoute(request, history);
    const shouldExecuteWorkflow = this.shouldExecuteWorkflow(request, route.workflowId);
    
    let searchAction;
    let toolResults: Record<string, any> = {};
    let searchResultContext: Record<string, any> | undefined;
    const workflow = WORKFLOW_REGISTRY[route.workflowId];

    // 2. Workflow Engine: Execute tools only after the workflow card has been confirmed.
    if (shouldExecuteWorkflow && workflow && workflow.steps.length > 0) {
      const execution = await this.engine.executeWorkflow(workflow, route.parameters);
      toolResults = execution.stepResults;
    }

    if (route.workflowId === 'SEARCH_PLACES' && shouldExecuteWorkflow) {
      const recommendStep = workflow?.steps?.find(s => s.tool === 'recommend_places');
      const searchStep = workflow?.steps?.find(s => s.tool === 'hybrid_search');

      const recommendedData = recommendStep ? toolResults[recommendStep.id]?.data : null;
      const searchData = searchStep ? toolResults[searchStep.id]?.data : null;

      const places = recommendedData?.items || searchData || [];
      searchResultContext = this.searchResultContextBuilder.build({
        places,
        parameters: route.parameters,
      });

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

    const workflowAction = this.buildWorkflowAction(route.workflowId, route.parameters, shouldExecuteWorkflow);

    if (route.workflowId === 'SEARCH_PLACES' && !shouldExecuteWorkflow) {
      return {
        conversationId,
        answer: '',
        searchAction,
        workflowAction,
        messages: await this.store.getHistory(conversationId),
        finishReason: 'stop'
      };
    }

    // 3. Response Composer: Generate final text
    const composerResult = await this.composer.compose({
      userQuery: request.text,
      workflowId: route.workflowId,
      parameters: route.parameters,
      toolResults,
      searchResultContext,
      taggedPlaceIds: request.taggedPlaceIds,
      taggedPlaces: request.taggedPlaces,
      userContext: request.userContext,
    }, history);

    await this.store.append(conversationId, { role: 'assistant', content: composerResult.answer });

    return {
      conversationId,
      answer: composerResult.answer,
      searchAction,
      workflowAction,
      messages: await this.store.getHistory(conversationId),
      finishReason: 'stop'
    };
  }

  /**
   * Orchestrates the entire AI flow with a streaming response.
   */
  async *streamQuery(request: ChatRequestDto): AsyncGenerator<StreamChunkDto> {
    const conversationId = this.resolveConversationId(request.conversationId);
    const history = await this.store.getHistory(conversationId);
    await this.store.append(conversationId, { role: 'user', content: request.text });

    // 1. Task Router
    const route = await this.resolveRoute(request, history);
    const shouldExecuteWorkflow = this.shouldExecuteWorkflow(request, route.workflowId);

    let toolResults: Record<string, any> = {};
    let searchResultContext: Record<string, any> | undefined;
    const workflow = WORKFLOW_REGISTRY[route.workflowId];

    // 2. Workflow Engine: Execute tools only after the workflow card has been confirmed.
    if (shouldExecuteWorkflow && workflow && workflow.steps.length > 0) {
      const execution = await this.engine.executeWorkflow(workflow, route.parameters);
      toolResults = execution.stepResults;
    }

    // Yield structured search data after tools complete
    if (route.workflowId === 'SEARCH_PLACES' && shouldExecuteWorkflow) {
      const recommendStep = workflow?.steps?.find(s => s.tool === 'recommend_places');
      const searchStep = workflow?.steps?.find(s => s.tool === 'hybrid_search');

      const recommendedData = recommendStep ? toolResults[recommendStep.id]?.data : null;
      const searchData = searchStep ? toolResults[searchStep.id]?.data : null;

      const places = recommendedData?.items || searchData || [];
      searchResultContext = this.searchResultContextBuilder.build({
        places,
        parameters: route.parameters,
      });

      const searchAction = {
        isSearch: true,
        query: route.parameters.query || request.text,
        location: route.parameters.location,
        type: route.parameters.type,
        types: route.parameters.types || (typeof route.parameters.type === 'string' ? route.parameters.type.split(/,/).map((s:string)=>s.trim()).filter(Boolean) : undefined),
        budget: route.parameters.budget,
        results: places,
      };

      yield {
        conversationId,
        delta: '',
        searchAction,
      } as any;
    }

    // Yield workflow metadata so the frontend can collect/confirm intent before executing.
    const workflowAction = this.buildWorkflowAction(route.workflowId, route.parameters, shouldExecuteWorkflow);
    if (workflowAction) {
      yield {
        conversationId,
        delta: '',
        workflowAction,
      } as any;
    }

    if (route.workflowId === 'SEARCH_PLACES' && !shouldExecuteWorkflow) {
      yield { conversationId, delta: '', finishReason: 'stop' };
      return;
    }

    // 3. Response Composer Stream
    const stream = this.composer.streamCompose({
      userQuery: request.text,
      workflowId: route.workflowId,
      parameters: route.parameters,
      toolResults,
      searchResultContext,
      taggedPlaceIds: request.taggedPlaceIds,
      taggedPlaces: request.taggedPlaces,
      userContext: request.userContext,
    }, history);

    const assistantParts: string[] = [];
    for await (const chunk of stream) {
      assistantParts.push(chunk);
      yield { conversationId, delta: chunk };
    }

    const fullAnswer = assistantParts.join('');
    await this.store.append(conversationId, { role: 'assistant', content: fullAnswer });

    yield { conversationId, delta: '', finishReason: 'stop' };
  }

  private resolveConversationId(candidate?: string): string {
    if (!candidate) return this.store.createId();
    if (this.uuidRegex.test(candidate)) return candidate;

    this.logger.warn(`Ignoring invalid conversationId "${candidate}" and creating a new conversation.`);
    return this.store.createId();
  }

  private async resolveRoute(request: ChatRequestDto, history: any[]) {
    const execution = request.workflowExecution;
    if (execution?.confirmed && execution.workflowId) {
      return {
        workflowId: execution.workflowId,
        parameters: this.normalizeExecutionParameters(execution.parameters || {}, request),
      };
    }

    return this.router.route(request.text, history);
  }

  private shouldExecuteWorkflow(request: ChatRequestDto, workflowId: string): boolean {
    return Boolean(
      request.workflowExecution?.confirmed &&
      request.workflowExecution.workflowId === workflowId
    );
  }

  private buildWorkflowAction(
    workflowId: string,
    parameters: Record<string, any>,
    alreadyExecuting: boolean,
  ): { type: string; parameters?: Record<string, any> } | undefined {
    if (alreadyExecuting) return undefined;

    if (workflowId === 'SEARCH_PLACES') {
      return { type: 'search', parameters };
    }

    if (workflowId === 'COMPARE_PLACES') {
      return { type: 'compare', parameters };
    }

    if (workflowId === 'ANALYZE_PLACE') {
      return { type: 'analyze', parameters };
    }

    return undefined;
  }

  private normalizeExecutionParameters(
    parameters: Record<string, any>,
    request: ChatRequestDto,
  ): Record<string, any> {
    const types = Array.isArray(parameters.types)
      ? parameters.types.filter(Boolean)
      : (typeof parameters.type === 'string' ? parameters.type.split(/,/).map((type: string) => type.trim()).filter(Boolean) : []);

    return {
      ...parameters,
      ...request.wizardPreferences,
      query: parameters.query || request.text,
      type: types.length ? types.join(', ') : parameters.type,
      types: types.length ? types : parameters.types,
    };
  }
}
