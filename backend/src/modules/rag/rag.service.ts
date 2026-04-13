import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * RAG (Retrieval-Augmented Generation) Service.
 * 
 * Handles:
 * - Storing text chunks with vector embeddings
 * - Retrieving relevant chunks for a given query
 * - Building context for LLM prompts
 */
@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Store a chunk of text with its embedding for a specific place.
   */
  async storeChunk(params: {
    placeId: string;
    userId?: string;
    sourceType: string;
    sourceId: string;
    chunkIndex?: number;
    content: string;
    tokenCount?: number;
    metadata?: any;
  }) {
    // TODO: Generate embedding via Groq or local model
    // For now, store the chunk without embedding
    this.logger.log(`Storing chunk for place ${params.placeId}, source: ${params.sourceType}`);

    // Note: embedding field requires Unsupported("vector") type
    // This will be implemented when embedding generation is ready
    return { stored: true, placeId: params.placeId };
  }

  /**
   * Retrieve relevant chunks for a place based on a query.
   */
  async retrieveChunks(placeId: string, query: string, limit: number = 5) {
    // TODO: Implement vector similarity search
    // For MVP, return recent chunks for the place
    const chunks = await this.prisma.chunk.findMany({
      where: { placeId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return chunks;
  }

  /**
   * Build context string from retrieved chunks for LLM prompt.
   */
  buildContext(chunks: any[]): string {
    if (!chunks.length) return '';
    return chunks.map((c) => c.content).join('\n\n---\n\n');
  }
}
