import { Controller, Post, Get, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ContributionsService } from './contributions.service';

@ApiTags('Contributions')
@ApiBearerAuth()
@Controller('contributions')
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Post('files')
  @ApiOperation({ summary: 'Record a file contribution for a place' })
  async createFile(
    @Body()
    body: {
      placeId: string;
      userId?: string;
      fileName?: string;
      mimeType?: string;
      fileSize?: number;
      storageUrl?: string;
    },
  ) {
    return this.contributionsService.createFileRecord(body);
  }

  @Get('files/:placeId')
  @ApiOperation({ summary: 'List files contributed for a place' })
  async getFiles(@Param('placeId') placeId: string) {
    return this.contributionsService.getFilesByPlace(placeId);
  }

  @Patch('files/:fileId/status')
  @ApiOperation({ summary: 'Update file processing status' })
  async updateStatus(
    @Param('fileId') fileId: string,
    @Body() body: { status: string; errorMessage?: string },
  ) {
    return this.contributionsService.updateFileStatus(fileId, body.status, body.errorMessage);
  }
}
