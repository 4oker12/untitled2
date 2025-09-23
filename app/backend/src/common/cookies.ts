import type { Response, Request } from 'express';
import crypto from 'crypto';

export function setAuthCookies(res: Response, opts: { access: string; refresh: string; isProd: boolean }) {
  const common = {
    httpOnly: true as const,
    sameSite: 'lax' as const,
    secure: opts.isProd,
    path: '/',
  };
  res.cookie('access_token', opts.access, { ...common });   // [FIX]
  res.cookie('refresh_token', opts.refresh, { ...common }); // [FIX]
  const csrf = randomToken();
  res.cookie('csrf_token', csrf, { httpOnly: false, sameSite: 'lax', secure: opts.isProd, path: '/' });
  return csrf;
}

export function clearAuthCookies(res: Response, isProd: boolean) {
  const opt = { httpOnly: true as const, sameSite: 'lax' as const, secure: isProd, path: '/', expires: new Date(0) };
  res.cookie('access_token', '', opt);
  res.cookie('refresh_token', '', opt);
  res.cookie('csrf_token', '', { ...opt, httpOnly: false }); // [FIX]
}

export function requireCsrf(req: Request) {
  const header = req.header('x-csrf');
  const cookie = (req as any).cookies?.['csrf_token'];
  return Boolean(header && cookie && header === cookie);
}

export function randomToken(length = 32) {
  return crypto.randomBytes(length).toString('hex'); // [FIX] Node API вместо getRandomValues
}
