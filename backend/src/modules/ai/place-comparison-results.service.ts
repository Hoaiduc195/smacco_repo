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
    const jsonCandidate = this.extractFirstJsonObject(withoutFence);

    if (!jsonCandidate) return null;

    try {
      const parsed = JSON.parse(jsonCandidate);
      if (parsed?.type !== 'place_comparison') return null;
      return parsed;
    } catch {
      return null;
    }
  }

  buildFallbackPayload(content: string, taggedPlaces: any[] = [], parameters: Record<string, any> = {}): any | null {
    const places = Array.isArray(taggedPlaces)
      ? taggedPlaces
        .filter((place) => place?.id && (place.name || place.placeName || place.title))
        .slice(0, 12)
        .map((place) => ({ id: String(place.id), name: stripMarkdownPlaceLinks(place.name || place.placeName || place.title) }))
      : [];

    if (places.length < 2) {
      return {
        type: 'place_comparison',
        status: 'insufficient_data',
        title: 'Cần thêm địa điểm để so sánh',
        places,
        comparisonRows: [],
        overallAssessment: {
          summary: 'Bạn hãy tag ít nhất 2 địa điểm để AI so sánh.',
          recommendedPlaceId: null,
          recommendedPlaceName: null,
          reasons: [],
          tradeoffs: [],
          bestFor: [],
        },
        dataNotes: ['Không đủ địa điểm được tag để tạo bảng so sánh.'],
        followUpQuestion: 'Bạn muốn tag thêm địa điểm nào để so sánh?',
      };
    }

    const placeMap = new Map<string, any>();
    for (const place of taggedPlaces || []) {
      if (place?.id) placeMap.set(String(place.id), place);
    }

    const criteria = this.normalizeCriteria(parameters?.criteria);
    const rows = (criteria.length ? criteria : ['rating', 'price', 'location', 'amenities'])
      .slice(0, 4)
      .map((criterion) => this.buildFallbackRow(criterion, places, placeMap));
    const recommended = this.pickHighestRatedPlace(places, placeMap);

    return {
      type: 'place_comparison',
      status: 'ok',
      title: `So sánh ${places.map((place) => place.name).join(' và ')}`,
      places,
      comparisonRows: rows,
      overallAssessment: {
        summary: this.truncateText(stripMarkdownPlaceLinks(content), 700) || 'Mình đã tạo bảng so sánh dựa trên phần thông tin mình có thể tham khảo được.',
        recommendedPlaceId: recommended?.id || null,
        recommendedPlaceName: recommended?.name || null,
        reasons: recommended ? [`${recommended.name} có rating nổi bật trong phần mình tham khảo được.`] : [],
        tradeoffs: ['Một số tiêu chí chưa có đủ review hoặc giá chi tiết để mình chấm thật chắc.'],
        bestFor: places.map((place) => ({
          placeId: place.id,
          placeName: place.name,
          scenario: 'Phù hợp khi ưu tiên các thông tin mình đang thấy rõ.',
        })).slice(0, 3),
      },
      dataNotes: ['Một vài tiêu chí chưa đủ rõ, nên mình đang so sánh theo các thông tin chắc hơn trước.'],
      followUpQuestion: 'Bạn muốn mình so sánh sâu hơn theo tiêu chí nào?',
    };
  }

  private extractFirstJsonObject(content: string): string | null {
    const start = content.indexOf('{');
    if (start === -1) return null;

    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let index = start; index < content.length; index += 1) {
      const char = content[index];

      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === '\\') {
        escaped = true;
        continue;
      }

      if (char === '"') {
        inString = !inString;
        continue;
      }

      if (inString) continue;

      if (char === '{') depth += 1;
      if (char === '}') depth -= 1;

      if (depth === 0) {
        return content.slice(start, index + 1);
      }
    }

    return null;
  }

  private normalizeCriteria(criteria: any): string[] {
    const allowed = new Set(['rating', 'price', 'location', 'amenities', 'reviews', 'quiet', 'cleanliness', 'other']);
    const values = Array.isArray(criteria)
      ? criteria
      : (typeof criteria === 'string' ? criteria.split(/,/) : []);

    return values
      .map((value) => String(value || '').trim().toLowerCase())
      .filter((value) => allowed.has(value));
  }

  private buildFallbackRow(criterion: string, places: Array<{ id: string; name: string }>, placeMap: Map<string, any>) {
    const labels: Record<string, string> = {
      rating: 'Đánh giá',
      price: 'Giá/Tầm giá',
      location: 'Vị trí',
      amenities: 'Tiện nghi',
      reviews: 'Review',
      quiet: 'Yên tĩnh',
      cleanliness: 'Sạch sẽ',
      other: 'Khác',
    };
    const values: Record<string, string> = {};
    const notes: Record<string, string> = {};

    for (const place of places) {
      const source = placeMap.get(place.id) || {};
      values[place.id] = this.extractCriterionValue(criterion, source);
      notes[place.id] = values[place.id] === 'Chưa rõ' ? 'Mình chưa thấy đủ thông tin rõ' : '';
    }

    return {
      key: criterion,
      label: labels[criterion] || 'Khác',
      values,
      notes,
    };
  }

  private extractCriterionValue(criterion: string, place: any): string {
    if (criterion === 'rating') {
      const rating = place.rating || place.averageRating;
      const count = place.reviewCount || place.reviewsCount || place.userRatingsTotal;
      if (!rating) return 'Chưa rõ';
      return count ? `${rating}/5 (${count} review)` : `${rating}/5`;
    }

    if (criterion === 'price') {
      return this.truncateText(place.price || place.priceRange || place.priceText || place.ratePerNight || '', 80) || 'Chưa rõ';
    }

    if (criterion === 'location') {
      return this.truncateText(place.address || place.placeAddress || place.displayAddress || '', 120) || 'Chưa rõ';
    }

    if (criterion === 'amenities') {
      const amenities = Array.isArray(place.amenities)
        ? place.amenities
        : (Array.isArray(place.rawSerpApiPropertyDetails?.amenities) ? place.rawSerpApiPropertyDetails.amenities : []);
      return amenities.length ? amenities.slice(0, 5).join(', ') : 'Chưa rõ';
    }

    if (criterion === 'reviews') {
      const count = place.reviewCount || place.reviewsCount || place.userRatingsTotal;
      return count ? `${count} review` : 'Chưa rõ';
    }

    return 'Chưa rõ';
  }

  private pickHighestRatedPlace(places: Array<{ id: string; name: string }>, placeMap: Map<string, any>) {
    return places
      .map((place) => ({ ...place, rating: Number(placeMap.get(place.id)?.rating || placeMap.get(place.id)?.averageRating) }))
      .filter((place) => Number.isFinite(place.rating))
      .sort((a, b) => b.rating - a.rating)[0];
  }

  private truncateText(value: string, maxLength: number): string {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
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
