export interface UnifiedToolInput {
  [key: string]: any;
}

export interface UnifiedToolOutput<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
  scoringMap?: Record<string, { score: number; details?: any }>;
}

export interface IUnifiedTool {
  readonly id: string;
  readonly description: string;
  execute(inputs: UnifiedToolInput): Promise<UnifiedToolOutput>;
}
