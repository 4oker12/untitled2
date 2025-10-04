import React from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { useSearchParams /*, useParams*/ } from 'react-router-dom';
import { UNREAD_SUMMARY, MESSAGES, FRIENDS } from '../api/queries';
import { SEND_MESSAGE, MARK_MESSAGE_READ } from '../api/mutations';

type Friend = { id: string; handle?: string | null; email?: string | null };

function useFriendsMap() {
    const { data } = useQuery(FRIENDS, { fetchPolicy: 'cache-first' });
    const list: Friend[] = data?.friendsSvc ?? data?.friends ?? [];
    return React.useMemo(() => {
        const m = new Map<string, Friend>();
        for (const f of list) m.set(f.id, f);
        return m;
    }, [list]);
}

export const MessagesPage: React.FC = () => {
    // можно читать userId из query-параметра: /messages?userId=...
    const [params, setParams] = useSearchParams();
    const selectedUserId = params.get('userId') ?? null;

    // слева — список диалогов по непрочитанным
    const { data: unreadData, refetch: refetchUnread } = useQuery(UNREAD_SUMMARY, {
        pollInterval: 15000,
        fetchPolicy: 'cache-and-network',
    });
    const byUser = unreadData?.unreadSummary?.byUser ?? [];

    // друзья (для меток)
    const friendsMap = useFriendsMap();

    // сообщения с выбранным пользователем
    const { data: msgsData, refetch: refetchMsgs } = useQuery(MESSAGES, {
        variables: selectedUserId ? { input: { withUserId: selectedUserId, take: 50 } } : undefined,
        skip: !selectedUserId,
        fetchPolicy: 'cache-and-network',
        pollInterval: selectedUserId ? 8000 : undefined,
    });
    const messages = msgsData?.messages ?? [];

    const [sendMessage, { loading: sending }] = useMutation(SEND_MESSAGE);
    const [markRead] = useMutation(MARK_MESSAGE_READ);

    const [text, setText] = React.useState('');

    // если userId не выбран — авто-выбор первого из непрочитанных
    React.useEffect(() => {
        if (!selectedUserId && byUser.length > 0) {
            setParams({ userId: byUser[0].userId }, { replace: true });
        }
    }, [selectedUserId, byUser, setParams]);

    // отметить непрочитанные как прочитанные (по кнопке)
    const onMarkAllRead = async () => {
        if (!messages.length) return;
        const unread = messages.filter((m: any) => !m.readAt); // простая эвристика
        for (const m of unread) {
            try { await markRead({ variables: { id: m.id } }); } catch {}
        }
        await Promise.all([refetchMsgs(), refetchUnread()]);
    };

    const onSend = async () => {
        if (!selectedUserId) return;
        const body = text.trim();
        if (!body) return;
        try {
            await sendMessage({ variables: { input: { toUserId: selectedUserId, body } } });
            setText('');
            await Promise.all([refetchMsgs(), refetchUnread()]);
            // авто-скролл вниз
            const el = document.getElementById('chat-scroll-anchor');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
        } catch (e: any) {
            alert(e?.message || 'Не удалось отправить');
        }
    };

    const dialogItems: { userId: string; count: number }[] = React.useMemo(() => {
        // по MVP показываем только тех, у кого есть непрочитанные
        // (можно расширить: показать всех друзей, а у кого 0 — без бейджа)
        return Array.isArray(byUser) ? byUser : [];
    }, [byUser]);

    return (
        <div className="max-w-5xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ЛЕВО: список диалогов */}
            <aside className="md:col-span-1">
                <div className="bg-white border rounded-lg overflow-hidden">
                    <div className="px-3 py-2 border-b font-semibold">Диалоги</div>
                    <ul className="max-h-[70vh] overflow-auto">
                        {dialogItems.length === 0 && (
                            <li className="p-3 text-sm text-gray-500">Новых сообщений пока нет</li>
                        )}
                        {dialogItems.map(({ userId, count }) => {
                            const f = friendsMap.get(userId);
                            const label = f?.handle || f?.email || userId;
                            const active = selectedUserId === userId;
                            return (
                                <li
                                    key={userId}
                                    className={`p-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 ${active ? 'bg-blue-50' : ''}`}
                                    onClick={() => setParams({ userId })}
                                >
                                    <div className="truncate">{label}</div>
                                    {count > 0 && (
                                        <span className="ml-2 text-xs bg-red-600 text-white rounded px-1.5">{count}</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </aside>

            {/* ПРАВО: чат */}
            <section className="md:col-span-2">
                {!selectedUserId ? (
                    <div className="text-gray-500">Выберите диалог слева</div>
                ) : (
                    <div className="bg-white border rounded-lg flex flex-col h-[75vh]">
                        {/* заголовок */}
                        <div className="px-3 py-2 border-b flex items-center justify-between">
                            <div className="font-semibold">
                                {(friendsMap.get(selectedUserId)?.handle ||
                                    friendsMap.get(selectedUserId)?.email ||
                                    selectedUserId)}
                            </div>
                            <button
                                onClick={onMarkAllRead}
                                className="text-sm text-blue-600 hover:underline"
                                disabled={!messages?.some((m: any) => !m.readAt)}
                            >
                                Отметить прочитанными
                            </button>
                        </div>

                        {/* сообщения */}
                        <div className="flex-1 overflow-auto p-3 space-y-2">
                            {messages.map((m: any) => {
                                const incoming = m.fromUserId === selectedUserId; // если пишет собеседник
                                return (
                                    <div
                                        key={m.id}
                                        className={`max-w-[80%] rounded-lg px-3 py-2 ${incoming ? 'bg-gray-100 self-start' : 'bg-blue-600 text-white self-end ml-auto'}`}
                                    >
                                        <div className="whitespace-pre-wrap break-words">{m.body}</div>
                                        <div className={`mt-1 text-[10px] opacity-70 ${incoming ? '' : 'text-white'}`}>
                                            {new Date(m.createdAt).toLocaleString()}
                                            {m.readAt && !incoming ? ' · прочитано' : ''}
                                        </div>
                                    </div>
                                );
                            })}
                            <div id="chat-scroll-anchor" />
                        </div>

                        {/* ввод */}
                        <div className="p-3 border-t flex gap-2">
              <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Напишите сообщение…"
                  className="flex-1 border rounded-md p-2 min-h-[44px] max-h-[120px]"
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          onSend();
                      }
                  }}
              />
                            <button
                                onClick={onSend}
                                disabled={!text.trim() || sending}
                                className="px-3 py-2 rounded-md bg-blue-600 text-white disabled:opacity-50 h-[44px]"
                            >
                                {sending ? '...' : 'Отправить'}
                            </button>
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
};
