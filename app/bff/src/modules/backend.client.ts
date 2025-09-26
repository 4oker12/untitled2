import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  Injectable,
} from '@nestjs/common';

export type ApiOk<T> = { ok: true; data: T };

@Injectable()
export class BackendClient {
  private readonly base: string;

  constructor() {
    this.base =
        process.env.BACKEND_URL ||
        process.env.API_URL ||
        process.env.BACKEND_API_URL ||
        'http://localhost:5000';

    if (!/^https?:\/\//.test(this.base)) {
      throw new Error(`Invalid BACKEND_URL: "${this.base}"`);
    }
  }

  private buildUrl(path: string) {
    const p = path.startsWith('/') ? path : `/${path}`;
    return new URL(p, this.base).toString();
  }

  private async parse(res: Response) {
    const ct = res.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
    return isJson ? await res.json() : await res.text();
  }

  private throwHttp(res: Response, data: any): never {
    const message =
        (typeof data === 'object' && (data?.message || data?.error?.code)) ||
        (typeof data === 'string' ? data : JSON.stringify(data)) ||
        res.statusText;

    switch (res.status) {
      case 400:
        throw new BadRequestException(message);
      case 401:
        throw new UnauthorizedException(message);
      case 403:
        throw new ForbiddenException(message);
      case 404:
        throw new NotFoundException(message);
      case 409:
        throw new ConflictException(message);
      default:
        throw new InternalServerErrorException(message);
    }
  }

  async get<T>(path: string, init?: RequestInit): Promise<ApiOk<T>> {
    const res = await fetch(this.buildUrl(path), { method: 'GET', ...(init || {}) });
    const data = await this.parse(res);
    if (!res.ok) this.throwHttp(res, data);
    return { ok: true, data: data as T };
  }

  async post<T>(path: string, body?: any, init?: RequestInit): Promise<ApiOk<T>> {
    const headers = { 'content-type': 'application/json', ...(init?.headers || {}) };
    const res = await fetch(this.buildUrl(path), {
      method: 'POST',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      ...(init || {}),
    });
    const data = await this.parse(res);
    if (!res.ok) this.throwHttp(res, data);
    return { ok: true, data: data as T };
  }

  async delete<T>(path: string, init?: RequestInit): Promise<ApiOk<T>> {
    const res = await fetch(this.buildUrl(path), { method: 'DELETE', ...(init || {}) });
    const data = await this.parse(res);
    if (!res.ok) this.throwHttp(res, data);
    return { ok: true, data: data as T };
  }
}
