// bff/src/modules/friends.service.ts
import { Injectable } from '@nestjs/common';
import { BackendClient } from '../backend.client';

@Injectable()
export class FriendsService {
    constructor(private readonly backend: BackendClient) {}

    listFriends(ctx?: any) {
        return this.backend.get('/friends', ctx?.req);
    }

    listRequests(direction?: 'incoming' | 'outgoing', ctx?: any) {
        const suffix = direction ? '?type=' + encodeURIComponent(direction) : '';
        return this.backend.get('/friends/requests' + suffix, ctx?.req);
    }

    sendRequest(input: { toHandle?: string; userId?: string }, ctx?: any) {
        const body = { toHandle: String(input?.toHandle || '').trim().toLowerCase() };
        return this.backend.post('/friends/requests', body, ctx?.req);
    }

    acceptRequest(id: string, ctx?: any) {
        return this.backend.post('/friends/requests/' + encodeURIComponent(id) + '/accept', {}, ctx?.req);
    }
    declineRequest(id: string, ctx?: any) {
        return this.backend.post('/friends/requests/' + encodeURIComponent(id) + '/decline', {}, ctx?.req);
    }
    cancelRequest(id: string, ctx?: any) {
        return this.backend.post('/friends/requests/' + encodeURIComponent(id) + '/cancel', {}, ctx?.req);
    }

    // алиасы под старые вызовы резолвера
    accept(id: string, ctx?: any)  { return this.acceptRequest(id, ctx); }
    decline(id: string, ctx?: any) { return this.declineRequest(id, ctx); }
    cancel(id: string, ctx?: any)  { return this.cancelRequest(id, ctx); }

    removeFriend(userId: string, ctx?: any) {
        return this.backend.delete('/friends/' + encodeURIComponent(userId), ctx?.req);
    }

    searchUsers(q: string, ctx?: any) {
        const qs = q ? '?q=' + encodeURIComponent(q) : '';
        return this.backend.get('/friends/search/users' + qs, ctx?.req);
    }
}
