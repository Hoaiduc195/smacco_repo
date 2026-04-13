import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatRequestDto {
  @ApiProperty({ example: 'Tìm khách sạn gần biển ở Đà Nẵng' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ example: 'conv-uuid-123' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;
}
