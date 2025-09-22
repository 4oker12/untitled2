import type { Response, Request } from 'express';

export function setAuthCookies(res: Response, opts: { access: string; refresh: string; isProd: boolean }) {
  const common = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: opts.isProd,
    path: '/',
  };
  res.cookie('access_token', opts.access, { ...common });
  res.cookie('refresh_token', opts.refresh, { ...common });
  const csrf = randomToken();
  res.cookie('csrf_token', csrf, { httpOnly: false, sameSite: 'lax', secure: opts.isProd, path: '/' });
  return csrf;
}

export function clearAuthCookies(res: Response, isProd: boolean) {
  const opt = { httpOnly: true, sameSite: 'lax' as const, secure: isProd, path: '/', expires: new Date(0) };
  res.cookie('access_token', '', opt);
  res.cookie('refresh_token', '', opt);
  res.cookie('csrf_token', '', { ...opt, httpOnly: false });
}

export function requireCsrf(req: Request) {
  const header = req.header('x-csrf');
  const cookie = req.cookies?.['csrf_token'];
  return header && cookie && header === cookie;
}

export function randomToken(length = 32) {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Buffer.from(bytes).toString('hex');
}
