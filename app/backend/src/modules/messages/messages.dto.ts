import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsInt, IsOptional, IsString, Length, Min, ArrayMinSize } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({ description: 'Recipient id or @handle', example: 'andrei' })
    @IsString()
    @Length(2, 64)
    to!: string;

    @ApiProperty({ description: 'Text content', example: 'hello!' })
    @IsString()
    @Length(1, 5000)
    body!: string;
}

export class ListMessagesQueryDto {
    @ApiPropertyOptional({ description: 'Filter by peer id or @handle', example: 'andrei' })
    @IsOptional()
    @IsString()
    with?: string;

    @ApiPropertyOptional({ description: 'Cursor (last item id)', example: 'cmg1...' })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ description: 'Page size (1..100)', example: 20, default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    take?: number = 20;
}

export class MarkReadDto {
    @ApiProperty({ type: [String], description: 'Message ids to mark as read' })
    @IsArray()
    @ArrayMinSize(1)
    @IsString({ each: true })
    ids!: string[];
}

export class ListPeersQueryDto {
    @ApiPropertyOptional({ description: 'Search by handle or name', example: 'and' })
    @IsOptional()
    @IsString()
    q?: string;

    @ApiPropertyOptional({ description: 'Cursor (peer userId)', example: 'cmg1...' })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ description: 'Page size (1..100)', example: 20, default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    take?: number = 20;
}
