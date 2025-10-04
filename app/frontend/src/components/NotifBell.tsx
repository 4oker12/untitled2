import React from 'react';
import { useQuery } from '@apollo/client';
import { UNREAD_SUMMARY } from '../api/queries';

export const NotifBell: React.FC = () => {
    const { data } = useQuery(UNREAD_SUMMARY, {
        pollInterval: 15000,            // опрос каждые 15 сек
        fetchPolicy: 'cache-and-network'
    });

    const total = data?.unreadSummary?.total ?? 0;

    return (
        <button
            type="button"
            className="relative inline-flex items-center justify-center"
            aria-label={`Непрочитанных: ${total}`}
            title={total > 0 ? `Непрочитанных: ${total}` : 'Нет новых сообщений'}
        >
            <span style={{ fontSize: 20, lineHeight: 1 }}>🔔</span>
            {total > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-[1px]">
          {total}
        </span>
            )}
        </button>
    );
};
