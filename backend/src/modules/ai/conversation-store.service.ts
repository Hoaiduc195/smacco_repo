import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './dto/chat-response.dto';
import { PrismaService } from '../../prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

  createId(): string {
    const id = uuidv4();
    this.store.set(id, { createdAt: Date.now() / 1000, messages: [] });
    return id;
  }

  async getHistory(conversationId: string): Promise<ChatMessage[]> {
    const record = this.store.get(conversationId);

    if (record) {
      const now = Date.now() / 1000;
      if (now - record.createdAt <= this.ttlSeconds) {
        return record.messages.slice(-this.maxMessages);
      }

      this.store.delete(conversationId);
    }

    const messages = await this.loadHistoryFromDb(conversationId);
    if (messages.length) {
      this.store.set(conversationId, { createdAt: Date.now() / 1000, messages });
    }

    return messages;
  }

  async append(conversationId: string, message: ChatMessage): Promise<void> {
    if (!this.store.has(conversationId)) {
      this.store.set(conversationId, { createdAt: Date.now() / 1000, messages: [] });
    }

    const record = this.store.get(conversationId)!;
    record.messages.push(message);

    // Trim oldest to respect maxMessages
    if (record.messages.length > this.maxMessages) {
      record.messages = record.messages.slice(-this.maxMessages);
    }

    await this.persistMessage(conversationId, message);
  }

  reset(conversationId: string): void {
    this.store.delete(conversationId);
  }

  private async persistMessage(conversationId: string, message: ChatMessage): Promise<void> {
    await this.prisma.conversation.upsert({
      where: { id: conversationId },
      create: { id: conversationId },
      update: {},
    });

    await this.prisma.message.create({
      data: {
        conversationId,
        senderRole: message.role,
        messageText: message.content,
        retrievedChunkIds: [],
      },
    });
  }

  private async loadHistoryFromDb(conversationId: string): Promise<ChatMessage[]> {
    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: this.maxMessages,
    });

    return rows
      .reverse()
      .map((row) => ({
        role: row.senderRole as ChatMessage['role'],
        content: row.messageText,
      }));
  }
}
