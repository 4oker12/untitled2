// app/bff/src/modules/auth.resolver.ts
import { Resolver, Mutation, Args, Query, Context } from '@nestjs/graphql'; // [CHANGED] добавил Query, Context
import { InternalServerErrorException } from '@nestjs/common';
import { BackendClient } from './backend.client';
import { RegisterInput, LoginInput, UserGql, AuthPayloadGql } from './graphql.models';

function pickUser(raw: any): any | null {
  if (!raw) return null;
  const body = raw?.data ?? raw; // поддержка ApiOk<T> и «сырых» форм

  if (body?.user) return body.user;                     // { user: {...} }
  if (body?.data?.user) return body.data.user;          // { data: { user: {...} } }
  if (body?.data && (body.data.id || body.data.email)) return body.data; // { data: {...} }
  if (body?.id || body?.email) return body;             // плоский объект
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
      throw new InternalServerErrorException(
          `Backend did not return user.id (got: ${JSON.stringify(resp)})`
      );
    }

    return toUserGql(u);
  }

  // [CHANGED] login больше НЕ требует accessToken — возвращаем то, что есть
  @Mutation(() => AuthPayloadGql)
  async login(@Args('input') input: LoginInput, @Context() ctx: any): Promise<AuthPayloadGql> {
    const resp: any = await this.backend.post<any>('/auth/login', input);
    const body = resp?.data ?? resp;

    // Пробуем найти токены, если backend их отдаёт
    const accessToken =
        body?.accessToken ?? body?.token ?? body?.data?.accessToken ?? body?.data?.token ?? null;
    const refreshToken =
        body?.refreshToken ?? body?.data?.refreshToken ?? null;

    // Если backend использует cookie-сессии, тут можно было бы прокинуть Set-Cookie.
    // Наш BackendClient сейчас не возвращает заголовки — поэтому пока просто возвращаем user.
    const u = pickUser(body);

    return {
      accessToken: accessToken ? String(accessToken) : null,
      refreshToken: refreshToken ? String(refreshToken) : null,
      user: u ? toUserGql(u) : null,
    };
  }

  // [ADDED] me: текущий пользователь (по Authorization/cookie)
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
    } catch (e: any) {
      // Если неавторизован — вернём null (ожидаемо для фронта)
      if (typeof e?.getStatus === 'function' && e.getStatus() === 401) return null;
      return null; // можно и пробросить, но фронту удобнее получить null
    }
  }
}
