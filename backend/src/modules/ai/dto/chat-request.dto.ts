import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
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

  @ApiPropertyOptional({ type: [String], example: ['place-uuid-1', 'place-uuid-2'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  taggedPlaceIds?: string[];

  @ApiPropertyOptional({ type: [Object], example: [{ id: 'place-uuid-1', name: 'Hotel A' }] })
  @IsOptional()
  @IsArray()
  taggedPlaces?: any[];
}
