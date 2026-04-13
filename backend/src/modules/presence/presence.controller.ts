import { Controller, Post, Delete, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PresenceService } from './presence.service';

@ApiTags('Presence')
@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Post(':placeId/join')
  @ApiOperation({ summary: 'Join a place (mark user as present)' })
  join(@Param('placeId') placeId: string, @Body('userId') userId: string) {
    return this.presenceService.join(placeId, userId);
  }

  @Delete(':placeId/leave')
  @ApiOperation({ summary: 'Leave a place (remove presence)' })
  leave(@Param('placeId') placeId: string, @Body('userId') userId: string) {
    return this.presenceService.leave(placeId, userId);
  }

  @Get(':placeId')
  @ApiOperation({ summary: 'Get active users at a place' })
  getPresence(@Param('placeId') placeId: string) {
    return this.presenceService.getPresence(placeId);
  }
}
