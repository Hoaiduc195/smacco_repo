import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createReviewDto: CreateReviewDto) {
    const data: any = {
      placeId: createReviewDto.locationId,
      userId: createReviewDto.userId,
      rating: createReviewDto.rating,
      reviewText: createReviewDto.content,
    };

    return this.prisma.review.create({ data });
  }

  async findAll(locationId?: string, userId?: string) {
    const where: any = {};
    if (locationId) where.placeId = locationId;
    if (userId) where.userId = userId;

    return this.prisma.review.findMany({
      where,
      include: {
        place: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException(`Review #${id} not found`);
    return review;
  }

  async remove(id: string): Promise<void> {
    await this.prisma.review.delete({ where: { id } });
  }
}
