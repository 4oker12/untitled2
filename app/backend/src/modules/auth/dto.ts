// app/backend/src/modules/auth/friends.users.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MinLength,
} from 'class-validator';

export enum Role {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export class RegisterDto {
  @ApiProperty({ example: 'user1@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'User1234!', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

  // ▼▼▼ ADDED: никнейм пользователя (обязателен при регистрации)
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @Length(3, 32)
  handle!: string;
  // ▲▲▲

  @ApiProperty({ example: 'User One', required: false, nullable: true, minLength: 1, maxLength: 100 })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  name?: string | null;
}

export class LoginDto {
  @ApiProperty({ example: 'user1@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'User1234!' })
  @IsString()
  password!: string;
}



