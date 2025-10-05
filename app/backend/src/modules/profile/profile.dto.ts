// app/backend/src/modules/profile/profile.auth.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class ProfileDto {
    @ApiProperty() id!: string;
    @ApiProperty() email!: string;
    @ApiProperty({ enum: ['ADMIN', 'USER'] }) role!: 'ADMIN' | 'USER';
    @ApiProperty({ nullable: true }) name!: string | null;
    @ApiProperty({ nullable: true, description: 'Уникальный никнейм @handle' }) handle!: string | null;
}

export class UpdateProfileDto {
    @ApiProperty({ required: false })
    @IsOptional() @IsString() @Length(1, 120)
    name?: string;

    @ApiProperty({
        required: false,
        description: 'Латиница/цифры/._, 3–32 символа, уникально',
        pattern: '^[a-z0-9_\\.]{3,32}$',
    })
    @IsOptional()
    @IsString()
    @Length(3, 32)
    @Matches(/^[a-z0-9_\.]+$/)
    handle?: string;
}
