// bff/src/modules/backend.client.ts
import { Injectable } from '@nestjs/common';
import fetch, { Headers } from 'node-fetch';

export type ApiOk<T> = { data: T } & Record<string, any>;

function clean(v: any): string {
  return (v ?? '').toString().trim().replace(/\r|\n/g, '');
}

function joinURL(base: string, path: string): string {
  const b = clean(base);
  const p = clean(path);

  // Абсолютный path? Берём как есть.
  if (/^https?:\/\//i.test(p)) return p;

  const baseNoSlash = (b || 'http://localhost:5000').replace(/\/+$/, '');
  const pathWithSlash = p.startsWith('/') ? p : '/' + p;
  return baseNoSlash + pathWithSlash;
}

@Injectable()
export class BackendClient {
  private baseUrl(): string {
    return clean(process.env.BACKEND_BASE_URL) || clean(process.env.BACKEND_URL) || 'http://localhost:5000';
  }

  private buildHeaders(req: any, hasBody: boolean): Headers {
    const h = new Headers();

    // Проброс Authorization / Cookie / CSRF (если используется)
    const auth = req?.headers?.authorization ?? req?.headers?.Authorization;
    if (auth) h.set('authorization', clean(auth));

    const cookie = req?.headers?.cookie;
    if (cookie) h.set('cookie', clean(cookie));

    const csrf = req?.headers?.['x-csrf'] ?? req?.headers?.['X-CSRF'];
    if (csrf) h.set('x-csrf', clean(csrf));

    if (hasBody) h.set('content-type', 'application/json');
    return h;
  }

  private async handle(res: any) {
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    if (!res.ok) {
      const err: any = new Error(data?.message || data?.error || `HTTP_${res.status}`);
      err.status = res.status;
      err.original = data;
      throw err;
    }
    return data ?? null;
  }

  private async request(
      method: 'GET' | 'POST' | 'DELETE' | 'PUT' | 'PATCH',
      req: any,
      path: string,
      body?: any,
  ) {
    const url = joinURL(this.baseUrl(), path);

    if (process.env.BFF_DEBUG === '1') {
      // детальный лог исходящих из BFF
      console.log('[BFF → BE]', method, url, body != null ? JSON.stringify(body) : '');
    }

    const hasBody = body !== undefined && body !== null && method !== 'GET';
    const res = await fetch(url, {
      method,
      headers: this.buildHeaders(req, hasBody),
      body: hasBody ? JSON.stringify(body) : undefined,
    } as any);

    return this.handle(res);
  }

  // ─── GET ──────────────────────────────────────────────────────────────────────
  async get<T = any>(path: string, req?: any): Promise<ApiOk<T>>;
  async get<T = any>(req: any, path: string): Promise<ApiOk<T>>;
  async get<T = any>(a: any, b?: any): Promise<ApiOk<T>> {
    const { req, path } = this.resolveArgs('GET', a, b);
    return this.request('GET', req, path);
  }

  // ─── POST ─────────────────────────────────────────────────────────────────────
  async post<T = any>(path: string, body?: any, req?: any): Promise<ApiOk<T>>;
  async post<T = any>(req: any, path: string, body?: any): Promise<ApiOk<T>>;
  async post<T = any>(a: any, b?: any, c?: any): Promise<ApiOk<T>> {
    const { req, path, body } = this.resolveArgs('POST', a, b, c);
    return this.request('POST', req, path, body);
  }

  // ─── DELETE ───────────────────────────────────────────────────────────────────
  async delete<T = any>(path: string, req?: any): Promise<ApiOk<T>>;
  async delete<T = any>(req: any, path: string): Promise<ApiOk<T>>;
  async delete<T = any>(a: any, b?: any): Promise<ApiOk<T>> {
    const { req, path } = this.resolveArgs('DELETE', a, b);
    return this.request('DELETE', req, path);
  }

  // ─── нормализация аргументов (поддержка обоих стилей вызова) ──────────────────
  private resolveArgs(
      kind: 'GET' | 'POST' | 'DELETE',
      a: any, b?: any, c?: any,
  ): { req: any; path: string; body?: any } {
    if (typeof a === 'string') {
      // стиль: (path, body?, req?)
      const path = a;
      const body = kind === 'POST' ? b : undefined;
      const req  = (kind === 'POST' ? c : b) ?? {};
      return { req, path, body };
    }
    // стиль: (req, path, body?)
    const req  = a ?? {};
    const path = String(b ?? '');
    const body = kind === 'POST' ? c : undefined;
    return { req, path, body };
  }
}
