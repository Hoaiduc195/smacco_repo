import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { PlacesService } from '../places/places.service';
import { ChatService } from '../ai/chat.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { CreateAnswerDto } from './dto/create-answer.dto';

type FirebaseUser = {
  uid: string;
  email?: string | null;
  name?: string | null;
};

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly placesService: PlacesService,
    private readonly chatService: ChatService,
  ) {}

  async listByPlace(placeId: string) {
    const resolvedPlaceId = await this.resolvePlaceId(placeId);
    if (!resolvedPlaceId) {
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

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question #${questionId} not found`);

    if (question.userId !== dbUser.id) {
      throw new ForbiddenException('Bạn chỉ có thể xóa câu hỏi của chính mình.');
    }

    await this.prisma.question.delete({ where: { id: questionId } });
  }

  private async createAiAnswer(questionId: string, placeName: string, placeAddress: string | null, questionText: string) {
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