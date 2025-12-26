'use client';
import React from 'react';
import { Ticket } from '../types';
import TicketListItem from './TicketListItem';

interface TicketListProps {
  tickets: Ticket[];
  selectedTicket: Ticket | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectTicket: (ticket: Ticket) => void;
}

export default function TicketList({
  tickets,
  selectedTicket,
  searchQuery,
  setSearchQuery,
  onSelectTicket,
}: TicketListProps) {
  return (
    <div className="w-full lg:w-80 flex-shrink-0 flex flex-col h-full">
      {/* Поиск */}
      <div className="p-4 border-b border-white/10">
        <div className="relative">
          <input
            type="text"
            placeholder="Поиск тикетов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-10 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-zinc-500 focus:outline-none focus:border-[#6050ba] transition"
          />
          <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Список тикетов */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tickets.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-zinc-500">Нет тикетов</p>
            <p className="text-xs text-zinc-600 mt-1">
              {searchQuery ? 'Попробуйте изменить поиск' : 'Создайте новый тикет'}
            </p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <TicketListItem
              key={ticket.id}
              ticket={ticket}
              isSelected={selectedTicket?.id === ticket.id}
              onSelect={onSelectTicket}
            />
          ))
        )}
      </div>
    </div>
  );
}
