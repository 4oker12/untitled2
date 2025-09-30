// src/modules/users/friends.users.dto.ts
// DTO описывают форму данных на вход/выход API и проверяются ValidationPipe'ом

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Length, Matches, MinLength } from 'class-validator';

export enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

export class UserDto {
    @ApiProperty() id!: string;
    @ApiProperty() @IsEmail() email!: string;
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string | null;
    @ApiProperty({ enum: Role }) @IsEnum(Role) role!: Role;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsString()
    @Length(3, 32)
    @Matches(/^[a-z0-9_\.]+$/, { message: 'handle must be lowercase [a-z0-9_.]' })
    handle?: string | null;
}

export class CreateUserDto {
    @ApiProperty() @IsEmail() email!: string;
    @ApiProperty() @IsString() @MinLength(6) password!: string;
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string | null;
    @ApiPropertyOptional({ enum: Role }) @IsOptional() @IsEnum(Role) role?: Role;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsString()
    @Length(3, 32)
    @Matches(/^[a-z0-9_\.]+$/)
    handle?: string | null;
}

export class UpdateUserDto {
    @ApiPropertyOptional() @IsOptional() @IsString() name?: string | null;
    @ApiPropertyOptional({ enum: Role }) @IsOptional() @IsEnum(Role) role?: Role;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsString()
    @Length(3, 32)
    @Matches(/^[a-z0-9_\.]+$/)
    handle?: string | null;
}
