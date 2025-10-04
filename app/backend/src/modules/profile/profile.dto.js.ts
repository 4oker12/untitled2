import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class ProfileDto {
    @ApiProperty()
    id!: string;

    @ApiProperty()
    userId!: string;

    @ApiPropertyOptional({ maxLength: 280, nullable: true })
    bio!: string | null;

    @ApiPropertyOptional({ maxLength: 120, nullable: true })
    location!: string | null;

    @ApiPropertyOptional({ nullable: true })
    website!: string | null;

    @ApiPropertyOptional({ format: 'date-time', nullable: true })
    birthday!: string | null;

    @ApiProperty()
    createdAt!: string;

    @ApiProperty()
    updatedAt!: string;
}

export class UpdateProfileDto {
    @ApiPropertyOptional({ maxLength: 280, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(280)
    bio?: string | null;

    @ApiPropertyOptional({ maxLength: 120, nullable: true })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    location?: string | null;

    @ApiPropertyOptional({ nullable: true })
    @IsOptional()
    @IsUrl({ require_protocol: true })
    website?: string | null;

    @ApiPropertyOptional({ format: 'date-time', nullable: true })
    @IsOptional()
    @IsDateString()
    birthday?: string | null;
}