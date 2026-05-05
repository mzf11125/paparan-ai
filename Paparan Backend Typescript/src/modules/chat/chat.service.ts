import { Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ChatRepository } from '@database/repositories/chat.repository';
import { ConversationalAgent } from '@modules/agents/conversational/conversational.agent';
import { LLMService } from '@config/llm.service';
import { asyncIterableToObservable, formatSSEChunk } from '@common/utils/stream.util';

@Injectable()
export class ChatService {
  constructor(
    private chatRepository: ChatRepository,
    private conversationalAgent: ConversationalAgent,
    private llmService: LLMService,
  ) {}

  async chat(userId: string, message: string, threadId?: string) {
    // If no thread provided, create a new one
    if (!threadId) {
      const thread = await this.chatRepository.createThread(userId);
      threadId = thread.id;
    }

    // Save user message
    await this.chatRepository.createMessage({
      threadId,
      role: 'user',
      content: message,
    });

    // Get chat history for context
    const history = await this.chatRepository.findMessagesByThread(threadId, 10);

    // Generate response using conversational agent
    const response = await this.conversationalAgent.chat(
      userId,
      threadId,
      message,
      history,
    );

    // Save assistant message
    await this.chatRepository.createMessage({
      threadId,
      role: 'assistant',
      content: response.content,
      metadata: response.metadata,
    });

    return {
      threadId,
      message: response.content,
      sources: response.sources,
    };
  }

  chatStream(userId: string, message: string, threadId?: string): Observable<string> {
    return new Observable<string>((subscriber) => {
      (async () => {
        try {
          // If no thread provided, create a new one
          if (!threadId) {
            const thread = await this.chatRepository.createThread(userId);
            threadId = thread.id;
            subscriber.next(formatSSEChunk(JSON.stringify({ threadId: thread.id }), 'metadata'));
          }

          // Save user message
          await this.chatRepository.createMessage({
            threadId,
            role: 'user',
            content: message,
          });

          // Get chat history for context
          const history = await this.chatRepository.findMessagesByThread(threadId, 10);

          // Start streaming response
          const messages = [
            { role: 'system' as const, content: 'You are a helpful AI assistant for Paparan AI.' },
            ...history.slice(0, -1).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
            { role: 'user' as const, content: message },
          ];

          const stream = this.llmService.stream(messages);

          let fullContent = '';
          for await (const chunk of stream) {
            if (chunk.content) {
              fullContent += chunk.content;
              subscriber.next(formatSSEChunk(chunk.content, 'message'));
            }
            if (chunk.done) {
              subscriber.next(formatSSEChunk(JSON.stringify({ done: true }), 'done'));
            }
          }

          // Save assistant message
          await this.chatRepository.createMessage({
            threadId,
            role: 'assistant',
            content: fullContent,
          });

          subscriber.complete();
        } catch (error) {
          subscriber.error(error);
        }
      })();
    });
  }

  async getHistory(userId: string, threadId: string) {
    // Verify user owns this thread
    const thread = await this.chatRepository.findThreadById(threadId);
    if (thread.user_id !== userId) {
      throw new Error('Thread not found');
    }

    return this.chatRepository.findMessagesByThread(threadId);
  }
}
