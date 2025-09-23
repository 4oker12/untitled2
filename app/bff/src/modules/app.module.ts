// src/modules/app.module.ts  [BFF]
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import type { Request, Response } from 'express'; // [FIX] типы для req/res

import { BackendModule } from './backend.module.js';
import { FriendsModule } from './friends.module.js';
import { UsersResolver } from './users.resolver.js';
import { AuthResolver } from './auth.resolver.js';

@Module({
  imports: [
    BackendModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/graphql',
      sortSchema: true,
      playground: true,
      // cors настраиваем в main.ts через app.enableCors(...)
      // [FIX] удалил свойство cors: ... из ApolloDriverConfig — его там нет
      // [FIX] явно типизировал req/res, чтобы убрать implicit any
      context: ({ req, res }: { req: Request; res: Response }) => ({ req, res }),
    }),
    FriendsModule,
  ],
  providers: [
    UsersResolver,
    AuthResolver,
  ],
})
export class AppModule {}

