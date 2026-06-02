export interface WorkflowStep {
  /** Unique ID for this step within the workflow */
  id: string;
  
  /** References ITool.id */
  tool: string; 
  
  /** 
   * Input mappings for the tool. 
   * Can contain template strings like "{{params.query}}" or "{{stepId.data.someField}}"
   */
  inputs: Record<string, any>; 
}

export interface WorkflowDefinition {
  /** Unique identifier for the workflow (e.g., "SEARCH_AND_RECOMMEND") */
  id: string;
  
  /** Description of the workflow purpose */
  description: string;
  
  /** Directed sequence of steps to execute */
  steps: WorkflowStep[];
}
