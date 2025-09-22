import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { AuthPayload, LoginInput, RegisterInput, User } from './graphql.models.js';
import { BackendClient } from './backend.client.js';

// Универсальная распаковка: если пришёл AxiosResponse — берём .data, иначе сам объект
function unwrap<T>(r: any): T {
  return (r && typeof r === 'object' && 'data' in r) ? (r.data as T) : (r as T);
}

@Resolver()
export class AuthResolver {
  @Mutation(() => AuthPayload)
  async register(
      @Args('input') input: RegisterInput,
      @Context('req') req: Request,
      @Context('res') res: Response,
  ): Promise<AuthPayload> {
    const client = new BackendClient(req, res);
    const resp: any = await client.register(input);
    return unwrap<AuthPayload>(resp);
  }

  @Mutation(() => AuthPayload)
  async login(
      @Args('input') input: LoginInput,
      @Context('req') req: Request,
      @Context('res') res: Response,
  ): Promise<AuthPayload> {
    const client = new BackendClient(req, res);
    const resp: any = await client.login(input);
    return unwrap<AuthPayload>(resp);
  }

  @Mutation(() => AuthPayload)
  async refresh(
      @Context('req') req: Request,
      @Context('res') res: Response,
  ): Promise<AuthPayload> {
    const client = new BackendClient(req, res);
    const resp: any = await client.refresh();
    return unwrap<AuthPayload>(resp);
  }

  @Mutation(() => Boolean)
  async logout(
      @Context('req') req: Request,
      @Context('res') res: Response,
  ): Promise<boolean> {
    const client = new BackendClient(req, res);
    await client.logout();
    return true;
  }

  @Query(() => User)
  async me(
      @Context('req') req: Request,
      @Context('res') res: Response,
  ): Promise<User> {
    const client = new BackendClient(req, res);
    const resp: any = await client.me();
    return unwrap<User>(resp);
  }
}

