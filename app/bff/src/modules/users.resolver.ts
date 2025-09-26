// [CHANGED] убрали .js и дженерики-матрёшки
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { BackendClient, ApiOk } from './backend.client';
import { UserGql } from './graphql.models';

@Resolver()
export class UsersResolver {
  constructor(private readonly backend: BackendClient) {}

  @Query(() => [String])
  async userIds(): Promise<string[]> {
    const r: ApiOk<UserGql[]> = await this.backend.get<UserGql[]>('/users');
    return r.data.map((u) => String(u.id));
  }

  @Mutation(() => String)
  async createUser(
      @Args('email') email: string,
      @Args('name', { nullable: true }) name?: string
  ): Promise<string> {
    const r: ApiOk<UserGql> = await this.backend.post<UserGql>('/users', { email, name });
    return String(r.data.id);
  }
}
