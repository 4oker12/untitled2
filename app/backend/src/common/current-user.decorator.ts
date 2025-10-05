// app/backend/src/common/current-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserPayload {
    sub: string;
    role: 'ADMIN' | 'USER';
    jti?: string;
    type?: 'access' | 'refresh';
}

export const CurrentUser = createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): CurrentUserPayload | undefined => {
        const req = ctx.switchToHttp().getRequest();
        return (req as any).user as CurrentUserPayload | undefined;
    },
);
