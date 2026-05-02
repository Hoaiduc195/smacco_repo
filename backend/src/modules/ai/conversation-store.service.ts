import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './dto/chat-response.dto';

interface ConversationRecord {
  createdAt: number;
  messages: ChatMessage[];
}

/**
 * In-memory conversation history with simple trimming.
 * Ported from Python ConversationStore.
 */
@Injectable()
export class ConversationStoreService {
  private readonly maxMessages: number = 20;
  private readonly ttlSeconds: number = 3600;
  private readonly store = new Map<string, ConversationRecord>();

  createId(): string {
    const id = uuidv4();
    this.store.set(id, { createdAt: Date.now() / 1000, messages: [] });
    return id;
  }

  getHistory(conversationId: string): ChatMessage[] {
    const record = this.store.get(conversationId);
    if (!record) return [];

    const now = Date.now() / 1000;
    if (now - record.createdAt > this.ttlSeconds) {
      this.store.delete(conversationId);
      return [];
    }

    return record.messages.slice(-this.maxMessages);
  }

  append(conversationId: string, message: ChatMessage): void {
    if (!this.store.has(conversationId)) {
      this.store.set(conversationId, { createdAt: Date.now() / 1000, messages: [] });
    }

    const record = this.store.get(conversationId)!;
    record.messages.push(message);

    // Trim oldest to respect maxMessages
    if (record.messages.length > this.maxMessages) {
      record.messages = record.messages.slice(-this.maxMessages);
    }
  }

  reset(conversationId: string): void {
    this.store.delete(conversationId);
  }
}
