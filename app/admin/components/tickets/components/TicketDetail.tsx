'use client';

import React from 'react';
import TicketAvatar from '@/components/icons/TicketAvatar';
import { Ticket } from '../types';

interface TicketDetailProps {
  ticket: Ticket;
  onStatusChange: (ticketId: string, status: string) => void;
  onViewRelease: (release: any) => void;
}

export default function TicketDetail({ ticket, onStatusChange, onViewRelease }: TicketDetailProps) {
  return (
    <div className="p-4 border-b border-zinc-800">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg mb-2">{ticket.subject}</h3>
          
          {/* Информация о пользователе */}
          <div className="flex items-center gap-3 mb-2">
            <TicketAvatar
              src={ticket.user_avatar}
              name={ticket.user_nickname}
              email={ticket.user_email}
              size="md"
              role={ticket.user_role}
              showRing
            />
            <div className="flex-1">
              <p className="text-sm text-white font-medium">
                {ticket.user_nickname || ticket.user_email?.split('@')[0] || 'Пользователь'}
              </p>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                {ticket.user_email && <span>{ticket.user_email}</span>}
                {ticket.user_telegram && (
                  <>
                    <span>•</span>
                    <span>@{ticket.user_telegram}</span>
                  </>
                )}
              </div>
              <UserRoleBadge role={ticket.user_role} />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <select
            value={ticket.status}
            onChange={(e) => onStatusChange(ticket.id, e.target.value)}
            className="px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="open">Открыт</option>
            <option value="in_progress">В работе</option>
            <option value="pending">Ожидание</option>
            <option value="closed">Закрыт</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <span>ID: {ticket.id.slice(0, 8)}</span>
        <span>•</span>
        <span>Создан: {new Date(ticket.created_at).toLocaleString('ru-RU')}</span>
      </div>

      {/* Информация о релизе */}
      {ticket.release && (
        <ReleaseCard release={ticket.release} onClick={() => onViewRelease(ticket.release)} />
      )}
    </div>
  );
}

function UserRoleBadge({ role }: { role?: string }) {
  const config = {
    owner: { bg: 'bg-purple-500/20 text-purple-300 border-purple-500/30', label: 'OWNER' },
    admin: { bg: 'bg-red-500/20 text-red-300 border-red-500/30', label: 'ADMIN' },
    exclusive: { bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', label: 'EXCLUSIVE' },
  }[role || ''] || { bg: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', label: 'BASIC' };

  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block mt-1 border ${config.bg}`}>
      {config.label}
    </span>
  );
}

interface ReleaseCardProps {
  release: {
    id: string;
    artist: string;
    title: string;
    artwork_url?: string;
    status: string;
  };
  onClick: () => void;
}

function ReleaseCard({ release, onClick }: ReleaseCardProps) {
  const statusConfig: Record<string, { label: string; color: string; emoji: string }> = {
    pending: { label: 'На модерации', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', emoji: '⏳' },
    approved: { label: 'Одобрен', color: 'bg-green-500/20 text-green-300 border-green-500/40', emoji: '✅' },
    rejected: { label: 'Отклонен', color: 'bg-red-500/20 text-red-300 border-red-500/40', emoji: '❌' },
    published: { label: 'Опубликован', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', emoji: '🎵' },
  };

  const status = statusConfig[release.status] || { label: release.status, color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40', emoji: '📀' };

  return (
    <div 
      onClick={onClick}
      className="mt-2 p-2 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg cursor-pointer hover:border-purple-500/50 transition-all duration-200 group"
    >
      <div className="flex items-center gap-2.5">
        <div className="flex-shrink-0">
          {release.artwork_url ? (
            <img 
              src={release.artwork_url} 
              alt={release.title}
              className="w-12 h-12 rounded object-cover group-hover:shadow-lg group-hover:shadow-purple-500/30 transition-shadow"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-medium text-purple-400 mb-0.5">Релиз по теме</p>
              <h4 className="text-xs font-bold text-white truncate">{release.title}</h4>
              <p className="text-[10px] text-zinc-400 truncate">{release.artist}</p>
            </div>
            <div className="ml-2 text-purple-400 group-hover:text-purple-300 transition-colors flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          
          <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium border mt-0.5 ${status.color}`}>
            <span>{status.emoji}</span>
            <span>{status.label}</span>
          </span>
        </div>
      </div>
      <p className="mt-1 text-[9px] text-center text-purple-400/70 group-hover:text-purple-400 transition-colors">
        Нажмите для подробной информации
      </p>
    </div>
  );
}
