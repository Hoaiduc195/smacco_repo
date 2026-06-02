

import { Controller, Post, Body, Res, HttpException, HttpStatus, Get, Param, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { NlpService } from './nlp.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { ParseRequestDto } from './dto/parse-request.dto';
import { ParseResponseDto } from './dto/parse-response.dto';
import { IAiOrchestrator } from './interfaces/ai-orchestrator.interface';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ConversationsService } from './conversations.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly nlpService: NlpService,
    private readonly recommendationsService: RecommendationsService,
    private readonly orchestrator: IAiOrchestrator,
    private readonly conversationsService: ConversationsService,
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
      return await this.orchestrator.processQuery(request);
    } catch (error) {
      throw new HttpException(
        `Orchestrator error: ${(error as Error).message}`,
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
      for await (const chunk of this.orchestrator.streamQuery(request)) {
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

  @Get('conversations')
  @ApiOperation({ summary: 'List recent chat conversations' })
  async listConversations(@Query('limit') limit?: string) {
    const take = Number(limit) || 20;
    const conversations = await this.conversationsService.listConversations(take);
    return { conversations };
  }

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  async createConversation() {
    const conversation = await this.conversationsService.createConversation();
    return { conversation };
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'List messages for a conversation' })
  async getConversationMessages(@Param('id') id: string, @Query('limit') limit?: string) {
    const take = Number(limit) || 50;
    const messages = await this.conversationsService.getMessages(id, take);
    return {
      messages: messages.map((msg) => ({
        role: msg.senderRole,
        content: msg.messageText,
        createdAt: msg.createdAt,
      })),
    };
  }

  @Delete('conversations/:id')
  @ApiOperation({ summary: 'Delete a conversation' })
  async deleteConversation(@Param('id') id: string) {
    await this.conversationsService.deleteConversation(id);
    return { deleted: true };
  }
}
