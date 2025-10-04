// app/bff/src/modules/messages/messages.resolver.ts
import { Resolver, Query, Mutation, Args, Context, ID } from '@nestjs/graphql';
import { BackendClient } from '../backend.client.js';
import {
    MessageGql,
    SendMessageInput,
    MessagesPageInput,
} from '../graphql.models.js';
import { UnreadSummaryGql } from '../graphql.models.js';


function pickHeaders(ctx: any): { headers?: Record<string, string> } {
    const auth = ctx?.req?.headers?.authorization;
    const cookie = ctx?.req?.headers?.cookie;
    const headers: Record<string, string> = {};
    if (auth) headers['authorization'] = auth;
    if (cookie) headers['cookie'] = cookie;
    return Object.keys(headers).length ? { headers } : {};
}

function toIso(v: any): string | null {
    if (!v) return null;
    try {
        const d = new Date(v);
        return isNaN(d as any) ? String(v) : d.toISOString();
    } catch {
        return String(v);
    }
}

function toMessageGql(raw: any): MessageGql {
    const m = raw?.data ?? raw ?? {};
    return {
        id: String(m.id),
        fromUserId: String(m.fromUserId),
        toUserId: String(m.toUserId),
        body: String(m.body ?? ''),
        createdAt: toIso(m.createdAt) ?? new Date().toISOString(),
        readAt: toIso(m.readAt),
    };
}

@Resolver()
export class MessagesResolver {
    constructor(private readonly backend: BackendClient) {}

    // Отправить сообщение
    @Mutation(() => MessageGql, { name: 'sendMessage' })
    async sendMessage(
        @Args('input') input: SendMessageInput,
        @Context() ctx: any,
    ): Promise<MessageGql> {
        // REST: POST /messages  { toUserId, body }
        const resp: any = await this.backend.post('/messages', input, pickHeaders(ctx));
        return toMessageGql(resp);
    }

    // Список переписки с конкретным пользователем (пагинация)
    // messages.resolver.ts (метод messages)
    @Query(() => [MessageGql], { name: 'messages' })
    async messages(
        @Args('input') input: MessagesPageInput,
        @Context() ctx: any,
    ): Promise<MessageGql[]> {
        const q = new URLSearchParams();
        q.set('withUserId', input.withUserId);

        // Жёсткая фильтрация take
        if (typeof input.take === 'number' && Number.isInteger(input.take) && input.take >= 1) {
            q.set('take', String(input.take));
        }
        if (input.cursor) q.set('cursor', input.cursor);

        const resp: any = await this.backend.get(`/messages?${q.toString()}`, pickHeaders(ctx));
        const list = resp?.data ?? resp ?? [];
        return Array.isArray(list) ? list.map(toMessageGql) : [];
    }



    // Пометить сообщение прочитанным
    @Mutation(() => MessageGql, { name: 'markMessageRead' })
    async markMessageRead(
        @Args('id', { type: () => ID }) id: string,
        @Context() ctx: any,
    ): Promise<MessageGql> {
        // REST: POST /messages/:id/read
        const resp: any = await this.backend.post(`/messages/${id}/read`, {}, pickHeaders(ctx));
        return toMessageGql(resp);
    }

    @Query(() => UnreadSummaryGql, { name: 'unreadSummary' })
    async unreadSummary(@Context() ctx: any): Promise<UnreadSummaryGql> {
        const resp: any = await this.backend.get('/messages/unread-summary', pickHeaders(ctx));
        const data = resp?.data ?? resp ?? { total: 0, byUser: [] };
        return {
            total: Number(data.total || 0),
            byUser: Array.isArray(data.byUser)
                ? data.byUser.map((x: any) => ({ userId: String(x.userId), count: Number(x.count || 0) }))
                : [],
        };
    }
}
