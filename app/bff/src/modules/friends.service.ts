// src/modules/friends.service.ts
import { Injectable } from '@nestjs/common';
import { BackendClient, ApiOk } from './backend.client.js';

export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELED';

export interface PublicUserDto {
  id: string;
  handle: string | null;
  name: string | null;
  email?: string | null;
}

export interface FriendRequestDto {
  id: string;
  fromId: string;
  toId: string;
  status: FriendRequestStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface SendFriendRequestDto {
  toHandle: string;
}

function ok<T>(data: T) {
  return { data };
}

@Injectable()
export class FriendsService {
  constructor(private readonly backend: BackendClient) {}

  async listFriends() {
    const r = await this.backend.get<ApiOk<PublicUserDto[]>>('/friends');
    return ok(r.data);
  }

  async listRequests(type?: 'incoming' | 'outgoing') {
    const query = type ? `?type=${encodeURIComponent(type)}` : '';
    const r = await this.backend.get<ApiOk<FriendRequestDto[]>>(`/friends/requests${query}`);
    return ok(r.data);
  }

  async sendRequest(body: SendFriendRequestDto) {
    const r = await this.backend.post<ApiOk<FriendRequestDto>>('/friends/requests', body);
    return ok(r.data);
  }

  async acceptRequest(id: string) {
    const r = await this.backend.post<ApiOk<FriendRequestDto>>(`/friends/requests/${encodeURIComponent(id)}/accept`);
    return ok(r.data);
  }

  async declineRequest(id: string) {
    const r = await this.backend.post<ApiOk<FriendRequestDto>>(`/friends/requests/${encodeURIComponent(id)}/decline`);
    return ok(r.data);
  }

  async cancelRequest(id: string) {
    const r = await this.backend.post<ApiOk<FriendRequestDto>>(`/friends/requests/${encodeURIComponent(id)}/cancel`);
    return ok(r.data);
  }

  async removeFriend(userId: string) {
    const r = await this.backend.delete<ApiOk<boolean>>(`/friends/${encodeURIComponent(userId)}`);
    return ok(r.data);
  }

  async searchUsers(q: string) {
    const r = await this.backend.get<ApiOk<PublicUserDto[]>>(`/users?search=${encodeURIComponent(q)}`);
    return ok(r.data);
  }
}
