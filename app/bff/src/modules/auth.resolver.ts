// src/modules/auth.resolver.ts
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Response } from 'express';
import { BackendClient, ApiOk } from './backend.client.js';
import { LoginInput, RegisterInput, UserGql } from './graphql.models.js';

@Resolver()
export class AuthResolver {
  constructor(private readonly backend: BackendClient) {}

  @Mutation(() => String)
  async register(
      @Args('input', { type: () => RegisterInput }) input: RegisterInput,
      @Context() ctx: { res: Response }
  ): Promise<string> {
    try {
      const { json, cookies } = await this.backend.postRaw('/auth/register', input);
      if (cookies.length) ctx.res.setHeader('set-cookie', cookies);
      const r = json as ApiOk<{ user: UserGql }>;
      return r.data.user.id;
    } catch (e: any) {
      // отдаём понятный текст с телом ответа бэкенда
      const msg =
          e?.body?.error?.code ??
          e?.body?.message ??
          (typeof e?.body === 'object' ? JSON.stringify(e.body) : e?.message);
      throw new Error(`REGISTER_FAILED: ${msg}`);
    }
  }

  @Mutation(() => String)
  async login(
      @Args('input', { type: () => LoginInput }) input: LoginInput,
      @Context() ctx: { res: Response }
  ): Promise<string> {
    try {
      const { json, cookies } = await this.backend.postRaw('/auth/login', input);
      if (cookies.length) ctx.res.setHeader('set-cookie', cookies);
      const r = json as ApiOk<{ user: UserGql }>;
      return r.data.user.id;
    } catch (e: any) {
      const msg =
          e?.body?.error?.code ??
          e?.body?.message ??
          (typeof e?.body === 'object' ? JSON.stringify(e.body) : e?.message);
      throw new Error(`LOGIN_FAILED: ${msg}`);
    }
  }

  @Mutation(() => Boolean)
  async refresh(@Context() ctx: { res: Response }): Promise<boolean> {
    try {
      const { cookies } = await this.backend.postRaw('/auth/refresh');
      if (cookies.length) ctx.res.setHeader('set-cookie', cookies);
      return true;
    } catch (e: any) {
      const msg =
          e?.body?.error?.code ??
          e?.body?.message ??
          (typeof e?.body === 'object' ? JSON.stringify(e.body) : e?.message);
      throw new Error(`REFRESH_FAILED: ${msg}`);
    }
  }

  @Mutation(() => Boolean)
  async logout(@Context() ctx: { res: Response }): Promise<boolean> {
    try {
      const { cookies } = await this.backend.postRaw('/auth/logout');
      if (cookies.length) ctx.res.setHeader('set-cookie', cookies);
      return true;
    } catch (e: any) {
      const msg =
          e?.body?.error?.code ??
          e?.body?.message ??
          (typeof e?.body === 'object' ? JSON.stringify(e.body) : e?.message);
      throw new Error(`LOGOUT_FAILED: ${msg}`);
    }
  }

  @Query(() => String, { nullable: true })
  async me(): Promise<string | null> {
    return null;
  }
}
