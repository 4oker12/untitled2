// src/api/friends.ts
// CHANGED: заполнил все методы; унифицировал распаковку { data }; улучшил сообщения об ошибках

const BFF_URL = (import.meta.env.VITE_BFF_URL as string) || 'http://localhost:4000';

async function http(path: string, init?: RequestInit) {
  const resp = await fetch(`${BFF_URL}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  let json: any = null;
  try { json = await resp.json(); } catch {}
  if (!resp.ok) {
    const msg =
        json?.message ||
        json?.error?.message ||
        json?.error?.code ||
        `HTTP_${resp.status}`;
    throw new Error(msg);
  }
  return json;
}

function ok<T>(r: any): T {
  return r && typeof r === 'object' && 'data' in r ? (r.data as T) : (r as T);
}

export type PublicUser = { id: string; email: string | null; name?: string | null; role?: string; handle?: string | null };
export type FriendRequest = {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELED';
  from?: PublicUser; to?: PublicUser;
  createdAt?: string; updatedAt?: string;
};

export const FriendsAPI = {
  // список друзей
  async listFriends(): Promise<PublicUser[]> {
    const r = await http(`/friends`, { method: 'GET' });
    return ok<PublicUser[]>(r);
  },

  // список заявок: incoming|outgoing
  async listRequests(type: 'incoming' | 'outgoing'): Promise<FriendRequest[]> {
    const r = await http(`/friends/requests?type=${encodeURIComponent(type)}`, { method: 'GET' });
    return ok<FriendRequest[]>(r);
  },

  // поиск пользователей
  async searchUsers(q: string): Promise<PublicUser[]> {
    const r = await http(`/friends/search/users?q=${encodeURIComponent(q)}`, { method: 'GET' });
    return ok<PublicUser[]>(r);
  },

  // отправить заявку по handle
  async sendRequest(toHandle: string): Promise<FriendRequest> {
    const body = { toHandle: String(toHandle || '').trim().toLowerCase() }; // CHANGED: нормализация
    const r = await http(`/friends/requests`, { method: 'POST', body: JSON.stringify(body) });
    return ok<FriendRequest>(r);
  },

  // принять/отклонить/отменить
  async acceptRequest(id: string): Promise<FriendRequest> {
    const r = await http(`/friends/requests/${id}/accept`, { method: 'POST', body: JSON.stringify({}) });
    return ok<FriendRequest>(r);
  },
  async declineRequest(id: string): Promise<FriendRequest> {
    const r = await http(`/friends/requests/${id}/decline`, { method: 'POST', body: JSON.stringify({}) });
    return ok<FriendRequest>(r);
  },
  async cancelRequest(id: string): Promise<FriendRequest> {
    const r = await http(`/friends/requests/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) });
    return ok<FriendRequest>(r);
  },

  // удалить из друзей
  async removeFriend(userId: string): Promise<boolean> {
    const r = await http(`/friends/${userId}`, { method: 'DELETE' });
    const val = ok<any>(r);
    return val === true || val?.data === true;
  },
};
