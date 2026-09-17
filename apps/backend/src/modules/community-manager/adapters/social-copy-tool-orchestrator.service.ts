import { Injectable, Logger } from '@nestjs/common';
import { LlmClient, type ToolDefinitionForLlm } from '../../../shared/ai/llm.client';
import { ToolRegistryService } from '../../../shared/ai/tools/tool-registry.service';
import type { ToolContext } from '../../../shared/ai/tools/tool.interface';

export interface ToolExecutionContext {
  tenantId: string;
  productId: string | null | undefined;
}

@Injectable()
export class SocialCopyToolOrchestratorService {
  private readonly logger = new Logger(SocialCopyToolOrchestratorService.name);

  constructor(
    private readonly llm: LlmClient,
    private readonly toolRegistry: ToolRegistryService,
  ) {}

  async executeTools(
    systemPrompt: string,
    userPrompt: string,
    taskType: string,
    toolCtx: ToolExecutionContext,
  ): Promise<string> {
    const toolDefinitions = this.buildToolDefinitions();

    const firstResponse = await this.llm.chat(systemPrompt, userPrompt, {
      taskType: taskType as never,
      maxTokens: 1024,
      temperature: 0.3,
      tools: toolDefinitions,
      toolChoice: 'auto',
    });

    if (!firstResponse.toolCalls.length) {
      return '';
    }

    const toolContext: ToolContext = {
      tenantId: toolCtx.tenantId,
      productId: toolCtx.productId ?? null,
      userId: null,
    };

    const results: string[] = [];
    for (const call of firstResponse.toolCalls) {
      const tool = this.toolRegistry.get(call.name);
      if (!tool) {
        this.logger.warn(`Tool not found: ${call.name}`);
        results.push(`[${call.name}]: Tool not found`);
        continue;
      }
      const executionResult = await tool.execute(call.args, toolContext);
      const formatted = executionResult.success
        ? `[${call.name}]: ${JSON.stringify(executionResult.result)}`
        : `[${call.name}]: ERROR — ${executionResult.error}`;
      results.push(formatted);
    }

    return results.join('\n\n');
  }

  private buildToolDefinitions(): ToolDefinitionForLlm[] {
    const all = this.toolRegistry.getAllDefinitions();
    return all.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema as unknown as Record<string, unknown>,
    }));
  }
}
