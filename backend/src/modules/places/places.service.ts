import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';

@Injectable()
export class PlacesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPlaceDto: CreatePlaceDto) {
    const data: any = {
      source: 'user',
      sourcePlaceId: createPlaceDto.locationId,
      placeName: createPlaceDto.nameCache,
      placeAddress: createPlaceDto.addressCache,
      categories: createPlaceDto.type ? [createPlaceDto.type] : [],
      lat: createPlaceDto.coordinates?.lat ?? 0,
      lng: createPlaceDto.coordinates?.lng ?? 0,
    };

    return this.prisma.place.create({ data });
  }

  async findAll(filters?: { type?: string; city?: string; q?: string }) {
    const where: any = {};
    if (filters?.type) where.type = filters.type;
    
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
}
