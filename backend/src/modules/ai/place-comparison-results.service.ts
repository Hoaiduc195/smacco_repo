import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RuntimeConfigService } from '../../config/runtime-config.service';
import { UsersService } from '../users/users.service';

type FirebaseUser = { uid: string; email?: string | null; name?: string | null };

const PLACE_LINK_REGEX = /\[([^\]]+)\]\(place:([^\)]+)\)/g;

function stripMarkdownPlaceLinks(value: any): string {
  return String(value || '').replace(PLACE_LINK_REGEX, '$1').trim();
}

@Injectable()
export class PlaceComparisonResultsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly runtimeConfig: RuntimeConfigService,
    private readonly usersService: UsersService,
  ) {}

  parsePayload(content: string): any | null {
    const raw = String(content || '').trim();
    if (!raw) return null;

    const withoutFence = raw
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    try {
      const parsed = JSON.parse(withoutFence);
      if (parsed?.type !== 'place_comparison') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  toAssistantMessage(payload: any): string {
    const assessment = payload?.overallAssessment || {};
    const lines: string[] = [];
    const summary = stripMarkdownPlaceLinks(assessment.summary);

    if (summary) {
      lines.push(summary);
    } else if (payload?.status === 'insufficient_data') {
      lines.push('Bạn hãy tag ít nhất 2 địa điểm để AI so sánh.');
    } else {
      lines.push('Mình đã tạo bảng so sánh chi tiết cho các địa điểm này.');
    }

    const recommended = stripMarkdownPlaceLinks(assessment.recommendedPlaceName);
    if (recommended) {
      lines.push('', `**Gợi ý nổi bật:** ${recommended}`);
    }

    if (Array.isArray(assessment.reasons) && assessment.reasons.length) {
      lines.push('', '**Lý do:**');
      assessment.reasons.slice(0, 4).forEach((reason: any) => {
        const text = stripMarkdownPlaceLinks(reason);
        if (text) lines.push(`- ${text}`);
      });
    }

    if (Array.isArray(assessment.bestFor) && assessment.bestFor.length) {
      lines.push('', '**Phù hợp nhất khi:**');
      assessment.bestFor.slice(0, 4).forEach((item: any) => {
        const placeName = stripMarkdownPlaceLinks(item?.placeName);
        const scenario = stripMarkdownPlaceLinks(item?.scenario);
        if (placeName || scenario) lines.push(`- ${placeName ? `${placeName}: ` : ''}${scenario}`.trim());
      });
    }

    if (Array.isArray(assessment.tradeoffs) && assessment.tradeoffs.length) {
      lines.push('', '**Cần cân nhắc:**');
      assessment.tradeoffs.slice(0, 4).forEach((tradeoff: any) => {
        const text = stripMarkdownPlaceLinks(tradeoff);
        if (text) lines.push(`- ${text}`);
      });
    }

    const followUp = stripMarkdownPlaceLinks(payload?.followUpQuestion);
    if (followUp) {
      lines.push('', followUp);
    }

    return lines.join('\n').trim();
  }

  async createForMessage(params: {
    conversationId: string;
    messageId?: string;
    payload: any;
  }): Promise<{ id: string } | null> {
    if (!this.runtimeConfig.chat.persistHistory || !params.messageId) return null;

    const assessment = params.payload?.overallAssessment || {};
    const places = Array.isArray(params.payload?.places) ? params.payload.places : [];

    return this.prisma.placeComparisonResult.create({
      data: {
        conversationId: params.conversationId,
        messageId: params.messageId,
        title: stripMarkdownPlaceLinks(params.payload?.title) || null,
        status: params.payload?.status ? String(params.payload.status) : null,
        placeIds: places.map((place: any) => String(place?.id || '')).filter(Boolean),
        summary: stripMarkdownPlaceLinks(assessment.summary) || null,
        recommendedPlaceName: stripMarkdownPlaceLinks(assessment.recommendedPlaceName) || null,
        payload: params.payload,
      },
      select: { id: true },
    });
  }

  async getForUser(firebaseUser: FirebaseUser, comparisonId: string) {
    if (!this.runtimeConfig.chat.persistHistory) {
      throw new NotFoundException('Không tìm thấy bảng so sánh.');
    }

    const user = await this.usersService.upsertFromFirebaseUser(firebaseUser);
    const result = await this.prisma.placeComparisonResult.findFirst({
      where: {
        id: comparisonId,
        conversation: { userId: user.id },
      },
      select: {
        id: true,
        conversationId: true,
        messageId: true,
        title: true,
        status: true,
        placeIds: true,
        summary: true,
        recommendedPlaceName: true,
        payload: true,
        createdAt: true,
      },
    });

    if (!result) {
      throw new NotFoundException('Không tìm thấy bảng so sánh.');
    }

    return result;
  }
}
