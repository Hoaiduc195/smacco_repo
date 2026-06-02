import { Injectable, Logger } from '@nestjs/common';
import { IUnifiedTool } from './tool.interface';

@Injectable()
export class ToolRegistryService {
  private readonly logger = new Logger(ToolRegistryService.name);
  private readonly tools = new Map<string, IUnifiedTool>();

  registerTool(tool: IUnifiedTool) {
    if (this.tools.has(tool.id)) {
      this.logger.warn(`Tool with ID ${tool.id} is already registered. Overwriting.`);
    }
    this.tools.set(tool.id, tool);
    this.logger.log(`Registered tool: ${tool.id}`);
  }

  getTool(id: string): IUnifiedTool | undefined {
    return this.tools.get(id);
  }

  getAllTools(): IUnifiedTool[] {
    return Array.from(this.tools.values());
  }
}
