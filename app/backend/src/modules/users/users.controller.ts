import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from '../auth/auth.service.js';
import { UsersService } from './users.service.js';
import { CreateUserSchema } from '../auth/dto.js';

function unauth(res: Response, message = 'Unauthenticated') {
  return res.status(401).json({ error: { code: 'UNAUTHENTICATED', message }, data: null });
}
function forbidden(res: Response, message = 'Forbidden') {
  return res.status(403).json({ error: { code: 'FORBIDDEN', message }, data: null });
}
function badRequest(res: Response, message: string, details?: unknown) {
  return res.status(400).json({ error: { code: 'BAD_USER_INPUT', message, details }, data: null });
}

@Controller('users')
export class UsersController {
  constructor(private readonly auth: AuthService, private readonly users: UsersService) {}

  private requireAccess(req: Request, res: Response) {
    const token = req.cookies?.['access_token'];
    if (!token) return { err: unauth(res) } as const;
    try {
      const payload = this.auth.verifyAccessToken(token);
      if (payload.type !== 'access') return { err: unauth(res) } as const;
      return { payload } as const;
    } catch {
      return { err: unauth(res) } as const;
    }
  }

  @Get('me')
  async me(@Req() req: Request, @Res() res: Response) {
    const gate = this.requireAccess(req, res);
    if ('err' in gate) return gate.err;
    const user = await this.users.findById(gate.payload.sub);
    if (!user) return unauth(res);
    const dto = { id: user.id, email: user.email, name: user.name, role: user.role };
    return res.status(200).json({ error: null, data: dto });
  }

  @Get()
  async list(@Req() req: Request, @Res() res: Response) {
    const gate = this.requireAccess(req, res);
    if ('err' in gate) return gate.err;
    if (gate.payload.role !== 'ADMIN') return forbidden(res);
    const users = await this.users.list();
    const dtos = users.map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role }));
    return res.status(200).json({ error: null, data: dtos });
  }

  @Post()
  async create(@Req() req: Request, @Res() res: Response, @Body() body: any) {
    const gate = this.requireAccess(req, res);
    if ('err' in gate) return gate.err;
    if (gate.payload.role !== 'ADMIN') return forbidden(res);

    const parse = CreateUserSchema.safeParse(body);
    if (!parse.success) return badRequest(res, 'Invalid input', parse.error.flatten());
    const { email, password, name, role } = parse.data;

    const existing = await this.users.findByEmail(email);
    if (existing) return res.status(409).json({ error: { code: 'CONFLICT', message: 'Email already exists' }, data: null });

    const passwordHash = await this.auth.hashPassword(password);
    const user = await this.users.create({ email, passwordHash, name: name ?? null, role: (role ?? 'USER') as any });
    const dto = { id: user.id, email: user.email, name: user.name, role: user.role };
    return res.status(201).json({ error: null, data: dto });
  }
}
