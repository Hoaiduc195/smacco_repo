import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AiIntegrationController } from './ai-integration.controller';
import { AiIntegrationService } from './ai-integration.service';

@Module({
  imports: [HttpModule],
  controllers: [AiIntegrationController],
  providers: [AiIntegrationService],
})
export class AiIntegrationModule {}
