import { Resolver, Mutation, Args, Context, Query } from '@nestjs/graphql';

@Resolver()
export class DebugResolver {
    @Query(() => String)
    ping() {
        return 'pong';
    }

    // вернём всё как строку JSON, чтобы не заморачиваться с скалярами
    @Mutation(() => String)
    debugEcho(
        @Args('payload', { type: () => String }) payload: string,
        @Context() ctx: any,
    ): string {
        // на всякий залогируем на сервере
        console.log('DEBUG payload:', payload);
        console.log('DEBUG req.body:', ctx?.req?.body);
        console.log('DEBUG headers:', ctx?.req?.headers);

        return JSON.stringify(
            {
                receivedPayload: payload,
                body: ctx?.req?.body,
                headers: ctx?.req?.headers,
            },
            null,
            2
        );
    }
}
