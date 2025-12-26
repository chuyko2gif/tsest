'use client';
import React from 'react';

interface TicketCardProps {
  ticket: any;
  onClick: () => void;
}

const statusColors = {
  open: 'bg-green-500/20 text-green-400 border-green-500/30',
  in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  closed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
};

const statusLabels = {
  open: 'Открыт',
  in_progress: 'В работе',
  pending: 'Ожидание',
  closed: 'Закрыт'
};

const categoryLabels: Record<string, string> = {
  general: 'Общий вопрос',
  problem: 'Проблема',
  payout: 'Выплаты',
  account: 'Аккаунт',
  releases: 'Релизы',
  other: 'Другое'
};

export default function TicketCard({ ticket, onClick }: TicketCardProps) {
  const hasUnread = ticket.unread_count > 0;

  return (
    <div
      onClick={onClick}
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        hasUnread
          ? 'bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20'
          : 'bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-white flex-1 line-clamp-1">
          {ticket.subject}
        </h3>
        {hasUnread && (
          <span className="flex-shrink-0 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {ticket.unread_count}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
          statusColors[ticket.status as keyof typeof statusColors] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
        }`}>
          {statusLabels[ticket.status as keyof typeof statusLabels] || ticket.status}
        </span>
        
        {ticket.category && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {categoryLabels[ticket.category] || ticket.category}
          </span>
        )}

        <span className="text-[10px] text-zinc-500">
          #{ticket.id.slice(0, 8)}
        </span>
        
        <span className="text-[10px] text-zinc-500 ml-auto">
          {new Date(ticket.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
}

export { statusColors, statusLabels, categoryLabels };
