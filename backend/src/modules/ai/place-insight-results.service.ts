import { Injectable } from '@nestjs/common';

const PLACE_LINK_REGEX = /\[([^\]]+)\]\(place:([^\)]+)\)/g;

function stripMarkdownPlaceLinks(value: any): string {
  return String(value || '').replace(PLACE_LINK_REGEX, '$1').trim();
}

@Injectable()
export class PlaceInsightResultsService {
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
      if (parsed?.type !== 'place_insight') return null;
      return this.normalizePayload(parsed);
    } catch {
      return null;
    }
  }

  buildFallbackPayload(
    content: string,
    taggedPlaces: any[] = [],
    parameters: Record<string, any> = {},
    toolResults: Record<string, any> = {},
  ): any {
    const places = Array.isArray(taggedPlaces)
      ? taggedPlaces.filter((place) => place?.id && (place.name || place.placeName || place.title))
      : [];

    if (places.length !== 1) {
      return {
        type: 'place_insight',
        status: 'insufficient_data',
        title: 'Cần đúng 1 địa điểm để tạo insight',
        location: 'Địa điểm',
        place: null,
        summary: 'Insight địa điểm chỉ hoạt động khi bạn tag đúng 1 địa điểm.',
        pros: [],
        cons: ['Bạn hãy giữ lại đúng 1 địa điểm trong danh sách tag AI rồi thử lại.'],
        safety: 'Chưa đủ dữ liệu để đánh giá.',
        transportation: 'Chưa đủ dữ liệu để đánh giá.',
        food: 'Chưa đủ dữ liệu để đánh giá.',
        attractions: 'Chưa đủ dữ liệu để đánh giá.',
        suitableFor: 'Chưa đủ dữ liệu để khuyến nghị.',
        overallAssessment: {
          summary: 'Bạn hãy tag đúng 1 địa điểm để mình tạo insight chi tiết ở panel bên trái.',
          verdict: 'Chưa thể phân tích vì số lượng địa điểm được tag chưa đúng.',
          reasons: [],
          tradeoffs: ['Insight cần đúng 1 địa điểm để tránh phân tích nhầm.'],
          nextSteps: ['Bỏ tag các địa điểm thừa hoặc tag thêm 1 địa điểm cụ thể.'],
        },
        dataNotes: ['Không đủ điều kiện tạo insight vì không có đúng 1 địa điểm được tag.'],
        followUpQuestion: 'Bạn muốn giữ lại địa điểm nào để phân tích?',
      };
    }

    const place = this.normalizePlace(this.unwrapToolData(toolResults?.place_metadata_context)?.place || places[0]);
    const insightContext = this.unwrapToolData(toolResults?.place_insight_context) || {};
    const travel = insightContext.travel || this.unwrapToolData(toolResults?.travel_estimate_context) || {};
    const nearby = insightContext.nearby || this.unwrapToolData(toolResults?.nearby_poi_context) || {};
    const criteria = this.normalizeStringArray(parameters?.criteria || insightContext.requestedCriteria);
    const tripPurposes = this.normalizeStringArray(parameters?.tripPurposes || insightContext.tripPurposes);
    const amenities = this.normalizeStringArray(place?.amenities).slice(0, 6);
    const poiItems = Array.isArray(nearby?.items) ? nearby.items : [];
    const foodPois = poiItems.filter((item: any) => /^amenity:(restaurant|cafe|bar|fast_food|marketplace)/.test(String(item?.category || '')));
    const attractionPois = poiItems.filter((item: any) => !/^amenity:(restaurant|cafe|bar|fast_food|marketplace)/.test(String(item?.category || '')));
    const rawSummary = stripMarkdownPlaceLinks(content);

    const summary = this.isUsableAiSummary(rawSummary)
      ? this.truncateText(rawSummary, 700)
      : this.buildSummary(place, travel, amenities, tripPurposes);
    const transportation = this.describeTravel(travel);
    const food = foodPois.length
      ? `Gần một số điểm ăn uống/cafe như ${foodPois.slice(0, 4).map((item: any) => this.describePoi(item)).join(', ')}.`
      : 'Chưa có dữ liệu quán ăn/cafe nổi bật quanh địa điểm trong phạm vi hiện tại.';
    const attractions = attractionPois.length
      ? `Có thể kết hợp lịch trình với ${attractionPois.slice(0, 4).map((item: any) => this.describePoi(item)).join(', ')}.`
      : 'Chưa có dữ liệu điểm tham quan nổi bật quanh địa điểm trong phạm vi hiện tại.';
    const pros = [
      place.rating ? `Rating hiện có ở mức ${place.rating}/5${place.reviewCount ? ` với ${place.reviewCount} review` : ''}.` : '',
      amenities.length ? `Có các tiện nghi/đặc điểm đáng chú ý: ${amenities.join(', ')}.` : '',
      travel.status === 'estimated' ? travel.interpretation : '',
      poiItems.length ? `Có ${poiItems.length} POI lân cận trong dữ liệu OpenStreetMap.` : '',
    ].filter(Boolean).slice(0, 4);
    const cons = [
      !place.reviewCount ? 'Thiếu review thực tế trong dữ liệu hiện có nên chưa thể kết luận sâu về chất lượng lưu trú.' : '',
      travel.status !== 'estimated' ? this.truncateText(travel.reason || 'Thiếu dữ liệu tọa độ để ước lượng di chuyển.', 160) : '',
      !foodPois.length && !attractionPois.length ? 'Dữ liệu xung quanh còn hạn chế, nên kiểm tra thêm bản đồ trước khi đặt.' : '',
    ].filter(Boolean).slice(0, 4);

    return this.normalizePayload({
      type: 'place_insight',
      status: 'ok',
      title: `Insight cho ${place.name || 'địa điểm này'}`,
      location: place.address || place.name || 'Địa điểm',
      place,
      summary,
      pros: pros.length ? pros : ['Có đủ metadata cơ bản để bắt đầu đánh giá.'],
      cons: cons.length ? cons : ['Chưa thấy điểm trừ rõ ràng trong dữ liệu hiện có, nhưng vẫn nên kiểm tra giá và review mới nhất.'],
      safety: 'Chưa có đủ review/an toàn cụ thể để kết luận chắc chắn; nên kiểm tra thêm đánh giá mới nhất và khu vực xung quanh trước khi đặt.',
      transportation,
      food,
      attractions,
      suitableFor: tripPurposes.length
        ? `Phù hợp nhất với chuyến đi ưu tiên ${tripPurposes.join(', ')}${criteria.length ? ` và các tiêu chí ${criteria.join(', ')}` : ''}.`
        : 'Phù hợp khi bạn cần một lựa chọn có metadata rõ ràng và muốn kiểm tra thêm trước khi đặt.',
      overallAssessment: {
        summary,
        verdict: `${place.name || 'Địa điểm này'} có thể là lựa chọn đáng cân nhắc nếu các tiêu chí chính của bạn khớp với dữ liệu hiện có.`,
        reasons: pros.slice(0, 3),
        tradeoffs: cons.slice(0, 3),
        nextSteps: ['Kiểm tra giá/phòng trống mới nhất.', 'Đọc thêm review gần đây trước khi đặt.'],
      },
      dataNotes: [
        'Insight fallback được dựng từ metadata/tool context vì phản hồi AI không phải JSON đúng schema.',
        ...(Array.isArray(insightContext.evidenceNotes) ? insightContext.evidenceNotes : []),
      ].slice(0, 4),
      followUpQuestion: 'Bạn muốn mình đào sâu thêm về di chuyển, tiện nghi hay review?',
    });
  }

  toAssistantMessage(payload: any): string {
    const normalized = this.normalizePayload(payload || {});
    const assessment = normalized.overallAssessment || {};
    const lines: string[] = [];
    const placeLink = normalized.place?.id && normalized.place?.name
      ? `[${stripMarkdownPlaceLinks(normalized.place.name)}](place:${normalized.place.id})`
      : stripMarkdownPlaceLinks(normalized.place?.name || 'địa điểm này');

    if (normalized.status === 'insufficient_data') {
      lines.push(stripMarkdownPlaceLinks(assessment.summary || normalized.summary) || 'Bạn hãy tag đúng 1 địa điểm để mình tạo insight chi tiết ở panel bên trái.');
    } else {
      const summary = stripMarkdownPlaceLinks(assessment.summary || normalized.summary);
      lines.push(summary || `Mình đã tạo insight chi tiết cho ${placeLink} ở panel bên trái.`);

      const verdict = stripMarkdownPlaceLinks(assessment.verdict);
      if (verdict) lines.push('', `**Nhận định nhanh:** ${verdict}`);

      if (Array.isArray(assessment.reasons) && assessment.reasons.length) {
        lines.push('', '**Lý do chính:**');
        assessment.reasons.slice(0, 3).forEach((reason: any) => {
          const text = stripMarkdownPlaceLinks(reason);
          if (text) lines.push(`- ${text}`);
        });
      }

      if (Array.isArray(assessment.tradeoffs) && assessment.tradeoffs.length) {
        lines.push('', '**Cần cân nhắc:**');
        assessment.tradeoffs.slice(0, 3).forEach((tradeoff: any) => {
          const text = stripMarkdownPlaceLinks(tradeoff);
          if (text) lines.push(`- ${text}`);
        });
      }

      lines.push('', `Mình đã mở panel bên trái với các mục chi tiết cho ${placeLink}.`);
    }

    const followUp = stripMarkdownPlaceLinks(normalized.followUpQuestion);
    if (followUp) lines.push('', followUp);

    return lines.join('\n').trim();
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

      if (depth === 0) return content.slice(start, index + 1);
    }

    return null;
  }

  private normalizePayload(payload: any): any {
    const place = payload?.place ? this.normalizePlace(payload.place) : null;
    const overallAssessment = payload?.overallAssessment && typeof payload.overallAssessment === 'object'
      ? payload.overallAssessment
      : {};

    return {
      type: 'place_insight',
      status: payload?.status === 'insufficient_data' ? 'insufficient_data' : 'ok',
      title: stripMarkdownPlaceLinks(payload?.title) || (place?.name ? `Insight cho ${place.name}` : 'Insight địa điểm'),
      location: stripMarkdownPlaceLinks(payload?.location) || place?.address || place?.name || 'Địa điểm',
      place,
      summary: stripMarkdownPlaceLinks(payload?.summary),
      pros: this.normalizeStringArray(payload?.pros).slice(0, 6),
      cons: this.normalizeStringArray(payload?.cons).slice(0, 6),
      safety: stripMarkdownPlaceLinks(payload?.safety),
      transportation: stripMarkdownPlaceLinks(payload?.transportation),
      food: stripMarkdownPlaceLinks(payload?.food),
      attractions: stripMarkdownPlaceLinks(payload?.attractions),
      suitableFor: stripMarkdownPlaceLinks(payload?.suitableFor),
      overallAssessment: {
        summary: stripMarkdownPlaceLinks(overallAssessment.summary),
        verdict: stripMarkdownPlaceLinks(overallAssessment.verdict),
        reasons: this.normalizeStringArray(overallAssessment.reasons).slice(0, 5),
        tradeoffs: this.normalizeStringArray(overallAssessment.tradeoffs).slice(0, 5),
        nextSteps: this.normalizeStringArray(overallAssessment.nextSteps).slice(0, 5),
      },
      dataNotes: this.normalizeStringArray(payload?.dataNotes).slice(0, 5),
      followUpQuestion: stripMarkdownPlaceLinks(payload?.followUpQuestion),
    };
  }

  private normalizePlace(place: any): any {
    if (!place || typeof place !== 'object') return null;
    return {
      id: place.id ? String(place.id) : undefined,
      name: stripMarkdownPlaceLinks(place.name || place.placeName || place.title),
      address: stripMarkdownPlaceLinks(place.address || place.placeAddress || place.displayAddress),
      rating: place.rating || place.averageRating,
      reviewCount: place.reviewCount || place.reviewsCount || place.userRatingsTotal,
      price: stripMarkdownPlaceLinks(place.price || place.priceRange || place.priceText || place.ratePerNight),
      amenities: this.normalizeStringArray(place.amenities).slice(0, 20),
      lat: place.lat || place.latitude || place.coordinates?.lat || place.location?.lat,
      lng: place.lng || place.longitude || place.coordinates?.lng || place.location?.lng,
    };
  }

  private unwrapToolData(value: any) {
    if (!value || typeof value !== 'object') return value;
    return value.data || value;
  }

  private normalizeStringArray(values: any): string[] {
    const array = Array.isArray(values) ? values : (values ? [values] : []);
    return array
      .map((value) => stripMarkdownPlaceLinks(value))
      .filter(Boolean);
  }

  private describeTravel(travel: any): string {
    if (travel?.status === 'estimated') {
      const estimates = travel.estimates || {};
      const carTaxi = estimates.carTaxiMinutes ? `taxi/ô tô khoảng ${estimates.carTaxiMinutes} phút` : '';
      const motorbike = estimates.motorbikeMinutes ? `xe máy khoảng ${estimates.motorbikeMinutes} phút` : '';
      const modes = [carTaxi, motorbike].filter(Boolean).join(', ');
      return `Từ ${travel.startLabel || 'điểm xuất phát'}, khoảng ${travel.estimatedRoadDistanceKm || travel.straightLineDistanceKm || 'chưa rõ'} km${modes ? `; ${modes}` : ''}. ${travel.interpretation || ''}`.trim();
    }

    return this.truncateText(travel?.reason || 'Thiếu dữ liệu tọa độ để ước lượng di chuyển.', 220);
  }

  private describePoi(item: any): string {
    const name = stripMarkdownPlaceLinks(item?.name);
    const distance = Number(item?.distanceKm);
    return Number.isFinite(distance) ? `${name} (${distance} km)` : name;
  }

  private buildSummary(place: any, travel: any, amenities: string[], tripPurposes: string[]): string {
    const parts = [
      `${place?.name || 'Địa điểm này'} có thể là một lựa chọn đáng cân nhắc dựa trên metadata hiện có.`,
      travel?.status === 'estimated' ? `Di chuyển từ ${travel.startLabel || 'điểm xuất phát'} được ước lượng ở mức ${travel.interpretation || 'có thể chấp nhận được'}.` : '',
      amenities.length ? `Điểm đáng chú ý là ${amenities.slice(0, 3).join(', ')}.` : '',
      tripPurposes.length ? `Nên đối chiếu thêm với mục đích ${tripPurposes.join(', ')} trước khi đặt.` : '',
    ].filter(Boolean);
    return parts.join(' ');
  }

  private isUsableAiSummary(value: string): boolean {
    const normalized = String(value || '').trim();
    if (!normalized || normalized.startsWith('{')) return false;
    return !/lỗi|loi|không thể kết nối|khong the ket noi|service unavailable/i.test(normalized);
  }

  private truncateText(value: string, maxLength: number): string {
    const normalized = String(value || '').replace(/\s+/g, ' ').trim();
    return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
  }
}
