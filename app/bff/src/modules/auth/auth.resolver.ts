// app/bff/src/modules/auth.resolver.ts
// [CHANGED] в login добавил установку куки access_token через ctx.res.setHeader('Set-Cookie', ...)

import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql';
import { InternalServerErrorException } from '@nestjs/common';
import { BackendClient } from './backend.client';
import { RegisterInput, LoginInput, UserGql, AuthPayloadGql } from './graphql.models';

function pickUser(raw: any): any | null {
  if (!raw) return null;
  const body = raw?.data ?? raw;
  if (body?.user) return body.user;
  if (body?.data?.user) return body.data.user;
  if (body?.data && (body.data.id || body.data.email)) return body.data;
  if (body?.id || body?.email) return body;
  return null;
}

function toUserGql(u: any): UserGql {
  return {
    id: String(u.id ?? u._id),
    email: u.email ?? '',
    name: u.name ?? null,
    role: (u.role as any) ?? null,
    handle: u.handle ?? null,
  };
}

@Resolver()
export class AuthResolver {
  constructor(private readonly backend: BackendClient) {}

  @Mutation(() => UserGql)
  async register(@Args('input') input: RegisterInput): Promise<UserGql> {
    const resp: any = await this.backend.post<any>('/auth/register', input);
    const u = pickUser(resp);
    if (!u || (u.id ?? u._id) == null) {
      throw new InternalServerErrorException('Register failed: backend returned no user');
    }
    return toUserGql(u);
  }

  // [CHANGED] login: выставляем Set-Cookie на домене BFF, чтобы Playground не требовал ручные заголовки
  @Mutation(() => AuthPayloadGql)
  async login(@Args('input') input: LoginInput, @Context() ctx: any): Promise<AuthPayloadGql> {
    const resp: any = await this.backend.post<any>('/auth/login', input);
    const body = resp?.data ?? resp;

    const accessToken =
        body?.accessToken ?? body?.token ?? body?.data?.accessToken ?? body?.data?.token ?? null;
    const refreshToken =
        body?.refreshToken ?? body?.data?.refreshToken ?? null;

    // [ADDED] Ставим httpOnly cookie. Для локалки SameSite=Lax достаточно.
    if (accessToken && ctx?.res) {
      const cookie = [
        `access_token=${String(accessToken)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
      ].join('; ');
      ctx.res.setHeader('Set-Cookie', cookie);
    }

    const u = pickUser(body);
    return {
      accessToken: accessToken ? String(accessToken) : null,
      refreshToken: refreshToken ? String(refreshToken) : null,
      user: u ? toUserGql(u) : null,
    };
  }

  // проксируем текущего пользователя (через authorization/cookie)
  @Query(() => UserGql, { nullable: true })
  async me(@Context() ctx: any): Promise<UserGql | null> {
    const auth = ctx?.req?.headers?.authorization as string | undefined;
    const cookie = ctx?.req?.headers?.cookie as string | undefined;
    const headers: Record<string, string> = {};
    if (auth) headers['authorization'] = auth;
    if (cookie) headers['cookie'] = cookie;

    try {
      const r: any = await this.backend.get<any>('/auth/me', { headers });
      const body = r?.data ?? r;
      const u = pickUser(body);
      return u ? toUserGql(u) : null;
    } catch {
      return null;
    }
  }
}
