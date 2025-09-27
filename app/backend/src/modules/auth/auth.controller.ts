// app/backend/src/modules/auth/auth.controller.ts
import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { UserDto } from '../users/dto.js';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto, LoginDto } from './dto.js';
// [ADDED]
import { setAuthCookies, clearAuthCookies } from '../../common/cookies.js';
import { ConfigService } from '../config/config.service.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
      private readonly auth: AuthService,
      private readonly users: UsersService,
      // [ADDED]
      private readonly config: ConfigService,
  ) {}

  @Post('register')
  @ApiResponse({ status: 201, description: 'User registered', type: UserDto })
  async register(@Body() body: RegisterDto, @Res() res: Response) {
    const { email, password, name, handle } = body;

    const existing = await this.users.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: { code: 'EMAIL_TAKEN' }, data: null });
    }

    // [ADDED] проверка занятости handle
    if (handle) {
      const dupHandle = await this.users.findByHandle(handle);
      if (dupHandle) {
        return res.status(409).json({ error: { code: 'HANDLE_TAKEN' }, data: null });
      }
    }

    const passwordHash = await this.auth.hashPassword(password);
    const user = await this.users.create({
      email,
      password,
      name: name ?? null,
      handle, // [ADDED]
      // role по умолчанию в сервисе = USER
    });

    // [CHANGED] вернём handle в ответе
    return res.status(201).json({
      data: { user: { id: user.id, email: user.email, name: user.name, role: user.role, handle: user.handle } },
    });
  }

  @Post('login')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Logged in', type: UserDto })
  async login(@Body() body: LoginDto, @Res() res: Response) {
    const { email, password } = body;

    const user = await this.users.findByEmail(email);
    if (!user) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' }, data: null });

    const ok = await this.auth.comparePassword(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS' }, data: null });

    // [ADDED] выдаём токены и ставим httpOnly cookies
    const accessToken  = this.auth.issueAccessToken(user.id, user.role);
    const refreshToken = this.auth.issueRefreshToken(user.id, user.role);
    setAuthCookies(res, { access: accessToken, refresh: refreshToken, isProd: this.config.secureCookies });

    // [ADDED] вернём токены и user в теле ответа (удобно для Playground)
    return res.json({
      data: {
        user: { id: user.id, email: user.email, name: user.name, role: user.role, handle: user.handle },
        accessToken,
        refreshToken,
      },
    });
  }

  // [ADDED] Текущий пользователь по access токену
  @Get('me')
  @HttpCode(200)
  @ApiCookieAuth('access_token')
  async me(@Req() req: Request, @Res() res: Response) {
    // Берём из Authorization: Bearer <token> или из cookie access_token
    const authHeader = req.header('authorization') ?? '';
    const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : null;
    const cookieToken = (req as any).cookies?.['access_token'] as string | undefined;
    const token = bearer || cookieToken;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    try {
      const payload = this.auth.verifyAccessToken(token);
      const user = await this.users.findById(payload.sub);
      if (!user) return res.status(401).json({ message: 'Unauthorized' });

      return res.json({
        data: { user: { id: user.id, email: user.email, name: user.name, role: user.role, handle: user.handle } },
      });
    } catch {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiCookieAuth('access_token')
  async refresh(@Req() req: Request, @Res() res: Response) {
    // TODO: твоя реализация refresh при необходимости
    return res.json({ data: { ok: true } });
  }

  @Post('logout')
  @HttpCode(200)
  @ApiCookieAuth('access_token')
  async logout(@Res() res: Response) {
    // [ADDED] подчистим cookies
    clearAuthCookies(res, this.config.secureCookies);
    return res.json({ data: true });
  }
}
