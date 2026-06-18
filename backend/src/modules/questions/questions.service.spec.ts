import { ForbiddenException } from '@nestjs/common';
import { QuestionsService } from './questions.service';

describe('QuestionsService test mode', () => {
  const createService = () => {
    const prisma = {
      question: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      answer: {
        create: jest.fn(),
      },
      presence: {
        findMany: jest.fn(),
      },
    };
    const usersService = {
      upsertFromFirebaseUser: jest.fn(),
      findByFirebaseUid: jest.fn(),
    };
    const placesService = {
      findOne: jest.fn(),
      ensureGoogleReviewsForAiContext: jest.fn(),
    };
    const localFixtures = {
      findOne: jest.fn(() => ({
        id: 'local-0',
        source: 'local',
        placeName: 'Fixture Hotel',
        placeAddress: 'Da Nang',
        categories: ['hotel'],
        averageRating: 4.5,
        reviewCount: 2,
        rawSerpApiPropertyDetails: {
          description: 'Khách sạn gần trung tâm, có bãi xe và hồ bơi.',
          amenities: ['parking', 'pool', 'wifi'],
          phone: '0123456789',
          rooms: 40,
        },
      })),
      findReviews: jest.fn(() => [
        {
          id: 'local-review-0-0',
          source: 'local',
          rating: 5,
          author: 'Anh Minh',
          reviewText: 'Có bãi gửi xe máy ngay trước sảnh và nhân viên hỗ trợ nhanh.',
        },
      ]),
    };
    const chatService = {
      answerPlaceQuestion: jest.fn(async () => 'Câu trả lời AI fixture.'),
    };
    const runtimeConfig = {
      environment: 'test',
    };

    const service = new QuestionsService(
      prisma as any,
      usersService as any,
      placesService as any,
      localFixtures as any,
      chatService as any,
      runtimeConfig as any,
    );

    return { service, prisma, usersService, placesService, localFixtures, chatService };
  };

  it('creates, answers, lists, and deletes questions without touching the database', async () => {
    const { service, prisma, usersService, placesService, localFixtures, chatService } = createService();
    const firebaseUser = { uid: 'user-1', email: 'user@example.com', name: 'Test User' };

    const created = await service.createQuestion({
      placeId: 'local-0',
      title: 'Có chỗ gửi xe không?',
      questionText: 'Ở đây có chỗ gửi xe máy không?',
    }, firebaseUser);

    expect(created).toMatchObject({
      placeId: 'local-0',
      title: 'Có chỗ gửi xe không?',
      author: {
        firebaseUid: 'user-1',
        displayName: 'Test User',
      },
      aiAnswer: null,
    });

    await new Promise((resolve) => setImmediate(resolve));

    const threadAfterAi = await service.getQuestionThread(created.id);
    expect(threadAfterAi.aiAnswer).toMatchObject({
      answerText: 'Câu trả lời AI fixture.',
      isAiGenerated: true,
    });

    expect(localFixtures.findOne).toHaveBeenCalledWith('0');
    expect(localFixtures.findReviews).toHaveBeenCalledWith('0');
    expect(chatService.answerPlaceQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        placeName: 'Fixture Hotel',
        placeAddress: 'Da Nang',
        questionText: 'Ở đây có chỗ gửi xe máy không?',
        placeContext: expect.objectContaining({
          source: 'local',
          categories: ['hotel'],
          averageRating: 4.5,
          reviewCount: 2,
          description: 'Khách sạn gần trung tâm, có bãi xe và hồ bơi.',
          amenities: ['parking', 'pool', 'wifi'],
          contact: expect.objectContaining({
            phone: '0123456789',
          }),
          rooms: 40,
          reviewSnippets: [
            expect.objectContaining({
              source: 'local',
              rating: 5,
              author: 'Anh Minh',
              text: 'Có bãi gửi xe máy ngay trước sảnh và nhân viên hỗ trợ nhanh.',
            }),
          ],
        }),
      }),
    );

    const answered = await service.createAnswer(created.id, {
      answerText: 'Có, ngay trước sảnh.',
    }, firebaseUser);
    expect(answered.answers).toHaveLength(1);
    expect(answered.answers[0]).toMatchObject({
      answerText: 'Có, ngay trước sảnh.',
      author: {
        firebaseUid: 'user-1',
      },
    });

    const listed = await service.listByPlace('local-0');
    expect(listed).toHaveLength(1);

    await service.deleteQuestion(created.id, firebaseUser);
    await expect(service.listByPlace('local-0')).resolves.toEqual([]);

    expect(usersService.upsertFromFirebaseUser).not.toHaveBeenCalled();
    expect(usersService.findByFirebaseUid).not.toHaveBeenCalled();
    expect(placesService.findOne).not.toHaveBeenCalled();
    expect(placesService.ensureGoogleReviewsForAiContext).not.toHaveBeenCalled();
    expect(prisma.question.create).not.toHaveBeenCalled();
    expect(prisma.question.findMany).not.toHaveBeenCalled();
    expect(prisma.question.findUnique).not.toHaveBeenCalled();
    expect(prisma.question.delete).not.toHaveBeenCalled();
    expect(prisma.answer.create).not.toHaveBeenCalled();
    expect(prisma.presence.findMany).not.toHaveBeenCalled();
  });

  it('keeps ownership checks in memory in test mode', async () => {
    const { service, usersService, prisma } = createService();
    const created = await service.createQuestion({
      placeId: 'local-0',
      questionText: 'Có yên tĩnh không?',
    }, { uid: 'owner', email: 'owner@example.com' });

    await expect(service.deleteQuestion(created.id, { uid: 'other', email: 'other@example.com' }))
      .rejects
      .toBeInstanceOf(ForbiddenException);
    expect(usersService.findByFirebaseUid).not.toHaveBeenCalled();
    expect(prisma.question.delete).not.toHaveBeenCalled();
  });
});
