import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { ConfigService } from '../config/config.service.js';
import { LoginSchema, RegisterSchema } from './dto.js';

function badRequest(res: Response, message: string, details?: unknown) {
  return res.status(400).json({ error: { code: 'BAD_USER_INPUT', message, details }, data: null });
}
function conflict(res: Response, message: string) {
  return res.status(409).json({ error: { code: 'CONFLICT', message }, data: null });
}
function unauth(res: Response, message = 'Unauthenticated') {
  return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message }, data: null });
}
function invalidCreds(res: Response) {
  return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' }, data: null });
}
function internal(res: Response, err: any) {
  const message = (err && typeof err === 'object' && 'message' in err) ? String(err.message) : 'Internal server error';
  return res.status(500).json({ error: { code: 'INTERNAL', message }, data: null });
}

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private setAuthCookies(res: Response, access: string, refresh: string) {
    const common = { httpOnly: true, sameSite: 'lax' as const, secure: this.config.secureCookies, path: '/' };
    res.cookie('access_token', access, common as any);
    res.cookie('refresh_token', refresh, common as any);
  }

  @Post('register')
  async register(@Body() body: any, @Res() res: Response) {
    try {
      const parse = RegisterSchema.safeParse(body);
      if (!parse.success) return badRequest(res, 'Invalid input', parse.error.flatten());
      const { email, password, name } = parse.data;

      const existing = await this.users.findByEmail(email);
      if (existing) return conflict(res, 'Email already exists');

      const passwordHash = await this.auth.hashPassword(password);
      const user = await this.users.create({ email, passwordHash, name: name ?? null, role: 'USER' });

      const access = this.auth.issueAccessToken(user.id, user.role as any);
      const refresh = this.auth.issueRefreshToken(user.id, user.role as any);
      this.setAuthCookies(res, access, refresh);

      const dto = { id: user.id, email: user.email, name: user.name, role: user.role };
      return res.status(201).json({ error: null, data: { user: dto } });
    } catch (err) {
      return internal(res, err);
    }
  }

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    const parse = LoginSchema.safeParse(body);
    if (!parse.success) return badRequest(res, 'Invalid input', parse.error.flatten());
    const { email, password } = parse.data;

    const user = await this.users.findByEmail(email);
    if (!user) return invalidCreds(res);
    const ok = await this.auth.comparePassword(password, (user as any).passwordHash);
    if (!ok) return invalidCreds(res);

    const access = this.auth.issueAccessToken(user.id, user.role as any);
    const refresh = this.auth.issueRefreshToken(user.id, user.role as any);
    this.setAuthCookies(res, access, refresh);

    const dto = { id: user.id, email: user.email, name: user.name, role: user.role };
    return res.status(200).json({ error: null, data: { user: dto } });
  }

  @Post('refresh')
  async refresh(@Req() req: Request, @Res() res: Response) {
    const token = req.cookies?.['refresh_token'];
    if (!token) return unauth(res);
    try {
      const payload = this.auth.verifyRefreshToken(token);
      if (payload.type !== 'refresh') return unauth(res);
      const user = await this.users.findById(payload.sub);
      if (!user) return unauth(res);
      const access = this.auth.issueAccessToken(user.id, user.role as any);
      // Optionally rotate refresh: keep simple by issuing new refresh each time
      const refresh = this.auth.issueRefreshToken(user.id, user.role as any);
      this.setAuthCookies(res, access, refresh);
      const dto = { id: user.id, email: user.email, name: user.name, role: user.role };
      return res.status(200).json({ error: null, data: { user: dto } });
    } catch {
      return unauth(res);
    }
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    const opts = { httpOnly: true, sameSite: 'lax' as const, secure: this.config.secureCookies, path: '/' };
    res.clearCookie('access_token', opts as any);
    res.clearCookie('refresh_token', opts as any);
    return res.status(200).json({ error: null, data: { ok: true } });
  }
}
