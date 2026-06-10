import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationStoreService } from './conversation-store.service';
import { RuntimeConfigService } from '../../config/runtime-config.service';
import { UsersService } from '../users/users.service';

type FirebaseUser = { uid: string; email?: string | null; name?: string | null };

@Injectable()
export class ConversationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly store: ConversationStoreService,
    private readonly runtimeConfig: RuntimeConfigService,
    private readonly usersService: UsersService,
  ) {}

  async listConversations(firebaseUser: FirebaseUser, limit: number = 20) {
    if (!this.runtimeConfig.chat.persistHistory) {
      return this.store.listMemoryConversations(limit, firebaseUser.uid);
    }

    const user = await this.usersService.upsertFromFirebaseUser(firebaseUser);

    const conversations = await this.prisma.conversation.findMany({
      where: { userId: user.id },
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

  async createConversation(firebaseUser: FirebaseUser) {
    if (!this.runtimeConfig.chat.persistHistory) {
      const id = this.store.createId(firebaseUser.uid);
      return {
        id,
        createdAt: new Date(),
      };
    }

    const user = await this.usersService.upsertFromFirebaseUser(firebaseUser);

    return this.prisma.conversation.create({ data: { userId: user.id } });
  }

  async getMessages(firebaseUser: FirebaseUser, conversationId: string, limit: number = 50) {
    if (!this.runtimeConfig.chat.persistHistory) {
      return this.store.getMemoryMessages(conversationId, limit, firebaseUser.uid).map((message, index) => ({
        id: `${conversationId}-${index}`,
        conversationId,
        senderRole: message.role,
        messageText: message.content,
        createdAt: new Date(),
      }));
    }

    const user = await this.usersService.upsertFromFirebaseUser(firebaseUser);

    return this.prisma.message.findMany({
      where: {
        conversationId,
        conversation: { userId: user.id },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  }

  async deleteConversation(firebaseUser: FirebaseUser, conversationId: string) {
    if (!this.runtimeConfig.chat.persistHistory) {
      this.store.reset(conversationId, firebaseUser.uid);
      return { id: conversationId };
    }

    const user = await this.usersService.upsertFromFirebaseUser(firebaseUser);

    return this.prisma.conversation.deleteMany({
      where: { id: conversationId, userId: user.id },
    });
  }
}
