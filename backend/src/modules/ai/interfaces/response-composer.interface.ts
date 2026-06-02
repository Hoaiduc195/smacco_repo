export interface ComposerContext {
  /** The original query from the user */
  userQuery: string;
  
  /** The workflow that was executed */
  workflowId: string;
  
  /** The parameters extracted by the Task Router */
  parameters: Record<string, any>;
  
  /** The raw results from the Workflow Engine (map of stepId -> ToolOutput) */
  toolResults: Record<string, any>; 

  /** Concise objective summary of search results for better LLM synthesis */
  searchResultContext?: Record<string, any>;

  /** Optional tagged place IDs from the user's active session */
  taggedPlaceIds?: string[];

  /** Optional tagged place details from the user's active session */
  taggedPlaces?: any[];
}

export interface ComposerResult {
  /** Natural language response to show the user */
  answer: string;
  
  /** Optional suggested next actions or queries */
  suggestedActions?: string[];
}

export abstract class IResponseComposer {
  /**
   * Takes the raw output from the workflow engine and uses an LLM to generate 
   * a natural language response for the user.
   */
  abstract compose(context: ComposerContext, conversationHistory?: any[]): Promise<ComposerResult>;

  /**
   * Streaming version of compose. Yields string chunks.
   */
  abstract streamCompose(context: ComposerContext, conversationHistory?: any[]): AsyncGenerator<string>;
}
