import { Controller, Post, Body, Res, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ChatService } from './chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

@ApiTags('Chat')
@Controller('ai/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
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

  @Post('stream')
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
