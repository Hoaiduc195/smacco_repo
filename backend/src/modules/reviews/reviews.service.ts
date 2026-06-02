import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UsersService } from '../users/users.service';
import { PlacesService } from '../places/places.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly placesService: PlacesService,
  ) {}

  async create(createReviewDto: CreateReviewDto, firebaseUser: any) {
    const author = await this.usersService.upsertFromFirebaseUser(firebaseUser);
    const place = await this.placesService.findOne(createReviewDto.locationId);

    const data: any = {
      placeId: place.id,
      userId: author.id,
      rating: createReviewDto.rating,
      reviewText: createReviewDto.content,
    };

    return this.prisma.review.create({
      data,
      include: {
        place: true,
        user: true,
      },
    });
  }

  async findAll(locationId?: string, userId?: string) {
    const where: any = {};
    if (locationId) where.placeId = locationId;
    if (userId) where.userId = userId;

    return this.prisma.review.findMany({
      where,
      include: {
        place: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: {
        place: true,
        user: true,
      },
    });
    if (!review) throw new NotFoundException(`Review #${id} not found`);
    return review;
  }

  async remove(id: string, firebaseUser: any): Promise<void> {
    const dbUser = await this.usersService.findByFirebaseUid(firebaseUser.uid);
    if (!dbUser) throw new ForbiddenException('Không tìm thấy người dùng.');

    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException(`Review #${id} not found`);

    if (review.userId !== dbUser.id) {
      throw new ForbiddenException('Bạn chỉ có thể xóa đánh giá của chính mình.');
    }

    await this.prisma.review.delete({ where: { id } });
  }
}
