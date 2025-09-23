// src/modules/users.resolver.ts
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { BackendClient, ApiOk } from './backend.client.js';
import { RoleGql, UserGql } from './graphql.models.js';

@Resolver()
export class UsersResolver {
  constructor(private readonly backend: BackendClient) {}

  @Query(() => [String]) // replace with your actual GQL type if needed
  async listUsers(): Promise<string[]> {
    const r = await this.backend.get<ApiOk<UserGql[]>>('/users');
    return r.data.map((u: UserGql) => u.id); // [FIX] no implicit any
  }

  @Mutation(() => String)
  async createUser(
      @Args('email') email: string,
      @Args('password') password: string,
      @Args('name', { nullable: true }) name?: string,
      @Args('handle', { nullable: true }) handle?: string
  ): Promise<string> {
    const r = await this.backend.post<ApiOk<UserGql>>('/users', {
      email,
      password,
      name: name ?? null,
      handle: handle ? handle.trim().toLowerCase() : null,
      role: RoleGql.USER, // optional
    });
    return r.data.id;
  }
}
