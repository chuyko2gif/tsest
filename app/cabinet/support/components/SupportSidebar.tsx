'use client';
import React from 'react';
import Link from 'next/link';
import { TicketStatus } from '../types';

interface SupportSidebarProps {
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  filterStatus: TicketStatus;
  setFilterStatus: (status: TicketStatus) => void;
  notifications: boolean;
  setNotifications: (enabled: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  onNewTicket: () => void;
}

export default function SupportSidebar({
  showSettings,
  setShowSettings,
  filterStatus,
  setFilterStatus,
  notifications,
  setNotifications,
  soundEnabled,
  setSoundEnabled,
  onNewTicket,
}: SupportSidebarProps) {
  const filters: { id: TicketStatus; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'open', label: 'Открытые' },
    { id: 'answered', label: 'Отвеченные' },
    { id: 'closed', label: 'Закрытые' },
  ];

  return (
    <div className={`fixed lg:relative z-50 h-full bg-[#0d0d12] border-r border-white/10 transition-all duration-300 ${
      showSettings ? 'w-64' : 'w-16'
    }`}>
      <div className="p-4 space-y-4">
        {/* Toggle */}
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center justify-center"
          title={showSettings ? 'Скрыть' : 'Показать меню'}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {showSettings && (
          <>
            {/* Назад в кабинет */}
            <Link
              href="/cabinet"
              className="w-full p-3 bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-bold">Кабинет</span>
            </Link>

            {/* Новый тикет */}
            <button
              onClick={onNewTicket}
              className="w-full p-3 bg-gradient-to-r from-[#6050ba] to-[#8b5cf6] hover:from-[#7060ca] hover:to-[#9d8df1] rounded-xl transition flex items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-bold">Новый</span>
            </button>

            {/* Фильтры */}
            <div className="space-y-2">
              <p className="text-xs text-zinc-500 uppercase tracking-wider px-2">Фильтры</p>
              {filters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterStatus(filter.id)}
                  className={`w-full p-2 rounded-lg text-left text-sm transition ${
                    filterStatus === filter.id
                      ? 'bg-[#6050ba]/20 text-[#9d8df1]'
                      : 'text-zinc-400 hover:bg-white/5'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Настройки */}
            <div className="space-y-2 pt-4 border-t border-white/10">
              <p className="text-xs text-zinc-500 uppercase tracking-wider px-2">Настройки</p>
              
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <span className="text-sm text-zinc-400">Уведомления</span>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                  className="w-4 h-4 accent-[#6050ba]"
                />
              </label>
              
              <label className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer">
                <span className="text-sm text-zinc-400">Звук</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#6050ba]"
                />
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
