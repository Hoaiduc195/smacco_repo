import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AiQueryDto } from './dto/ai-query.dto';
import { AxiosResponse } from 'axios';

@Injectable()
export class AiIntegrationService {
  private readonly aiServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl =
      this.configService.get<string>('app.aiServiceUrl') ||  'http://localhost:8000';
  }

  async processQuery(aiQueryDto: AiQueryDto) {
    try {
      const response = await firstValueFrom(
        this.httpService.post<any>(`${this.aiServiceUrl}/api/v1/parse`, {
          text: aiQueryDto.text,
          userId: aiQueryDto.userId,
        }),
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'AI Service unavailable',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}
