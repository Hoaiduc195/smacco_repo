import { IsString, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReviewDto {
  @ApiProperty({ example: 'ChIJN1t_tDeuEmsRUsoyG83frY4' })
  @IsString()
  locationId: string;

  @ApiProperty({ example: 'u123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: 'Quán ăn ngon, giá rẻ, hợp lý!' })
  @IsOptional()
  @IsString()
  content?: string;
}
