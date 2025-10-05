// [NEW] app/backend/src/modules/friends/friends.friends.users.auth.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Length } from 'class-validator';

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
