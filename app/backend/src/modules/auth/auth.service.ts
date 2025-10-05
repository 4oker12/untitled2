import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaClient, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  private prisma = new PrismaClient();

  constructor(private readonly jwt: JwtService) {}

  private toView(user: any) {
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
      const payload = this.jwt.verify(refreshToken);
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
    // При куки-стратегии достаточно обнулить куки в контроллере
    return { ok: true };
  }

  private async issueTokens(user: { id: string; role: Role }) {
    const base = { sub: user.id, role: user.role as 'ADMIN' | 'USER' };

    const accessToken = await this.jwt.signAsync(
        { ...base, type: 'access' },
        { expiresIn: '15m' },
    );

    const refreshToken = await this.jwt.signAsync(
        { ...base, type: 'refresh' },
        { expiresIn: '7d' },
    );

    return { accessToken, refreshToken };
  }
}
