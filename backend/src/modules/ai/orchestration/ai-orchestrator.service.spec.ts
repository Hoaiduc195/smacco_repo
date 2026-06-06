import { AiOrchestratorService } from './ai-orchestrator.service';
import { ChatRequestDto } from '../dto/chat-request.dto';
import { ChatMessage } from '../dto/chat-response.dto';

describe('AiOrchestratorService history ordering', () => {
  const baseHistory: ChatMessage[] = [
    { role: 'assistant', content: 'Previous assistant message' },
  ];

  const createStore = () => {
    let history = [...baseHistory];

    return {
      createId: jest.fn(() => '11111111-1111-1111-1111-111111111111'),
      getHistory: jest.fn(async () => [...history]),
      append: jest.fn(async (_conversationId: string, message: ChatMessage) => {
        history = [...history, message];
      }),
    };
  };

  const createService = (store: ReturnType<typeof createStore>) => {
    const router = {
      route: jest.fn(async (_text: string, _history?: ChatMessage[]) => ({
        workflowId: 'GENERAL_CHAT',
        parameters: { topic: 'test' },
      })),
    };

    const composer = {
      compose: jest.fn(async () => ({ answer: 'Composed answer' })),
      streamCompose: jest.fn(async function* () {
        yield 'streamed answer';
      }),
    };

    const engine = {
      executeWorkflow: jest.fn(),
    };

    const searchResultContextBuilder = {
      build: jest.fn(),
    };

    const service = new AiOrchestratorService(
      router as any,
      engine as any,
      composer as any,
      store as any,
      searchResultContextBuilder as any,
    );

    return { service, router, composer };
  };

  const request: ChatRequestDto = {
    text: 'Find me something nearby',
    conversationId: '11111111-1111-1111-1111-111111111111',
  };

  it('includes the current user turn in router and composer history for processQuery', async () => {
    const store = createStore();
    const { service, router, composer } = createService(store);

    await service.processQuery(request);

    const expectedHistory = [
      ...baseHistory,
      { role: 'user', content: request.text },
    ];

    expect(router.route).toHaveBeenCalledWith(request.text, expectedHistory);
    expect(composer.compose).toHaveBeenCalledWith(
      expect.any(Object),
      expectedHistory,
    );
  });

  it('includes the current user turn in router and composer history for streamQuery', async () => {
    const store = createStore();
    const { service, router, composer } = createService(store);

    const chunks: string[] = [];
    for await (const chunk of service.streamQuery(request)) {
      chunks.push(chunk.delta);
    }

    const expectedHistory = [
      ...baseHistory,
      { role: 'user', content: request.text },
    ];

    expect(chunks).toContain('streamed answer');
    expect(router.route).toHaveBeenCalledWith(request.text, expectedHistory);
    expect(composer.streamCompose).toHaveBeenCalledWith(
      expect.any(Object),
      expectedHistory,
    );
  });
});
