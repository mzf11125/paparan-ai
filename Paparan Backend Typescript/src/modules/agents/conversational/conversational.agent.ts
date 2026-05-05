import { Injectable } from '@nestjs/common';
import { LLMService } from '@config/llm.service';
import { BaseAgent, AgentContext, AgentResponse, AgentType, AgentStreamChunk } from './base/base.agent';
import { SupabaseToolsService } from '@modules/tools/supabase-tools/supabase-tools.service';
import { LLMMessage } from '@models/types/llm.types';

export interface ConversationalInput {
  message: string;
  conversationHistory?: LLMMessage[];
  useRAG?: boolean;
  retrieveContext?: boolean;
}

export interface ConversationalResult {
  content: string;
  sources: Array<{
    content: string;
    source?: string;
    url?: string;
    similarity?: number;
  }>;
  metadata?: {
    tokensUsed?: number;
    sourcesRetrieved?: number;
  };
}

/**
 * Conversational Agent - Handles RAG-enabled chat interactions
 */
@Injectable()
export class ConversationalAgent extends BaseAgent {
  readonly name = 'conversational';
  readonly description = 'Handles conversational RAG interactions for chat';
  readonly type: AgentType = 'conversational';

  constructor(
    protected llm: LLMService,
    private supabaseTools: SupabaseToolsService,
  ) {
    super(llm, {
      systemPrompt: `You are a helpful AI assistant for Paparan AI, a policy intelligence platform for Indonesia.

Your role is to:
1. Provide accurate, helpful information about policy topics
2. Help users navigate and understand policy briefs
3. Assist with research and analysis questions
4. Be concise but thorough in your responses
5. Cite sources when available

When answering:
- Use clear, professional language
- Break down complex topics into understandable points
- Provide context for policy recommendations
- Acknowledge uncertainty when appropriate
- Maintain Indonesian policy context awareness`,
    });
  }

