// components/MessageModal.tsx
import React from 'react';
import { useMutation } from '@apollo/client';
import { SEND_MESSAGE } from '../api/mutations';

type Friend = { id: string; handle?: string | null; email?: string | null };

interface Props {
    open: boolean;
    onClose: () => void;
    to: Friend | null;
}

export const MessageModal: React.FC<Props> = ({ open, onClose, to }) => {
    const [text, setText] = React.useState('');
    const [send, { loading }] = useMutation(SEND_MESSAGE);

    React.useEffect(() => {
        if (open) setText('');
    }, [open]);

    if (!open || !to) return null;

    const label = to.handle || to.email || to.id;

    const onSend = async () => {
        const body = text.trim();
        if (!body) return;
        try {
            await send({ variables: { input: { toUserId: to.id, body } } });
            onClose();
        } catch (e: any) {
            alert(e?.message || 'Не удалось отправить сообщение');
        }
    };

    // простая модалка на Tailwind — без внешних зависимостей
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative w-full max-w-md bg-white rounded-xl shadow-lg p-4">
                <div className="mb-3">
                    <div className="text-sm text-gray-500">Сообщение для</div>
                    <div className="font-semibold">{label}</div>
                </div>

                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Напишите что-нибудь…"
                    className="w-full min-h-[120px] border rounded-lg p-3 focus:outline-none focus:ring"
                    maxLength={2000}
                />

                <div className="mt-3 flex items-center justify-between text-sm text-gray-500">
                    <div>{text.length}/2000</div>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 rounded border bg-white hover:bg-gray-50"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={onSend}
                            disabled={!text.trim() || loading}
                            className="px-3 py-1.5 rounded bg-blue-600 text-white disabled:opacity-50"
                        >
                            {loading ? 'Отправка…' : 'Отправить'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
