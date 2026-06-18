import { BadRequestException, ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { PlacesService } from '../places/places.service';
import { LocalFixturePlacesService } from '../places/local-fixture-places.service';
import { ChatService, PlaceQuestionContext } from '../ai/chat.service';
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
    private readonly localFixtures: LocalFixturePlacesService,
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
    if (this.isTestMode()) {
      const author = this.buildMockAuthor(firebaseUser);
      const place = this.resolveMockPlaceInfo(dto.placeId);
      const questionId = `mock-q-${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date();
      const mockQuestion = {
        id: questionId,
        placeId: dto.placeId,
        userId: author.id,
        title: dto.title?.trim() || null,
        questionText: dto.questionText.trim(),
        status: 'open',
        createdAt: now,
        updatedAt: now,
        user: author,
      };
      this.mockQuestions.push(mockQuestion);

      const createdThread = await this.getQuestionThread(questionId);
      this.createAiAnswerInBackground(questionId, place, dto.questionText);
      return createdThread;
    }

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

    const createdThread = await this.getQuestionThread(question.id);
    this.createAiAnswerInBackground(question.id, place, dto.questionText);
    return createdThread;
  }

  async createAnswer(questionId: string, dto: CreateAnswerDto, firebaseUser: FirebaseUser) {
    if (this.isTestMode()) {
      const question = this.mockQuestions.find(q => q.id === questionId);
      if (!question) {
        throw new BadRequestException(`Question #${questionId} not found`);
      }
      const author = this.buildMockAuthor(firebaseUser);
      const answerId = `mock-a-${Math.random().toString(36).substring(2, 9)}`;
      const now = new Date();
      const mockAnswer = {
        id: answerId,
        questionId,
        userId: author.id,
        answerText: dto.answerText.trim(),
        createdAt: now,
        updatedAt: now,
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
    if (this.isTestMode()) {
      const userId = this.buildMockAuthor(firebaseUser).id;
      const questionIdx = this.mockQuestions.findIndex(q => q.id === questionId);
      if (questionIdx === -1) throw new NotFoundException(`Question #${questionId} not found`);
      const question = this.mockQuestions[questionIdx];
      if (question.userId !== userId && question.user?.firebaseUid !== firebaseUser.uid) {
        throw new ForbiddenException('Bạn chỉ có thể xóa câu hỏi của chính mình.');
      }
      this.mockQuestions.splice(questionIdx, 1);
      this.mockAnswers = this.mockAnswers.filter(ans => ans.questionId !== questionId);
      return;
    }

    const dbUser = await this.usersService.findByFirebaseUid(firebaseUser.uid);
    if (!dbUser) throw new ForbiddenException('Không tìm thấy người dùng.');

    const question = await this.prisma.question.findUnique({ where: { id: questionId } });
    if (!question) throw new NotFoundException(`Question #${questionId} not found`);

    if (question.userId !== dbUser.id) {
      throw new ForbiddenException('Bạn chỉ có thể xóa câu hỏi của chính mình.');
    }

    await this.prisma.question.delete({ where: { id: questionId } });
  }

  private async createAiAnswer(questionId: string, place: any, questionText: string) {
    const placeName = this.getPlaceName(place);
    const placeAddress = this.getPlaceAddress(place);
    const placeContext = await this.buildPlaceQuestionContext(place);

    if (this.isTestMode()) {
      try {
        const aiAnswerText = await this.chatService.answerPlaceQuestion({
          placeName,
          placeAddress,
          questionText,
          placeContext,
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
        placeContext,
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

  private createAiAnswerInBackground(questionId: string, place: any, questionText: string) {
    void this.createAiAnswer(questionId, place, questionText).catch((error) => {
      this.logger.warn(`Background AI answer generation failed for question ${questionId}: ${(error as Error).message}`);
    });
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

  private isTestMode(): boolean {
    return this.runtimeConfig.environment === 'test';
  }

  private buildMockAuthor(firebaseUser: FirebaseUser) {
    const uid = firebaseUser?.uid || 'anonymous';
    const displayName = firebaseUser?.name || firebaseUser?.email || 'Người dùng';
    return {
      id: `mock-user-${uid}`,
      firebaseUid: uid,
      email: firebaseUser?.email || null,
      displayName,
    };
  }

  private resolveMockPlaceInfo(placeId: string): any {
    const localSourcePlaceId = this.getLocalSourcePlaceId(placeId);
    if (localSourcePlaceId !== null) {
      try {
        const place = this.localFixtures.findOne(localSourcePlaceId);
        return {
          ...place,
          id: place?.id || placeId,
          placeName: place?.placeName || place?.name || `Địa điểm ${placeId}`,
          placeAddress: place?.placeAddress || place?.address || null,
          reviewSnippets: this.localFixtures.findReviews(localSourcePlaceId),
        };
      } catch {
        // Fall through to a non-DB fallback below.
      }
    }

    return {
      id: placeId,
      source: 'local',
      placeName: `Địa điểm ${placeId}`,
      placeAddress: null,
    };
  }

  private getLocalSourcePlaceId(placeId: string): string | null {
    if (!placeId) return null;
    if (placeId.startsWith('local-')) return placeId.slice('local-'.length);
    if (/^\d+$/.test(placeId)) return placeId;
    return null;
  }

  private async buildPlaceQuestionContext(place: any): Promise<PlaceQuestionContext> {
    const details = this.getRawPlaceDetails(place);
    const reviewSnippets = await this.buildReviewSnippets(place);

    return {
      source: place?.source || null,
      categories: this.normalizeStringArray(place?.categories).slice(0, 6),
      averageRating: this.toNumberOrNull(place?.averageRating),
      reviewCount: this.toNumberOrNull(place?.reviewCount),
      description: this.truncateText(details.description || place?.description, 500),
      amenities: this.normalizeStringArray([
        ...this.normalizeStringArray(place?.amenities),
        ...this.normalizeStringArray(details.amenities),
      ]).slice(0, 14),
      contact: {
        phone: this.toStringOrNull(details.phone || place?.phone),
        email: this.toStringOrNull(details.email || place?.email),
        website: this.toStringOrNull(details.website || place?.website),
      },
      rooms: this.toNumberOrNull(details.rooms || place?.rooms),
      reviewSnippets,
    };
  }

  private async buildReviewSnippets(place: any): Promise<PlaceQuestionContext['reviewSnippets']> {
    const snippets: PlaceQuestionContext['reviewSnippets'] = [];

    for (const review of Array.isArray(place?.reviewSnippets) ? place.reviewSnippets : []) {
      const text = this.truncateText(review?.reviewText || review?.content || review?.text, 280);
      if (!text) continue;
      snippets.push({
        source: review?.source || 'local',
        rating: this.toNumberOrNull(review?.rating),
        author: this.toStringOrNull(review?.author),
        text,
      });
    }

    if (!this.isTestMode() && place?.id) {
      try {
        const userReviews = await this.prisma.review.findMany({
          where: {
            placeId: place.id,
            source: { not: 'google' },
            reviewText: { not: null },
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });

        for (const review of userReviews) {
          const text = this.truncateText(review.reviewText, 280);
          if (!text) continue;
          snippets.push({
            source: review.source,
            rating: review.rating,
            text,
          });
        }
      } catch (error) {
        this.logger.warn(`Unable to load user reviews for AI question context: ${(error as Error).message}`);
      }

      try {
        const googleReviews = await this.placesService.ensureGoogleReviewsForAiContext(place.id);
        for (const review of googleReviews) {
          const text = this.truncateText(review?.reviewText, 280);
          if (!text) continue;
          snippets.push({
            source: review?.source || 'google',
            rating: this.toNumberOrNull(review?.rating),
            author: this.toStringOrNull(review?.author),
            text,
          });
        }
      } catch (error) {
        this.logger.warn(`Unable to load Google reviews for AI question context: ${(error as Error).message}`);
      }
    }

    return snippets.slice(0, 5);
  }

  private getRawPlaceDetails(place: any): Record<string, any> {
    const details = place?.rawSerpApiPropertyDetails;
    return details && typeof details === 'object' && !Array.isArray(details) ? details : {};
  }

  private getPlaceName(place: any): string {
    return place?.placeName || place?.name || 'Địa điểm';
  }

  private getPlaceAddress(place: any): string | null {
    return place?.placeAddress || place?.address || null;
  }

  private normalizeStringArray(value: any): string[] {
    const values = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
    return Array.from(
      new Set(
        values
          .map((item) => String(item).trim())
          .filter(Boolean),
      ),
    );
  }

  private toStringOrNull(value: any): string | null {
    if (value === null || value === undefined) return null;
    const text = String(value).trim();
    return text || null;
  }

  private toNumberOrNull(value: any): number | null {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private truncateText(value: any, maxLength: number): string | null {
    const text = this.toStringOrNull(value);
    if (!text) return null;
    return text.length > maxLength ? `${text.slice(0, maxLength - 1).trim()}...` : text;
  }
}
