import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('r2.accountId');
    const accessKeyId = this.configService.get<string>('r2.accessKeyId');
    const secretAccessKey = this.configService.get<string>('r2.secretAccessKey');
    this.bucketName = this.configService.get<string>('r2.bucketName') || '';
    this.publicUrl = this.configService.get<string>('r2.publicUrl') || '';

    if (!accountId || !accessKeyId || !secretAccessKey || !this.bucketName) {
      this.logger.warn('Cloudflare R2 is not fully configured. File uploads might fail.');
    }

    this.s3Client = new S3Client({
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: accessKeyId || '',
        secretAccessKey: secretAccessKey || '',
      },
      region: 'auto',
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const fileExt = path.extname(file.originalname);
    const uniqueId = uuidv4();
    const fileName = `${folder}/${uniqueId}${fileExt}`;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await this.s3Client.send(command);

      const baseUrl = this.publicUrl
        ? this.publicUrl.replace(/\/$/, '')
        : `https://${this.bucketName}.${this.configService.get<string>('r2.accountId')}.r2.cloudflarestorage.com`;

      return `${baseUrl}/${fileName}`;
    } catch (error) {
      this.logger.error(`Error uploading file to R2: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to upload file to Cloudflare R2: ${error.message}`);
    }
  }
}
