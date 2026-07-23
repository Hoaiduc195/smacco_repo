import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  MaxFileSizeValidator,
  ParseFilePipe,
  FileTypeValidator,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { UploadService } from './upload.service';

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_MIME_TYPE = /^image\/(jpeg|png|webp|gif)$/;

@ApiTags('Uploads')
@ApiBearerAuth()
@UseGuards(FirebaseAuthGuard)
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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  async uploadAvatar(@UploadedFile(new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE_BYTES }),
      new FileTypeValidator({ fileType: IMAGE_MIME_TYPE }),
    ],
  })) file: Express.Multer.File) {
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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  async uploadPlaceImage(@UploadedFile(new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE_BYTES }),
      new FileTypeValidator({ fileType: IMAGE_MIME_TYPE }),
    ],
  })) file: Express.Multer.File) {
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
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_SIZE_BYTES } }))
  async uploadPostImage(@UploadedFile(new ParseFilePipe({
    validators: [
      new MaxFileSizeValidator({ maxSize: MAX_IMAGE_SIZE_BYTES }),
      new FileTypeValidator({ fileType: IMAGE_MIME_TYPE }),
    ],
  })) file: Express.Multer.File) {
    const url = await this.uploadService.uploadFile(file, 'posts');
    return { url };
  }
}
