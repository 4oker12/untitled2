// bff/src/modules/friends.resolver.ts
// CHANGED: GraphQL-резолвер дергает FriendsService (который ходит в BackendClient);
//          аккуратно распаковываем { data }, нигде не делаем .map на объекте.

import { Resolver, Query, Mutation, ID, Args, Context } from '@nestjs/graphql';
import { FriendsService } from './friends.service';
import {
    FriendRequestGql,
    FriendRequestStatusGql,
    UserGql,
    SendFriendRequestInput,
} from '../graphql.models';

// ——— helpers ———
function unwrapArray<T = any>(raw: any): T[] {
    if (Array.isArray(raw)) return raw as T[];
    const d = raw?.data ?? raw;
    return Array.isArray(d) ? (d as T[]) : [];
}
function unwrapOne<T = any>(raw: any): T {
    const d = raw?.data ?? raw;
    return d as T;
}

function toUserGql(u: any | null | undefined): UserGql | null {
    if (!u) return null;
    return {
        id: String(u.id ?? u.userId ?? u._id ?? ''),
        email: u.email ?? null,
        name: u.name ?? null,
        role: (u.role as any) ?? null,
        handle: u.handle ?? null,
    };
}
function toReqStatus(s: any | undefined): FriendRequestStatusGql | null {
    const v = String(s ?? '').toUpperCase();
    if (v === 'PENDING' || v === 'REQUESTED') return FriendRequestStatusGql.PENDING;
    if (v === 'ACCEPTED') return FriendRequestStatusGql.ACCEPTED;
    if (v === 'DECLINED') return FriendRequestStatusGql.DECLINED;
    if (v === 'CANCELED' || v === 'CANCELLED') return FriendRequestStatusGql.CANCELED;
    return null;
}
function toFriendReqGql(r: any): FriendRequestGql {
    return {
        id: String(r.id ?? r.requestId ?? r._id ?? ''),
        from: toUserGql(r.from ?? r.fromUser ?? r.requester) ?? undefined,
        to: toUserGql(r.to ?? r.toUser ?? r.addressee) ?? undefined,
        status: toReqStatus(r.status) ?? undefined,
        createdAt: (r.createdAt ?? r.created_at) ? String(r.createdAt ?? r.created_at) : undefined,
        updatedAt: (r.updatedAt ?? r.updated_at) ? String(r.updatedAt ?? r.updated_at) : undefined,
    };
}

// ——— resolver ———
@Resolver()
export class FriendsResolver {
    constructor(private readonly friends: FriendsService) {}

    @Query(() => [UserGql])
    async friendsSvc(@Context() ctx: any): Promise<UserGql[]> {
        const raw = await this.friends.listFriends(ctx);        // CHANGED
        const list = unwrapArray<any>(raw);                     // CHANGED
        return list.map((u) => toUserGql(u)!).filter(Boolean) as UserGql[];
    }

    @Query(() => [FriendRequestGql])
    async friendRequests(
        @Args('direction', { type: () => String, nullable: true }) direction?: 'incoming' | 'outgoing',
        @Context() ctx?: any,
    ): Promise<FriendRequestGql[]> {
        const raw = await this.friends.listRequests(direction, ctx); // CHANGED
        const list = unwrapArray<any>(raw);                          // CHANGED
        return list.map(toFriendReqGql);
    }

    @Mutation(() => FriendRequestGql)
    async sendFriendRequest(
        @Args('input') input: SendFriendRequestInput,
        @Context() ctx?: any,
    ): Promise<FriendRequestGql> {
        const raw = await this.friends.sendRequest(
            { toHandle: input.toHandle ?? undefined, userId: input.userId ?? undefined },
            ctx,
        );                                                     // CHANGED
        const one = unwrapOne<any>(raw);                       // CHANGED
        return toFriendReqGql(one);
    }

    @Mutation(() => FriendRequestGql)
    async acceptFriendRequest(  @Args('id', { type: () => ID }) id: string,     // ← ТАК
        @Context() ctx?: any): Promise<FriendRequestGql> {
        const raw = await this.friends.accept(id, ctx);        // CHANGED
        const one = unwrapOne<any>(raw);                       // CHANGED
        return toFriendReqGql(one);
    }

    @Mutation(() => FriendRequestGql)
    async declineFriendRequest
     (@Args('id', { type: () => ID }) id: string,
     @Context() ctx?: any): Promise<FriendRequestGql> {
        const raw = await this.friends.decline(id, ctx);       // CHANGED
        const one = unwrapOne<any>(raw);                       // CHANGED
        return toFriendReqGql(one);
    }

    @Mutation(() => FriendRequestGql)
    async cancelFriendRequest(@Args('id', { type: () => ID }) id: string,
                              @Context() ctx?: any): Promise<FriendRequestGql> {
        const raw = await this.friends.cancel(id, ctx);        // CHANGED
        const one = unwrapOne<any>(raw);                       // CHANGED
        return toFriendReqGql(one);
    }

    @Mutation(() => Boolean)
    async removeFriend(
        @Args('userId', { type: () => ID }) userId: string,
        @Context() ctx?: any,
    ): Promise<boolean> {
        await this.friends.removeFriend(userId, ctx);
        return true;
    }

    @Query(() => [UserGql])
    async searchUsers(@Args('q') q: string, @Context() ctx?: any): Promise<UserGql[]> {
        const raw = await this.friends.searchUsers(q, ctx);    // CHANGED
        const list = unwrapArray<any>(raw);                    // CHANGED
        return list.map((u) => toUserGql(u)!).filter(Boolean) as UserGql[];
    }
}
