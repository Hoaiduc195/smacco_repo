import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';



@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (admin.apps.length === 0) {
      const projectId = this.configService.get<string>('firebase.projectId');
      if (!projectId) {
        throw new UnauthorizedException('Firebase project ID is not configured');
      }

      admin.initializeApp({
        projectId,
      });
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split('Bearer ')[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      request.user = decodedToken;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid Firebase token');
    }
  }
}
