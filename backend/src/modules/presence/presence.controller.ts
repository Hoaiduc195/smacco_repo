import { Body, Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { PresenceService } from './presence.service';

@ApiTags('Presence')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('presence')
export class PresenceController {
  constructor(private readonly presenceService: PresenceService) {}

  @Post('check-in')
  @ApiOperation({ summary: 'Check in at a place using coordinates' })
  checkIn(
    @Body('placeId') placeId: string,
    @Body('latitude') latitude: number,
    @Body('longitude') longitude: number,
    @Req() request: any,
  ) {
    return this.presenceService.checkIn(request.user, { placeId, latitude, longitude });
  }

  @Delete('me')
  @ApiOperation({ summary: 'Clear current onsite status' })
  leave(@Req() request: any) {
    return this.presenceService.leave(request.user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user onsite status' })
  getMyStatus(@Req() request: any) {
    return this.presenceService.getMyStatus(request.user);
  }

  @Get(':placeId')
  @ApiOperation({ summary: 'Get active users at a place' })
  getPresence(@Param('placeId') placeId: string) {
    return this.presenceService.getActiveUsers(placeId);
  }
}
