import { Injectable, Logger } from '@nestjs/common';

interface PresenceRecord {
  placeId: string;
  userId: string;
  joinedAt: Date;
}

/**
 * Presence tracking service.
 * 
 * Tracks which users are currently "present" (viewing/interacting with) a place.
 * Uses in-memory storage for MVP.
 */
@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);
  private readonly presenceMap = new Map<string, PresenceRecord[]>();

  /**
   * Mark a user as present at a place.
   */
  join(placeId: string, userId: string): { placeId: string; activeUsers: number } {
    if (!this.presenceMap.has(placeId)) {
      this.presenceMap.set(placeId, []);
    }

    const records = this.presenceMap.get(placeId)!;
    const existing = records.find((r) => r.userId === userId);
    if (!existing) {
      records.push({ placeId, userId, joinedAt: new Date() });
    }

    this.logger.log(`User ${userId} joined place ${placeId}. Active: ${records.length}`);
    return { placeId, activeUsers: records.length };
  }

  /**
   * Remove a user's presence from a place.
   */
  leave(placeId: string, userId: string): { placeId: string; activeUsers: number } {
    const records = this.presenceMap.get(placeId);
    if (records) {
      const filtered = records.filter((r) => r.userId !== userId);
      this.presenceMap.set(placeId, filtered);
      this.logger.log(`User ${userId} left place ${placeId}. Active: ${filtered.length}`);
      return { placeId, activeUsers: filtered.length };
    }
    return { placeId, activeUsers: 0 };
  }

  /**
   * Get all active users at a place.
   */
  getPresence(placeId: string): { placeId: string; activeUsers: number; users: string[] } {
    const records = this.presenceMap.get(placeId) || [];
    return {
      placeId,
      activeUsers: records.length,
      users: records.map((r) => r.userId),
    };
  }
}
