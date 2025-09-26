import { Resolver, Query, Mutation } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String, { name: 'health' })
  health() {
    return 'ok';
  }

  // держим как предохранитель — гарантирует, что в схеме есть корневой Mutation
  @Mutation(() => String, { name: 'noop' })
  noop() {
    return 'ok';
  }
}
