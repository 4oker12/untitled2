// [ADDED FILE] друзья через сервис
import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { FriendsService } from './friends.service';
import { FriendRequestGql, FriendRequestStatusGql, UserGql } from './graphql.models';

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

    // [ADDED] список друзей
    @Query(() => [UserGql])
    async friendsSvc(): Promise<UserGql[]> {
        const list = await this.friends.listFriends();
        return list.map((u: any) => toUserGql(u)!).filter(Boolean) as UserGql[];
    }

    // [ADDED] заявки (incoming|outgoing)
    @Query(() => [FriendRequestGql])
    async friendRequests(
        @Args('direction', { type: () => String, nullable: true }) direction?: 'incoming' | 'outgoing'
    ): Promise<FriendRequestGql[]> {
        const list = await this.friends.listRequests(direction);
        return list.map(toFriendReqGql);
    }

    // [ADDED] отправить заявку
    @Mutation(() => FriendRequestGql)
    async requestFriend(@Args('userId') userId: string): Promise<FriendRequestGql> {
        const r = await this.friends.requestFriend(userId);
        return toFriendReqGql(r);
    }

    // [ADDED] принять заявку
    @Mutation(() => FriendRequestGql)
    async acceptFriendRequest(@Args('id') id: string): Promise<FriendRequestGql> {
        const r = await this.friends.acceptRequest(id);
        return toFriendReqGql(r);
    }

    // [ADDED] отклонить заявку
    @Mutation(() => FriendRequestGql)
    async declineFriendRequest(@Args('id') id: string): Promise<FriendRequestGql> {
        const r = await this.friends.declineRequest(id);
        return toFriendReqGql(r);
    }

    // [ADDED] отменить свою заявку
    @Mutation(() => FriendRequestGql)
    async cancelFriendRequest(@Args('id') id: string): Promise<FriendRequestGql> {
        const r = await this.friends.cancelRequest(id);
        return toFriendReqGql(r);
    }

    // [ADDED] удалить друга
    @Mutation(() => Boolean)
    async removeFriend(@Args('userId') userId: string): Promise<boolean> {
        return this.friends.removeFriend(userId);
    }

    // [ADDED] поиск юзеров
    @Query(() => [UserGql])
    async searchUsers(@Args('q') q: string): Promise<UserGql[]> {
        const list = await this.friends.searchUsers(q);
        return list.map((u: any) => toUserGql(u)!).filter(Boolean) as UserGql[];
    }
}
