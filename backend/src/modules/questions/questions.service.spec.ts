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
    };
    const localFixtures = {
      findOne: jest.fn(() => ({
        id: 'local-0',
        placeName: 'Fixture Hotel',
        placeAddress: 'Da Nang',
      })),
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
      aiAnswer: {
        answerText: 'Câu trả lời AI fixture.',
        isAiGenerated: true,
      },
    });
    expect(localFixtures.findOne).toHaveBeenCalledWith('0');
    expect(chatService.answerPlaceQuestion).toHaveBeenCalledWith({
      placeName: 'Fixture Hotel',
      placeAddress: 'Da Nang',
      questionText: 'Ở đây có chỗ gửi xe máy không?',
    });

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
