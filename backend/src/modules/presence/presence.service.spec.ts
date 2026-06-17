import { BadRequestException } from '@nestjs/common';
import { PresenceService } from './presence.service';

const TEST_PLACE_ID = '11111111-1111-4111-8111-111111111111';

function createService(options?: {
  place?: Record<string, any>;
  environment?: 'development' | 'test' | 'production';
  strictCoordinateValidation?: boolean;
  strictDistanceValidation?: boolean;
}) {
  const user = { id: 'user-1', displayName: 'Test User', email: 'test@example.com' };
  const place = {
    id: TEST_PLACE_ID,
    placeName: 'Test Place',
    placeAddress: 'Test Address',
    lat: 10.7769,
    lng: 106.7009,
    ...options?.place,
  };

  const prisma = {
    presence: {
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      create: jest.fn().mockResolvedValue({
        id: 'presence-1',
        userId: user.id,
        placeId: place.id,
        place,
        user,
        joinedAt: new Date('2026-06-17T00:00:00.000Z'),
      }),
    },
  };

  const usersService = {
    upsertFromFirebaseUser: jest.fn().mockResolvedValue(user),
  };

  const placesService = {
    findOne: jest.fn().mockResolvedValue(place),
    findBySourcePlaceId: jest.fn(),
  };

  const runtimeConfig = {
    get environment() {
      return options?.environment ?? 'development';
    },
    get presence() {
      return {
        strictCoordinateValidation: options?.strictCoordinateValidation ?? true,
        strictDistanceValidation: options?.strictDistanceValidation ?? true,
      };
    },
  };

  const service = new PresenceService(
    prisma as any,
    usersService as any,
    placesService as any,
    runtimeConfig as any,
  );

  return { service, prisma, usersService, placesService };
}

describe('PresenceService runtime validation policy', () => {
  it('rejects missing place coordinates when coordinate validation is strict', async () => {
    const { service, prisma } = createService({
      place: { lat: null, lng: null },
      strictCoordinateValidation: true,
    });

    await expect(
      service.checkIn(
        { uid: 'firebase-user-1' },
        { placeId: TEST_PLACE_ID, latitude: 10.7769, longitude: 106.7009 },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.presence.create).not.toHaveBeenCalled();
  });

  it('bypasses missing place coordinates when coordinate validation is relaxed', async () => {
    const { service, prisma } = createService({
      place: { lat: null, lng: null },
      strictCoordinateValidation: false,
    });

    const result = await service.checkIn(
      { uid: 'firebase-user-1' },
      { placeId: TEST_PLACE_ID, latitude: 10.7769, longitude: 106.7009 },
    );

    expect(result).toMatchObject({
      isActive: true,
      placeId: TEST_PLACE_ID,
      placeName: 'Test Place',
    });
    expect(prisma.presence.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', leftAt: null },
      data: { leftAt: expect.any(Date) },
    });
    expect(prisma.presence.create).toHaveBeenCalled();
  });

  it('rejects distant check-ins when distance validation is strict', async () => {
    const { service, prisma } = createService({
      strictDistanceValidation: true,
    });

    await expect(
      service.checkIn(
        { uid: 'firebase-user-1' },
        { placeId: TEST_PLACE_ID, latitude: 21.0278, longitude: 105.8342 },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.presence.create).not.toHaveBeenCalled();
  });

  it('bypasses distant check-ins when distance validation is relaxed', async () => {
    const { service, prisma } = createService({
      strictDistanceValidation: false,
    });

    const result = await service.checkIn(
      { uid: 'firebase-user-1' },
      { placeId: TEST_PLACE_ID, latitude: 21.0278, longitude: 105.8342 },
    );

    expect(result).toMatchObject({
      isActive: true,
      placeId: TEST_PLACE_ID,
    });
    expect(prisma.presence.create).toHaveBeenCalled();
  });

  it('uses in-memory status and does not touch the database in test mode', async () => {
    const { service, prisma, usersService, placesService } = createService({
      environment: 'test',
    });
    const firebaseUser = {
      uid: 'firebase-user-1',
      email: 'user@example.com',
      name: 'Fixture User',
    };

    await expect(service.getMyStatus(firebaseUser)).resolves.toEqual({ isActive: false });

    const checkedIn = await service.checkIn(firebaseUser, {
      placeId: 'local-0',
      latitude: 21.0278,
      longitude: 105.8342,
    });
    expect(checkedIn).toMatchObject({
      isActive: true,
      placeId: 'local-0',
      placeName: 'Địa điểm',
      user: {
        id: 'firebase-user-1',
        displayName: 'Fixture User',
      },
    });

    await expect(service.getMyStatus(firebaseUser)).resolves.toMatchObject({
      isActive: true,
      placeId: 'local-0',
    });
    await expect(service.getActiveUsers('local-0')).resolves.toMatchObject({
      placeId: 'local-0',
      activeUsers: 1,
      users: [
        {
          id: 'firebase-user-1',
          displayName: 'Fixture User',
        },
      ],
    });
    await expect(service.getActiveUserIds('local-0', ['firebase-user-1'])).resolves.toEqual(
      new Set(['firebase-user-1']),
    );
    await expect(service.leave(firebaseUser)).resolves.toMatchObject({
      isActive: false,
      placeId: 'local-0',
      placeName: 'Địa điểm',
    });

    expect(usersService.upsertFromFirebaseUser).not.toHaveBeenCalled();
    expect(placesService.findOne).not.toHaveBeenCalled();
    expect(placesService.findBySourcePlaceId).not.toHaveBeenCalled();
    expect(prisma.presence.updateMany).not.toHaveBeenCalled();
    expect(prisma.presence.findFirst).not.toHaveBeenCalled();
    expect(prisma.presence.findMany).not.toHaveBeenCalled();
    expect(prisma.presence.update).not.toHaveBeenCalled();
    expect(prisma.presence.create).not.toHaveBeenCalled();
  });
});