  async execute(input: ConversationalInput, context: AgentContext): Promise<AgentResponse<ConversationalResult>> {
    this.validateInput(input, ['message']);

    try {
      // Retrieve relevant documents if RAG is enabled
      let retrievedDocuments: Array<{ content: string; source?: string; url?: string; similarity?: number }> = [];

      if (input.useRAG !== false && input.retrieveContext !== false) {
        retrievedDocuments = await this.retrieveContext(input.message, context);
      }

      // Build messages with conversation history
      const messages = this.buildChatMessages(input, context, retrievedDocuments);

      // Generate response
      const response = await this.llm.chat(messages, {
        temperature: 0.7,
        maxTokens: 2048,
      });

      return {
        success: true,
        data: {
          content: response.content,
          sources: retrievedDocuments,
          metadata: {
            tokensUsed: response.tokensUsed,
            sourcesRetrieved: retrievedDocuments.length,
          },
        },
      };
    } catch (error) {
      this.logger.error(`Conversational agent failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stream chat response
   */
  async* stream(
    input: ConversationalInput,
    context: AgentContext,
  ): AsyncIterable<AgentStreamChunk & { sources?: typeof this.retrieveContext extends (...args: any[]) => any ? any : never }> {
    this.validateInput(input, ['message']);

    yield { content: 'Retrieving relevant context...', done: false };

    // Retrieve relevant documents
    let retrievedDocuments: Array<{ content: string; source?: string; url?: string; similarity?: number }> = [];

    if (input.useRAG !== false && input.retrieveContext !== false) {
      try {
        retrievedDocuments = await this.retrieveContext(input.message, context);
        yield {
          content: `Found ${retrievedDocuments.length} relevant sources`,
          done: false,
        };
      } catch {
        yield { content: 'Proceeding without context retrieval', done: false };
      }
    }

    // Build messages
    const messages = this.buildChatMessages(input, context, retrievedDocuments);

    yield { content: '', done: false };

    // Stream response
    let fullContent = '';
    for await (const chunk of this.llm.stream(messages, { temperature: 0.7, maxTokens: 2048 })) {
      fullContent += chunk.content;
      yield {
        content: chunk.content,
        done: false,
        metadata: { sources: retrievedDocuments },
      };
    }

    yield {
      content: '',
      done: true,
      metadata: { sources: retrievedDocuments },
    };
  }

  /**
   * Retrieve relevant context using vector search
   */
  private async retrieveContext(
    message: string,
    context: AgentContext,
  ): Promise<Array<{ content: string; source?: string; url?: string; similarity?: number }>> {
    try {
      const results = await this.supabaseTools.vectorSearch({
        query: message,
        limit: 5,
        threshold: 0.7,
      });

      return results.map(r => ({
        content: r.content,
        source: r.metadata?.title || r.metadata?.source,
        url: r.metadata?.url,
        similarity: r.similarity,
      }));
    } catch (error) {
      this.logger.warn(`Context retrieval failed: ${error.message}`);
      return [];
    }
  }

  /**
   * Build chat messages with history and context
   */
  private buildChatMessages(
    input: ConversationalInput,
    context: AgentContext,
    retrievedDocuments: Array<{ content: string; source?: string }>,
  ): LLMMessage[] {
    const messages: LLMMessage[] = [];

    // System prompt
    let systemPrompt = this.buildSystemPrompt();

    // Add context about retrieved documents
    if (retrievedDocuments.length > 0) {
      systemPrompt += '\n\nYou have access to the following relevant context from the knowledge base:\n';
      retrievedDocuments.forEach((doc, i) => {
        systemPrompt += `\n[Source ${i + 1}]: ${doc.content.slice(0, 500)}`;
        if (doc.source) {
          systemPrompt += `\n(Source: ${doc.source})`;
        }
      });
      systemPrompt += '\n\nUse this context to inform your responses, but don\'t explicitly mention you\'re using retrieved context unless necessary.';
    }

    messages.push({ role: 'system', content: systemPrompt });

    // Conversation history
    if (input.conversationHistory && input.conversationHistory.length > 0) {
      for (const msg of input.conversationHistory) {
        if (msg.role !== 'system') {
          messages.push(msg);
        }
      }
    }

    // Current message
    messages.push({ role: 'user', content: input.message });

    return messages;
  }

  /**
   * Generate a suggested question based on conversation
   */
  async generateFollowUpQuestion(conversation: {
    lastMessage: string;
    lastResponse: string;
    topic?: string;
  }): Promise<string> {
    const prompt = `Based on this conversation exchange, generate one relevant follow-up question that the user might want to ask:

User: ${conversation.lastMessage}
Assistant: ${conversation.lastResponse.slice(0, 500)}${conversation.topic ? `\nTopic context: ${conversation.topic}` : ''}

Generate only the follow-up question, nothing else.`;

    const messages = this.formatMessages(prompt);
    const response = await this.llm.chat(messages, { temperature: 0.8, maxTokens: 100 });

    return response.content.trim().replace(/^"|"$/g, '').replace(/\?$/, '') + '?';
  }

  /**
   * Summarize a conversation thread
   */
  async summarizeConversation(messages: Array<{ role: string; content: string }>): Promise<string> {
    if (messages.length === 0) {
      return '';
    }

    const prompt = `Summarize the following conversation into a concise 2-3 sentence overview:

${messages.map(m => `${m.role}: ${m.content.slice(0, 200)}`).join('\n\n')}

Focus on:
1. Main topic discussed
2. Key points covered
3. Any conclusions reached`;

    const formatted = this.formatMessages(prompt);
    const response = await this.llm.chat(formatted, { temperature: 0.5, maxTokens: 300 });

    return response.content.trim();
  }

  /**
   * Extract topics from conversation
   */
  async extractTopics(messages: Array<{ role: string; content: string }>): Promise<string[]> {
    const conversationText = messages.map(m => `${m.role}: ${m.content}`).join('\n\n');

    const prompt = `Extract the main topics discussed in this conversation. Return as a JSON array of topic strings.

Conversation:
${conversationText.slice(0, 2000)}

Topics:`;

    const formatted = this.formatMessages(prompt);
    const response = await this.llm.chat(formatted, { temperature: 0.3, maxTokens: 200 });

    try {
      const topics = this.extractJson(response.content);
      return Array.isArray(topics) ? topics : [response.content.trim()];
    } catch {
      return [];
    }
  }
}
