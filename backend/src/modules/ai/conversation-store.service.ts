import { ForbiddenException, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './dto/chat-response.dto';
import { PrismaService } from '../../prisma/prisma.service';
import { RuntimeConfigService } from '../../config/runtime-config.service';

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

  constructor(
    private readonly prisma: PrismaService,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {}

  createId(userId?: string): string {
    const id = uuidv4();
    this.store.set(this.scopeMemoryConversationId(id, userId), { createdAt: Date.now() / 1000, messages: [] });
    return id;
  }

  async getHistory(conversationId: string, userId?: string): Promise<ChatMessage[]> {
    const storeId = this.shouldPersistHistory() ? conversationId : this.scopeMemoryConversationId(conversationId, userId);
    const record = this.store.get(storeId);

    if (record) {
      const now = Date.now() / 1000;
      if (now - record.createdAt <= this.ttlSeconds) {
        return record.messages.slice(-this.maxMessages);
      }

      this.store.delete(storeId);
    }

    if (!this.shouldPersistHistory()) {
      return [];
    }

    const messages = await this.loadHistoryFromDb(conversationId, userId);
    if (messages.length) {
      this.store.set(storeId, { createdAt: Date.now() / 1000, messages });
    }

    return messages;
  }

  async append(conversationId: string, message: ChatMessage, userId?: string): Promise<void> {
    const shouldPersist = this.shouldPersistHistory();
    if (shouldPersist) {
      await this.persistMessage(conversationId, message, userId);
    }

    const storeId = shouldPersist ? conversationId : this.scopeMemoryConversationId(conversationId, userId);
    if (!this.store.has(storeId)) {
      this.store.set(storeId, { createdAt: Date.now() / 1000, messages: [] });
    }

    const record = this.store.get(storeId)!;
    record.messages.push(message);

    // Trim oldest to respect maxMessages
    if (record.messages.length > this.maxMessages) {
      record.messages = record.messages.slice(-this.maxMessages);
    }

  }

  reset(conversationId: string, userId?: string): void {
    this.store.delete(this.scopeMemoryConversationId(conversationId, userId));
  }

  listMemoryConversations(limit: number = 20, userId?: string) {
    const prefix = userId ? `${userId}:` : '';
    return Array.from(this.store.entries())
      .filter(([id]) => !prefix || id.startsWith(prefix))
      .sort((a, b) => b[1].createdAt - a[1].createdAt)
      .slice(0, limit)
      .map(([id, record]) => {
        const lastMessage = record.messages[record.messages.length - 1];
        return {
          id: prefix ? id.slice(prefix.length) : id,
          createdAt: new Date(record.createdAt * 1000),
          lastMessage: lastMessage?.content || null,
          lastRole: lastMessage?.role || null,
        };
      });
  }

  getMemoryMessages(conversationId: string, limit: number = 50, userId?: string): ChatMessage[] {
    const record = this.store.get(this.scopeMemoryConversationId(conversationId, userId));
    if (!record) return [];
    return record.messages.slice(-limit);
  }

  resolveMemoryConversationId(conversationId: string, userId?: string): string {
    return this.scopeMemoryConversationId(conversationId, userId);
  }

  private shouldPersistHistory(): boolean {
    return this.runtimeConfig.chat.persistHistory;
  }

  private async persistMessage(conversationId: string, message: ChatMessage, userId?: string): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, userId: true },
    });

    if (!conversation) {
      await this.prisma.conversation.create({ data: { id: conversationId, userId } });
    } else if (userId && conversation.userId && conversation.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập cuộc trò chuyện này.');
    } else if (userId && !conversation.userId) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { userId },
      });
    }

    await this.prisma.message.create({
      data: {
        conversationId,
        senderRole: message.role,
        messageText: message.content,
        retrievedChunkIds: [],
      },
    });
  }

  private async loadHistoryFromDb(conversationId: string, userId?: string): Promise<ChatMessage[]> {
    if (userId) {
      const conversation = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId },
        select: { id: true },
      });

      if (!conversation) return [];
    }

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

  private scopeMemoryConversationId(conversationId: string, userId?: string): string {
    if (!userId) return conversationId;
    const prefix = `${userId}:`;
    return conversationId.startsWith(prefix) ? conversationId : `${prefix}${conversationId}`;
  }
}
