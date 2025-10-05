import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { Reflector } from '@nestjs/core';
import { verifyJwt, type JwtPayload } from '../../common/jwt.js';
import { ConfigService } from '../../config/config.service.js';
import { PUBLIC_KEY } from '../../common/public.decorator.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(private readonly config: ConfigService, private readonly reflector: Reflector) {}

    canActivate(ctx: ExecutionContext): boolean {
        // пропускаем публичные ручки
        const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
            ctx.getHandler(),
            ctx.getClass(),
        ]);
        if (isPublic) return true;

        const req = ctx.switchToHttp().getRequest<Request>();
        const token = this.bearerOrCookie(req);
        if (!token) throw new UnauthorizedException('Invalid token');

        let payload: JwtPayload | undefined;
        try {
            // RS256 верификация access токена
            payload = verifyJwt<JwtPayload>(token, this.config.accessPublicKey);
        } catch {
            throw new UnauthorizedException('Invalid token');
        }

        if (!payload?.sub) throw new UnauthorizedException('Invalid payload');
        (req as any).user = payload; // для @CurrentUser()
        return true;
    }

    private bearerOrCookie(req: Request): string | null {
        const h = req.header('authorization') ?? '';
        if (h.startsWith('Bearer ')) return h.slice(7).trim() || null;

        // читаем куки, которые ставит auth.controller (camelCase)
        // поддержим и старое snake_case на всякий случай
        const c =
            (req as any).cookies?.['accessToken'] ||
            (req as any).cookies?.['access_token'];
        return (typeof c === 'string' ? c.trim() : null) || null;
    }
}
