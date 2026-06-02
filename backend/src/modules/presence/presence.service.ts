import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { PlacesService } from '../places/places.service';

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  private readonly checkInRadiusMeters = 150;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly placesService: PlacesService,
  ) {}

  async checkIn(firebaseUser: { uid: string; email?: string | null; name?: string | null }, input: { placeId: string; latitude: number; longitude: number }) {
    const user = await this.usersService.upsertFromFirebaseUser(firebaseUser);
    const resolvedPlaceId = await this.resolvePlaceId(input.placeId);
    if (!resolvedPlaceId) {
      throw new BadRequestException('Địa điểm này không tồn tại hoặc chưa được đồng bộ.');
    }
    const place = await this.placesService.findOne(resolvedPlaceId);

    if (place.lat == null || place.lng == null) {
      if (process.env.NODE_ENV === 'development') {
        this.logger.warn(`Bypassing missing coordinates in development.`);
      } else {
        throw new BadRequestException('Địa điểm này chưa có tọa độ để xác minh onsite.');
      }
    }

    if (place.lat != null && place.lng != null) {
      const distance = this.distanceMeters(place.lat, place.lng, input.latitude, input.longitude);
      if (distance > this.checkInRadiusMeters) {
        if (process.env.NODE_ENV === 'development') {
          this.logger.warn(`Bypassing distance check in development. Distance was ${Math.round(distance)}m.`);
        } else {
          throw new BadRequestException('Bạn đang ở ngoài phạm vi xác minh onsite của địa điểm này.');
        }
      }
    }

    await this.prisma.presence.updateMany({
      where: { userId: user.id, leftAt: null },
      data: { leftAt: new Date() },
    });

    const presence = await this.prisma.presence.create({
      data: {
        userId: user.id,
        placeId: place.id,
      },
      include: { place: true, user: true },
    });

    this.logger.log(`User ${user.id} checked in at place ${place.id}`);
    return this.formatCurrentStatus(presence);
  }

  async leave(firebaseUser: { uid: string; email?: string | null; name?: string | null }) {
    const user = await this.usersService.upsertFromFirebaseUser(firebaseUser);
    const active = await this.prisma.presence.findFirst({
      where: { userId: user.id, leftAt: null },
      orderBy: { joinedAt: 'desc' },
      include: { place: true, user: true },
    });

    if (!active) {
      return { isActive: false };
    }

    const updated = await this.prisma.presence.update({
      where: { id: active.id },
      data: { leftAt: new Date() },
      include: { place: true, user: true },
    });

    this.logger.log(`User ${user.id} left place ${active.placeId}`);
    return {
      isActive: false,
      placeId: updated.placeId,
      placeName: updated.place?.placeName || 'Địa điểm',
      leftAt: updated.leftAt,
    };
  }

  async getMyStatus(firebaseUser: { uid: string; email?: string | null; name?: string | null }) {
    const user = await this.usersService.upsertFromFirebaseUser(firebaseUser);
    const active = await this.prisma.presence.findFirst({
      where: { userId: user.id, leftAt: null },
      orderBy: { joinedAt: 'desc' },
      include: { place: true, user: true },
    });

    if (!active) {
      return { isActive: false };
    }

    return this.formatCurrentStatus(active);
  }

  async getActiveUsers(placeId: string) {
    const resolvedPlaceId = await this.resolvePlaceId(placeId);
    if (!resolvedPlaceId) {
      return {
        placeId,
        activeUsers: 0,
        users: [],
      };
    }

    const activeUsers = await this.prisma.presence.findMany({
      where: { placeId: resolvedPlaceId, leftAt: null },
      include: { user: true, place: true },
      orderBy: { joinedAt: 'desc' },
    });

    return {
      placeId,
      activeUsers: activeUsers.length,
      users: activeUsers.map((record) => ({
        id: record.userId,
        displayName: record.user?.displayName || record.user?.email || 'Người dùng',
        joinedAt: record.joinedAt,
      })),
    };
  }

  async getActiveUserIds(placeId: string, userIds: string[]) {
    if (!userIds.length) return new Set<string>();

    const resolvedPlaceId = await this.resolvePlaceId(placeId);
    if (!resolvedPlaceId) return new Set<string>();

    const active = await this.prisma.presence.findMany({
      where: {
        placeId: resolvedPlaceId,
        leftAt: null,
        userId: { in: userIds },
      },
      select: { userId: true },
    });

    return new Set(active.map((record) => record.userId));
  }

  private formatCurrentStatus(record: any) {
    const displayName = record.user?.displayName || record.user?.email || 'Người dùng';
    return {
      isActive: true,
      placeId: record.placeId,
      placeName: record.place?.placeName || 'Địa điểm',
      placeAddress: record.place?.placeAddress || null,
      joinedAt: record.joinedAt,
      user: {
        id: record.userId,
        displayName,
        initials: displayName.slice(0, 1).toUpperCase(),
      },
    };
  }

  private distanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const radius = 6371000;
    const toRad = (value: number) => (value * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * radius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private async resolvePlaceId(placeId: string): Promise<string | null> {
    if (this.isUuid(placeId)) {
      return placeId;
    }
    const dashIndex = placeId.indexOf('-');
    const source = dashIndex !== -1 ? placeId.substring(0, dashIndex) : 'serpapi';
    const sourcePlaceId = dashIndex !== -1 ? placeId.substring(dashIndex + 1) : placeId;
    
    const place = await this.placesService.findBySourcePlaceId(sourcePlaceId, source);
    return place ? place.id : null;
  }

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }
}
