import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UploadService } from './upload.service';

@ApiTags('Uploads')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @ApiOperation({ summary: 'Upload a user avatar to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please provide an image file');
    }
    const url = await this.uploadService.uploadFile(file, 'avatars');
    return { url };
  }

  @Post('place')
  @ApiOperation({ summary: 'Upload a place cover or details image to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPlaceImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please provide an image file');
    }
    const url = await this.uploadService.uploadFile(file, 'places');
    return { url };
  }

  @Post('post')
  @ApiOperation({ summary: 'Upload an image for a post or contribution to Cloudflare R2' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadPostImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please provide an image file');
    }
    const url = await this.uploadService.uploadFile(file, 'posts');
    return { url };
  }
}
