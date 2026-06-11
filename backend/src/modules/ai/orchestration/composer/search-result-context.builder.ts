import { Injectable } from '@nestjs/common';

interface SearchResultContextInput {
  places: any[];
  parameters: Record<string, any>;
}

@Injectable()
export class SearchResultContextBuilder {
  build(input: SearchResultContextInput) {
    const places = Array.isArray(input.places) ? input.places : [];
    const topPlaces = places.slice(0, 10).map((place) => this.summarizePlace(place));
    const placesWithRating = places.filter((place) => typeof place.rating === 'number');
    const placesWithReviewCount = places.filter((place) => typeof place.userRatingsTotal === 'number');
    const placesWithPrice = places.filter((place) => Boolean(place.price || place.priceLevel));
    const placesWithAmenities = places.filter((place) => Array.isArray(place.amenities) && place.amenities.length > 0);

    return {
      total: places.length,
      userIntent: {
        query: input.parameters.query,
        location: input.parameters.location,
        anchor: input.parameters.anchor,
        budget: input.parameters.budget,
        type: input.parameters.type,
        types: input.parameters.types,
      },
      priorityCriteria: this.buildPriorityCriteria(input.parameters),
      overview: {
        rating: this.buildRatingOverview(placesWithRating),
        reviewCoverage: this.buildReviewCoverage(placesWithReviewCount, places.length),
        priceCoverage: this.buildCoverageLabel(placesWithPrice.length, places.length, 'giá'),
        amenityCoverage: this.buildCoverageLabel(placesWithAmenities.length, places.length, 'tiện ích'),
        sources: this.summarizeSources(places),
        limitations: this.buildLimitations({
          total: places.length,
          withRating: placesWithRating.length,
          withReviews: placesWithReviewCount.length,
          withPrice: placesWithPrice.length,
          withAmenities: placesWithAmenities.length,
        }),
      },
      topPlaces,
      guidance: 'Ưu tiên đúng tiêu chí user, dựa trên evidence trong topPlaces, nói rõ dữ liệu thiếu và không bịa.',
    };
  }

  private summarizePlace(place: any) {
    return {
      id: place.locationId || place.id,
      name: place.name,
      address: place.address,
      rating: place.rating,
      userRatingsTotal: place.userRatingsTotal,
      price: place.price,
      priceLevel: place.priceLevel,
      types: place.types,
      distanceKm: place.distanceKm,
      anchorLabel: place.anchorLabel,
      score: place.score,
      reasons: Array.isArray(place.reasons) ? place.reasons.slice(0, 3) : [],
      amenities: Array.isArray(place.amenities) ? place.amenities.slice(0, 6) : [],
      source: place.source,
      dataCompleteness: {
        hasRating: typeof place.rating === 'number',
        hasReviewCount: typeof place.userRatingsTotal === 'number',
        hasPrice: Boolean(place.price || place.priceLevel),
        hasAmenities: Array.isArray(place.amenities) && place.amenities.length > 0,
      },
    };
  }

  private buildPriorityCriteria(parameters: Record<string, any>) {
    const query = this.normalizeText(parameters.query || '');
    const hasProximityIntent = Boolean(
      parameters.anchor ||
      /\b(gan|gan nhat|xung quanh|near|nearby|closest|trung tam)\b/.test(query),
    );

    if (hasProximityIntent) {
      return {
        primary: 'proximity',
        target: parameters.anchor || parameters.location || 'khu vực người dùng yêu cầu',
        instruction: 'Xếp nhận xét theo mức độ gần target trước; chỉ dùng tiện ích/rating/giá làm tiêu chí phụ.',
      };
    }

    if (parameters.budget) {
      return {
        primary: 'budget',
        target: parameters.budget,
        instruction: 'Ưu tiên nhận xét về mức phù hợp ngân sách trước, sau đó mới đến rating, vị trí và tiện ích.',
      };
    }

    return {
      primary: 'overall_fit',
      target: parameters.location || parameters.type || parameters.query,
      instruction: 'Nhận xét cân bằng giữa vị trí, rating, giá, tiện ích và độ đầy đủ dữ liệu.',
    };
  }

  private buildRatingOverview(placesWithRating: any[]): string {
    if (!placesWithRating.length) return 'Chưa có đủ dữ liệu rating để đánh giá xu hướng.';

    const average = placesWithRating.reduce((sum, place) => sum + place.rating, 0) / placesWithRating.length;
    const strongCount = placesWithRating.filter((place) => place.rating >= 4).length;
    return `${placesWithRating.length} nơi có rating, trung bình khoảng ${average.toFixed(1)}/5; ${strongCount} nơi đạt từ 4.0 trở lên.`;
  }

  private buildReviewCoverage(placesWithReviewCount: any[], total: number): string {
    if (!total) return 'Không có kết quả để đánh giá số lượng review.';
    if (!placesWithReviewCount.length) return 'Phần lớn kết quả chưa có số lượng đánh giá.';

    const totalReviews = placesWithReviewCount.reduce((sum, place) => sum + place.userRatingsTotal, 0);
    return `${placesWithReviewCount.length}/${total} nơi có số lượng đánh giá; tổng cộng khoảng ${totalReviews.toLocaleString('vi-VN')} lượt.`;
  }

  private buildCoverageLabel(count: number, total: number, label: string): string {
    if (!total) return `Không có dữ liệu ${label}.`;
    if (count === 0) return `Chưa có kết quả nào có dữ liệu ${label}.`;
    if (count === total) return `Tất cả kết quả đều có dữ liệu ${label}.`;
    return `${count}/${total} kết quả có dữ liệu ${label}.`;
  }

  private summarizeSources(places: any[]): Record<string, number> {
    return places.reduce((acc: Record<string, number>, place) => {
      const source = place.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
  }

  private buildLimitations(stats: {
    total: number;
    withRating: number;
    withReviews: number;
    withPrice: number;
    withAmenities: number;
  }): string[] {
    if (!stats.total) return ['Không có kết quả phù hợp để phân tích.'];

    const limitations: string[] = [];
    if (stats.withRating < stats.total) limitations.push('Một số nơi thiếu rating.');
    if (stats.withReviews < stats.total) limitations.push('Một số nơi thiếu số lượng đánh giá.');
    if (stats.withPrice < stats.total) limitations.push('Một số nơi thiếu giá hoặc price level.');
    if (stats.withAmenities < stats.total) limitations.push('Một số nơi thiếu danh sách tiện ích.');
    return limitations.length ? limitations : ['Dữ liệu chính khá đầy đủ cho nhóm kết quả này.'];
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
