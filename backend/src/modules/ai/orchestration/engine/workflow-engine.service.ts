import { Injectable, Logger } from '@nestjs/common';
import { WorkflowDefinition } from './workflow.schema';
import { ToolRegistryService } from '../../../../common/tools/tool-registry.service';
import { UnifiedToolOutput } from '../../../../common/tools/tool.interface';

export interface WorkflowExecutionResult {
  workflowId: string;
  success: boolean;
  stepResults: Record<string, UnifiedToolOutput>;
  error?: string;
}

@Injectable()
export class WorkflowEngineService {
  private readonly logger = new Logger(WorkflowEngineService.name);

  constructor(private readonly toolRegistry: ToolRegistryService) {}

  /**
   * Executes a workflow deterministically.
   * NO LLM calls happen here.
   */
  async executeWorkflow(
    workflow: WorkflowDefinition,
    parameters: Record<string, any>,
  ): Promise<WorkflowExecutionResult> {
    this.logger.log(`Starting workflow execution: ${workflow.id}`);
    
    const context: Record<string, any> = {
      params: parameters,
    };
    
    const stepResults: Record<string, UnifiedToolOutput> = {};

    for (const step of workflow.steps) {
      this.logger.debug(`Executing step: ${step.id} (Tool: ${step.tool})`);
      
      const tool = this.toolRegistry.getTool(step.tool);
      if (!tool) {
        const errorMsg = `Tool not found: ${step.tool} for step ${step.id}`;
        this.logger.error(errorMsg);
        return { workflowId: workflow.id, success: false, stepResults, error: errorMsg };
      }

      try {
        // Resolve inputs using current context
        const resolvedInputs = this.resolveInputs(step.inputs, context);
        
        // Execute tool
        const output = await tool.execute(resolvedInputs);
        
        // Store output in context for future steps
        stepResults[step.id] = output;
        context[step.id] = output;

        // If a step strictly fails and we don't have conditional logic yet, we might want to halt or continue.
        // For MVP, we continue, but mark the output as error.
        if (output.status === 'error') {
          this.logger.warn(`Step ${step.id} returned error: ${output.error}`);
        }
      } catch (error: any) {
        this.logger.error(`Exception in step ${step.id}: ${error.message}`);
        const failedOutput: UnifiedToolOutput = { status: 'error', error: error.message };
        stepResults[step.id] = failedOutput;
        context[step.id] = failedOutput;
      }
    }

    this.logger.log(`Completed workflow execution: ${workflow.id}`);
    return {
      workflowId: workflow.id,
      success: true,
      stepResults,
    };
  }

  /**
   * Recursively resolves template strings like "{{params.location}}" using the context.
   */
  private resolveInputs(inputs: Record<string, any>, context: Record<string, any>): Record<string, any> {
    const resolved: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string' && value.startsWith('{{') && value.endsWith('}}')) {
        const path = value.slice(2, -2).trim();
        resolved[key] = this.getValueByPath(context, path);
      } else if (typeof value === 'object' && value !== null) {
        // Handle nested objects
        resolved[key] = Array.isArray(value) 
          ? value.map(item => typeof item === 'string' ? this.resolveString(item, context) : item)
          : this.resolveInputs(value, context);
      } else {
        resolved[key] = value;
      }
    }
    
    return resolved;
  }

  private resolveString(val: string, context: Record<string, any>): any {
    if (val.startsWith('{{') && val.endsWith('}}')) {
       return this.getValueByPath(context, val.slice(2, -2).trim());
    }
    return val;
  }

  /**
   * Basic JSONPath-like resolver. e.g., "params.location" or "fetch_places.data.0.id"
   */
  private getValueByPath(obj: any, path: string): any {
    const keys = path.replace(/\[(\w+)\]/g, '.$1').split('.');
    let current = obj;
    for (const key of keys) {
      if (current === undefined || current === null) return undefined;
      current = current[key];
    }
    return current;
  }
}
