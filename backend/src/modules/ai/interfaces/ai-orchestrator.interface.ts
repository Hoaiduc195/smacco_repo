import { ChatRequestDto } from '../dto/chat-request.dto';
import { ChatResponseDto, StreamChunkDto } from '../dto/chat-response.dto';

export abstract class IAiOrchestrator {
  /**
   * Orchestrates the entire AI flow for a non-streaming request.
   */
  abstract processQuery(request: ChatRequestDto): Promise<ChatResponseDto>;

  /**
   * Orchestrates the entire AI flow with a streaming response.
   */
  abstract streamQuery(request: ChatRequestDto): AsyncGenerator<StreamChunkDto>;
}
