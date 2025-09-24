import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  @Query(() => String, { name: 'health' })
  health() {
    return 'ok';
  }
}
