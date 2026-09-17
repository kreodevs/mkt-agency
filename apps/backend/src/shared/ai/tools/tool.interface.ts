export type JsonSchemaType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface JsonSchema {
  type: JsonSchemaType;
  description?: string;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  items?: JsonSchema;
  enum?: string[];
  default?: unknown;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: JsonSchema;
}

export interface ToolExecutionResult {
  success: boolean;
  result: unknown;
  error?: string;
}

export interface ToolContext {
  tenantId: string;
  productId?: string | null;
  userId?: string | null;
}

export interface AgentTool {
  definition: ToolDefinition;
  execute(input: Record<string, unknown>, ctx: ToolContext): Promise<ToolExecutionResult>;
}
