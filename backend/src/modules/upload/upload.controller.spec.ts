import 'reflect-metadata';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { UploadController } from './upload.controller';

describe('UploadController security', () => {
  it('protects every upload route with Firebase authentication', () => {
    const guards = Reflect.getMetadata(GUARDS_METADATA, UploadController) || [];

    expect(guards).toContain(FirebaseAuthGuard);
  });
});
