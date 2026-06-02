import { Controller, Get, Post, Delete, Param, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { SavedPlacesService } from './saved-places.service';

@ApiTags('Saved Places')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
@Controller('saved-places')
export class SavedPlacesController {
  constructor(private readonly savedPlacesService: SavedPlacesService) {}

  @Post(':placeId')
  @ApiOperation({ summary: 'Lưu địa điểm vào danh sách yêu thích' })
  savePlace(@Param('placeId') placeId: string, @Req() request: any) {
    return this.savedPlacesService.savePlace(request.user, placeId);
  }

  @Delete(':placeId')
  @ApiOperation({ summary: 'Xóa địa điểm khỏi danh sách yêu thích' })
  unsavePlace(@Param('placeId') placeId: string, @Req() request: any) {
    return this.savedPlacesService.unsavePlace(request.user, placeId);
  }

  @Get('check/:placeId')
  @ApiOperation({ summary: 'Kiểm tra trạng thái lưu của địa điểm' })
  checkSavedStatus(@Param('placeId') placeId: string, @Req() request: any) {
    return this.savedPlacesService.checkSavedStatus(request.user, placeId);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả địa điểm đã lưu của người dùng' })
  getSavedPlaces(@Req() request: any) {
    return this.savedPlacesService.getSavedPlaces(request.user);
  }
}
