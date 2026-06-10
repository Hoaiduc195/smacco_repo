
import { Controller, Post, Body, Res, Req, HttpException, HttpStatus, Get, Param, Query, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { NlpService } from './nlp.service';
import { RecommendationsService } from '../recommendations/recommendations.service';
import { ParseRequestDto } from './dto/parse-request.dto';
import { ParseResponseDto } from './dto/parse-response.dto';
import { IAiOrchestrator } from './interfaces/ai-orchestrator.interface';
import { ChatRequestDto } from './dto/chat-request.dto';
import { ConversationsService } from './conversations.service';
import { PlaceComparisonResultsService } from './place-comparison-results.service';
import { UsersService } from '../users/users.service';
import { RuntimeConfigService } from '../../config/runtime-config.service';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(
    private readonly nlpService: NlpService,
    private readonly recommendationsService: RecommendationsService,
    private readonly orchestrator: IAiOrchestrator,
    private readonly conversationsService: ConversationsService,
    private readonly placeComparisonResultsService: PlaceComparisonResultsService,
    private readonly usersService: UsersService,
    private readonly runtimeConfig: RuntimeConfigService,
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
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Send a chat message to the AI assistant' })
  async chat(@Body() request: ChatRequestDto, @Req() req: any) {
    try {
      const userId = await this.resolveConversationUserId(req.user);
      return await this.orchestrator.processQuery(request, userId);
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new HttpException(
        `Orchestrator error: ${(error as Error).message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Post('chat/stream')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Stream a chat response via SSE' })
  async chatStream(@Body() request: ChatRequestDto, @Req() req: any, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    try {
      const userId = await this.resolveConversationUserId(req.user);

      for await (const chunk of this.orchestrator.streamQuery(request, userId)) {
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
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'List recent chat conversations' })
  async listConversations(@Req() req: any, @Query('limit') limit?: string) {
    const take = this.parseBoundedLimit(limit, 20, 50);
    const conversations = await this.conversationsService.listConversations(req.user, take);
    return { conversations };
  }

  @Post('conversations')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Create a new conversation' })
  async createConversation(@Req() req: any) {
    const conversation = await this.conversationsService.createConversation(req.user);
    return { conversation };
  }

  @Get('conversations/:id/messages')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'List messages for a conversation' })
  async getConversationMessages(@Req() req: any, @Param('id') id: string, @Query('limit') limit?: string) {
    const take = this.parseBoundedLimit(limit, 50, 100);
    const messages = await this.conversationsService.getMessages(req.user, id, take);
    return {
      messages: messages.map((msg) => ({
        role: msg.senderRole,
        content: msg.messageText,
        id: msg.id,
        comparisonResultId: msg.comparisonResult?.id || null,
        createdAt: msg.createdAt,
      })),
    };
  }

  @Get('comparisons/:id')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Get a stored place comparison result' })
  async getComparisonResult(@Req() req: any, @Param('id') id: string) {
    const result = await this.placeComparisonResultsService.getForUser(req.user, id);
    return { comparison: result };
  }

  @Delete('conversations/:id')
  @ApiBearerAuth()
  @UseGuards(FirebaseAuthGuard)
  @ApiOperation({ summary: 'Delete a conversation' })
  async deleteConversation(@Req() req: any, @Param('id') id: string) {
    await this.conversationsService.deleteConversation(req.user, id);
    return { deleted: true };
  }

  private parseBoundedLimit(value: string | undefined, defaultValue: number, maxValue: number): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return defaultValue;
    return Math.min(Math.floor(parsed), maxValue);
  }

  private async resolveConversationUserId(firebaseUser: any): Promise<string> {
    if (!this.runtimeConfig.chat.persistHistory) {
      return firebaseUser.uid;
    }

    const user = await this.usersService.upsertFromFirebaseUser(firebaseUser);
    return user.id;
  }
}
