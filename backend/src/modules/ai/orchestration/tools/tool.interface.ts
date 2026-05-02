export interface ToolInput {
  [key: string]: any;
}

export interface ToolOutput<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
}

export interface ITool {
  /** Unique identifier for the tool, used in workflow definitions */
  readonly id: string;
  
  /** Description of what the tool does */
  readonly description: string;

  /** Execute the tool with deterministic logic */
  execute(inputs: ToolInput): Promise<ToolOutput>;
}
