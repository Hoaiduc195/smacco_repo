import { IsString, IsOptional, IsBoolean, IsArray, IsNumber, ValidateNested, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UserContextDto {
  @ApiPropertyOptional({ example: 'Minh' })
  @IsOptional()
  @IsString()
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
  timezone?: string;

  @ApiPropertyOptional({ example: 'vi-VN' })
  @IsOptional()
  @IsString()
  locale?: string;
}

export class WizardPreferencesDto {
  @ApiPropertyOptional({ type: [String], example: ['yên tĩnh', 'gần biển'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferences?: string[];

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsNumber()
  guestCount?: number;

  @ApiPropertyOptional({ type: [String], example: ['price', 'rating', 'location'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  criteria?: string[];

  @ApiPropertyOptional({ example: 'mid' })
  @IsOptional()
  @IsString()
  budget?: string;

  @ApiPropertyOptional({ type: [String], example: ['hotel', 'homestay'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  types?: string[];
}

export class WorkflowExecutionDto {
  @ApiPropertyOptional({ example: 'SEARCH_PLACES' })
  @IsOptional()
  @IsString()
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
