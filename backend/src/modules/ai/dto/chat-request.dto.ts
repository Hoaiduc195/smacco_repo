import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, ValidateNested, IsObject, MaxLength, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UserContextDto {
  @ApiPropertyOptional({ example: 'Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  displayName?: string;

  @ApiPropertyOptional({ example: 16.047 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 108.206 })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ example: 'Asia/Ho_Chi_Minh' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  timezone?: string;

  @ApiPropertyOptional({ example: 'vi-VN' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  locale?: string;
}

export class WizardPreferencesDto {
  @ApiPropertyOptional({ type: [String], example: ['yên tĩnh', 'gần biển'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  preferences?: string[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  guestCount?: number;

  @ApiPropertyOptional({ type: [String], example: ['price', 'rating', 'location'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  criteria?: string[];

  @ApiPropertyOptional({ example: 'mid' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  budget?: string;

  @ApiPropertyOptional({ type: [String], example: ['hotel', 'homestay'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  types?: string[];

  @ApiPropertyOptional({ example: 'Vị trí hiện tại' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  startLocation?: string;

  @ApiPropertyOptional({ type: [String], example: ['nghỉ dưỡng', 'gia đình'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  tripPurposes?: string[];
}

export class TaggedPlaceDto {
  @ApiPropertyOptional({ example: 'serpapi-12345' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  id?: string;

  @ApiPropertyOptional({ example: 'Hotel A' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  name?: string;

  @ApiPropertyOptional({ example: 'Hotel A' })
  @IsOptional()
  @IsString()
  @MaxLength(400)
  placeName?: string;

  @ApiPropertyOptional({ example: 'Da Nang, Vietnam' })
  @IsOptional()
  @IsString()
  @MaxLength(800)
  address?: string;

  @ApiPropertyOptional({ example: 'Da Nang, Vietnam' })
  @IsOptional()
  @IsString()
  @MaxLength(800)
  placeAddress?: string;

  @ApiPropertyOptional({ example: 'hotel' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  type?: string;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ example: 4.5 })
  @IsOptional()
  @IsNumber()
  averageRating?: number;

  @ApiPropertyOptional({ example: 16.047 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 108.206 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 16.047 })
  @IsOptional()
  @IsNumber()
  lat?: number;

  @ApiPropertyOptional({ example: 108.206 })
  @IsOptional()
  @IsNumber()
  lng?: number;

  @ApiPropertyOptional({ type: [String], example: ['wifi', 'pool'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: '800.000đ/đêm' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  price?: string;

  @ApiPropertyOptional({ example: '800.000đ - 1.200.000đ' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  priceRange?: string;

  @ApiPropertyOptional({ example: 128 })
  @IsOptional()
  @IsNumber()
  reviewCount?: number;

  @ApiPropertyOptional({ example: 'serpapi' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  source?: string;

  @ApiPropertyOptional({ example: '12345' })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  sourcePlaceId?: string;
}

export class WorkflowExecutionDto {
  @ApiPropertyOptional({ example: 'SEARCH_PLACES' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  workflowId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  confirmed?: boolean;

  @ApiPropertyOptional({ type: Object, example: { query: 'khach san gan bien', location: 'Da Nang' } })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;
}

export class ChatRequestDto {
  @ApiProperty({ example: 'Tìm khách sạn gần biển ở Đà Nẵng' })
  @IsString()
  @MaxLength(8000)
  text: string;

  @ApiPropertyOptional({ example: 'conv-uuid-123' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  conversationId?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  stream?: boolean;

  @ApiPropertyOptional({ type: [String], example: ['place-uuid-1', 'place-uuid-2'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  taggedPlaceIds?: string[];

  @ApiPropertyOptional({ type: [TaggedPlaceDto], example: [{ id: 'place-uuid-1', name: 'Hotel A' }] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => TaggedPlaceDto)
  taggedPlaces?: TaggedPlaceDto[];

  @ApiPropertyOptional({ type: () => UserContextDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UserContextDto)
  userContext?: UserContextDto;

  @ApiPropertyOptional({ type: () => WizardPreferencesDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WizardPreferencesDto)
  wizardPreferences?: WizardPreferencesDto;

  @ApiPropertyOptional({ type: () => WorkflowExecutionDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => WorkflowExecutionDto)
  workflowExecution?: WorkflowExecutionDto;
}
