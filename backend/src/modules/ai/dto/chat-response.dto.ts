export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  id?: string;
  comparisonResultId?: string | null;
  comparisonPayload?: any;
  insightPayload?: any;
}

export interface ChatResponseDto {
  answer: string;
  conversationId: string;
  finishReason?: string;
  usagePromptTokens?: number;
  usageCompletionTokens?: number;
  messages?: ChatMessage[];
  searchAction?: any;
  comparisonResultId?: string | null;
  comparisonPayload?: any;
  insightPayload?: any;
  workflowAction?: {
    type: string;
    parameters?: Record<string, any>;
  };
}

export interface StreamChunkDto {
  conversationId: string;
  delta: string;
  finishReason?: string;
  searchAction?: any;
  messageMeta?: {
    comparisonResultId?: string | null;
    comparisonPayload?: any;
    insightPayload?: any;
  };
  workflowAction?: {
    type: string;
    parameters?: Record<string, any>;
  };
}
