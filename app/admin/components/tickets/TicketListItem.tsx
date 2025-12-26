'use client';

import React from 'react';
import { Ticket, statusColors, statusLabels, categoryLabels } from './types';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';

interface TicketListItemProps {
  ticket: Ticket;
  isSelected: boolean;
  searchQuery: string;
  onSelect: (ticket: Ticket) => void;
  onViewProfile: (ticket: Ticket) => void;
}

export default function TicketListItem({
  ticket,
  isSelected,
  searchQuery,
  onSelect,
  onViewProfile
}: TicketListItemProps) {
  const highlightMatch = (text: string | undefined, query: string) => {
    if (!text || !query) return false;
    return text.toLowerCase().includes(query.toLowerCase());
  };

  return (
    <button
      onClick={() => {
        onSelect(ticket);
        fetchWithAuth(`/api/support/tickets/${ticket.id}/read`, { method: 'POST' });
      }}
      className={`w-full p-4 rounded-xl transition-all text-left ${
        ticket.status === 'in_progress' || ticket.status === 'open'
          ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
          : ticket.status === 'pending'
          ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
          : ticket.status === 'closed'
          ? 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
      } ${
        isSelected
          ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20'
          : 'border'
      }`}
    >
      {/* Код тикета, категория и статус */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            highlightMatch(ticket.id, searchQuery)
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 ring-2 ring-yellow-500/30'
              : 'bg-zinc-800/50 text-zinc-400 border-zinc-700'
          }`}>
            #{ticket.id.substring(0, 8)}
          </span>
          {ticket.category && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
              highlightMatch(categoryLabels[ticket.category as keyof typeof categoryLabels], searchQuery)
                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 ring-2 ring-yellow-500/30'
                : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
            }`}>
              {categoryLabels[ticket.category as keyof typeof categoryLabels] || ticket.category}
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
          statusColors[ticket.status as keyof typeof statusColors] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
        }`}>
          {statusLabels[ticket.status as keyof typeof statusLabels] || ticket.status || 'Неизвестно'}
        </span>
      </div>

      <div className="mb-2">
        <h3 className={`font-bold text-white text-sm line-clamp-1 ${
          highlightMatch(ticket.subject, searchQuery) ? 'bg-yellow-500/10 px-1 rounded' : ''
        }`}>
          {ticket.subject}
        </h3>
      </div>

      {/* Информация о пользователе */}
      <div className="flex items-center gap-2 mb-2">
        {ticket.user_avatar ? (
          <div 
            className="w-7 h-7 rounded-full bg-cover bg-center flex-shrink-0 border border-zinc-700"
            style={{ backgroundImage: `url(${ticket.user_avatar})` }}
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">
              {(ticket.user_nickname || ticket.user_email || 'U').charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-xs text-white font-medium truncate ${
            highlightMatch(ticket.user_nickname, searchQuery) || highlightMatch(ticket.user_email, searchQuery)
              ? 'bg-yellow-500/20 px-1 rounded'
              : ''
          }`}>
            {ticket.user_nickname || ticket.user_email?.split('@')[0] || 'Пользователь'}
          </p>
          {ticket.user_email && (
            <p className={`text-[10px] text-zinc-400 truncate ${
              highlightMatch(ticket.user_email, searchQuery) ? 'bg-yellow-500/20 px-1 rounded' : ''
            }`}>{ticket.user_email}</p>
          )}
          <UserRoleBadge role={ticket.user_role} size="small" />
        </div>
        
        {/* Кнопка просмотра профиля */}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onViewProfile(ticket);
          }}
          className="p-1.5 bg-[#6050ba]/20 hover:bg-[#6050ba]/40 border border-[#6050ba]/30 rounded-lg transition-all flex-shrink-0 cursor-pointer"
          title="Просмотреть профиль"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onViewProfile(ticket);
            }
          }}
        >
          <svg className="w-4 h-4 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-zinc-500">
          {ticket.ticket_messages?.length || 0} сообщений
        </span>
      </div>

      <div className="text-xs text-zinc-500">
        {new Date(ticket.created_at).toLocaleString('ru-RU')}
      </div>
    </button>
  );
}

// Компонент бейджа роли пользователя
export function UserRoleBadge({ role, size = 'normal' }: { role?: string; size?: 'small' | 'normal' }) {
  const sizeClasses = size === 'small' 
    ? 'text-[9px] px-1.5 py-0.5' 
    : 'text-[10px] px-2 py-0.5';

  const roleConfig: Record<string, { bg: string; label: string }> = {
    owner: { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'OWNER' },
    admin: { bg: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'ADMIN' },
    exclusive: { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'EXCLUSIVE' },
    basic: { bg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', label: 'BASIC' },
  };

  const config = roleConfig[role || 'basic'] || roleConfig.basic;

  return (
    <span className={`${sizeClasses} rounded-full font-bold inline-block mt-0.5 border ${config.bg}`}>
      {config.label}
    </span>
  );
}
