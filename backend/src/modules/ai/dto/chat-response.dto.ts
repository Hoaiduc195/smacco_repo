export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponseDto {
  answer: string;
  conversationId: string;
  finishReason?: string;
  usagePromptTokens?: number;
  usageCompletionTokens?: number;
  messages?: ChatMessage[];
  searchAction?: any;
}

export interface StreamChunkDto {
  conversationId: string;
  delta: string;
  finishReason?: string;
  searchAction?: any;
}
