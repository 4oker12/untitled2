import type { Request, Response } from 'express';
import fetch, { Headers } from 'node-fetch';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

export class BackendClient {
  constructor(private readonly req: Request, private readonly res: Response) {}

  private buildHeaders(extra?: Record<string, string>) {
    const headers = new Headers();
    headers.set('content-type', 'application/json');
    // Forward Authorization if present
    const auth = this.req.headers['authorization'];
    if (auth) headers.set('authorization', Array.isArray(auth) ? auth[0] : auth);
    // Forward CSRF if present (optional)
    const csrf = this.req.headers['x-csrf'];
    if (csrf) headers.set('x-csrf', Array.isArray(csrf) ? csrf[0] : csrf);
    // Forward cookie header as-is to backend
    const cookie = this.req.headers['cookie'];
    if (cookie) headers.set('cookie', Array.isArray(cookie) ? cookie.join('; ') : cookie);
    if (extra) for (const [k, v] of Object.entries(extra)) headers.set(k, v);
    return headers;
  }

  private async call(path: string, init?: RequestInit) {
    const url = `${BACKEND_URL}${path}`;
    const resp = await fetch(url, {
      credentials: 'include' as any,
      redirect: 'manual',
      ...init,
      headers: this.buildHeaders(init?.headers as any),
    } as any);

    // Pipe Set-Cookie back to client
    const setCookie = resp.headers.raw()['set-cookie'];
    if (setCookie && setCookie.length) {
      // using append to avoid overwriting multiple cookies
      for (const c of setCookie) this.res.append('set-cookie', c);
    }

    const json = await resp.json().catch(() => null);
    if (!resp.ok) {
      const message = (json as any)?.error?.message || `Backend error: ${resp.status}`;
      throw new Error(message);
    }
    return json;
  }

  register(body: any) { return this.call('/auth/register', { method: 'POST', body: JSON.stringify(body) }); }
  login(body: any) { return this.call('/auth/login', { method: 'POST', body: JSON.stringify(body) }); }
  refresh() { return this.call('/auth/refresh', { method: 'POST', body: JSON.stringify({}) }); }
  logout() { return this.call('/auth/logout', { method: 'POST', body: JSON.stringify({}) }); }
  me() { return this.call('/users/me', { method: 'GET' }); }
  listUsers() { return this.call('/users', { method: 'GET' }); }
  createUser(body: any) { return this.call('/users', { method: 'POST', body: JSON.stringify(body) }); }
}
