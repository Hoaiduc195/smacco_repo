import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { PlacesService } from '../places/places.service';

@Injectable()
export class SavedPlacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly placesService: PlacesService,
  ) {}

  private async getDbUser(firebaseUser: { uid: string; email?: string | null; name?: string | null }) {
    const user = await this.usersService.upsertFromFirebaseUser(firebaseUser);
    if (!user) {
      throw new NotFoundException('Không tìm thấy thông tin người dùng.');
    }
    return user;
  }

  private async getDbPlace(placeId: string) {
    try {
      return await this.placesService.findOne(placeId);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Địa điểm không tồn tại hoặc chưa được đồng bộ.');
      }
      throw error;
    }
  }

  async savePlace(firebaseUser: { uid: string; email?: string | null; name?: string | null }, placeId: string) {
    const user = await this.getDbUser(firebaseUser);
    const place = await this.getDbPlace(placeId);

    const existing = await this.prisma.savedPlace.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: place.id,
        },
      },
    });

    if (!existing) {
      await this.prisma.savedPlace.create({
        data: {
          userId: user.id,
          placeId: place.id,
        },
      });
    }

    return { isSaved: true };
  }

  async unsavePlace(firebaseUser: { uid: string; email?: string | null; name?: string | null }, placeId: string) {
    const user = await this.getDbUser(firebaseUser);
    const place = await this.getDbPlace(placeId);

    await this.prisma.savedPlace.deleteMany({
      where: {
        userId: user.id,
        placeId: place.id,
      },
    });

    return { isSaved: false };
  }

  async checkSavedStatus(firebaseUser: { uid: string; email?: string | null; name?: string | null }, placeId: string) {
    const user = await this.getDbUser(firebaseUser);
    let place;
    try {
      place = await this.getDbPlace(placeId);
    } catch (error) {
      return { isSaved: false };
    }

    const saved = await this.prisma.savedPlace.findUnique({
      where: {
        userId_placeId: {
          userId: user.id,
          placeId: place.id,
        },
      },
    });

    return { isSaved: !!saved };
  }

  async getSavedPlaces(firebaseUser: { uid: string; email?: string | null; name?: string | null }) {
    const user = await this.getDbUser(firebaseUser);

    const savedRecords = await this.prisma.savedPlace.findMany({
      where: {
        userId: user.id,
      },
      include: {
        place: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return savedRecords.map((record: any) => record.place);
  }
}
