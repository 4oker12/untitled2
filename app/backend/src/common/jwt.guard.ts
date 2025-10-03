import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { verifyJwt, JwtPayload } from './jwt.js';

@Injectable()
export class JwtGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest();
        // берём заголовок
        const raw = (req.headers['authorization'] ?? req.headers['Authorization']) as string | string[] | undefined;
        if (!raw) throw new UnauthorizedException('Missing Authorization header');

        const header = Array.isArray(raw) ? raw[0] : raw;
        const parts = header.trim().split(' ');
        const token = parts.length === 2 ? parts[1] : parts[0];

        const pub = process.env.JWT_PUBLIC_KEY;
        if (!pub) throw new UnauthorizedException('Server misconfigured: JWT_PUBLIC_KEY is missing');

        try {
            const payload = verifyJwt<JwtPayload>(token, pub);
            // положим «юзера» в req (как ты ожидаешь в контроллерах)
            req.user = { id: payload.sub, role: payload.role, jti: payload.jti, type: payload.type };
            return true;
        } catch {
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
