import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RagService } from './rag.service';

@ApiTags('RAG')
@Controller('ai/rag')
export class RagController {
  constructor(private readonly ragService: RagService) {}

  @Post('chunks')
  @ApiOperation({ summary: 'Store a text chunk for RAG indexing' })
  async storeChunk(
    @Body()
    body: {
      placeId: string;
      userId?: string;
      sourceType: string;
      sourceId: string;
      chunkIndex?: number;
      content: string;
      tokenCount?: number;
      metadata?: any;
    },
  ) {
    return this.ragService.storeChunk(body);
  }

  @Get('chunks/:placeId')
  @ApiOperation({ summary: 'Retrieve relevant chunks for a place' })
  async retrieveChunks(
    @Param('placeId') placeId: string,
    @Query('query') query: string = '',
    @Query('limit') limit: number = 5,
  ) {
    const chunks = await this.ragService.retrieveChunks(placeId, query, limit);
    return { chunks, context: this.ragService.buildContext(chunks) };
  }
}
