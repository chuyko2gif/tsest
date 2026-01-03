'use client';

import React from 'react';
import { Ticket, statusColors, statusLabels, categoryLabels } from '../types';
import TicketAvatar from '@/components/icons/TicketAvatar';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';

interface TicketListProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  onSelectTicket: (ticket: Ticket) => void;
  onViewProfile: (ticket: Ticket) => void;
  searchQuery: string;
}

export default function TicketList({
  tickets,
  selectedTicket,
  onSelectTicket,
  onViewProfile,
  searchQuery,
}: TicketListProps) {
  if (tickets.length === 0) {
    return (
      <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">
        <svg className="w-12 h-12 mx-auto text-zinc-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="text-zinc-500">Тикетов не найдено</p>
      </div>
    );
  }

  return (
    <>
      {tickets.map(ticket => (
        <TicketCard
          key={ticket.id}
          ticket={ticket}
          isSelected={selectedTicket?.id === ticket.id}
          onSelect={onSelectTicket}
          onViewProfile={onViewProfile}
          searchQuery={searchQuery}
        />
      ))}
    </>
  );
}

interface TicketCardProps {
  ticket: Ticket;
  isSelected: boolean;
  onSelect: (ticket: Ticket) => void;
  onViewProfile: (ticket: Ticket) => void;
  searchQuery: string;
}

function TicketCard({ ticket, isSelected, onSelect, onViewProfile, searchQuery }: TicketCardProps) {
  const handleSelect = () => {
    onSelect(ticket);
    fetchWithAuth(`/api/support/tickets/${ticket.id}/read`, { method: 'POST' });
  };

  const highlightClass = (text: string | undefined) => {
    if (!text || !searchQuery) return '';
    return text.toLowerCase().includes(searchQuery.toLowerCase()) 
      ? 'bg-yellow-500/20 px-1 rounded' 
      : '';
  };

  return (
    <button
      onClick={handleSelect}
      className={`w-full p-4 rounded-xl transition-all text-left ${
        ticket.status === 'in_progress' || ticket.status === 'open'
          ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
          : ticket.status === 'pending'
          ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
          : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
      } ${isSelected ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20' : 'border'}`}
    >
      {/* Код тикета, категория и статус */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
            searchQuery && ticket.id.toLowerCase().includes(searchQuery.toLowerCase())
              ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 ring-2 ring-yellow-500/30'
              : 'bg-zinc-800/50 text-zinc-400 border-zinc-700'
          }`}>
            #{ticket.id.substring(0, 8)}
          </span>
          {ticket.category && (
            <span className="text-[10px] px-2 py-0.5 rounded-full border bg-purple-500/20 text-purple-400 border-purple-500/30">
              {categoryLabels[ticket.category] || ticket.category}
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
          statusColors[ticket.status] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
        }`}>
          {statusLabels[ticket.status] || ticket.status || 'Неизвестно'}
        </span>
      </div>

      <div className="mb-2">
        <h3 className={`font-bold text-white text-sm line-clamp-1 ${highlightClass(ticket.subject)}`}>
          {ticket.subject}
        </h3>
      </div>

      {/* Информация о пользователе */}
      <div className="flex items-center gap-2 mb-2">
        <TicketAvatar
          src={ticket.user_avatar}
          name={ticket.user_nickname}
          email={ticket.user_email}
          size="sm"
          role={ticket.user_role}
        />
        <div className="flex-1 min-w-0">
          <p className={`text-xs text-white font-medium truncate ${highlightClass(ticket.user_nickname || ticket.user_email)}`}>
            {ticket.user_nickname || ticket.user_email?.split('@')[0] || 'Пользователь'}
          </p>
          {ticket.user_email && (
            <p className={`text-[10px] text-zinc-400 truncate ${highlightClass(ticket.user_email)}`}>
              {ticket.user_email}
            </p>
          )}
          <UserRoleBadge role={ticket.user_role} />
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

function UserRoleBadge({ role }: { role?: string }) {
  const config = {
    owner: { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'OWNER' },
    admin: { bg: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'ADMIN' },
    exclusive: { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'EXCLUSIVE' },
  }[role || ''] || { bg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', label: 'BASIC' };

  return (
    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold inline-block mt-0.5 border ${config.bg}`}>
      {config.label}
    </span>
  );
}
