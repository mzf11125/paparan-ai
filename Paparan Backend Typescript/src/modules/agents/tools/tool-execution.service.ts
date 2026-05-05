import { Injectable, Logger } from '@nestjs/common';
import { TavilyService } from '@modules/tools/tavily/tavily.service';
import { SupabaseToolsService } from '@modules/tools/supabase-tools/supabase-tools.service';
import { HttpClientService } from '@modules/tools/http/http-client.service';
import { KnowledgeGraphService } from '@modules/tools/knowledge-graph/knowledge-graph.service';
import { DocumentProcessorService } from '@modules/tools/document-processor/document-processor.service';
import { ToolDefinition, ToolResult } from '@modules/tools/tools.types';

/**
 * Tool Execution Framework
 * Manages tool discovery, execution, and result caching for agents
 */
@Injectable()
export class ToolExecutionService {
  private readonly logger = new Logger(ToolExecutionService.name);
  private tools: Map<string, ToolDefinition> = new Map();
  private toolCache: Map<string, { result: any; timestamp: number }> = new Map();

  constructor(
    private tavily: TavilyService,
    private supabaseTools: SupabaseToolsService,
    private httpClient: HttpClientService,
    private knowledgeGraph: KnowledgeGraphService,
    private documentProcessor: DocumentProcessorService,
  ) {
    this.registerBuiltinTools();
  }

  /**
   * Register all built-in tools
   */
  private registerBuiltinTools(): void {
    // Tavily Search
    this.registerTool({
      name: 'tavily_search',
      description: 'Search the web using Tavily for current information',
      parameters: {
        query: { type: 'string', description: 'Search query', required: true },
        maxResults: { type: 'number', description: 'Maximum number of results', required: false, default: 10 },
        daysAgo: { type: 'number', description: 'Number of days to look back', required: false, default: 7 },
        topic: { type: 'enum', description: 'Search topic (general/news/finance)', required: false, enum: ['general', 'news', 'finance'] },
      },
      handler: async (params) => {
        const results = await this.tavily.search({
          query: params.query,
          maxResults: params.maxResults,
          daysAgo: params.daysAgo,
          topic: params.topic,
        });
        return { success: true, data: results };
      },
    });

    // Vector Search
    this.registerTool({
      name: 'vector_search',
      description: 'Search documents using vector similarity',
      parameters: {
        query: { type: 'string', description: 'Search query', required: true },
        limit: { type: 'number', description: 'Number of results', required: false, default: 5 },
        threshold: { type: 'number', description: 'Similarity threshold', required: false, default: 0.7 },
      },
      handler: async (params) => {
        const results = await this.supabaseTools.vectorSearch({
          query: params.query,
          limit: params.limit,
          threshold: params.threshold,
        });
        return { success: true, data: results };
      },
    });

    // HTTP Request
    this.registerTool({
      name: 'http_get',
      description: 'Make an HTTP GET request',
      parameters: {
        url: { type: 'string', description: 'URL to fetch', required: true },
        cache: { type: 'boolean', description: 'Use cache', required: false, default: true },
      },
      handler: async (params) => {
        const response = await this.httpClient.get(params.url, { cache: params.cache });
        return { success: true, data: response.data };
      },
    });

    // Knowledge Graph Query
    this.registerTool({
      name: 'knowledge_graph',
      description: 'Query the knowledge graph for entities and relationships',
      parameters: {
        query: { type: 'string', description: 'Query text', required: true },
        limit: { type: 'number', description: 'Number of results', required: false, default: 10 },
      },
      handler: async (params) => {
        const results = await this.knowledgeGraph.query(params.query);
        return { success: true, data: results };
      },
    });

    // Document Processing
    this.registerTool({
      name: 'extract_text',
      description: 'Extract text from a URL',
      parameters: {
        url: { type: 'string', description: 'URL of the document', required: true },
      },
      handler: async (params) => {
        const buffer = await this.httpClient.downloadFile(params.url);
        const result = await this.documentProcessor.extractText(buffer, 'text/plain', params.url);
        return { success: true, data: result };
      },
    });

    // Hybrid Search
    this.registerTool({
      name: 'hybrid_search',
      description: 'Combined vector and keyword search',
      parameters: {
        query: { type: 'string', description: 'Search query', required: true },
        limit: { type: 'number', description: 'Number of results', required: false, default: 5 },
        vectorWeight: { type: 'number', description: 'Weight for vector search', required: false, default: 0.7 },
        keywordWeight: { type: 'number', description: 'Weight for keyword search', required: false, default: 0.3 },
      },
      handler: async (params) => {
        const results = await this.supabaseTools.hybridSearch({
          query: params.query,
          limit: params.limit,
          vectorWeight: params.vectorWeight,
          keywordWeight: params.keywordWeight,
        });
        return { success: true, data: results };
      },
    });
  }

