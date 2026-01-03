'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';
import { preloadAvatars } from '@/components/icons/TicketAvatar';
import { Ticket, TicketFilter } from '../types';

interface UseTicketsReturn {
  tickets: Ticket[];
  loading: boolean;
  error: string;
  selectedTicket: Ticket | null;
  setSelectedTicket: (ticket: Ticket | null) => void;
  filter: TicketFilter;
  setFilter: (filter: TicketFilter) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  loadTickets: (forceRefresh?: boolean) => Promise<void>;
  handleStatusChange: (ticketId: string, newStatus: string) => Promise<void>;
  filteredTickets: Ticket[];
}

export function useTickets(supabase: any): UseTicketsReturn {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<TicketFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Предзагружаем аватарки при загрузке тикетов
  useEffect(() => {
    if (tickets.length > 0) {
      const avatarUrls = tickets
        .map(t => t.user_avatar)
        .filter((url): url is string => !!url);
      preloadAvatars(avatarUrls);
    }
  }, [tickets]);

  const loadTickets = useCallback(async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setLoading(true);
      }
      const response = await fetchWithAuth('/api/support/tickets');
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Требуется авторизация');
          setLoading(false);
          return;
        }
        
        try {
          const text = await response.text();
          if (text) {
            const data = JSON.parse(text);
            setError(data.error || `Ошибка загрузки тикетов (${response.status})`);
          } else {
            setError(`Ошибка загрузки тикетов (${response.status})`);
          }
        } catch {
          setError(`Ошибка загрузки тикетов (${response.status})`);
        }
        setLoading(false);
        return;
      }

      const text = await response.text();
      if (!text) {
        setError('Пустой ответ от сервера');
        setLoading(false);
        return;
      }
      
      const data = JSON.parse(text);
      const sortedTickets = (data.tickets || []).sort((a: Ticket, b: Ticket) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setTickets(sortedTickets);
      
      // Обновляем выбранный тикет, если он открыт
      if (selectedTicket) {
        const updatedSelectedTicket = sortedTickets.find((t: Ticket) => t.id === selectedTicket.id);
        if (updatedSelectedTicket) {
          setSelectedTicket(updatedSelectedTicket);
        }
      }
      
      setError('');
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      if (tickets.length === 0) {
        setError('Ошибка соединения с сервером');
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTicket, tickets.length]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const body: any = { status: newStatus };
      if (newStatus === 'closed') {
        body.archived_at = new Date().toISOString();
      }

      const response = await fetchWithAuth(`/api/support/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        loadTickets();
        if (selectedTicket?.id === ticketId) {
          setSelectedTicket({ ...selectedTicket, status: newStatus, archived_at: body.archived_at || selectedTicket.archived_at });
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  // Автообновление каждые 5 секунд
  useEffect(() => {
    loadTickets();
    const interval = setInterval(() => loadTickets(), 5000);
    return () => clearInterval(interval);
  }, []);

  // Обновляем выбранный тикет при его изменении
  useEffect(() => {
    if (selectedTicket) {
      const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket && JSON.stringify(updatedTicket) !== JSON.stringify(selectedTicket)) {
        setSelectedTicket(updatedTicket);
      }
    }
  }, [tickets]);

  // Фильтрация тикетов
  const filteredTickets = tickets.filter(t => {
    // Фильтр по статусу
    if (filter !== 'all') {
      if (filter === 'in_progress') {
        if (t.status !== 'in_progress' && t.status !== 'open') return false;
      } else if (filter === 'pending') {
        if (t.status !== 'pending') return false;
      } else if (filter === 'closed') {
        if (t.status !== 'closed') return false;
      }
    }

    // Поиск
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        t.id.toLowerCase().includes(query) ||
        t.subject.toLowerCase().includes(query) ||
        t.user_email?.toLowerCase().includes(query) ||
        t.user_nickname?.toLowerCase().includes(query) ||
        t.user_telegram?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  return {
    tickets,
    loading,
    error,
    selectedTicket,
    setSelectedTicket,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    loadTickets,
    handleStatusChange,
    filteredTickets,
  };
}
