// [CHANGED] добавил sendFriendRequest(input) и прокинул @Context
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { FriendsService } from './friends.service';
import { FriendRequestGql, FriendRequestStatusGql, UserGql, SendFriendRequestInput } from './graphql.models';

function toUserGql(u: any | undefined | null): UserGql | null {
    if (!u) return null;
    return {
        id: String(u.id ?? u.userId ?? u._id ?? ''),
        email: u.email ?? '',
        name: u.name ?? null,
        role: (u.role as any) ?? null,
        handle: u.handle ?? null,
    };
}

function toReqStatus(s: any | undefined): FriendRequestStatusGql | null {
    if (!s) return null;
    const v = String(s).toUpperCase();
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

@Resolver()
export class FriendsResolver {
    constructor(private readonly friends: FriendsService) {}

    @Query(() => [UserGql])
    async friendsSvc(@Context() ctx: any): Promise<UserGql[]> {
        const list = await this.friends.listFriends(ctx);
        return list.map((u: any) => toUserGql(u)!).filter(Boolean) as UserGql[];
    }

    @Query(() => [FriendRequestGql])
    async friendRequests(
        @Args('direction', { type: () => String, nullable: true }) direction?: 'incoming' | 'outgoing',
        @Context() ctx?: any,
    ): Promise<FriendRequestGql[]> {
        const list = await this.friends.listRequests(direction, ctx);
        return list.map(toFriendReqGql);
    }

    @Mutation(() => FriendRequestGql)
    async requestFriend(@Args('userId') userId: string, @Context() ctx?: any): Promise<FriendRequestGql> {
        const r = await this.friends.requestFriend(userId, ctx);
        return toFriendReqGql(r);
    }

    // [ADDED] универсальная мутация: либо userId, либо toHandle
    @Mutation(() => FriendRequestGql)
    async sendFriendRequest(
        @Args('input') input: SendFriendRequestInput,
        @Context() ctx?: any,
    ): Promise<FriendRequestGql> {
        const r = await this.friends.sendRequest(
            { userId: input.userId ?? undefined, toHandle: input.toHandle ?? undefined },
            ctx,
        );
        return toFriendReqGql(r);
    }

    @Mutation(() => FriendRequestGql)
    async acceptFriendRequest(@Args('id') id: string, @Context() ctx?: any): Promise<FriendRequestGql> {
        const r = await this.friends.acceptRequest(id, ctx);
        return toFriendReqGql(r);
    }

    @Mutation(() => FriendRequestGql)
    async declineFriendRequest(@Args('id') id: string, @Context() ctx?: any): Promise<FriendRequestGql> {
        const r = await this.friends.declineRequest(id, ctx);
        return toFriendReqGql(r);
    }

    @Mutation(() => FriendRequestGql)
    async cancelFriendRequest(@Args('id') id: string, @Context() ctx?: any): Promise<FriendRequestGql> {
        const r = await this.friends.cancelRequest(id, ctx);
        return toFriendReqGql(r);
    }

    @Mutation(() => Boolean)
    async removeFriend(@Args('userId') userId: string, @Context() ctx?: any): Promise<boolean> {
        return this.friends.removeFriend(userId, ctx);
    }

    @Query(() => [UserGql])
    async searchUsers(@Args('q') q: string, @Context() ctx?: any): Promise<UserGql[]> {
        const list = await this.friends.searchUsers(q, ctx);
        return list.map((u: any) => toUserGql(u)!).filter(Boolean) as UserGql[];
    }
}