  /**
   * Register a custom tool
   */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    this.logger.debug(`Registered tool: ${tool.name}`);
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): void {
    this.tools.delete(name);
    this.logger.debug(`Unregistered tool: ${name}`);
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get tool descriptions for LLM function calling
   */
  getToolDescriptions(): string {
    const descriptions = this.getAllTools().map(tool => {
      const params = Object.entries(tool.parameters)
        .map(([name, param]) => {
          const required = param.required ? ' (required)' : '';
          const typeInfo = `${param.type}${required}`;
          return `  - ${name}: ${typeInfo} - ${param.description}`;
        })
        .join('\n');

      return `${tool.name}: ${tool.description}\nParameters:\n${params}`;
    }).join('\n\n');

    return `Available tools:\n\n${descriptions}`;
  }

  /**
   * Execute a tool
   */
  async executeTool(name: string, parameters: Record<string, any>, options: {
    useCache?: boolean;
    cacheTTL?: number;
  } = {}): Promise<ToolResult> {
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        success: false,
        error: `Tool not found: ${name}`,
      };
    }

    // Validate required parameters
    for (const [paramName, param] of Object.entries(tool.parameters)) {
      if (param.required && !parameters[paramName]) {
        return {
          success: false,
          error: `Missing required parameter: ${paramName}`,
        };
      }
    }

    // Check cache
    if (options.useCache !== false) {
      const cacheKey = this.getToolCacheKey(name, parameters);
      const cached = this.toolCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < (options.cacheTTL || 300000)) {
        this.logger.debug(`Cache hit for tool: ${name}`);
        return {
          ...cached.result,
          metadata: { ...cached.result.metadata, cached: true },
        };
      }
    }

    // Execute tool
    const startTime = Date.now();
    try {
      this.logger.debug(`Executing tool: ${name} with params:`, parameters);

      const result = await tool.handler(parameters);

      // Add execution metadata
      if (!result.metadata) {
        result.metadata = {};
      }
      result.metadata.executionTime = Date.now() - startTime;

      // Cache successful results
      if (result.success && options.useCache !== false) {
        const cacheKey = this.getToolCacheKey(name, parameters);
        this.toolCache.set(cacheKey, { result, timestamp: Date.now() });

        // Limit cache size
        if (this.toolCache.size > 100) {
          const firstKey = this.toolCache.keys().next().value;
          this.toolCache.delete(firstKey);
        }
      }

      return result;
    } catch (error) {
      this.logger.error(`Tool ${name} execution failed:`, error);

      return {
        success: false,
        error: error.message,
        metadata: { executionTime: Date.now() - startTime },
      };
    }
  }

  /**
   * Execute multiple tools in parallel
   */
  async executeToolsParallel(calls: Array<{ name: string; parameters: Record<string, any> }>): Promise<ToolResult[]> {
    const results = await Promise.allSettled(
      calls.map(call => this.executeTool(call.name, call.parameters))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          success: false,
          error: result.reason?.message || 'Unknown error',
        };
      }
    });
  }

  /**
   * Execute tools in sequence, passing results to next tool
   */
  async executeToolsSequential(calls: Array<{ name: string; parameters: Record<string, any> }>): Promise<ToolResult[]> {
    const results: ToolResult[] = [];
    let previousResults: Record<string, any> = {};

    for (const call of calls) {
      // Merge previous results into parameters
      const parameters = { ...previousResults, ...call.parameters };
      const result = await this.executeTool(call.name, parameters);
      results.push(result);

      // Store result for next tool
      if (result.success) {
        previousResults[call.name] = result.data;
      } else {
        // Stop on failure
        break;
      }
    }

    return results;
  }

  /**
   * Generate tool call from LLM response
   * Parses LLM output to extract tool name and parameters
   */
  parseToolCall(llmResponse: string): { name: string; parameters: Record<string, any> } | null {
    // Try to extract JSON from response
    const jsonMatch = llmResponse.match(/```json\s*([\s\S]*?)\s*```/) ||
                     llmResponse.match(/```\s*([\s\S]*?)\s*```/) ||
                     llmResponse.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);

        // Look for tool call pattern
        if (parsed.tool) {
          return {
            name: parsed.tool,
            parameters: parsed.parameters || parsed.params || {},
          };
        }

        // Check if response is a direct tool call
        for (const toolName of this.tools.keys()) {
          if (parsed[toolName]) {
            return {
              name: toolName,
              parameters: parsed[toolName],
            };
          }
        }
      } catch {
        // Invalid JSON
      }
    }

    // Try pattern matching for "tool_name(param1=value1, param2=value2)"
    const toolPattern = /(\w+)\(([^)]*)\)/;
    const match = llmResponse.match(toolPattern);

    if (match) {
      const name = match[1];
      const paramString = match[2];

      const parameters: Record<string, any> = {};

      if (paramString) {
        const pairs = paramString.split(',');
        for (const pair of pairs) {
          const [key, ...valueParts] = pair.split('=');
          const value = valueParts.join('=').trim();
          parameters[key.trim()] = this.parseValue(value);
        }
      }

      return { name, parameters };
    }

    return null;
  }

  /**
   * Parse value string to appropriate type
   */
  private parseValue(value: string): any {
    value = value.trim();

    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Number
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);

    return value;
  }

  /**
   * Generate cache key for tool call
   */
  private getToolCacheKey(name: string, parameters: Record<string, any>): string {
    const paramString = JSON.stringify(parameters, Object.keys(parameters).sort());
    return `${name}:${paramString}`;
  }

  /**
   * Clear tool cache
   */
  clearCache(): void {
    this.toolCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.toolCache.size,
      tools: Array.from(this.tools.keys()),
    };
  }

  /**
   * Format tool results for LLM
   */
  formatToolResults(results: ToolResult[]): string {
    const formatted = results.map((result, index) => {
      if (result.success) {
        return `${index + 1}. ${JSON.stringify(result.data, null, 2).slice(0, 500)}`;
      } else {
        return `${index + 1}. Error: ${result.error}`;
      }
    }).join('\n\n');

    return `Tool Execution Results:\n\n${formatted}`;
  }

  /**
   * Create tool use prompt for LLM
   */
  createToolPrompt(availableTools?: string[]): string {
    const toolList = availableTools || Array.from(this.tools.keys());

    return `You have access to the following tools:

${this.getToolDescriptions()}

To use a tool, respond in the following JSON format:
{
  "tool": "tool_name",
  "parameters": {
    "param1": "value1",
    "param2": "value2"
  }
}

Available tools: ${toolList.join(', ')}`;
  }
}
