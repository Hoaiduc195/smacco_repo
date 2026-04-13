import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Contributions service — handles user-contributed content
 * that feeds into the RAG pipeline.
 * 
 * Manages: file uploads, text contributions, review data for RAG ingestion.
 */
@Injectable()
export class ContributionsService {
  private readonly logger = new Logger(ContributionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a file contribution for a place.
   */
  async createFileRecord(params: {
    placeId: string;
    userId?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    storageUrl?: string;
  }) {
    return this.prisma.file.create({
      data: {
        placeId: params.placeId,
        userId: params.userId,
        fileName: params.fileName,
        mimeType: params.mimeType,
        fileSize: params.fileSize,
        storageUrl: params.storageUrl,
        fileStatus: 'pending',
      },
    });
  }

  /**
   * List files contributed for a place.
   */
  async getFilesByPlace(placeId: string) {
    return this.prisma.file.findMany({
      where: { placeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update file processing status.
   */
  async updateFileStatus(fileId: string, status: string, errorMessage?: string) {
    return this.prisma.file.update({
      where: { id: fileId },
      data: { fileStatus: status, errorMessage },
    });
  }
}
