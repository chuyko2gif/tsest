'use client';

import { Ticket, getStatusColor, getStatusLabel } from './types';

interface TicketListProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  loading: boolean;
  onSelectTicket: (ticket: Ticket) => void;
}

export function TicketList({ tickets, selectedTicket, loading, onSelectTicket }: TicketListProps) {
  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Загрузка...</div>;
  }

  if (tickets.length === 0) {
    return <div className="p-8 text-center text-zinc-500">Нет тикетов</div>;
  }

  return (
    <div className="space-y-2">
      {tickets.map(ticket => (
        <div
          key={ticket.id}
          onClick={() => onSelectTicket(ticket)}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            selectedTicket?.id === ticket.id
              ? 'bg-[#6050ba]/20 border-[#6050ba]/50'
              : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
          }`}
        >
          <div className="flex items-start gap-3 mb-2">
            {ticket.user?.avatar && (
              <div 
                className="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0"
                style={{ backgroundImage: `url(${ticket.user.avatar})` }}
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-bold text-sm truncate">{ticket.user?.nickname || 'Пользователь'}</h3>
                {ticket.unread_count > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">
                    {ticket.unread_count}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 truncate">{ticket.subject}</p>
            </div>
          </div>
          
          {ticket.last_message_preview && (
            <p className="text-xs text-zinc-600 truncate mb-2">{ticket.last_message_preview}</p>
          )}
          
          <div className="flex items-center justify-between">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(ticket.status)}`}>
              {getStatusLabel(ticket.status)}
            </span>
            <span className="text-[10px] text-zinc-600">
              {new Date(ticket.last_message_at || ticket.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
