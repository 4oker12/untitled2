// app/backend/src/modules/friends/dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsOptional, IsString, Length } from 'class-validator';

export class FriendUserDto {
    @ApiProperty() id!: string;
    @ApiProperty() email!: string;
    @ApiProperty({ nullable: true }) name?: string | null;
    @ApiProperty({ nullable: true }) handle?: string | null;
}

export class FriendRequestDto {
    @ApiProperty() id!: string;
    @ApiProperty() fromId!: string;
    @ApiProperty() toId!: string;
    @ApiProperty({ enum: ['PENDING', 'ACCEPTED', 'DECLINED'] }) status!: 'PENDING' | 'ACCEPTED' | 'DECLINED';
}

export class SendFriendRequestDto {
    @ApiProperty({ example: 'john_doe' })
    @IsString()
    @Length(3, 32)
    toHandle!: string;
}

export class IdParamDto {
    @ApiProperty()
    @IsString()
    id!: string;
}

export class ListRequestsQueryDto {
    @ApiProperty({ required: false, enum: ['incoming', 'outgoing'] })
    @IsOptional()
    @IsIn(['incoming', 'outgoing'])
    type?: 'incoming' | 'outgoing';
}
