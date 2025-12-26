'use client';
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../lib/fetchWithAuth';
import TicketCard from './TicketCard';
import CreateTicketForm from './CreateTicketForm';
import TicketView from './TicketView';

interface SupportContentProps {
  onClose: () => void;
  onUpdateUnreadCount?: () => void;
}

export default function SupportContent({ onClose, onUpdateUnreadCount }: SupportContentProps) {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTickets = async () => {
    try {
      const response = await fetchWithAuth('/api/support/tickets');
      const data = await response.json();
      
      if (data.success) {
        setTickets(data.tickets || []);
        setError('');
      } else {
        setError(data.error || 'Не удалось загрузить тикеты');
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
      setError('Ошибка при загрузке тикетов');
    } finally {
      setLoading(false);
    }
  };

  const handleTicketCreated = (newTicket: any) => {
    setShowCreateForm(false);
    loadTickets();
    setSelectedTicket(newTicket);
  };

  if (selectedTicket) {
    return (
      <TicketView
        ticket={selectedTicket}
        onBack={() => {
          setSelectedTicket(null);
          loadTickets();
        }}
        onUpdate={loadTickets}
        onClose={onClose}
        onUpdateUnreadCount={onUpdateUnreadCount}
      />
    );
  }

  if (showCreateForm) {
    return (
      <CreateTicketForm
        onCancel={() => setShowCreateForm(false)}
        onCreated={handleTicketCreated}
      />
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Кнопка создания тикета */}
      <button
        onClick={() => setShowCreateForm(true)}
        className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Создать тикет
      </button>

      {/* Заголовок */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Ваши тикеты</h3>
        <button
          onClick={loadTickets}
          className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
          title="Обновить"
        >
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Список тикетов */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <div className="text-4xl">📭</div>
          <p className="text-zinc-500 text-sm">У вас пока нет тикетов</p>
          <p className="text-zinc-600 text-xs">Создайте первый тикет, чтобы связаться с поддержкой</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => setSelectedTicket(ticket)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
