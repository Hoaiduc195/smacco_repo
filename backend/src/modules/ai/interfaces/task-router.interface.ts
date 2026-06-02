export interface TaskRouteResult {
  /** Matches WorkflowDefinition.id */
  workflowId: string; 
  
  /** Extracted parameters from user input to feed into the workflow */
  parameters: Record<string, any>; 
}

export abstract class ITaskRouter {
  /**
   * Analyzes the user query and routes it to a specific workflow with extracted parameters.
   * This uses an LLM internally with strict JSON output constraints.
   */
  abstract route(userQuery: string, conversationHistory?: any[]): Promise<TaskRouteResult>;
}
