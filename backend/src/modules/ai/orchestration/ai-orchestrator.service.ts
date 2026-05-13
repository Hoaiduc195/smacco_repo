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
    if (route.workflowId === 'SEARCH_PLACES') {
      searchAction = {
        isSearch: true,
        query: route.parameters.query || request.text,
        location: route.parameters.location,
        type: route.parameters.type,
        budget: route.parameters.budget,
      };
    }

    let toolResults = {};
    const workflow = WORKFLOW_REGISTRY[route.workflowId];

    // 2. Workflow Engine: Execute tools if steps exist
    if (workflow && workflow.steps.length > 0) {
      const execution = await this.engine.executeWorkflow(workflow, route.parameters);
      toolResults = execution.stepResults;
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
    
    // Yield search intent immediately to frontend so it can update UI
    if (route.workflowId === 'SEARCH_PLACES') {
      const searchAction = {
        isSearch: true,
        query: route.parameters.query || request.text,
        location: route.parameters.location,
        type: route.parameters.type,
        budget: route.parameters.budget,
      };
      
      yield {
        conversationId,
        delta: '',
        searchAction,
      } as any;
    }

    let toolResults = {};
    const workflow = WORKFLOW_REGISTRY[route.workflowId];

    // 2. Workflow Engine (Executes BEFORE streaming text begins)
    // Note: Tools are executed synchronously first, then the LLM composes stream
    if (workflow && workflow.steps.length > 0) {
      const execution = await this.engine.executeWorkflow(workflow, route.parameters);
      toolResults = execution.stepResults;
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
