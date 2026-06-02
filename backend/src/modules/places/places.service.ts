import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Place } from '@prisma/client';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Request } from 'express';

@Injectable()
export class PlacesService {
  private readonly logger = new Logger(PlacesService.name);
  private readonly apiKey: string;
  private readonly googleReviewTtlMs = 90 * 24 * 60 * 60 * 1000;
  private readonly googleReviewContextLimit = 10;
  private readonly googleReviewPrefix = '__GOOGLE_REVIEW__::';

  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiKey = this.configService.get<string>('SERPAPI_API_KEY') || '';
  }

  private getBaseUrl(req?: Request): string {
    if (req) {
      const protocol = req.protocol;
      const host = req.get('host');
      return `${protocol}://${host}/api/v1`;
    }
    const port = this.configService.get<number>('app.port') || 3001;
    return `http://localhost:${port}/api/v1`;
  }

  private formatCoverImageUrl(url: string | null, req?: Request): string | null {
    if (!url) return null;
    if (url.startsWith('/images/')) {
      const baseUrl = this.getBaseUrl(req);
      const filename = url.replace('/images/', '');
      return `${baseUrl}/places/test-data/images/${filename}`;
    }
    return url;
  }

  mapPlace(place: Place | null, req?: Request): any {
    if (!place) return null;
    return {
      ...place,
      coverImageUrl: this.formatCoverImageUrl(place.coverImageUrl, req),
    };
  }

  async create(createPlaceDto: CreatePlaceDto, req?: Request) {
    const source = (createPlaceDto.source || 'unknown').trim().toLowerCase();
    const sourcePlaceId = createPlaceDto.locationId;
    const lat = createPlaceDto.coordinates?.lat ?? null;
    const lng = createPlaceDto.coordinates?.lng ?? null;
    const normalizedName = this.normalizeText(createPlaceDto.nameCache);
    const normalizedAddress = this.normalizeText(createPlaceDto.addressCache || '');

    try {
      const place = await this.prisma.$transaction(async (tx) => {
        const existingSource = await tx.placeSource.findUnique({
          where: {
            source_sourcePlaceId: {
              source,
              sourcePlaceId,
            },
          },
          include: { place: true },
        });

        if (existingSource) {
          if (existingSource.place) {
            return existingSource.place;
          }
          await tx.placeSource.delete({ where: { id: existingSource.id } });
        }

        const matchedPlace = await this.findFuzzyMatch(tx, {
          name: createPlaceDto.nameCache,
          address: createPlaceDto.addressCache,
          lat,
          lng,
        });

        if (matchedPlace) {
          await tx.placeSource.create({
            data: {
              placeId: matchedPlace.id,
              source,
              sourcePlaceId,
              rawName: createPlaceDto.nameCache,
              rawAddress: createPlaceDto.addressCache,
              normalizedName,
              normalizedAddress,
              lat,
              lng,
            },
          });
          return matchedPlace;
        }

        const place = await tx.place.create({
          data: {
            source,
            sourcePlaceId,
            placeName: createPlaceDto.nameCache,
            placeAddress: createPlaceDto.addressCache,
            categories: createPlaceDto.type ? [createPlaceDto.type] : [],
            lat: lat ?? 0,
            lng: lng ?? 0,
            coverImageUrl: createPlaceDto.imageUrl,
          },
        });

        await tx.placeSource.create({
          data: {
            placeId: place.id,
            source,
            sourcePlaceId,
            rawName: createPlaceDto.nameCache,
            rawAddress: createPlaceDto.addressCache,
            normalizedName,
            normalizedAddress,
            lat,
            lng,
          },
        });

        return place;
      });
      return this.mapPlace(place, req);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existing = await this.findBySourcePlaceId(sourcePlaceId, source);
        if (existing) {
          return this.mapPlace(existing, req);
        }
      }
      throw error;
    }
  }

  async findAll(filters?: { type?: string | string[]; city?: string; q?: string }, req?: Request) {
    const where: any = {};
    const types = this.normalizeTypes(filters?.type);
    if (types.length === 1) where.categories = { has: types[0] };
    if (types.length > 1) where.categories = { hasSome: types };
    
    if (filters?.city && filters?.q) {
      // If both city and q are provided, search for either name matching q OR address matching city
      where.OR = [
        { placeName: { contains: filters.q, mode: 'insensitive' } },
        { placeAddress: { contains: filters.city, mode: 'insensitive' } }
      ];
    } else {
      if (filters?.city) {
        where.placeAddress = { contains: filters.city, mode: 'insensitive' };
      }
      if (filters?.q) {
        where.placeName = { contains: filters.q, mode: 'insensitive' };
      }
    }

    const places = await this.prisma.place.findMany({ where });
    return places.map(p => this.mapPlace(p, req));
  }

  async findOne(id: string, req?: Request) {
    if (!this.isUuid(id)) {
      const dashIndex = id.indexOf('-');
      const source = dashIndex !== -1 ? id.substring(0, dashIndex) : 'serpapi';
      const sourcePlaceId = dashIndex !== -1 ? id.substring(dashIndex + 1) : id;
      
      let place = await this.findBySourcePlaceId(sourcePlaceId, source);
      if (!place) {
        try {
          // Automatically create a stub place in DB so it exists for reviews, saved lists, presence
          place = await this.prisma.place.create({
            data: {
              source,
              sourcePlaceId,
              placeName: `Địa điểm #${sourcePlaceId.slice(0, 8)}`,
              placeAddress: 'Địa chỉ đang được cập nhật',
              categories: ['hotel'],
              lat: 16.047,
              lng: 108.206,
            },
          });
          
          await this.prisma.placeSource.create({
            data: {
              placeId: place.id,
              source,
              sourcePlaceId,
              rawName: place.placeName,
              rawAddress: place.placeAddress,
              normalizedName: this.normalizeText(place.placeName),
              normalizedAddress: this.normalizeText(place.placeAddress || ''),
              lat: 16.047,
              lng: 108.206,
            },
          });
        } catch (error: any) {
          // Concurrency race condition: another parallel request created the place first.
          // Recover by fetching the newly created place record.
          this.logger.warn(`Concurrency collision detected for sourcePlaceId ${sourcePlaceId}. Recovering...`);
          place = await this.findBySourcePlaceId(sourcePlaceId, source);
          if (!place) {
            throw error; // Re-throw original error if record still doesn't exist
          }
        }
      }
      return this.mapPlace(place, req);
    }

    const place = await this.prisma.place.findUnique({ where: { id } });
    if (!place) throw new NotFoundException(`Place #${id} not found`);
    return this.mapPlace(place, req);
  }

  async findReviews(id: string) {
    const place = await this.findOne(id);

    const reviews = await this.prisma.review.findMany({
      where: {
        placeId: place.id,
        source: { not: 'google' },
      },
      include: {
        place: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Map and parse the cached Google reviews prefix if present
    return reviews.map((r) => {
      if (r.source === 'google' && r.reviewText && r.reviewText.startsWith('__GOOGLE_REVIEW__::')) {
        const parts = r.reviewText.split('::');
        const author = parts[1] || 'Ẩn danh';
        const date = parts[2] || '';
        const cleanText = parts.slice(3).join('::') || '';
        return {
          ...r,
          author,
          date,
          reviewText: cleanText,
        };
      }
      return r;
    });
  }

  async findMedia(id: string, req?: Request) {
    const reviews = await this.findReviews(id);
    const photos = await this.findPhotos(id, req);

    return { reviews, photos };
  }

  async ensureGoogleReviewsForAiContext(id: string) {
    const place = await this.findOne(id);
    const config = this.getFeaturesConfig();

    if (!config.reviews || place.source !== 'serpapi' || !place.sourcePlaceId) {
      return [];
    }

    const latestGoogleReview = await this.prisma.review.findFirst({
      where: {
        placeId: place.id,
        source: 'google',
        reviewText: { startsWith: this.googleReviewPrefix },
      },
      orderBy: { createdAt: 'desc' },
    });

    const isStale = latestGoogleReview
      ? Date.now() - latestGoogleReview.createdAt.getTime() > this.googleReviewTtlMs
      : true;

    if (isStale) {
      try {
        await this.prisma.review.deleteMany({
          where: {
            placeId: place.id,
            source: 'google',
            reviewText: { startsWith: this.googleReviewPrefix },
          },
        });
        await this.fetchSerpApiReviewsAndCache(
          place.sourcePlaceId,
          place.id,
          this.googleReviewContextLimit,
        );
      } catch (error: any) {
        this.logger.error(`Error refreshing SerpAPI reviews for AI context ${place.id}: ${error.message}`);
      }
    }

    return this.findGoogleReviewsForAiContext(place.id);
  }

  async findGoogleReviewsForAiContext(placeId: string) {
    const reviews = await this.prisma.review.findMany({
      where: {
        placeId,
        source: 'google',
        reviewText: { startsWith: this.googleReviewPrefix },
      },
      orderBy: { createdAt: 'desc' },
      take: this.googleReviewContextLimit,
    });

    return reviews.map((r) => this.parseReviewForContext(r));
  }

  async findPhotos(id: string, req?: Request): Promise<string[]> {
    const place = await this.findOne(id, req);
    const config = this.getFeaturesConfig();

    if (config.photos && place.source === 'serpapi' && place.sourcePlaceId) {
      try {
        const serpApiPhotos = await this.fetchSerpApiPhotos(place.sourcePlaceId);
        if (serpApiPhotos.length > 0) {
          return serpApiPhotos;
        }
      } catch (error) {
        this.logger.error(`Error fetching SerpAPI photos for place ${id}: ${error.message}`);
      }
    }

    // Check if it has local test data photos stored in rawSerpApiPropertyDetails
    if (place.rawSerpApiPropertyDetails && typeof place.rawSerpApiPropertyDetails === 'object') {
      const details = place.rawSerpApiPropertyDetails as any;
      if (Array.isArray(details.images)) {
        const baseUrl = this.getBaseUrl(req);
        return details.images.map((img: string) => {
          const filename = img.startsWith('/') ? img.substring(1) : img;
          const cleanFilename = filename.startsWith('images/') ? filename.replace('images/', '') : filename;
          return `${baseUrl}/places/test-data/images/${cleanFilename}`;
        });
      }
    }

    // Default optimized behavior: return the existing cover image as a single photo in an array
    if (place.coverImageUrl) {
      return [place.coverImageUrl];
    }

    return [];
  }

  async fetchSerpApiReviewsAndCache(propertyToken: string, placeId: string, limit = 10): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn('SERPAPI_API_KEY is not configured. Skipping reviews fetch.');
      return;
    }

    try {
      this.logger.log(`Fetching dynamic Google Reviews from SerpAPI for placeId: ${placeId}`);
      const response = await this.http.axiosRef.get('https://serpapi.com/search', {
        params: {
          engine: 'google_hotels_reviews',
          property_token: propertyToken,
          api_key: this.apiKey,
          hl: 'vi',
          gl: 'vn',
        },
      });

      const reviews = (response.data?.reviews ?? []).slice(0, limit);
      if (reviews.length === 0) {
        return;
      }

      const createData = reviews.map((r: any) => {
        const author = r.user?.name || 'Ẩn danh';
        const date = r.date || '';
        const snippet = r.snippet || '';
        const encodedText = `${this.googleReviewPrefix}${author}::${date}::${snippet}`;

        return {
          placeId,
          rating: typeof r.rating === 'number' ? Math.round(r.rating) : 5,
          reviewText: encodedText,
          source: 'google',
        };
      });

      await this.prisma.$transaction(
        createData.map((data: any) => this.prisma.review.create({ data }))
      );

      this.logger.log(`Successfully cached ${reviews.length} Google Reviews in database for placeId: ${placeId}`);
    } catch (error: any) {
      this.logger.error(`SerpAPI reviews fetch error: ${error.message}`);
    }
  }

  async fetchSerpApiPhotos(propertyToken: string): Promise<string[]> {
    if (!this.apiKey) {
      return [];
    }

    try {
      this.logger.log(`Fetching dynamic Google Photos from SerpAPI for token: ${propertyToken}`);
      const response = await this.http.axiosRef.get('https://serpapi.com/search', {
        params: {
          engine: 'google_hotels_photos',
          property_token: propertyToken,
          api_key: this.apiKey,
        },
      });

      const photoUrls: string[] = [];

      if (Array.isArray(response.data?.photos)) {
        for (const p of response.data.photos) {
          if (p.photo_url) photoUrls.push(p.photo_url);
        }
      }

      if (Array.isArray(response.data?.sections)) {
        for (const section of response.data.sections) {
          if (Array.isArray(section.photos)) {
            for (const p of section.photos) {
              if (p.photo_url) photoUrls.push(p.photo_url);
            }
          }
        }
      }

      const uniqueUrls = Array.from(new Set(photoUrls.filter(url => typeof url === 'string' && url.trim().length > 0)));
      return uniqueUrls.slice(0, 15);
    } catch (error: any) {
      this.logger.error(`SerpAPI photos fetch error: ${error.message}`);
      return [];
    }
  }

  private getFeaturesConfig() {
    const configPath = path.join(process.cwd(), 'features.json');
    const defaults = { hotelSearch: true, photos: false, reviews: true, nearbyAmenities: true };
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        return { ...defaults, ...JSON.parse(content) };
      }
    } catch (err) {
      // ignore config loading errors and fallback
    }
    return defaults;
  }

  async findBySourcePlaceId(sourcePlaceId: string, source = 'serpapi') {
    const record = await this.prisma.placeSource.findUnique({
      where: {
        source_sourcePlaceId: {
          source: source.trim().toLowerCase(),
          sourcePlaceId,
        },
      },
      include: { place: true },
    });

    return record?.place ?? null;
  }

  async update(id: string, updatePlaceDto: UpdatePlaceDto, req?: Request) {
    const place = await this.prisma.place.update({
      where: { id },
      data: updatePlaceDto,
    });
    if (!place) throw new NotFoundException(`Place #${id} not found`);
    return this.mapPlace(place, req);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.place.delete({ where: { id } });
  }

  private async findFuzzyMatch(
    tx: Prisma.TransactionClient,
    input: { name: string; address?: string; lat: number | null; lng: number | null },
  ) {
    if (!input.lat || !input.lng || !input.name || !input.address) {
      return null;
    }

    const maxDistanceMeters = 50;
    const latDelta = this.metersToLatDelta(maxDistanceMeters);
    const lngDelta = this.metersToLngDelta(maxDistanceMeters, input.lat);

    const candidates = await tx.place.findMany({
      where: {
        lat: { gte: input.lat - latDelta, lte: input.lat + latDelta },
        lng: { gte: input.lng - lngDelta, lte: input.lng + lngDelta },
      },
      take: 50,
    });

    const targetName = this.normalizeText(input.name);
    const targetAddress = this.normalizeText(input.address || '');

    for (const candidate of candidates) {
      if (!candidate.placeName || !candidate.placeAddress) continue;
      if (candidate.lat == null || candidate.lng == null) continue;

      const distance = this.distanceMeters(input.lat, input.lng, candidate.lat, candidate.lng);
      if (distance > maxDistanceMeters) continue;

      const nameSim = this.jaccardSimilarity(targetName, this.normalizeText(candidate.placeName));
      const addressSim = this.jaccardSimilarity(targetAddress, this.normalizeText(candidate.placeAddress));

      if (nameSim >= 0.7 && addressSim >= 0.6) {
        return candidate;
      }
    }

    return null;
  }

  private normalizeText(text: string): string {
    const ascii = text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    return ascii
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseReviewForContext(review: any) {
    let author: string | undefined;
    let date: string | undefined;
    let text = review.reviewText || '';

    if (review.source === 'google' && text.startsWith(this.googleReviewPrefix)) {
      const parts = text.split('::');
      author = parts[1] || 'Ẩn danh';
      date = parts[2] || '';
      text = parts.slice(3).join('::') || '';
    }

    return {
      id: review.id,
      source: review.source,
      rating: review.rating,
      author,
      date,
      reviewText: text,
      createdAt: review.createdAt,
    };
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

  private jaccardSimilarity(a: string, b: string): number {
    const tokensA = this.tokenize(a);
    const tokensB = this.tokenize(b);
    if (!tokensA.size || !tokensB.size) return 0;
    const intersection = new Set([...tokensA].filter((t) => tokensB.has(t)));
    const unionSize = tokensA.size + tokensB.size - intersection.size;
    return unionSize === 0 ? 0 : intersection.size / unionSize;
  }

  private tokenize(text: string): Set<string> {
    const stopwords = new Set([
      'khach', 'san', 'nha', 'hang', 'quan', 'ca', 'phe', 'cafe',
      'hotel', 'resort', 'homestay', 'inn', 'hostel', 'restaurant',
    ]);

    const tokens = text.split(' ').filter(Boolean);
    return new Set(tokens.filter((t) => !stopwords.has(t)));
  }

  private distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
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

  private metersToLatDelta(meters: number): number {
    return meters / 111320;
  }

  private metersToLngDelta(meters: number, lat: number): number {
    return meters / (111320 * Math.cos(this.toRad(lat)));
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
