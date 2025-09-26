// [CHANGED] убрали .js из импорта и выровняли generics
import { Injectable, BadRequestException } from '@nestjs/common';
import { BackendClient, ApiOk } from './backend.client';

import {PublicUserDto, FriendRequestDto} from "./friends.dto";

@Injectable()
export class FriendsService {
  constructor(private readonly backend: BackendClient) {}

  async listFriends(): Promise<PublicUserDto[]> {
    const r: ApiOk<PublicUserDto[]> = await this.backend.get<PublicUserDto[]>('/friends');
    return r.data;
  }

  async listRequests(direction?: 'incoming' | 'outgoing'): Promise<FriendRequestDto[]> {
    const query = direction ? `?direction=${encodeURIComponent(direction)}` : '';
    const r: ApiOk<FriendRequestDto[]> =
        await this.backend.get<FriendRequestDto[]>(`/friends/requests${query}`);
    return r.data;
  }

  async requestFriend(userId: string): Promise<FriendRequestDto> {
    const body = { userId };
    const r: ApiOk<FriendRequestDto> =
        await this.backend.post<FriendRequestDto>('/friends/requests', body);
    return r.data;
  }

  async acceptRequest(id: string): Promise<FriendRequestDto> {
    const r: ApiOk<FriendRequestDto> =
        await this.backend.post<FriendRequestDto>(`/friends/requests/${encodeURIComponent(id)}/accept`);
    return r.data;
  }

  async declineRequest(id: string): Promise<FriendRequestDto> {
    const r: ApiOk<FriendRequestDto> =
        await this.backend.post<FriendRequestDto>(`/friends/requests/${encodeURIComponent(id)}/decline`);
    return r.data;
  }

  async cancelRequest(id: string): Promise<FriendRequestDto> {
    const r: ApiOk<FriendRequestDto> =
        await this.backend.post<FriendRequestDto>(`/friends/requests/${encodeURIComponent(id)}/cancel`);
    return r.data;
  }

  async removeFriend(userId: string): Promise<boolean> {
    const r: ApiOk<boolean> =
        await this.backend.delete<boolean>(`/friends/${encodeURIComponent(userId)}`);
    return r.data;
  }

  async searchUsers(q: string): Promise<PublicUserDto[]> {
    const r: ApiOk<PublicUserDto[]> =
        await this.backend.get<PublicUserDto[]>(`/users?search=${encodeURIComponent(q)}`);
    return r.data;
  }

  async sendRequest(params: { userId?: string; toHandle?: string }): Promise<FriendRequestDto> {
        const { userId, toHandle } = params || {};
       if (userId) {
            return this.requestFriend(userId);
          }
        if (toHandle) {
            // Пытаемся найти пользователя по handle и отправить заявку
               const r: ApiOk<PublicUserDto[]> =
                  await this.backend.get<PublicUserDto[]>(`/users?search=${encodeURIComponent(toHandle)}`);
            const candidate =
                  r.data.find(u => (u.handle ?? '').toLowerCase() === toHandle.toLowerCase()) ?? r.data[0];
            if (!candidate?.id) {
                throw new BadRequestException('User not found by handle');
              }
            return this.requestFriend(String(candidate.id));
          }
        throw new BadRequestException('Either userId or toHandle must be provided');
      }
}
