import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecommendationItem } from '../ai/dto/parse-response.dto';
import { NearbyAmenitiesTool } from '../../common/tools/nearby-amenities.tool';
import { ProximityCheckerTool } from '../../common/tools/proximity-checker.tool';
import { filterVietnam } from '../../common/utils/vietnam-filter';
import { distanceKm } from '../../common/utils/geo.util';

export interface RankPlacesParams {
  query?: string;
  budget?: string;
  maxResults?: number;
  anchorLocation?: { lat: number; lng: number } | null;
  anchorLabel?: string;
}

export interface RankedPlace {
  locationId: string;
  name: string;
  address?: string;
  location?: { lat: number; lng: number };
  rating?: number;
  priceLevel?: number;
  source?: string;
  sourcePlaceId?: string;
  types?: string[];
  score: number;
  reasons: string[];
}

@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly nearbyAmenitiesTool: NearbyAmenitiesTool,
    private readonly proximityCheckerTool: ProximityCheckerTool,
  ) {}

  /**
   * Old method: queries DB directly via Prisma. Kept for backward compatibility.
   */
  async recommend(
    location?: string,
    placeType?: string,
    budget?: string,
    limit: number = 10,
  ): Promise<RecommendationItem[]> {
    const where: any = {};
    if (location) where.placeAddress = { contains: location, mode: 'insensitive' };
    if (placeType) where.categories = { has: placeType };

    const places = await this.prisma.place.findMany({ where, take: limit });

    const results: RecommendationItem[] = places.map((place) => ({
      locationId: place.id,
      name: place.placeName || 'Unknown',
      address: place.placeAddress || '',
      rating: 0,
      score: this.calculateScore(place),
      type: place.categories?.[0],
      lat: place.lat,
      lng: place.lng,
    }));

    const requestedLocation = this.parseLocation(location);
    results.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;
      if (requestedLocation && a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
        return distanceKm(requestedLocation.lat, requestedLocation.lng, a.lat, a.lng) -
               distanceKm(requestedLocation.lat, requestedLocation.lng, b.lat, b.lng);
      }
      return 0;
    });

    return results;
  }

  /**
   * New method: ranks externally-provided places using tools + scoring.
   * Accepts search results + user intent params.
   */
  async rankPlaces(places: any[], params: RankPlacesParams): Promise<{ items: RankedPlace[]; total: number }> {
    const maxResults = params.maxResults ?? 10;
    const budget = params.budget;
    const anchorLocation = params.anchorLocation;
    const anchorLabel = params.anchorLabel;

    // Step 1: Filter only Vietnam places
    const vietnamPlaces = filterVietnam(places || []);
    this.logger.log(`Vietnam filter: ${places?.length || 0} → ${vietnamPlaces.length} places`);

    if (vietnamPlaces.length === 0) return { items: [], total: 0 };

    // Step 2: Run tools in parallel
    const toolResults: Record<string, Record<string, { score: number; details?: any }>> = {};
    const toolTasks: Promise<void>[] = [];

    toolTasks.push(
      this.nearbyAmenitiesTool.execute({ places: vietnamPlaces })
        .then(r => { toolResults.nearby_amenities = r.scoringMap || {}; })
        .catch((err: any) => this.logger.error(`Amenities tool failed: ${err.message}`)),
    );

    if (anchorLocation) {
      toolTasks.push(
        this.proximityCheckerTool.execute({ places: vietnamPlaces, anchorLocation, anchorLabel })
          .then(r => { toolResults.proximity_checker = r.scoringMap || {}; })
          .catch((err: any) => this.logger.error(`Proximity tool failed: ${err.message}`)),
      );
    }

    await Promise.all(toolTasks);

    // Step 3: Score each place
    const ranked = vietnamPlaces.map((place) => {
      const placeId = place.locationId || place.id || '';
      const ratingScore = this.scoreRating(place.rating);
      const budgetScore = this.scoreBudget(place.priceLevel, budget);
      const distanceScore = this.scoreDistance(place.location, anchorLocation);

      const amenityScore = toolResults.nearby_amenities?.[placeId]?.score ?? 0;
      const proximityScore = toolResults.proximity_checker?.[placeId]?.score ?? 0;
      const hasProximity = toolResults.proximity_checker != null;

      const ratingW = 0.30;
      const budgetW = 0.20;
      const distanceW = 0.20;
      const amenityW = 0.15;
      const proximityW = hasProximity ? 0.15 : 0;

      const baseW = ratingW + budgetW + (hasProximity ? 0 : proximityW);

      const score = this.roundScore(
        baseW * (ratingW / baseW * ratingScore + budgetW / baseW * budgetScore) +
        distanceW * distanceScore +
        amenityW * amenityScore +
        proximityW * proximityScore
      );

      return {
        locationId: place.locationId || place.id || '',
        name: place.name,
        address: place.address,
        location: place.location,
        rating: place.rating,
        priceLevel: place.priceLevel,
        source: place.source,
        sourcePlaceId: place.sourcePlaceId,
        types: place.types,
        score,
        reasons: this.buildReasons(place, budget, anchorLabel, distanceScore, toolResults, placeId),
      } as RankedPlace;
    });

    ranked.sort((a, b) => b.score - a.score);

    return {
      items: ranked.slice(0, maxResults),
      total: ranked.length,
    };
  }

  scoreRating(rating?: number): number {
    if (typeof rating !== 'number') return 0.4;
    if (rating <= 0) return 0.2;
    return Math.min(rating / 5, 1);
  }

  scoreBudget(priceLevel?: number, budget?: string): number {
    if (!budget) return 0.5;
    if (typeof priceLevel !== 'number') return 0.5;
    const map: Record<string, (pl: number) => number> = {
      low: (pl) => pl <= 2 ? 1 : 0.3,
      mid: (pl) => pl >= 2 && pl <= 3 ? 1 : 0.4,
      high: (pl) => pl >= 3 ? 1 : 0.4,
    };
    return (map[budget] || (() => 0.5))(priceLevel);
  }

  private buildReasons(
    place: any, budget?: string, anchorLabel?: string, distanceScore?: number,
    toolResults?: Record<string, Record<string, any>>, placeId: string = '',
  ): string[] {
    const reasons: string[] = [];
    if (typeof place.rating === 'number' && place.rating > 0) reasons.push(`Đánh giá ${place.rating.toFixed(1)}/5`);
    if (budget && typeof place.priceLevel === 'number') {
      const labels: Record<string, string> = { low: 'tiết kiệm', mid: 'trung bình', high: 'cao cấp' };
      reasons.push(`Phù hợp ngân sách ${labels[budget] || budget}`);
    }
    if (anchorLabel && typeof distanceScore === 'number' && distanceScore > 0.5) reasons.push(`Gần ${anchorLabel}`);
    const a = toolResults?.nearby_amenities?.[placeId];
    if (a?.details?.categoryCount > 0) reasons.push(`${a.details.totalAmenities} tiện ích lân cận (${a.details.categoryCount} loại)`);
    const p = toolResults?.proximity_checker?.[placeId];
    if (p?.details?.distanceKm != null && p.details.distanceKm <= 5) reasons.push(`Cách ${anchorLabel || 'địa điểm mong muốn'} ${p.details.distanceKm}km`);
    return reasons.length ? reasons : ['Xếp hạng dựa trên điểm tổng hợp'];
  }

  private roundScore(v: number): number { return Math.round(v * 1000) / 1000; }

  private scoreDistance(loc?: { lat: number; lng: number }, anchor?: { lat: number; lng: number } | null): number {
    if (!loc || !anchor) return 0.5;
    const d = distanceKm(loc.lat, loc.lng, anchor.lat, anchor.lng);
    return d <= 1 ? 1 : d <= 3 ? 0.7 : d <= 5 ? 0.4 : 0.2;
  }

  private parseLocation(location?: string): { lat: number; lng: number } | null {
    if (!location) return null;
    const parts = location.split(',').map(s => s.trim());
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]); const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  }

  private calculateScore(place: any): number {
    let score = 0.5;
    if (place.categories?.length > 0) score += 0.2;
    if (place.lat && place.lng) score += 0.1;
    if (place.placeAddress) score += 0.1;
    return Math.round(score * 10000) / 10000;
  }


}
