import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import type { Request, Response } from 'express';
import { CreateUserInput, User } from './graphql.models.js';
import { BackendClient } from './backend.client.js';

function unwrap<T>(r: any): T {
  return (r && typeof r === 'object' && 'data' in r) ? (r.data as T) : (r as T);
}

@Resolver(() => User)
export class UsersResolver {
  @Query(() => [User])
  async users(
      @Context('req') req: Request,
      @Context('res') res: Response,
  ): Promise<User[]> {
    const client = new BackendClient(req, res);
    const resp: any = await client.listUsers();
    return unwrap<User[]>(resp) ?? [];
  }

  @Mutation(() => User)
  async createUser(
      @Args('input') input: CreateUserInput,
      @Context('req') req: Request,
      @Context('res') res: Response,
  ): Promise<User> {
    const client = new BackendClient(req, res);
    const resp: any = await client.createUser(input);
    return unwrap<User>(resp);
  }
}