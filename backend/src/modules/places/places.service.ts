import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPlaceDto: CreatePlaceDto) {
    const source = (createPlaceDto.source || 'unknown').trim().toLowerCase();
    const sourcePlaceId = createPlaceDto.locationId;
    const lat = createPlaceDto.coordinates?.lat ?? null;
    const lng = createPlaceDto.coordinates?.lng ?? null;
    const normalizedName = this.normalizeText(createPlaceDto.nameCache);
    const normalizedAddress = this.normalizeText(createPlaceDto.addressCache || '');

    return this.prisma.$transaction(async (tx) => {
      const existingSource = await tx.placeSource.findUnique({
        where: {
          source_sourcePlaceId: {
            source,
            sourcePlaceId,
          },
        },
        include: { place: true },
      });

      if (existingSource?.place) {
        return existingSource.place;
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
  }

  async findAll(filters?: { type?: string; city?: string; q?: string }) {
    const where: any = {};
    if (filters?.type) where.categories = { has: filters.type };
    
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

    return this.prisma.place.findMany({ where });
  }

  async findOne(id: string) {
    const place = await this.prisma.place.findUnique({ where: { id } });
    if (!place) throw new NotFoundException(`Place #${id} not found`);
    return place;
  }

  async update(id: string, updatePlaceDto: UpdatePlaceDto) {
    const place = await this.prisma.place.update({
      where: { id },
      data: updatePlaceDto,
    });
    if (!place) throw new NotFoundException(`Place #${id} not found`);
    return place;
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
}
