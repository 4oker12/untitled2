// app/backend/src/modules/auth/auth.controller.ts
import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { UserDto } from '../users/dto.js';
// ↓↓↓ Больше НЕ импортируем zod
// import { LoginSchema, RegisterSchema } from './dto.js';

import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDto, LoginDto, Role } from './dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
      private readonly auth: AuthService,
      private readonly users: UsersService,
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

    // TODO: выставь куки/токены как у тебя реализовано (access/refresh)
    // [CHANGED] вернём handle
    return res.json({ data: { user: { id: user.id, email: user.email, name: user.name, role: user.role, handle: user.handle } } });
  }

  @Post('refresh')
  @HttpCode(200)
  @ApiCookieAuth('access_token')
  async refresh(@Req() req: Request, @Res() res: Response) {
    // твоя реализация refresh
    return res.json({ data: { ok: true} });
  }

  @Post('logout')
  @HttpCode(200)
  @ApiCookieAuth('access_token')
  async logout(@Res() res: Response) {
    // твоя реализация logout
    return res.json({ data: true });
  }
}
