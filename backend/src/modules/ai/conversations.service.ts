import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationStoreService } from './conversation-store.service';
import { RuntimeConfigService } from '../../config/runtime-config.service';

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: ConversationStoreService,
    private readonly runtimeConfig: RuntimeConfigService,
  ) {}

  async listConversations(limit: number = 20) {
    if (!this.runtimeConfig.chat.persistHistory) {
      return this.store.listMemoryConversations(limit);
    }

    const conversations = await this.prisma.conversation.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return conversations.map((conversation) => ({
      id: conversation.id,
      createdAt: conversation.createdAt,
      lastMessage: conversation.messages[0]?.messageText || null,
      lastRole: conversation.messages[0]?.senderRole || null,
    }));
  }

  async createConversation() {
    if (!this.runtimeConfig.chat.persistHistory) {
      return {
        id: this.store.createId(),
        createdAt: new Date(),
      };
    }

    return this.prisma.conversation.create({ data: {} });
  }

  async getMessages(conversationId: string, limit: number = 50) {
    if (!this.runtimeConfig.chat.persistHistory) {
      return this.store.getMemoryMessages(conversationId, limit).map((message, index) => ({
        id: `${conversationId}-${index}`,
        conversationId,
        senderRole: message.role,
        messageText: message.content,
        createdAt: new Date(),
      }));
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async deleteConversation(conversationId: string) {
    if (!this.runtimeConfig.chat.persistHistory) {
      this.store.reset(conversationId);
      return { id: conversationId };
    }

    return this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }
}
