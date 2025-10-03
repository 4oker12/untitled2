import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class SendMessageDto {
    @ApiProperty({ description: 'ID получателя', example: 'cku7lv2a7001x0b9j8p6mxyz' })
    @IsString()
    toUserId!: string;

    @ApiProperty({
        description: 'Текст сообщения',
        minLength: 1,
        maxLength: 2000,
        example: 'Привет! Проверяю сообщения 🚀',
    })
    @IsString()
    @Length(1, 2000)
    body!: string;
}

export class ListMessagesDto {
    @ApiProperty({ description: 'ID собеседника', example: 'cku7lv2a7001x0b9j8p6mxyz' })
    @IsString()
    withUserId!: string;

    @ApiPropertyOptional({ description: 'ID сообщения-курсора для пагинации' })
    @IsOptional()
    @IsString()
    cursor?: string;

    @ApiPropertyOptional({ description: 'Сколько сообщений вернуть', default: 20 })
    @IsOptional()
    @IsInt()
    @Min(1)
    take?: number;
}
