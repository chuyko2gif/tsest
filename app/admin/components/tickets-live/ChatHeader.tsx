'use client';

import { Ticket, getStatusColor, getStatusLabel } from './types';

interface ChatHeaderProps {
  ticket: Ticket;
  onChangeStatus: (status: string) => void;
}

export function ChatHeader({ ticket, onChangeStatus }: ChatHeaderProps) {
  return (
    <div className="p-4 bg-white/[0.05] border-b border-white/10">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {ticket.user?.avatar && (
            <div 
              className="w-12 h-12 rounded-xl bg-cover bg-center"
              style={{ backgroundImage: `url(${ticket.user.avatar})` }}
            />
          )}
          <div>
            <h2 className="font-bold">{ticket.user?.nickname || 'Пользователь'}</h2>
            <p className="text-xs text-zinc-500">{ticket.user?.email}</p>
            <p className="text-xs text-zinc-600">{ticket.subject}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {ticket.status !== 'closed' && (
            <button
              onClick={() => onChangeStatus('closed')}
              className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold transition"
            >
              Закрыть
            </button>
          )}
          {ticket.status === 'closed' && (
            <button
              onClick={() => onChangeStatus('open')}
              className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-xs font-bold transition"
            >
              Открыть
            </button>
          )}
        </div>
      </div>
      
      <div className="flex gap-2 text-xs">
        <span className={`px-2 py-1 rounded-lg border ${getStatusColor(ticket.status)}`}>
          {getStatusLabel(ticket.status)}
        </span>
        <span className="px-2 py-1 bg-zinc-500/10 text-zinc-400 rounded-lg">
          Создан {new Date(ticket.created_at).toLocaleDateString('ru-RU')}
        </span>
      </div>
    </div>
  );
}
