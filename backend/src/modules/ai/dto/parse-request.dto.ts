import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ParseRequestDto {
  @ApiProperty({ example: 'Tìm quán ăn ngon ở Đà Nẵng, giá rẻ' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ example: 'u123' })
  @IsOptional()
  @IsString()
  userId?: string;
}
