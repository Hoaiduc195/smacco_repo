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
  private readonly maxContextPlaces = 50;
  private readonly maxTextLength = 8000;

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
  async processQuery(request: ChatRequestDto, userId?: string): Promise<ChatResponseDto> {
    const safeRequest = this.sanitizeRequest(request);
    const conversationId = this.resolveConversationId(safeRequest.conversationId, userId);
    await this.store.append(conversationId, { role: 'user', content: safeRequest.text }, userId);
    const history = await this.store.getHistory(conversationId, userId);

    // 1. Task Router: Classify intent and extract params
    const route = await this.resolveRoute(safeRequest, history);
    const shouldExecuteWorkflow = this.shouldExecuteWorkflow(safeRequest, route.workflowId);
    
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
        query: route.parameters.query || safeRequest.text,
        location: route.parameters.location,
        type: route.parameters.type,
        types: route.parameters.types || (typeof route.parameters.type === 'string' ? route.parameters.type.split(/,/) .map((s:string)=>s.trim()).filter(Boolean) : undefined),
        budget: route.parameters.budget,
        results: places,
      };
    }

    const workflowAction = this.buildWorkflowAction(route.workflowId, route.parameters, shouldExecuteWorkflow);

    if (this.shouldWaitForWorkflowConfirmation(route.workflowId, shouldExecuteWorkflow)) {
      return {
        conversationId,
        answer: '',
        searchAction,
        workflowAction,
        messages: await this.store.getHistory(conversationId, userId),
        finishReason: 'stop'
      };
    }

    // 3. Response Composer: Generate final text
    const composerResult = await this.composer.compose({
      userQuery: safeRequest.text,
      workflowId: route.workflowId,
      parameters: route.parameters,
      toolResults,
      searchResultContext,
      taggedPlaceIds: safeRequest.taggedPlaceIds,
      taggedPlaces: safeRequest.taggedPlaces,
      userContext: safeRequest.userContext,
    }, history);

    await this.store.append(conversationId, { role: 'assistant', content: composerResult.answer }, userId);

    return {
      conversationId,
      answer: composerResult.answer,
      searchAction,
      workflowAction,
      messages: await this.store.getHistory(conversationId, userId),
      finishReason: 'stop'
    };
  }

  /**
   * Orchestrates the entire AI flow with a streaming response.
   */
  async *streamQuery(request: ChatRequestDto, userId?: string): AsyncGenerator<StreamChunkDto> {
    const safeRequest = this.sanitizeRequest(request);
    const conversationId = this.resolveConversationId(safeRequest.conversationId, userId);
    await this.store.append(conversationId, { role: 'user', content: safeRequest.text }, userId);
    const history = await this.store.getHistory(conversationId, userId);

    // 1. Task Router
    const route = await this.resolveRoute(safeRequest, history);
    const shouldExecuteWorkflow = this.shouldExecuteWorkflow(safeRequest, route.workflowId);

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
        query: route.parameters.query || safeRequest.text,
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

    if (this.shouldWaitForWorkflowConfirmation(route.workflowId, shouldExecuteWorkflow)) {
      yield { conversationId, delta: '', finishReason: 'stop' };
      return;
    }

    // 3. Response Composer Stream
    const stream = this.composer.streamCompose({
      userQuery: safeRequest.text,
      workflowId: route.workflowId,
      parameters: route.parameters,
      toolResults,
      searchResultContext,
      taggedPlaceIds: safeRequest.taggedPlaceIds,
      taggedPlaces: safeRequest.taggedPlaces,
      userContext: safeRequest.userContext,
    }, history);

    const assistantParts: string[] = [];
    for await (const chunk of stream) {
      assistantParts.push(chunk);
      yield { conversationId, delta: chunk };
    }

    const fullAnswer = assistantParts.join('');
    await this.store.append(conversationId, { role: 'assistant', content: fullAnswer }, userId);

    yield { conversationId, delta: '', finishReason: 'stop' };
  }

  private resolveConversationId(candidate?: string, userId?: string): string {
    if (!candidate) return this.store.createId(userId);
    if (this.uuidRegex.test(candidate)) return candidate;

    this.logger.warn(`Ignoring invalid conversationId "${candidate}" and creating a new conversation.`);
    return this.store.createId(userId);
  }

  private sanitizeRequest(request: ChatRequestDto): ChatRequestDto {
    const text = this.truncateString(request.text || '', this.maxTextLength)?.trim() || '';

    return {
      ...request,
      text,
      conversationId: this.truncateString(request.conversationId, 120),
      taggedPlaceIds: this.sanitizeStringArray(request.taggedPlaceIds, this.maxContextPlaces, 240),
      taggedPlaces: this.sanitizeTaggedPlaces(request.taggedPlaces),
      userContext: request.userContext ? {
        displayName: this.truncateString(request.userContext.displayName, 240),
        lat: request.userContext.lat,
        lng: request.userContext.lng,
        timezone: this.truncateString(request.userContext.timezone, 120),
        locale: this.truncateString(request.userContext.locale, 20),
      } : undefined,
      wizardPreferences: request.wizardPreferences ? {
        preferences: this.sanitizeStringArray(request.wizardPreferences.preferences, 30, 160),
        guestCount: request.wizardPreferences.guestCount,
        criteria: this.sanitizeStringArray(request.wizardPreferences.criteria, 20, 120),
        budget: this.truncateString(request.wizardPreferences.budget, 120),
        types: this.sanitizeStringArray(request.wizardPreferences.types, 20, 120),
      } : undefined,
      workflowExecution: request.workflowExecution ? {
        confirmed: request.workflowExecution.confirmed,
        workflowId: this.truncateString(request.workflowExecution.workflowId, 80),
        parameters: this.sanitizeWorkflowParameters(request.workflowExecution.parameters),
      } : undefined,
    };
  }

  private sanitizeTaggedPlaces(places?: any[]): any[] | undefined {
    if (!Array.isArray(places)) return undefined;

    const sanitized = places.slice(0, this.maxContextPlaces).map((place) => ({
      id: this.truncateString(place?.id, 240),
      name: this.truncateString(place?.name, 400),
      placeName: this.truncateString(place?.placeName, 400),
      address: this.truncateString(place?.address, 800),
      placeAddress: this.truncateString(place?.placeAddress, 800),
      type: this.truncateString(place?.type, 160),
      latitude: this.sanitizeNumber(place?.latitude),
      longitude: this.sanitizeNumber(place?.longitude),
      lat: this.sanitizeNumber(place?.lat),
      lng: this.sanitizeNumber(place?.lng),
      rating: this.sanitizeNumber(place?.rating),
      averageRating: this.sanitizeNumber(place?.averageRating),
      amenities: this.sanitizeStringArray(place?.amenities, 30, 160),
    })).filter((place) => place.id || place.name || place.placeName);

    return sanitized.length ? sanitized : undefined;
  }

  private sanitizeWorkflowParameters(parameters?: Record<string, any>): Record<string, any> | undefined {
    if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) return undefined;

    return {
      query: this.truncateString(parameters.query, 1000),
      location: this.truncateString(parameters.location, 400),
      locations: this.sanitizeStringArray(parameters.locations, 20, 400),
      anchor: this.truncateString(parameters.anchor, 400),
      budget: this.truncateString(parameters.budget, 120),
      type: this.truncateString(parameters.type, 240),
      types: this.sanitizeStringArray(parameters.types, 20, 120),
      placeNames: this.sanitizeStringArray(parameters.placeNames, 50, 400),
      criteria: this.truncateString(parameters.criteria, 240),
      placeName: this.truncateString(parameters.placeName, 400),
      preferences: this.sanitizeStringArray(parameters.preferences, 30, 160),
    };
  }

  private sanitizeStringArray(values: unknown, maxItems: number, maxLength: number): string[] | undefined {
    if (!Array.isArray(values)) return undefined;

    const strings = values
      .slice(0, maxItems)
      .map((value) => this.truncateString(value, maxLength)?.trim())
      .filter((value): value is string => Boolean(value));

    return strings.length ? strings : undefined;
  }

  private truncateString(value: unknown, maxLength: number): string | undefined {
    if (typeof value !== 'string') return undefined;
    return value.length > maxLength ? value.slice(0, maxLength) : value;
  }

  private sanitizeNumber(value: unknown): number | undefined {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : undefined;
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

  private shouldWaitForWorkflowConfirmation(workflowId: string, alreadyExecuting: boolean): boolean {
    return !alreadyExecuting && (workflowId === 'SEARCH_PLACES' || workflowId === 'COMPARE_PLACES');
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
