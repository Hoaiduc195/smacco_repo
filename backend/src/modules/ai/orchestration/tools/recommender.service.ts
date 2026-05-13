import { Injectable } from '@nestjs/common';

interface RecommendedItem {
  locationId: string;
  name: string;
  address?: string;
  location?: { lat: number; lng: number };
  rating?: number;
  priceLevel?: number;
  source?: string;
  sourcePlaceId?: string;
  score: number;
  reasons: string[];
}

@Injectable()
export class RecommenderService {
  scorePlaces(places: any[], params: { budget?: string; maxResults?: number }) {
    const maxResults = params.maxResults ?? 5;
    const budget = params.budget;
    const anchorLocation = params.anchorLocation;
    const anchorLabel = params.anchorLabel;

    const ranked = (places || []).map((place) => {
      const ratingScore = this.scoreRating(place.rating);
      const budgetScore = this.scoreBudget(place.priceLevel, budget);
      const distanceScore = this.scoreDistance(place.location, anchorLocation);
      const score = this.roundScore(
        0.5 * ratingScore + 0.3 * budgetScore + 0.2 * distanceScore,
      );

      return {
        locationId: place.locationId,
        name: place.name,
        address: place.address,
        location: place.location,
        rating: place.rating,
        priceLevel: place.priceLevel,
        source: place.source,
        sourcePlaceId: place.sourcePlaceId,
        score,
        reasons: this.buildReasons(place, budget, anchorLabel, distanceScore),
      } as RecommendedItem;
    });

    ranked.sort((a, b) => b.score - a.score);

    return {
      items: ranked.slice(0, maxResults),
      total: ranked.length,
    };
  }

  private scoreRating(rating?: number): number {
    if (typeof rating !== 'number') return 0.4;
    if (rating <= 0) return 0.2;
    return Math.min(rating / 5, 1);
  }

  private scoreBudget(priceLevel?: number, budget?: string): number {
    if (!budget) return 0.5;
    if (typeof priceLevel !== 'number') return 0.5;

    if (budget === 'low') return priceLevel <= 2 ? 1 : 0.3;
    if (budget === 'mid') return priceLevel >= 2 && priceLevel <= 3 ? 1 : 0.4;
    if (budget === 'high') return priceLevel >= 3 ? 1 : 0.4;

    return 0.5;
  }

  private buildReasons(
    place: any,
    budget?: string,
    anchorLabel?: string,
    distanceScore?: number,
  ): string[] {
    const reasons: string[] = [];
    if (typeof place.rating === 'number') {
      reasons.push(`Rating ${place.rating.toFixed(1)}/5`);
    }

    if (budget) {
      if (typeof place.priceLevel === 'number') {
        reasons.push(`Matches budget: ${budget}`);
      } else {
        reasons.push('Budget match inferred due to missing price data');
      }
    }

    if (anchorLabel && typeof distanceScore === 'number' && distanceScore > 0) {
      reasons.push(`Close to ${anchorLabel}`);
    }

    return reasons.length ? reasons : ['Ranked by rating and overall fit'];
  }

  private roundScore(value: number): number {
    return Math.round(value * 1000) / 1000;
  }

  private scoreDistance(
    placeLocation?: { lat: number; lng: number },
    anchorLocation?: { lat: number; lng: number } | null,
  ): number {
    if (!placeLocation || !anchorLocation) return 0.5;
    const distanceKm = this.distanceKm(
      placeLocation.lat,
      placeLocation.lng,
      anchorLocation.lat,
      anchorLocation.lng,
    );

    if (distanceKm <= 1) return 1;
    if (distanceKm <= 3) return 0.7;
    if (distanceKm <= 5) return 0.4;
    return 0.2;
  }

  private distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
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
}
