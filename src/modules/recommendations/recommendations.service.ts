import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RecommendationItem } from '../ai/dto/parse-response.dto';

/**
 * Recommendation engine that queries PostgreSQL via Prisma, ranks results,
 * and returns top recommendations.
 * Ported from Python RecommendationEngine (SQLAlchemy → Prisma).
 */
@Injectable()
export class RecommendationsService {
  private readonly logger = new Logger(RecommendationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recommend(
    location?: string,
    placeType?: string,
    budget?: string,
    limit: number = 10,
  ): Promise<RecommendationItem[]> {
    // Query local DB via Prisma (replaces SQLAlchemy queries)
    const where: any = {};

    if (location) {
      where.placeAddress = { contains: location, mode: 'insensitive' };
    }
    if (placeType) {
      where.categories = { has: placeType };
    }

    const places = await this.prisma.place.findMany({
      where,
      take: limit,
    });

    const results: RecommendationItem[] = places.map((place) => {
      const score = this.calculateScore(place);

      return {
        locationId: place.id,
        name: place.placeName || 'Unknown',
        address: place.placeAddress || '',
        rating: 0, // No rating in Place model; reviews are separate
        score,
        type: place.categories?.[0],
        lat: place.lat,
        lng: place.lng,
      };
    });

    // Sort by score descending, then by distance if we have a reference point
    const requestedLocation = this.parseLocation(location);
    results.sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;

      if (requestedLocation && a.lat != null && a.lng != null && b.lat != null && b.lng != null) {
        const distA = this.distanceKm(requestedLocation.lat, requestedLocation.lng, a.lat, a.lng);
        const distB = this.distanceKm(requestedLocation.lat, requestedLocation.lng, b.lat, b.lng);
        return distA - distB;
      }
      return 0;
    });

    return results;
  }

  private parseLocation(location?: string): { lat: number; lng: number } | null {
    if (!location) return null;
    const parts = location.split(',').map((s) => s.trim());
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat, lng };
  }

  private distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371.0;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private calculateScore(place: any): number {
    // Simple scoring: places with more categories or coordinates get a slight boost
    let score = 0.5;
    if (place.categories && place.categories.length > 0) score += 0.2;
    if (place.lat && place.lng) score += 0.1;
    if (place.placeAddress) score += 0.1;
    return Math.round(score * 10000) / 10000;
  }
}
