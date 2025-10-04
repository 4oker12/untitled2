import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMessageDto {
    @IsString()
    toUserId!: string;

    @IsString()
    body!: string;
}

export class ListMessagesDto {
    @IsString()
    withUserId!: string;

    @IsOptional()
    @Transform(({ value }) => {
        // Превращаем "", null, undefined -> undefined
        if (value === '' || value == null) return undefined;
        // Число/строка -> целое число
        const n = Number(value);
        if (!Number.isFinite(n)) return undefined;
        return Math.trunc(n);
    })
    @IsInt({ message: 'take must be an integer number' })
    @Min(1, { message: 'take must not be less than 1' })
    take?: number;

    @IsOptional()
    @IsString()
    cursor?: string;
}
