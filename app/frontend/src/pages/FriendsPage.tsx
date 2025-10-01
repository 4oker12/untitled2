import React from 'react';
import { useLazyQuery, useMutation, useQuery } from '@apollo/client';
import { FRIENDS, FRIEND_REQUESTS, SEARCH_USERS } from '../api/queries';
import {
  ACCEPT_FRIEND_REQUEST,
  CANCEL_FRIEND_REQUEST,
  DECLINE_FRIEND_REQUEST,
  SEND_FRIEND_REQUEST,
} from '../api/mutations';

type Dir = 'incoming' | 'outgoing';

function useDebounced<T extends any[]>(fn: (...args: T) => void, ms = 300) {
  const ref = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: T) => {
    if (ref.current) clearTimeout(ref.current);
    ref.current = setTimeout(() => fn(...args), ms);
  };
}

export const FriendsPage: React.FC = () => {
  const [tab, setTab] = React.useState<'search' | 'requests' | 'friends'>('search');
  const [rqTab, setRqTab] = React.useState<Dir>('incoming');
  const [q, setQ] = React.useState('');
  const [busyKey, setBusyKey] = React.useState<string | null>(null);

  // Список друзей
  const friendsQ = useQuery(FRIENDS, { fetchPolicy: 'cache-and-network' });

  // Заявки с переключением направления
  const reqQ = useQuery(FRIEND_REQUESTS, {
    variables: { direction: rqTab },
    fetchPolicy: 'cache-and-network',
  });

  // Поиск
  const [runSearch, searchQ] = useLazyQuery(SEARCH_USERS, { fetchPolicy: 'network-only' });
  const debouncedSearch = useDebounced((value: string) => {
    const v = value.trim().toLowerCase();
    if (v.length < 2) return;
    runSearch({ variables: { q: v } });
  }, 300);

  React.useEffect(() => {
    if (tab === 'search') debouncedSearch(q);
  }, [q, tab]);

  // Мутации
  const [sendReq]    = useMutation(SEND_FRIEND_REQUEST);
  const [acceptReq]  = useMutation(ACCEPT_FRIEND_REQUEST);
  const [declineReq] = useMutation(DECLINE_FRIEND_REQUEST);
  const [cancelReq]  = useMutation(CANCEL_FRIEND_REQUEST);

  const refetchAll = async () => {
    await Promise.allSettled([
      friendsQ.refetch(),
      reqQ.refetch({ direction: rqTab }),
    ]);
  };

  const isPending = (r: any) =>
      (r?.status || '').toUpperCase() === 'PENDING' || (r?.status || '').toUpperCase() === 'REQUESTED';

  const onSend = async (handle?: string | null) => {
    const h = (handle || '').trim().toLowerCase();
    if (!h) return alert('Введите handle');
    setBusyKey('send:' + h);
    try {
      await sendReq({
        variables: { input: { toHandle: h } },
        refetchQueries: [{ query: FRIEND_REQUESTS, variables: { direction: 'outgoing' } }],
      });
      if (rqTab === 'outgoing') await reqQ.refetch({ direction: 'outgoing' });
      alert('Заявка отправлена');
    } catch (e: any) {
      alert(e?.message || 'Ошибка');
    } finally {
      setBusyKey(null);
    }
  };

  const onAccept = async (id: string) => {
    setBusyKey('accept:' + id);
    try {
      await acceptReq({
        variables: { id },
        refetchQueries: [
          { query: FRIEND_REQUESTS, variables: { direction: 'incoming' } },
          { query: FRIENDS },
        ],
      });
    } catch (e: any) {
      alert(e?.message || 'Ошибка');
    } finally {
      setBusyKey(null);
    }
  };

  const onDecline = async (id: string) => {
    setBusyKey('decline:' + id);
    try {
      await declineReq({
        variables: { id },
        refetchQueries: [{ query: FRIEND_REQUESTS, variables: { direction: 'incoming' } }],
      });
    } catch (e: any) {
      alert(e?.message || 'Ошибка');
    } finally {
      setBusyKey(null);
    }
  };

  const onCancel = async (id: string) => {
    // CHANGED: дополнительная защита — отменяем только на вкладке исходящих
    if (rqTab !== 'outgoing') {
      alert('Отменить можно только исходящие заявки');
      return;
    }
    setBusyKey('cancel:' + id);
    try {
      await cancelReq({
        variables: { id },
        refetchQueries: [{ query: FRIEND_REQUESTS, variables: { direction: 'outgoing' } }],
      });
    } catch (e: any) {
      alert(e?.message || 'Ошибка');
    } finally {
      setBusyKey(null);
    }
  };

  const onRemove = async (userId: string) => {
    alert('Удаление друга добавим отдельной мутацией (removeFriend) при необходимости.');
  };

  const TabBtn: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({ active, onClick, children }) => (
      <button onClick={onClick} className={(active ? 'bg-blue-600 text-white' : 'bg-white text-gray-700') + ' px-3 py-1 rounded border'}>
        {children}
      </button>
  );

  return (
      <div className="max-w-3xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-4">Friends</h1>

        <div className="flex gap-2 mb-4">
          <TabBtn active={tab === 'search'} onClick={() => setTab('search')}>Search</TabBtn>
          <TabBtn active={tab === 'requests'} onClick={() => setTab('requests')}>Requests</TabBtn>
          <TabBtn active={tab === 'friends'} onClick={() => setTab('friends')}>Friends</TabBtn>
        </div>

        {tab === 'search' && (
            <section>
              <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by handle"
                  className="border rounded px-3 py-2 w-full"
              />
              {searchQ.loading && <p className="mt-2 text-sm text-gray-500">Loading…</p>}
              {searchQ.error && <p className="mt-2 text-sm text-red-600">{searchQ.error.message}</p>}
              <ul className="divide-y mt-3 bg-white rounded border">
                {(searchQ.data?.searchUsers ?? []).map((u: any) => (
                    <li key={u.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{u.handle || u.email}</div>
                        <div className="text-sm text-gray-500">{u.email}</div>
                      </div>
                      <button
                          onClick={() => onSend(u.handle)}
                          disabled={!u.handle || busyKey === 'send:' + u.handle}
                          className="text-sm text-blue-600 disabled:opacity-50"
                      >
                        {busyKey === 'send:' + u.handle ? 'Sending…' : 'Add friend'}
                      </button>
                    </li>
                ))}
              </ul>
            </section>
        )}

        {tab === 'requests' && (
            <section>
              <div className="flex gap-2 mb-3">
                <TabBtn active={rqTab === 'incoming'} onClick={() => setRqTab('incoming')}>Incoming</TabBtn>
                <TabBtn active={rqTab === 'outgoing'} onClick={() => setRqTab('outgoing')}>Outgoing</TabBtn>
              </div>

              {reqQ.loading && <p>Loading…</p>}
              {reqQ.error && <p className="text-red-600">{reqQ.error.message}</p>}

              <ul className="divide-y bg-white rounded border">
                {(reqQ.data?.friendRequests ?? []).map((r: any) => {
                  const pending = isPending(r); // CHANGED: показываем кнопки только если PENDING
                  return (
                      <li key={r.id} className="p-3 flex items-center justify-between">
                        <div className="text-sm">
                          {rqTab === 'incoming' ? (
                              <>From: <span className="font-medium">{r.from?.handle || r.from?.email}</span></>
                          ) : (
                              <>To: <span className="font-medium">{r.to?.handle || r.to?.email}</span></>
                          )}
                          {/* CHANGED: отображаем статус для не pending */}
                          {!pending && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                        {String(r.status || '').toUpperCase()}
                      </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          {rqTab === 'incoming' ? (
                              pending ? (
                                  <>
                                    <button
                                        className="text-green-600 disabled:opacity-50"
                                        disabled={busyKey === 'accept:' + r.id}
                                        onClick={() => onAccept(r.id)}
                                    >
                                      {busyKey === 'accept:' + r.id ? 'Accepting…' : 'Accept'}
                                    </button>
                                    <button
                                        className="text-red-600 disabled:opacity-50"
                                        disabled={busyKey === 'decline:' + r.id}
                                        onClick={() => onDecline(r.id)}
                                    >
                                      {busyKey === 'decline:' + r.id ? 'Declining…' : 'Decline'}
                                    </button>
                                  </>
                              ) : null
                          ) : (
                              pending ? (
                                  <button
                                      className="text-orange-600 disabled:opacity-50"
                                      disabled={busyKey === 'cancel:' + r.id}
                                      onClick={() => onCancel(r.id)}
                                  >
                                    {busyKey === 'cancel:' + r.id ? 'Cancelling…' : 'Cancel'}
                                  </button>
                              ) : null
                          )}
                        </div>
                      </li>
                  );
                })}
              </ul>
            </section>
        )}

        {tab === 'friends' && (
            <section>
              {friendsQ.loading && <p>Loading…</p>}
              {friendsQ.error && <p className="text-red-600">{friendsQ.error.message}</p>}
              <ul className="divide-y bg-white rounded border">
                {(friendsQ.data?.friendsSvc ?? []).map((f: any) => (
                    <li key={f.id} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{f.handle || f.email}</div>
                        <div className="text-sm text-gray-500">{f.email}</div>
                      </div>
                      <button className="text-red-600" onClick={() => onRemove(f.id)}>Remove</button>
                    </li>
                ))}
              </ul>
            </section>
        )}
      </div>
  );
};
