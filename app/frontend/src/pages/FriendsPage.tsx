import React, { useEffect, useMemo, useState } from 'react';
import { FriendsAPI } from '../api/friends';

function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reload = React.useCallback(async () => {
    setLoading(true); setError(null);
    try { const r = await fn(); setData(r as any); } catch (e: any) { setError(e?.message || 'Error'); } finally { setLoading(false); }
  }, deps);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload } as const;
}

export const FriendsPage: React.FC = () => {
  const [tab, setTab] = useState<'search'|'requests'|'friends'>('search');
  const [rqTab, setRqTab] = useState<'incoming'|'outgoing'>('incoming');
  const [q, setQ] = useState('');

  const friends = useAsync(() => FriendsAPI.listFriends(), []);
  const incoming = useAsync(() => FriendsAPI.listRequests('incoming'), []);
  const outgoing = useAsync(() => FriendsAPI.listRequests('outgoing'), []);

  const [searchRes, setSearchRes] = useState<any[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const doSearch = async () => {
    const qq = q.trim().toLowerCase();
    if (qq.length < 2) { setSearchRes([]); return; }
    setSearchLoading(true); setSearchError(null);
    try { const r = await FriendsAPI.searchUsers(qq); setSearchRes(r); } catch (e: any) { setSearchError(e?.message || 'Error'); } finally { setSearchLoading(false); }
  };

  useEffect(() => { const t = setTimeout(doSearch, 300); return () => clearTimeout(t); }, [q]);

  const onAdd = async (handle: string) => {
    try { await FriendsAPI.sendRequest(handle); alert('Request sent'); outgoing.reload(); } catch (e: any) { alert(`Error: ${e.message}`); }
  };
  const onAccept = async (id: string) => { try { await FriendsAPI.acceptRequest(id); alert('Accepted'); incoming.reload(); friends.reload(); } catch (e: any) { alert(`Error: ${e.message}`);} };
  const onDecline = async (id: string) => { try { await FriendsAPI.declineRequest(id); alert('Declined'); incoming.reload(); } catch (e: any) { alert(`Error: ${e.message}`);} };
  const onCancel = async (id: string) => { try { await FriendsAPI.cancelRequest(id); alert('Canceled'); outgoing.reload(); } catch (e: any) { alert(`Error: ${e.message}`);} };
  const onRemove = async (userId: string) => { try { await FriendsAPI.removeFriend(userId); alert('Removed'); friends.reload(); } catch (e: any) { alert(`Error: ${e.message}`);} };

  const TabButton: React.FC<{active:boolean; onClick:()=>void; children: React.ReactNode}> = ({active, onClick, children}) => (
    <button onClick={onClick} className={(active?'bg-blue-600 text-white':'bg-white text-gray-700') + ' px-3 py-1 rounded border'}>{children}</button>
  );

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Friends</h1>
      <div className="flex gap-2 mb-4">
        <TabButton active={tab==='search'} onClick={()=>setTab('search')}>Search</TabButton>
        <TabButton active={tab==='requests'} onClick={()=>setTab('requests')}>Requests</TabButton>
        <TabButton active={tab==='friends'} onClick={()=>setTab('friends')}>Friends</TabButton>
      </div>

      {tab==='search' && (
        <div>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by handle" className="border rounded px-3 py-2 w-full" />
          {searchLoading && <p className="mt-2 text-sm text-gray-500">Loading…</p>}
          {searchError && <p className="mt-2 text-sm text-red-600">{searchError}</p>}
          {searchRes && searchRes.length===0 && <p className="mt-2 text-sm text-gray-500">No users</p>}
          <ul className="divide-y mt-3 bg-white rounded border">
            {(searchRes||[]).map(u => (
              <li key={u.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{u.handle || u.email}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </div>
                <button onClick={()=>onAdd(u.handle)} className="text-sm text-blue-600">Add friend</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab==='requests' && (
        <div>
          <div className="flex gap-2 mb-3">
            <TabButton active={rqTab==='incoming'} onClick={()=>setRqTab('incoming')}>Incoming</TabButton>
            <TabButton active={rqTab==='outgoing'} onClick={()=>setRqTab('outgoing')}>Outgoing</TabButton>
          </div>
          {rqTab==='incoming' ? (
            <section>
              {incoming.loading && <p>Loading…</p>}
              {incoming.error && <p className="text-red-600">{incoming.error}</p>}
              {incoming.data && incoming.data.length===0 && <p className="text-gray-500">No incoming requests</p>}
              <ul className="divide-y bg-white rounded border">
                {(incoming.data||[]).map((r:any)=> (
                  <li key={r.id} className="p-3 flex items-center justify-between">
                    <div className="text-sm">From: <span className="font-medium">{r.from?.handle || r.fromId}</span></div>
                    <div className="flex gap-2">
                      <button className="text-green-600" onClick={()=>onAccept(r.id)}>Accept</button>
                      <button className="text-red-600" onClick={()=>onDecline(r.id)}>Decline</button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <section>
              {outgoing.loading && <p>Loading…</p>}
              {outgoing.error && <p className="text-red-600">{outgoing.error}</p>}
              {outgoing.data && outgoing.data.length===0 && <p className="text-gray-500">No outgoing requests</p>}
              <ul className="divide-y bg-white rounded border">
                {(outgoing.data||[]).map((r:any)=> (
                  <li key={r.id} className="p-3 flex items-center justify-between">
                    <div className="text-sm">To: <span className="font-medium">{r.to?.handle || r.toId}</span></div>
                    <button className="text-orange-600" onClick={()=>onCancel(r.id)}>Cancel</button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {tab==='friends' && (
        <section>
          {friends.loading && <p>Loading…</p>}
          {friends.error && <p className="text-red-600">{friends.error}</p>}
          {friends.data && friends.data.length===0 && <p className="text-gray-500">You have no friends yet</p>}
          <ul className="divide-y bg-white rounded border">
            {(friends.data||[]).map((f:any)=> (
              <li key={f.id} className="p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{f.handle || f.email}</div>
                  <div className="text-sm text-gray-500">{f.email}</div>
                </div>
                <button className="text-red-600" onClick={()=>onRemove(f.id)}>Remove</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
