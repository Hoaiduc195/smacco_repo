import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { AiController } from './ai.controller';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';

describe('AiController auth guards', () => {
  const getGuards = (methodName: keyof AiController) =>
    Reflect.getMetadata(GUARDS_METADATA, AiController.prototype[methodName]) ?? [];

  it.each([
    'chat',
    'chatStream',
    'listConversations',
    'createConversation',
    'getConversationMessages',
    'deleteConversation',
  ] as const)('protects %s with FirebaseAuthGuard', (methodName) => {
    expect(getGuards(methodName)).toContain(FirebaseAuthGuard);
  });

  it('keeps parse unguarded', () => {
    expect(getGuards('parse')).toEqual([]);
  });
});
