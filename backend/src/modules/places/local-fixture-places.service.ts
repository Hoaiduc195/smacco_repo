import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LocalFixturePlacesService {
  private readonly logger = new Logger(LocalFixturePlacesService.name);
  private cache: any[] | null = null;

  constructor(private readonly configService: ConfigService) {}

  findAll(filters?: { type?: string | string[]; city?: string; q?: string }, req?: Request): any[] {
    const data = this.loadAll();
    const types = this.normalizeTypes(filters?.type);

    return data
      .filter((item) => {
        if (types.length > 0) {
          const itemType = String(item.type || '').toLowerCase();
          const matchesType = types.some((type) =>
            itemType.includes(type) ||
            (Array.isArray(item.amenities) && item.amenities.some((amenity: string) => String(amenity).toLowerCase().includes(type)))
          );
          if (!matchesType) return false;
        }

        if (filters?.city) {
          const cityLower = filters.city.toLowerCase();
          const addressLower = String(item.address || '').toLowerCase();
          if (!addressLower.includes(cityLower)) return false;
        }

        if (filters?.q) {
          const qLower = filters.q.toLowerCase();
          const nameLower = String(item.name || '').toLowerCase();
          const addressLower = String(item.address || '').toLowerCase();
          const descLower = String(item.description || '').toLowerCase();
          if (!nameLower.includes(qLower) && !addressLower.includes(qLower) && !descLower.includes(qLower)) {
            return false;
          }
        }

        return true;
      })
      .map((item) => this.mapPlace(item, item.index, req));
  }

  findOne(sourcePlaceId: string, req?: Request): any {
    const item = this.getItem(sourcePlaceId);
    if (!item) throw new NotFoundException(`Local test-data place local-${sourcePlaceId} not found`);
    return this.mapPlace(item, Number(sourcePlaceId), req);
  }

  findReviews(sourcePlaceId: string) {
    const item = this.getItem(sourcePlaceId);
    return (item?.reviews || []).map((review: any, index: number) => ({
      id: `local-review-${sourcePlaceId}-${index}`,
      placeId: `local-${sourcePlaceId}`,
      rating: review.rating,
      reviewText: review.content,
      author: review.author,
      source: 'local',
    }));
  }

  findPhotos(sourcePlaceId: string, req?: Request): string[] {
    const item = this.getItem(sourcePlaceId);
    const baseUrl = this.getBaseUrl(req);
    return (item?.images || []).map((filename: string) => (
      `${baseUrl}/places/test-data/images/${filename}`
    ));
  }

  getItem(sourcePlaceId: string): any {
    const data = this.loadAll();
    const index = parseInt(sourcePlaceId, 10);
    if (!Number.isNaN(index) && index >= 0 && index < data.length) {
      return data[index];
    }
    return null;
  }

  loadAll(): any[] {
    if (this.cache) return this.cache;

    const candidates = [
      path.join(process.cwd(), 'test', 'fixtures', 'data.json'),
      path.join(process.cwd(), 'backend', 'test', 'fixtures', 'data.json'),
    ];
    const testDataPath = candidates.find((candidate) => fs.existsSync(candidate));

    if (!testDataPath) {
      this.logger.error(`Local test data file data.json not found in candidates: ${candidates.join(', ')}`);
      this.cache = [];
      return this.cache;
    }

    try {
      const content = fs.readFileSync(testDataPath, 'utf8');
      const data = JSON.parse(content);
      this.cache = data.map((item: any, index: number) => ({ ...item, index }));
      return this.cache || [];
    } catch (err: any) {
      this.logger.error(`Failed to load local test data from ${testDataPath}: ${err.message}`);
      this.cache = [];
      return this.cache;
    }
  }

  mapPlace(item: any, index: number, req?: Request): any {
    const reviews = Array.isArray(item.reviews) ? item.reviews : [];
    const averageRating = reviews.length
      ? reviews.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) / reviews.length
      : null;
    const coverImageUrl = Array.isArray(item.images) && item.images.length
      ? this.formatCoverImageUrl(`/images/${item.images[0]}`, req)
      : null;

    return {
      id: `local-${index}`,
      source: 'local',
      sourcePlaceId: String(index),
      placeName: item.name,
      placeAddress: item.address,
      categories: item.type ? [String(item.type).toLowerCase()] : ['hotel'],
      lat: item.latitude || 0,
      lng: item.longitude || 0,
      coverImageUrl,
      averageRating,
      reviewCount: reviews.length,
      amenities: item.amenities,
      rawSerpApiPropertyDetails: {
        phone: item.phone,
        email: item.email,
        rooms: item.rooms,
        website: item.website,
        description: item.description,
        amenities: item.amenities,
        images: item.images,
      },
    };
  }

  private getBaseUrl(req?: Request): string {
    if (req) {
      return `${req.protocol}://${req.get('host')}/api/v1`;
    }
    const port = this.configService.get<number>('app.port') || 3001;
    return `http://localhost:${port}/api/v1`;
  }

  private formatCoverImageUrl(url: string | null, req?: Request): string | null {
    if (!url) return null;
    if (url.startsWith('/images/')) {
      const filename = url.replace('/images/', '');
      return `${this.getBaseUrl(req)}/places/test-data/images/${filename}`;
    }
    return url;
  }

  private normalizeTypes(type?: string | string[]): string[] {
    const values = [
      ...(Array.isArray(type) ? type : []),
      ...(typeof type === 'string' ? type.split(',') : []),
    ]
      .map((value) => String(value).trim().toLowerCase())
      .filter(Boolean);

    return Array.from(new Set(values));
  }
}
