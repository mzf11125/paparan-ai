import { Observable } from 'rxjs';
import { AsyncIterableIterator } from 'typescript';

/**
 * Convert an AsyncIterable to an Observable for SSE streaming
 */
export function asyncIterableToObservable<T>(
  asyncIterable: AsyncIterable<T>,
): Observable<T> {
  return new Observable<T>((subscriber) => {
    (async () => {
      try {
        for await (const item of asyncIterable) {
          subscriber.next(item);
        }
        subscriber.complete();
      } catch (error) {
        subscriber.error(error);
      }
    })();
  });
}

/**
 * Create SSE-formatted data from a chunk
 */
export function formatSSEChunk(data: string, event?: string): string {
  let output = '';

  if (event) {
    output += `event: ${event}\n`;
  }

  output += `data: ${data}\n\n`;
  return output;
}

/**
 * SSE event types for streaming
 */
export enum SSEEventType {
  MESSAGE = 'message',
  DONE = 'done',
  ERROR = 'error',
  METADATA = 'metadata',
  SOURCE = 'source',
}

/**
 * SSE message format
 */
export interface SSEMessage {
  event?: SSEEventType;
  data: string;
  id?: string;
  retry?: number;
}

/**
 * Format an SSE message
 */
export function formatSSEMessage(message: SSEMessage): string {
  let output = '';

  if (message.id) {
    output += `id: ${message.id}\n`;
  }

  if (message.event) {
    output += `event: ${message.event}\n`;
  }

  if (message.retry) {
    output += `retry: ${message.retry}\n`;
  }

  output += `data: ${message.data}\n\n`;
  return output;
}

/**
 * Create SSE response from LLM stream chunks
 */
export async function* streamToSSE(
  stream: AsyncIterable<{ content: string; done: boolean }>,
  options: {
    includeMetadata?: boolean;
    metadata?: Record<string, any>;
  } = {},
): AsyncIterable<string> {
  const { includeMetadata, metadata } = options;

  if (includeMetadata && metadata) {
    yield formatSSEMessage({
      event: SSEEventType.METADATA,
      data: JSON.stringify(metadata),
    });
  }

  for await (const chunk of stream) {
    if (chunk.content) {
      yield formatSSEMessage({
        event: SSEEventType.MESSAGE,
        data: chunk.content,
      });
    }

    if (chunk.done) {
      yield formatSSEMessage({
        event: SSEEventType.DONE,
        data: JSON.stringify({ done: true }),
      });
    }
  }
}

/**
 * Accumulate stream chunks into a complete response
 */
export async function accumulateStream(
  stream: AsyncIterable<{ content: string; done: boolean }>,
): Promise<string> {
  let content = '';

  for await (const chunk of stream) {
    content += chunk.content;
    if (chunk.done) break;
  }

  return content;
}

/**
 * Parse SSE message from string
 */
export function parseSSEMessage(line: string): SSEMessage | null {
  if (!line.startsWith('data:') && !line.startsWith('event:') && !line.startsWith('id:')) {
    return null;
  }

  const message: SSEMessage = {
    data: '',
  };

  const parts = line.split('\n');
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith('event:')) {
      message.event = trimmed.slice(6).trim() as SSEEventType;
    } else if (trimmed.startsWith('data:')) {
      message.data = trimmed.slice(5).trim();
    } else if (trimmed.startsWith('id:')) {
      message.id = trimmed.slice(3).trim();
    } else if (trimmed.startsWith('retry:')) {
      message.retry = parseInt(trimmed.slice(6).trim(), 10);
    }
  }

  return message;
}

/**
 * Buffer and parse SSE stream
 */
export async function* parseSSEStream(
  stream: AsyncIterable<string>,
): AsyncIterable<SSEMessage> {
  let buffer = '';

  for await (const chunk of stream) {
    buffer += chunk;
    const lines = buffer.split('\n\n');
    buffer = lines.pop() || ''; // Keep incomplete message in buffer

    for (const line of lines) {
      const message = parseSSEMessage(line);
      if (message) {
        yield message;
      }
    }
  }

  // Process any remaining buffer
  if (buffer.trim()) {
    const message = parseSSEMessage(buffer);
    if (message) {
      yield message;
    }
  }
}
