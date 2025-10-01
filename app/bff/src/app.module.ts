

// [CHANGED] добавили FriendsModule и context для req/res
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';

import { AppResolver } from './app.resolver';
import { DebugResolver } from './debug.resolver';

import { BackendModule } from './modules/backend.module';
import { AuthResolver } from './modules/auth.resolver';
import { FriendsModule } from './modules/friends/friends.module'; // [ADDED]

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      path: '/graphql',
      playground: true,
      // [ADDED] даём резолверам доступ к res (для Set-Cookie)
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),    }),
    BackendModule,
    FriendsModule, // [ADDED]
  ],
  providers: [AppResolver, DebugResolver, AuthResolver],
})
export class AppModule {}
