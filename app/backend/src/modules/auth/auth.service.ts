import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';
import { ConfigService } from '../../config/config.service.js';
import { signJwt, verifyJwt } from '../../common/jwt.js';

type UserView = {
  id: string;
  email: string;
  name: string | null;
  handle: string | null;
  role: 'ADMIN' | 'USER';
};

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();
  constructor(private readonly config: ConfigService) {}

  private toView(user: any): UserView {
    return {
      id: user.id,
      email: user.email,
      name: user.name ?? null,
      handle: user.handle ?? null,
      role: user.role as 'ADMIN' | 'USER',
    };
  }

  async register(params: { email: string; password: string; name?: string; handle?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: params.email } });
    if (existing) throw new ConflictException('Email already in use');

    const passwordHash = await bcrypt.hash(params.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: params.email,
        passwordHash,
        name: params.name ?? null,
        handle: params.handle ?? null,
        role: Role.USER,
      },
    });

    const tokens = await this.issueTokens(user);
    return { user: this.toView(user), ...tokens };
  }

  async login(params: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: params.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(params.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.issueTokens(user);
    return { user: this.toView(user), ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      // RS256 verify refresh
      const payload = verifyJwt(refreshToken, this.config.refreshPublicKey);
      if (payload?.type !== 'refresh') throw new UnauthorizedException();
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) throw new UnauthorizedException();
      const tokens = await this.issueTokens(user);
      return { user: this.toView(user), ...tokens };
    } catch {
      throw new UnauthorizedException();
    }
  }

  async logout() {
    return { ok: true };
  }

  private async issueTokens(user: { id: string; role: Role }) {
    const base = { sub: user.id, role: user.role as 'ADMIN' | 'USER' };

    // ⬇️ третьим аргументом — TTL строкой/числом, БЕЗ объекта { expiresIn }
    const accessToken = signJwt(
        { ...base, type: 'access' },
        this.config.accessPrivateKey,
        this.config.accessTtl,   // string, например '15m'
    );
    const refreshToken = signJwt(
        { ...base, type: 'refresh' },
        this.config.refreshPrivateKey,
        this.config.refreshTtl,  // string, например '7d'
    );

    return { accessToken, refreshToken };
  }
}
