// src/modules/friends/friends.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class PublicUserDto {
    @ApiProperty() id!: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() email?: string;
    @ApiProperty({ required: false }) @IsOptional() @IsString() name?: string | null;
    @ApiProperty({ required: false }) @IsOptional() @IsString() role?: 'ADMIN' | 'USER' | string | null;
    @ApiProperty({ required: false }) @IsOptional() @IsString() handle?: string | null;
}

export enum FriendRequestStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED',
    CANCELED = 'CANCELED',
}

export class FriendRequestDto {
    @ApiProperty() id!: string;
    @ApiProperty({ type: PublicUserDto, required: false }) @IsOptional() from?: PublicUserDto | null;
    @ApiProperty({ type: PublicUserDto, required: false }) @IsOptional() to?: PublicUserDto | null;
    @ApiProperty({ enum: FriendRequestStatus, required: false }) @IsOptional() @IsEnum(FriendRequestStatus) status?: FriendRequestStatus | null;
    @ApiProperty({ required: false }) @IsOptional() @IsString() createdAt?: string | null;
    @ApiProperty({ required: false }) @IsOptional() @IsString() updatedAt?: string | null;
}

export class CreateFriendRequestDto {
    @ApiProperty({ example: 'andrii' })
    @IsString()
    @Length(3)
    toHandle!: string;
}

/** Query DTO для /friends/search/users */
export class SearchUsersQueryDto {
    @ApiPropertyOptional({ description: 'Search by handle or name', example: 'puerto' })
    @IsOptional()
    @IsString()
    @Length(2, 64)
    q?: string;

    @ApiPropertyOptional({ description: 'Cursor (last user id)', example: 'cmg1...' })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ description: 'Page size (1..100)', example: 20, default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    take?: number = 20;
}
