import { IsString, IsOptional, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CoordinatesDto {
  @ApiProperty() @IsNumber() lat: number;
  @ApiProperty() @IsNumber() lng: number;
}

export class CreatePlaceDto {
  @ApiProperty({ example: 'ChIJN1t_tDeuEmsRUsoyG83frY4' })
  @IsString()
  locationId: string;

  @ApiProperty({ example: 'Cà phê vợt Cheo Leo' })
  @IsString()
  nameCache: string;

  @ApiPropertyOptional({ example: 'Quận 3, TP.HCM' })
  @IsOptional()
  @IsString()
  addressCache?: string;

  @ApiPropertyOptional({ example: 'food' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates?: CoordinatesDto;
}
