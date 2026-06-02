import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConversationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listConversations(limit: number = 20) {
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
    return this.prisma.conversation.create({ data: {} });
  }

  async getMessages(conversationId: string, limit: number = 50) {
    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async deleteConversation(conversationId: string) {
    return this.prisma.conversation.delete({
      where: { id: conversationId },
    });
  }
}
