'use client';

import React from 'react';
import { TicketFilter } from '../types';

interface TicketsHeaderProps {
  totalCount: number;
  activeCount: number;
  filter: TicketFilter;
  setFilter: (filter: TicketFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function TicketsHeader({
  totalCount,
  activeCount,
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  loading,
  onRefresh,
}: TicketsHeaderProps) {
  const filters: { id: TicketFilter; label: string }[] = [
    { id: 'all', label: 'Все' },
    { id: 'in_progress', label: 'В работе' },
    { id: 'pending', label: 'Ожидание' },
    { id: 'closed', label: 'Закрытые' },
  ];

  return (
    <>
      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white text-center lg:text-left">
            Тикеты поддержки
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            {totalCount} тикетов • {activeCount} активных
          </p>
        </div>

        {/* Поиск и кнопка обновления */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial sm:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск..."
              className="w-full px-4 py-2 pl-10 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <button
            onClick={onRefresh}
            disabled={loading}
            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Обновить тикеты"
          >
            <svg className={`w-5 h-5 text-zinc-400 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div>
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                filter === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
