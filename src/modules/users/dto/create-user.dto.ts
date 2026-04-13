import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Nguyen Van A' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'a@example.com' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  firebaseUid?: string;

  @ApiPropertyOptional({ example: ['cafe', 'nature'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  preferences?: string[];
}
