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
      append: jest.fn(async (_conversationId: string, message: ChatMessage): Promise<any> => {
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
    const placeComparisonResultsService = {
      parsePayload: jest.fn<any, any[]>(() => null),
      toAssistantMessage: jest.fn(),
      createForMessage: jest.fn(),
    };

    const service = new AiOrchestratorService(
      router as any,
      engine as any,
      composer as any,
      store as any,
      searchResultContextBuilder as any,
      placeComparisonResultsService as any,
    );

    return { service, router, composer, placeComparisonResultsService };
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

  it('stores compare payload separately and returns analysis text plus comparison id', async () => {
    const store = createStore();
    store.append.mockImplementation(async (_conversationId: string, message: ChatMessage) => {
      (store.getHistory as jest.Mock).mockResolvedValue([...baseHistory, message]);
      return { id: 'message-1' };
    });
    const { service, composer, placeComparisonResultsService } = createService(store);
    const payload = {
      type: 'place_comparison',
      places: [{ id: 'a', name: 'Alpha' }, { id: 'b', name: 'Beta' }],
      comparisonRows: [],
      overallAssessment: { summary: 'Alpha phù hợp hơn.' },
    };

    composer.compose.mockResolvedValueOnce({ answer: JSON.stringify(payload) });
    placeComparisonResultsService.parsePayload.mockReturnValueOnce(payload);
    placeComparisonResultsService.toAssistantMessage.mockReturnValueOnce('Alpha phù hợp hơn.');
    placeComparisonResultsService.createForMessage.mockResolvedValueOnce({ id: 'comparison-1' });

    const response = await service.processQuery({
      ...request,
      text: 'So sánh các địa điểm tôi đã tag theo giá và vị trí.',
      workflowExecution: {
        workflowId: 'COMPARE_PLACES',
        confirmed: true,
        parameters: {},
      },
    } as any);

    expect(response.answer).toBe('Alpha phù hợp hơn.');
    expect(response.comparisonResultId).toBe('comparison-1');
    expect(store.append).toHaveBeenLastCalledWith(
      request.conversationId,
      { role: 'assistant', content: 'Alpha phù hợp hơn.' },
      undefined,
    );
    expect(placeComparisonResultsService.createForMessage).toHaveBeenCalledWith({
      conversationId: request.conversationId,
      messageId: 'message-1',
      payload,
    });
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
