import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { PlacesService } from '../places/places.service';
import { ChatService } from '../ai/chat.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';
import { RuntimeConfigService } from '../../config/runtime-config.service';

type FirebaseUser = {
  uid: string;
  email?: string | null;
  name?: string | null;
};

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);
  private mockQuestions: any[] = [];
  private mockAnswers: any[] = [];

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly placesService: PlacesService,
    private readonly chatService: ChatService,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {}

  async listByPlace(placeId: string) {
    if (this.runtimeConfig.environment === 'test') {
      const questions = this.mockQuestions.filter(q => q.placeId === placeId);
      questions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      
      const formatted = [];
      for (const q of questions) {
        const qAnswers = this.mockAnswers.filter(ans => ans.questionId === q.id);
        qAnswers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        
        formatted.push({
          id: q.id,
          placeId: q.placeId,
          title: q.title,
          questionText: q.questionText,
          status: q.status,
          createdAt: q.createdAt,
          updatedAt: q.updatedAt,
          author: {
            id: q.user?.id || null,
            firebaseUid: q.user?.firebaseUid || null,
            displayName: q.user?.displayName || q.user?.email || 'Người dùng',
            initials: (q.user?.displayName || q.user?.email || 'N').slice(0, 1).toUpperCase(),
            isOnsite: false,
            isAi: false,
          },
          aiAnswer: qAnswers.find(ans => ans.isAiGenerated) || null,
          answers: qAnswers.filter(ans => !ans.isAiGenerated).map(ans => ({
            id: ans.id,
            answerText: ans.answerText,
            createdAt: ans.createdAt,
            updatedAt: ans.updatedAt,
            isAiGenerated: false,
            author: {
              id: ans.user?.id || null,
              firebaseUid: ans.user?.firebaseUid || null,
              displayName: ans.user?.displayName || ans.user?.email || 'Người dùng',
              initials: (ans.user?.displayName || ans.user?.email || 'N').slice(0, 1).toUpperCase(),
              isOnsite: false,
              isAi: false,
            },
          })),
        });
      }
      return formatted;
    }

    const resolvedPlaceId = await this.resolvePlaceId(placeId);
    if (!resolvedPlaceId || !this.isUuid(resolvedPlaceId)) {
      return [];
    }

    const questions = await this.prisma.question.findMany({
      where: { placeId: resolvedPlaceId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        answers: {
          orderBy: { createdAt: 'asc' },
          include: { user: true },
        },
      },
    });

    const participantIds = new Set<string>();
    for (const question of questions) {
      if (question.userId) participantIds.add(question.userId);
      for (const answer of question.answers) {
        if (answer.userId) participantIds.add(answer.userId);
      }
    }

    const onsiteUserIds = await this.getActiveOnsiteUserIds(resolvedPlaceId, [...participantIds]);
    return questions.map((question) => this.formatQuestionThread(question, onsiteUserIds));
  }

  async createQuestion(dto: CreateQuestionDto, firebaseUser: FirebaseUser) {
    const author = await this.usersService.upsertFromFirebaseUser(firebaseUser);
    const place = await this.resolvePlace(dto.placeId);

    if (!place) {
      throw new BadRequestException(`Place #${dto.placeId} not found`);
    }

    if (this.runtimeConfig.environment === 'test') {
      const questionId = `mock-q-${Math.random().toString(36).substring(2, 9)}`;
      const mockQuestion = {
        id: questionId,
        placeId: dto.placeId,
        userId: author.id,
        title: dto.title?.trim() || null,
        questionText: dto.questionText.trim(),
        status: 'open',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: author,
      };
      this.mockQuestions.push(mockQuestion);

      await this.createAiAnswer(questionId, place.placeName || place.name || `Địa điểm`, place.placeAddress || place.address || null, dto.questionText);
      return this.getQuestionThread(questionId);
    }

    const question = await this.prisma.question.create({
      data: {
        placeId: place.id,
        userId: author.id,
        title: dto.title?.trim() || null,
        questionText: dto.questionText.trim(),
        status: 'open',
      },
    });

    await this.createAiAnswer(question.id, place.placeName, place.placeAddress, dto.questionText);
    return this.getQuestionThread(question.id);
  }

  async createAnswer(questionId: string, dto: CreateAnswerDto, firebaseUser: FirebaseUser) {
    if (this.runtimeConfig.environment === 'test') {
      const question = this.mockQuestions.find(q => q.id === questionId);
      if (!question) {
        throw new BadRequestException(`Question #${questionId} not found`);
      }
      const author = await this.usersService.upsertFromFirebaseUser(firebaseUser);
      const answerId = `mock-a-${Math.random().toString(36).substring(2, 9)}`;
      const mockAnswer = {
        id: answerId,
        questionId,
        userId: author.id,
        answerText: dto.answerText.trim(),
        createdAt: new Date(),
        updatedAt: new Date(),
        user: author,
        isAiGenerated: false,
      };
      this.mockAnswers.push(mockAnswer);
      return this.getQuestionThread(questionId);
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: { place: true },
    });

    if (!question) {
      throw new BadRequestException(`Question #${questionId} not found`);
    }

    const author = await this.usersService.upsertFromFirebaseUser(firebaseUser);

    await this.prisma.answer.create({
      data: {
        questionId,
        userId: author.id,
        answerText: dto.answerText.trim(),
      },
    });

    return this.getQuestionThread(questionId);
  }

  async getQuestionThread(questionId: string, onsiteUserIds?: Set<string>) {
    if (this.runtimeConfig.environment === 'test') {
      const q = this.mockQuestions.find(quest => quest.id === questionId);
      if (!q) {
        throw new BadRequestException(`Question #${questionId} not found`);
      }
      const qAnswers = this.mockAnswers.filter(ans => ans.questionId === questionId);
      qAnswers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      return {
        id: q.id,
        placeId: q.placeId,
        title: q.title,
        questionText: q.questionText,
        status: q.status,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        author: {
          id: q.user?.id || null,
          firebaseUid: q.user?.firebaseUid || null,
          displayName: q.user?.displayName || q.user?.email || 'Người dùng',
          initials: (q.user?.displayName || q.user?.email || 'N').slice(0, 1).toUpperCase(),
          isOnsite: false,
          isAi: false,
        },
        aiAnswer: qAnswers.find(ans => ans.isAiGenerated) || null,
        answers: qAnswers.filter(ans => !ans.isAiGenerated).map(ans => ({
          id: ans.id,
          answerText: ans.answerText,
          createdAt: ans.createdAt,
          updatedAt: ans.updatedAt,
          isAiGenerated: false,
          author: {
            id: ans.user?.id || null,
            firebaseUid: ans.user?.firebaseUid || null,
            displayName: ans.user?.displayName || ans.user?.email || 'Người dùng',
            initials: (ans.user?.displayName || ans.user?.email || 'N').slice(0, 1).toUpperCase(),
            isOnsite: false,
            isAi: false,
          },
        })),
      };
    }

    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
      include: {
        place: true,
        user: true,
        answers: {
          orderBy: { createdAt: 'asc' },
          include: { user: true },
        },
      },
    });

    if (!question) {
      throw new BadRequestException(`Question #${questionId} not found`);
    }

    const participantIds = new Set<string>();
    if (question.userId) participantIds.add(question.userId);
    for (const answer of question.answers || []) {
      if (answer.userId) participantIds.add(answer.userId);
    }

    const onsiteIds = onsiteUserIds ?? (await this.getActiveOnsiteUserIds(question.placeId, [...participantIds]));
    return this.formatQuestionThread(question as any, onsiteIds);
  }

  async deleteQuestion(questionId: string, firebaseUser: FirebaseUser): Promise<void> {
    const dbUser = await this.usersService.findByFirebaseUid(firebaseUser.uid);
    if (!dbUser) throw new ForbiddenException('Không tìm thấy người dùng.');

    if (this.runtimeConfig.environment === 'test') {
      const questionIdx = this.mockQuestions.findIndex(q => q.id === questionId);
      if (questionIdx === -1) throw new NotFoundException(`Question #${questionId} not found`);
      if (this.mockQuestions[questionIdx].userId !== dbUser.id) {
        throw new ForbiddenException('Bạn chỉ có thể xóa câu hỏi của chính mình.');
      }
      this.mockQuestions.splice(questionIdx, 1);
      this.mockAnswers = this.mockAnswers.filter(ans => ans.questionId !== questionId);
      return;
    }

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question #${questionId} not found`);

    if (question.userId !== dbUser.id) {
      throw new ForbiddenException('Bạn chỉ có thể xóa câu hỏi của chính mình.');
    }

    await this.prisma.question.delete({ where: { id: questionId } });
  }

  private async createAiAnswer(questionId: string, placeName: string, placeAddress: string | null, questionText: string) {
    if (this.runtimeConfig.environment === 'test') {
      try {
        const aiAnswerText = await this.chatService.answerPlaceQuestion({
          placeName,
          placeAddress,
          questionText,
        });
        this.mockAnswers.push({
          id: `mock-a-ai-${Math.random().toString(36).substring(2, 9)}`,
          questionId,
          userId: null,
          answerText: aiAnswerText,
          createdAt: new Date(),
          updatedAt: new Date(),
          isAiGenerated: true,
          author: {
            id: 'ai',
            displayName: 'AI',
            initials: 'AI',
            isOnsite: false,
            isAi: true,
          },
        });
      } catch (error) {
        this.logger.warn(`Unable to generate AI answer for question ${questionId}: ${(error as Error).message}`);
        this.mockAnswers.push({
          id: `mock-a-ai-${Math.random().toString(36).substring(2, 9)}`,
          questionId,
          userId: null,
          answerText: 'Hiện tại AI chưa tạo được câu trả lời cho câu hỏi này. Bạn có thể đợi thêm hoặc để cộng đồng onsite hỗ trợ thêm.',
          createdAt: new Date(),
          updatedAt: new Date(),
          isAiGenerated: true,
          author: {
            id: 'ai',
            displayName: 'AI',
            initials: 'AI',
            isOnsite: false,
            isAi: true,
          },
        });
      }
      return;
    }

    try {
      const aiAnswerText = await this.chatService.answerPlaceQuestion({
        placeName,
        placeAddress,
        questionText,
      });

      await this.prisma.answer.create({
        data: {
          questionId,
          userId: null,
          answerText: aiAnswerText,
        },
      });
    } catch (error) {
      this.logger.warn(`Unable to generate AI answer for question ${questionId}: ${(error as Error).message}`);
      await this.prisma.answer.create({
        data: {
          questionId,
          userId: null,
          answerText:
            'Hiện tại AI chưa tạo được câu trả lời cho câu hỏi này. Bạn có thể đợi thêm hoặc để cộng đồng onsite hỗ trợ thêm.',
        },
      });
    }
  }

  private async getActiveOnsiteUserIds(placeId: string, userIds: string[]) {
    if (!userIds.length) return new Set<string>();

    const activeStatuses = await this.prisma.presence.findMany({
      where: {
        placeId,
        leftAt: null,
        userId: { in: userIds },
      },
      select: {
        userId: true,
      },
    });

    return new Set(activeStatuses.map((presence) => presence.userId));
  }

  private async resolvePlace(placeId: string) {
    return this.placesService.findOne(placeId).catch(() => null);
  }

  private async resolvePlaceId(placeId: string) {
    const place = await this.resolvePlace(placeId);
    return place?.id ?? null;
  }

  private formatQuestionThread(question: any, onsiteUserIds: Set<string>) {
    const userId = question.userId || null;
    const answers = (question.answers || []).map((answer: any) => this.formatAnswer(answer, onsiteUserIds.has(answer.userId ?? '')));
    const aiAnswer = answers.find((answer: any) => answer.isAiGenerated) || null;
    const userAnswers = answers.filter((answer: any) => !answer.isAiGenerated);

    return {
      id: question.id,
      placeId: question.placeId,
      title: question.title,
      questionText: question.questionText,
      status: question.status,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      author: this.formatAuthor(question.user, userId ? onsiteUserIds.has(userId) : false),
      aiAnswer,
      answers: userAnswers,
    };
  }

  private formatAnswer(answer: any, isOnsiteAuthor: boolean) {
    if (!answer.userId) {
      return {
        id: answer.id,
        answerText: answer.answerText,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
        isAiGenerated: true,
        author: {
          id: 'ai',
          displayName: 'AI',
          initials: 'AI',
          isOnsite: false,
          isAi: true,
        },
      };
    }

    return {
      id: answer.id,
      answerText: answer.answerText,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
      isAiGenerated: false,
      author: this.formatAuthor(answer.user, isOnsiteAuthor),
    };
  }

  private formatAuthor(user: any, isOnsite: boolean) {
    const displayName = user?.displayName || user?.email || 'Người dùng';
    return {
      id: user?.id || null,
      firebaseUid: user?.firebaseUid || null,
      displayName,
      initials: displayName.slice(0, 1).toUpperCase(),
      isOnsite,
      isAi: false,
    };
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}