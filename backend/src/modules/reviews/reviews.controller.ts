import { Controller, Get, Post, Delete, Body, Param, Query, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Create a review' })
  create(@Body() createReviewDto: CreateReviewDto, @Req() request: any) {
    return this.reviewsService.create(createReviewDto, request.user);
  }

  @Get()
  @ApiOperation({ summary: 'Get reviews (optionally by location or user)' })
  @ApiQuery({ name: 'locationId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  findAll(@Query('locationId') locationId?: string, @Query('userId') userId?: string) {
    return this.reviewsService.findAll(locationId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete own review' })
  remove(@Param('id') id: string, @Req() request: any) {
    return this.reviewsService.remove(id, request.user);
  }
}
