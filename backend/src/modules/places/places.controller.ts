import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlacesService } from './places.service';
import { CreatePlaceDto } from './dto/create-place.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { Request, Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@ApiTags('Places')
@Controller('places')
export class PlacesController {
  constructor(private readonly placesService: PlacesService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new place' })
  create(@Body() createPlaceDto: CreatePlaceDto, @Req() req: Request) {
    return this.placesService.create(createPlaceDto, req);
  }

  @Get('test-data/images/:filename')
  @ApiOperation({ summary: 'Get local test data image' })
  serveTestDataImage(
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    const candidates = [
      path.join(process.cwd(), 'test', 'fixtures', 'images'),
      path.join(process.cwd(), 'backend', 'test', 'fixtures', 'images'),
      path.join(__dirname, '..', '..', '..', 'test', 'fixtures', 'images'),
      path.join(__dirname, '..', '..', '..', '..', 'test', 'fixtures', 'images'),
    ];
    let imagesDir = '';
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        imagesDir = c;
        break;
      }
    }

    if (!imagesDir) {
      throw new NotFoundException('Test data images directory not found');
    }

    const filePath = path.join(imagesDir, filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException(`Image ${filename} not found`);
    }

    return res.sendFile(filePath);
  }

  @Get()
  @ApiOperation({ summary: 'Get all places' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'city', required: false })
  findAll(@Query('type') type?: string, @Query('city') city?: string, @Req() req?: Request) {
    return this.placesService.findAll({ type, city }, req);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get place by ID' })
  findOne(@Param('id') id: string, @Req() req?: Request) {
    return this.placesService.findOne(id, req);
  }

  @Get(':id/reviews')
  @ApiOperation({ summary: 'Get reviews for a place' })
  findReviews(@Param('id') id: string) {
    return this.placesService.findReviews(id);
  }

  @Get(':id/media')
  @ApiOperation({ summary: 'Get photos and reviews for a place' })
  findMedia(@Param('id') id: string, @Req() req?: Request) {
    return this.placesService.findMedia(id, req);
  }

  @Get(':id/photos')
  @ApiOperation({ summary: 'Get photos for a place' })
  findPhotos(@Param('id') id: string, @Req() req?: Request) {
    return this.placesService.findPhotos(id, req);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update place' })
  update(@Param('id') id: string, @Body() updatePlaceDto: UpdatePlaceDto, @Req() req?: Request) {
    return this.placesService.update(id, updatePlaceDto, req);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete place' })
  remove(@Param('id') id: string) {
    return this.placesService.remove(id);
  }
}
