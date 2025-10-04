// app/backend/src/common/jwt.guard.ts
import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import { verifyJwt, type JwtPayload } from './jwt.js';
import { ConfigService } from '../modules/config/config.service.js';

@Injectable()
export class JwtGuard implements CanActivate {
    constructor(private readonly config: ConfigService) {}

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request>();

        const token = this.extractToken(req);
        if (!token) {
            throw new UnauthorizedException('Missing Authorization header');
        }

        const pub = this.config.accessPublicKey;
        if (!pub) {
            throw new UnauthorizedException(
                'Server misconfigured: access public key is missing',
            );
        }

        try {
            const payload = verifyJwt<JwtPayload>(token, pub);
            (req as any).user = {
                id: payload.sub,
                role: payload.role,
                jti: payload.jti,
                type: payload.type,
            };
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }

    private extractToken(req: Request): string | null {
        // 1) Authorization: Bearer <token> ИЛИ просто <token>
        const raw =
            (req.headers['authorization'] ??
                (req.headers as any)['Authorization']) as
                | string
                | string[]
                | undefined;

        if (raw) {
            const header = Array.isArray(raw) ? raw[0] : raw;
            const parts = header.trim().split(' ');
            const t = parts.length === 2 ? parts[1] : parts[0];
            if (t) return t;
        }

        // 2) cookie: access_token=<token>
        const cookie = (req as any).cookies?.['access_token'] as string | undefined;
        if (cookie && cookie.trim()) return cookie.trim();

        return null;
    }
}
