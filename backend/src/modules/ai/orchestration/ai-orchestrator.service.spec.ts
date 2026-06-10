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

  it('returns compare workflow metadata without composing when compare is not confirmed', async () => {
    const store = createStore();
    const { service, router, composer } = createService(store);
    router.route.mockResolvedValueOnce({
      workflowId: 'COMPARE_PLACES',
      parameters: { criteria: 'overall' },
    } as any);

    const response = await service.processQuery({
      ...request,
      text: 'So sánh các địa điểm tôi vừa tag',
    });

    expect(response.workflowAction).toEqual({
      type: 'compare',
      parameters: { criteria: 'overall' },
    });
    expect(response.answer).toBe('');
    expect(composer.compose).not.toHaveBeenCalled();
  });

  it('streams compare workflow metadata without composing when compare is not confirmed', async () => {
    const store = createStore();
    const { service, router, composer } = createService(store);
    router.route.mockResolvedValueOnce({
      workflowId: 'COMPARE_PLACES',
      parameters: { criteria: 'overall' },
    } as any);

    const chunks = [];
    for await (const chunk of service.streamQuery({
      ...request,
      text: 'So sánh các địa điểm tôi vừa tag',
    })) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      {
        conversationId: request.conversationId,
        delta: '',
        workflowAction: {
          type: 'compare',
          parameters: { criteria: 'overall' },
        },
      },
      { conversationId: request.conversationId, delta: '', finishReason: 'stop' },
    ]);
    expect(composer.streamCompose).not.toHaveBeenCalled();
  });

  it('composes compare workflow when confirmed by the frontend', async () => {
    const store = createStore();
    const { service, router, composer } = createService(store);

    const response = await service.processQuery({
      ...request,
      text: 'So sánh các địa điểm tôi đã tag theo giá và vị trí.',
      taggedPlaceIds: ['serpapi-a', 'serpapi-b'],
      taggedPlaces: [
        { id: 'serpapi-a', name: 'Alpha Hotel', price: '800.000đ/đêm', reviewCount: 120, amenities: ['wifi'] },
        { id: 'serpapi-b', name: 'Beta Homestay', price: '650.000đ/đêm', reviewCount: 80, amenities: ['parking'] },
      ],
      workflowExecution: {
        workflowId: 'COMPARE_PLACES',
        confirmed: true,
        parameters: { criteria: ['price', 'location'] },
      },
    } as any);

    expect(router.route).not.toHaveBeenCalled();
    expect(response.workflowAction).toBeUndefined();
    expect(response.answer).toBe('Composed answer');
    expect(composer.compose).toHaveBeenCalledWith(
      expect.objectContaining({
        workflowId: 'COMPARE_PLACES',
        parameters: expect.objectContaining({ criteria: ['price', 'location'] }),
        taggedPlaceIds: ['serpapi-a', 'serpapi-b'],
        taggedPlaces: expect.arrayContaining([
          expect.objectContaining({ id: 'serpapi-a', price: '800.000đ/đêm', reviewCount: 120, amenities: ['wifi'] }),
        ]),
      }),
      expect.any(Array),
    );
  });
});
