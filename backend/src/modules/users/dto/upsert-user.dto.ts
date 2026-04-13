import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpsertUserDto {
  @ApiProperty({ example: 'firebase-uid-36' })
  @IsString()
  @IsNotEmpty()
  uid: string;

  @ApiProperty({ example: 'user@example.com' , required : false})
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'John Doe' , required : false})
  @IsOptional()
  @IsString()
  name?: string;
}
