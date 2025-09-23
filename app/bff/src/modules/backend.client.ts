// src/modules/backend.client.ts
// Typed fetch client for backend (Node >=18).

export type ApiOk<T> = { data: T };
export type ApiErr = { error: { code: string; message?: string } | null; data: null };

export class BackendClient {
  constructor(
      private readonly baseUrl: string,
      private readonly getAuthHeaders: () => Record<string, string> | Promise<Record<string, string>> = () => ({})
  ) {}

  async get<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = await this.mergeHeaders(init);
    const res = await fetch(this.baseUrl + path, { method: 'GET', headers, ...init });
    return this.parse<T>(res);
  }

  async post<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
    const headers = await this.mergeHeaders(init, { 'Content-Type': 'application/json' });
    const res = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    });
    return this.parse<T>(res);
  }

  async delete<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = await this.mergeHeaders(init);
    const res = await fetch(this.baseUrl + path, { method: 'DELETE', headers, ...init });
    return this.parse<T>(res);
  }

  // --- raw POST (нужен для Set-Cookie) ---
  async postRaw(
      path: string,
      body?: unknown,
      init?: RequestInit
  ): Promise<{ json: unknown; cookies: string[]; status: number }> {
    const headers = await this.mergeHeaders(init, { 'Content-Type': 'application/json' });
    const res = await fetch(this.baseUrl + path, {
      method: 'POST',
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      ...init,
    });

    const text = await res.text();
    const json = text ? JSON.parse(text) : null;

    // собрать Set-Cookie (node-fetch vs undici)
    const anyHeaders: any = res.headers as any;
    const raw = typeof anyHeaders?.raw === 'function' ? anyHeaders.raw() : undefined;
    const cookies: string[] =
        (raw && raw['set-cookie']) ??
        (res.headers.get('set-cookie') ? [res.headers.get('set-cookie') as string] : []);

    if (!res.ok) {
      const bodySnippet =
          json && typeof json === 'object'
              ? JSON.stringify(json)
              : (typeof json === 'string' ? json : '');
      const err: any = new Error(`Backend error ${res.status}${bodySnippet ? `: ${bodySnippet}` : ''}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return { json, cookies, status: res.status };
  }

  // ---- helpers ----
  private async mergeHeaders(init?: RequestInit, extra?: Record<string, string>): Promise<Record<string, string>> {
    const auth = await Promise.resolve(this.getAuthHeaders());
    return { ...(extra ?? {}), ...(init?.headers as Record<string, string> | undefined ?? {}), ...auth };
  }

  private async parse<T>(res: Response): Promise<T> {
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const bodySnippet =
          json && typeof json === 'object'
              ? JSON.stringify(json)
              : (typeof json === 'string' ? json : '');
      const err: any = new Error(`Backend error ${res.status}${bodySnippet ? `: ${bodySnippet}` : ''}`);
      err.status = res.status;
      err.body = json;
      throw err;
    }
    return json as T;
  }
}
