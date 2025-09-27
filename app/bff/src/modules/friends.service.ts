// [CHANGED] шлём в backend именно { toHandle }, и прокидываем cookie/authorization из контекста
import { Injectable, BadRequestException } from '@nestjs/common';
import { BackendClient, ApiOk } from './backend.client';
import { PublicUserDto, FriendRequestDto } from './friends.dto';

type Ctx = { req?: { headers?: Record<string, any> } } | undefined;

@Injectable()
export class FriendsService {
    constructor(private readonly backend: BackendClient) {}

    private authHeaders(ctx: Ctx): Record<string, string> {
        const auth = ctx?.req?.headers?.authorization as string | undefined;
        const cookie = ctx?.req?.headers?.cookie as string | undefined;
        const headers: Record<string, string> = {};
        if (auth) headers['authorization'] = auth;
        if (cookie) headers['cookie'] = cookie;
        return headers;
    }

    async listFriends(ctx?: Ctx): Promise<PublicUserDto[]> {
        const r: ApiOk<PublicUserDto[]> = await this.backend.get<PublicUserDto[]>('/friends', {
            headers: this.authHeaders(ctx),
        });
        return r.data;
    }

    // у тебя на бэке параметр зовётся "type" (incoming|outgoing)
    async listRequests(direction?: 'incoming' | 'outgoing', ctx?: Ctx): Promise<FriendRequestDto[]> {
        const query = direction ? `?type=${encodeURIComponent(direction)}` : '';
        const r: ApiOk<FriendRequestDto[]> =
            await this.backend.get<FriendRequestDto[]>(`/friends/requests${query}`, {
                headers: this.authHeaders(ctx),
            });
        return r.data;
    }

    // приватный помощник — создать заявку точно по handle
    private async postRequestByHandle(toHandle: string, ctx?: Ctx): Promise<FriendRequestDto> {
        if (!toHandle || typeof toHandle !== 'string') {
            throw new BadRequestException('toHandle is required');
        }
        const r: ApiOk<FriendRequestDto> =
            await this.backend.post<FriendRequestDto>('/friends/requests', { toHandle }, {
                headers: this.authHeaders(ctx),
            });
        return r.data;
    }

    // если пришёл userId — резолвим в handle (через поиск) и всё равно шлём { toHandle }
    private async resolveHandleByUserId(userId: string, ctx?: Ctx): Promise<string> {
        const r: ApiOk<PublicUserDto[]> =
            await this.backend.get<PublicUserDto[]>(`/users?search=${encodeURIComponent(userId)}`, {
                headers: this.authHeaders(ctx),
            });
        const candidate =
            r.data.find(u => String(u.id) === String(userId)) ?? r.data[0];
        const handle = candidate?.handle;
        if (!handle) throw new BadRequestException('Cannot resolve handle by userId');
        return String(handle);
    }

    // старая совместимая мутация (по id)
    async requestFriend(userId: string, ctx?: Ctx): Promise<FriendRequestDto> {
        const handle = await this.resolveHandleByUserId(userId, ctx);
        return this.postRequestByHandle(handle, ctx);
    }

    // [CHANGED] приоритизируем toHandle и шлём его напрямую
    async sendRequest(params: { userId?: string; toHandle?: string }, ctx?: Ctx): Promise<FriendRequestDto> {
        const { userId, toHandle } = params || {};
        if (toHandle) return this.postRequestByHandle(toHandle, ctx);
        if (userId) return this.requestFriend(String(userId), ctx);
        throw new BadRequestException('Either userId or toHandle must be provided');
    }

    async acceptRequest(id: string, ctx?: Ctx): Promise<FriendRequestDto> {
        const r: ApiOk<FriendRequestDto> =
            await this.backend.post<FriendRequestDto>(`/friends/requests/${encodeURIComponent(id)}/accept`, undefined, {
                headers: this.authHeaders(ctx),
            });
        return r.data;
    }

    async declineRequest(id: string, ctx?: Ctx): Promise<FriendRequestDto> {
        const r: ApiOk<FriendRequestDto> =
            await this.backend.post<FriendRequestDto>(`/friends/requests/${encodeURIComponent(id)}/decline`, undefined, {
                headers: this.authHeaders(ctx),
            });
        return r.data;
    }

    async cancelRequest(id: string, ctx?: Ctx): Promise<FriendRequestDto> {
        const r: ApiOk<FriendRequestDto> =
            await this.backend.post<FriendRequestDto>(`/friends/requests/${encodeURIComponent(id)}/cancel`, undefined, {
                headers: this.authHeaders(ctx),
            });
        return r.data;
    }

    async removeFriend(userId: string, ctx?: Ctx): Promise<boolean> {
        const r: ApiOk<boolean> =
            await this.backend.delete<boolean>(`/friends/${encodeURIComponent(userId)}`, {
                headers: this.authHeaders(ctx),
            });
        return r.data;
    }

    async searchUsers(q: string, ctx?: Ctx): Promise<PublicUserDto[]> {
        const r: ApiOk<PublicUserDto[]> =
            await this.backend.get<PublicUserDto[]>(`/friends/search/users?q=${encodeURIComponent(q)}`, {
                headers: this.authHeaders(ctx),
            });
        return r.data;
    }
}
