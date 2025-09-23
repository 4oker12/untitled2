const BFF_URL = import.meta.env.VITE_BFF_URL || 'http://localhost:4000';

async function http(path: string, init?: RequestInit) {
  const resp = await fetch(`${BFF_URL}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  const json = await resp.json().catch(() => null);
  if (!resp.ok) throw new Error((json?.error?.code) || `HTTP_${resp.status}`);
  return json;
}

function ok<T>(r: any): T { return (r && typeof r === 'object' && 'data' in r) ? r.data as T : r as T; }

export const FriendsAPI = {
  async searchUsers(q: string) {
    const qs = q ? `?search=${encodeURIComponent(q.trim().toLowerCase())}` : '';
    const r = await http(`/users${qs}`, { method: 'GET' });
    return ok<any[]>(r);
  },
  async listFriends() {
    const r = await http('/friends', { method: 'GET' });
    return ok<any[]>(r);
  },
  async listRequests(type?: 'incoming'|'outgoing') {
    const qs = type ? `?type=${type}` : '';
    const r = await http(`/friends/requests${qs}`, { method: 'GET' });
    return ok<any[]>(r);
  },
  async sendRequest(toHandle: string) {
    const r = await http('/friends/requests', { method: 'POST', body: JSON.stringify({ toHandle: toHandle.trim().toLowerCase() }) });
    return ok<any>(r);
  },
  async acceptRequest(id: string) {
    const r = await http(`/friends/requests/${id}/accept`, { method: 'POST', body: JSON.stringify({}) });
    return ok<any>(r);
  },
  async declineRequest(id: string) {
    const r = await http(`/friends/requests/${id}/decline`, { method: 'POST', body: JSON.stringify({}) });
    return ok<any>(r);
  },
  async cancelRequest(id: string) {
    const r = await http(`/friends/requests/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) });
    return ok<any>(r);
  },
  async removeFriend(userId: string) {
    const r = await http(`/friends/${userId}`, { method: 'DELETE' });
    return ok<any>(r);
  },
};
