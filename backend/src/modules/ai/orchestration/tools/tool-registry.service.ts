import { Injectable, Logger } from '@nestjs/common';
import { ITool } from './tool.interface';

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly tools = new Map<string, ITool>();

  registerTool(tool: ITool) {
    if (this.tools.has(tool.id)) {
      this.logger.warn(`Tool with ID ${tool.id} is already registered. Overwriting.`);
    }
    this.tools.set(tool.id, tool);
    this.logger.log(`Registered tool: ${tool.id}`);
  }

  getTool(id: string): ITool | undefined {
    return this.tools.get(id);
  }

  getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }
}
