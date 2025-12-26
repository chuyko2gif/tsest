'use client';
import React from 'react';
import { Ticket } from '../types';
import { getStatusColor, getStatusLabel } from '../utils';

interface TicketListItemProps {
  ticket: Ticket;
  isSelected: boolean;
  onSelect: (ticket: Ticket) => void;
}

export default function TicketListItem({ ticket, isSelected, onSelect }: TicketListItemProps) {
  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Вчера';
    } else if (days < 7) {
      return d.toLocaleDateString('ru-RU', { weekday: 'short' });
    } else {
      return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <button
      onClick={() => onSelect(ticket)}
      className={`w-full p-4 rounded-xl text-left transition-all ${
        isSelected
          ? 'bg-[#6050ba]/20 border-[#6050ba]/50'
          : 'bg-white/5 hover:bg-white/10 border-white/10'
      } border`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm truncate flex-1">{ticket.subject}</h3>
        {ticket.unread_count > 0 && (
          <span className="px-2 py-0.5 bg-[#6050ba] text-white text-xs rounded-full font-bold">
            {ticket.unread_count}
          </span>
        )}
      </div>
      
      <p className="text-xs text-zinc-500 truncate mb-2">
        {ticket.last_message_preview || 'Нет сообщений'}
      </p>
      
      <div className="flex items-center justify-between">
        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(ticket.status)}`}>
          {getStatusLabel(ticket.status)}
        </span>
        <span className="text-[10px] text-zinc-600">
          {formatDate(ticket.last_message_at || ticket.created_at)}
        </span>
      </div>
      
      {ticket.is_typing && (
        <div className="mt-2 flex items-center gap-1">
          <div className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-[#6050ba] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 bg-[#6050ba] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 bg-[#6050ba] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-[10px] text-[#9d8df1]">печатает...</span>
        </div>
      )}
    </button>
  );
}
