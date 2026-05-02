

import { Controller, Post, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { NlpService } from './nlp.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { ParseRequestDto } from './dto/parse-request.dto';
import { ParseResponseDto } from './dto/parse-response.dto';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly nlpService: NlpService,
    private readonly recommendationsService: RecommendationsService,
    private readonly chatService: ChatService,
  ) {}

  @Post('parse')
  @ApiOperation({ summary: 'Parse natural language query and get recommendations' })
  async parse(@Body() dto: ParseRequestDto): Promise<ParseResponseDto> {
    try {
      // Step 1: Extract filters from natural language
      const filters = this.nlpService.extractFilters(dto.text);

      // Step 2: Get recommendations (direct service call — no HTTP!)
      const recommendations = await this.recommendationsService.recommend(
        filters.location,
        filters.type,
        filters.budget,
      );

      return {
        query: dto.text,
        extractedFilters: filters,
        recommendations,
      };
    } catch (error) {
      throw new HttpException(
        `AI parse error: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('chat')
  @ApiOperation({ summary: 'Send a chat message to the AI assistant' })
  async chat(@Body() request: ChatRequestDto) {
    try {
      return await this.chatService.chat(request);
    } catch (error) {
      throw new HttpException(
        `Chat service error: ${(error as Error).message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post('chat/stream')
  @ApiOperation({ summary: 'Stream a chat response via SSE' })
  async chatStream(@Body() request: ChatRequestDto, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      for await (const chunk of this.chatService.streamChat(request)) {
        const payload = JSON.stringify(chunk);
        res.write(`data: ${payload}\n\n`);
      }
    } catch (error) {
      const errorPayload = JSON.stringify({
        conversationId: request.conversationId || '',
        finishReason: 'error',
        error: (error as Error).message,
      });
      res.write(`data: ${errorPayload}\n\n`);
    }

    res.end();
  }
}
