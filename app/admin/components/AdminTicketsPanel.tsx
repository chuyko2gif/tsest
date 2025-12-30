'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';
import TicketAvatar, { preloadAvatars } from '@/components/TicketAvatar';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  priority: string;
  category?: string;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  last_admin_message_at: string | null;
  admin_read_at: string | null;
  archived_at: string | null;
  ticket_messages: TicketMessage[];
  user_email?: string;
  user_nickname?: string;
  user_telegram?: string;
  user_avatar?: string;
  user_role?: string;
  release_id?: string;
  release?: {
    id: string;
    artist: string;
    title: string;
    artwork_url?: string;
    status: string;
    created_at: string;
  };
}

interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_admin: boolean;
  created_at: string;
  images: string[];
  sender_email?: string;
  sender_username?: string;
  sender_avatar?: string;
  sender_nickname?: string;
  reactions?: MessageReaction[];
}

interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  reaction: string;
  user?: {
    nickname: string;
    avatar: string;
  };
}

export default function AdminTicketsPanel({ supabase }: { supabase: any }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<'all' | 'in_progress' | 'pending' | 'closed'>('all');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Состояния для просмотра профиля
  const [viewingUser, setViewingUser] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [userReleases, setUserReleases] = useState<any[]>([]);
  const [userPayouts, setUserPayouts] = useState<any[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<any[]>([]);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Состояние для модального окна релиза
  const [viewingRelease, setViewingRelease] = useState<any>(null);
  
  // Состояние для индикатора печати
  const [userTyping, setUserTyping] = useState(false);
  const [userTypingName, setUserTypingName] = useState<string>('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Ref для автопрокрутки
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Проверяем, находится ли пользователь внизу списка
  const isNearBottom = () => {
    const container = messagesContainerRef.current;
    if (!container) return true;
    const threshold = 150; // пикселей от низа
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  };

  // Автопрокрутка к последнему сообщению (только если уже внизу)
  const scrollToBottom = () => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Прокручиваем при изменении сообщений в выбранном тикете (только если внизу)
  useEffect(() => {
    if (selectedTicket?.ticket_messages) {
      scrollToBottom();
    }
  }, [selectedTicket?.ticket_messages]);

  // Получаем текущего пользователя
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, [supabase]);

  // Прокручиваем вниз когда появляется индикатор печати (только если внизу)
  useEffect(() => {
    if (userTyping) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [userTyping]);

  // Предзагружаем аватарки при загрузке тикетов
  useEffect(() => {
    if (tickets.length > 0) {
      const avatarUrls = tickets
        .map(t => t.user_avatar)
        .filter((url): url is string => !!url);
      preloadAvatars(avatarUrls);
    }
  }, [tickets]);

  // Функция переключения реакции
  const toggleReaction = async (messageId: string, hasReaction: boolean) => {
    if (!currentUserId || !selectedTicket) return;
    
    try {
      if (hasReaction) {
        // Удаляем реакцию
        await supabase
          .from('ticket_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', currentUserId);
        
        // Обновляем локальное состояние
        setSelectedTicket(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ticket_messages: prev.ticket_messages.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  reactions: (msg.reactions || []).filter(r => r.user_id !== currentUserId)
                };
              }
              return msg;
            })
          };
        });
      } else {
        // Добавляем реакцию
        const { data, error } = await supabase
          .from('ticket_message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            reaction: '❤️'
          })
          .select(`
            id,
            message_id,
            user_id,
            reaction,
            user:profiles(nickname, avatar)
          `)
          .single();
        
        if (error) throw error;
        
        // Обновляем локальное состояние
        setSelectedTicket(prev => {
          if (!prev) return null;
          return {
            ...prev,
            ticket_messages: prev.ticket_messages.map(msg => {
              if (msg.id === messageId) {
                return {
                  ...msg,
                  reactions: [...(msg.reactions || []), data]
                };
              }
              return msg;
            })
          };
        });
      }
    } catch (e) {
      console.error('Ошибка реакции:', e);
    }
  };

  const loadTickets = async (forceRefresh = false) => {
    try {
      if (forceRefresh) {
        setLoading(true);
      }
      const response = await fetchWithAuth('/api/support/tickets');
      
      // Проверяем, что ответ не является редиректом или ошибкой авторизации
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setError('Требуется авторизация');
          setLoading(false);
          return;
        }
        
        // Пробуем прочитать JSON с ошибкой
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
      
      setError(''); // Очистить ошибку при успехе
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      // Не показываем ошибку, если это просто обновление в фоне
      if (tickets.length === 0) {
        setError('Ошибка соединения с сервером');
      }
    } finally {
      setLoading(false);
    }
  };

  // Автообновление каждые 5 секунд (polling вместо Realtime)
  useEffect(() => {
    loadTickets();
    
    const interval = setInterval(() => {
      loadTickets();
    }, 5000); // 5 секунд - реакции тоже обновляются

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Проверка статуса печати пользователя
  useEffect(() => {
    if (!selectedTicket) return;

    const checkTyping = async () => {
      try {
        const response = await fetchWithAuth(`/api/support/tickets/${selectedTicket.id}/typing`);
        const data = await response.json();
        console.log('Admin: Typing check response:', data);
        if (response.ok && data.isTyping && !data.isAdmin && data.username) {
          console.log('Admin: Setting user typing:', data.username);
          setUserTyping(true);
          setUserTypingName(data.username);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setUserTyping(false);
            setUserTypingName('');
          }, 3000);
        } else {
          setUserTyping(false);
          setUserTypingName('');
        }
      } catch (err) {
        console.error('Error checking typing status:', err);
      }
    };

    const typingInterval = setInterval(checkTyping, 1000);
    return () => {
      clearInterval(typingInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [selectedTicket?.id]);

  // Обновляем выбранный тикет при его изменении
  useEffect(() => {
    if (selectedTicket) {
      const updatedTicket = tickets.find(t => t.id === selectedTicket.id);
      if (updatedTicket && JSON.stringify(updatedTicket) !== JSON.stringify(selectedTicket)) {
        setSelectedTicket(updatedTicket);
      }
    }
  }, [tickets]);

  const markAsRead = async (ticketId: string) => {
    try {
      await fetchWithAuth(`/api/support/tickets/${ticketId}/read`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const viewUserProfile = async (ticket: Ticket) => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    setProfileLoading(true);
    
    try {
      // Получаем профиль пользователя из Supabase
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', ticket.user_id)
        .single();
      
      if (profileError || !profile) {
        console.error('Profile not found:', profileError);
        setProfileLoading(false);
        return;
      }
      
      setViewingUser(profile);
      
      // Загружаем релизы пользователя (исключая черновики)
      const { data: releases } = await supabase
        .from('releases')
        .select('*')
        .eq('user_id', ticket.user_id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });
      setUserReleases(releases || []);
      
      // Загружаем выплаты пользователя
      const { data: payouts } = await supabase
        .from('payouts')
        .select(`
          *,
          transactions(*)
        `)
        .eq('user_id', ticket.user_id)
        .order('created_at', { ascending: false });
      setUserPayouts(payouts || []);
      
      // Загружаем заявки на вывод
      const { data: withdrawals } = await supabase
        .from('withdrawal_requests')
        .select('*')
        .eq('user_id', ticket.user_id)
        .order('created_at', { ascending: false });
      setUserWithdrawals(withdrawals || []);
      
      // Загружаем тикеты пользователя
      const { data: ticketsData } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', ticket.user_id)
        .order('created_at', { ascending: false });
      setUserTickets(ticketsData || []);
      
      // Загружаем транзакции
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', ticket.user_id)
        .order('created_at', { ascending: false });
      
      // Объединяем транзакции и заявки на вывод
      const allTransactions = [
        ...(transactions || []).map((tx: any) => ({ ...tx, source: 'transaction' })),
        ...(withdrawals || []).map((wr: any) => ({ 
          ...wr, 
          source: 'withdrawal_request',
          type: 'withdrawal',
          status: wr.status,
          description: `${wr.bank_name} - ${wr.card_number}`
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setUserTransactions(allTransactions);
    } catch (e) {
      console.error('Ошибка загрузки профиля:', e);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      // Если закрываем тикет, добавляем архивацию
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setError('');

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 МБ

    try {
      const uploadedUrls: string[] = [];
      let hasError = false;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          setError(`Файл "${file.name}" не является изображением. Разрешены только фото.`);
          hasError = true;
          continue;
        }

        // Проверяем размер файла
        if (file.size > MAX_FILE_SIZE) {
          setError(`Файл "${file.name}" слишком большой (${(file.size / 1024 / 1024).toFixed(2)} МБ). Максимальный размер: 10 МБ.`);
          hasError = true;
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetchWithAuth('/api/support/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          uploadedUrls.push(data.url);
        } else {
          setError(data.error || 'Ошибка загрузки изображения');
          hasError = true;
        }
      }

      setReplyImages([...replyImages, ...uploadedUrls]);
      
      // Очищаем input если была ошибка
      if (hasError) {
        e.target.value = '';
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Ошибка загрузки изображений');
      e.target.value = ''; // Очищаем input
    } finally {
      setUploading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTicket || !replyMessage.trim()) return;

    setSending(true);
    setError('');

    try {
      const response = await fetchWithAuth(`/api/support/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message: replyMessage, images: replyImages }),
      });

      const data = await response.json();

      if (response.ok) {
        setSelectedTicket({
          ...selectedTicket,
          ticket_messages: [...selectedTicket.ticket_messages, data.message],
        });
        setReplyMessage('');
        setReplyImages([]);
        loadTickets();
      } else {
        setError(data.error || 'Ошибка отправки сообщения');
      }
    } catch (err) {
      console.error('Error sending reply:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setSending(false);
    }
  };

  const statusColors = {
    open: 'bg-green-500/20 text-green-400 border-green-500/30',
    in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    closed: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  };

  const statusLabels = {
    open: 'Открыт',
    in_progress: 'В работе',
    pending: 'Ожидание',
    closed: 'Закрыт',
  };

  const categoryLabels = {
    general: 'Общий вопрос',
    problem: 'Проблема',
    payout: 'Выплаты',
    account: 'Аккаунт',
    releases: 'Релизы',
    other: 'Другое'
  };

  const priorityColors = {
    low: 'bg-zinc-500/20 text-zinc-400',
    medium: 'bg-blue-500/20 text-blue-400',
    high: 'bg-orange-500/20 text-orange-400',
    urgent: 'bg-red-500/20 text-red-400',
  };

  const priorityLabels = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
    urgent: 'Срочно',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Ошибка API */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="text-red-400 text-sm font-medium">{error}</p>
          <button 
            onClick={() => loadTickets()}
            className="mt-2 text-xs text-red-300 hover:text-red-200 underline"
          >
            Попробовать снова
          </button>
        </div>
      )}

      {/* Заголовок */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white text-center lg:text-left">Тикеты поддержки</h2>
          <p className="text-sm text-zinc-500 mt-1">
            {tickets.length} тикетов • {tickets.filter(t => t.status !== 'closed').length} активных
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
            onClick={() => loadTickets(true)}
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
          {[
            { id: 'all', label: 'Все' },
            { id: 'in_progress', label: 'В работе' },
            { id: 'pending', label: 'Ожидание' },
            { id: 'closed', label: 'Закрытые' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
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

      {/* Контент */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список тикетов */}
        <div className="lg:col-span-1 space-y-2 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 hover:scrollbar-thumb-zinc-600">
          {(() => {
            let filteredTickets = tickets.filter(t => {
              if (filter === 'all') {
                return true;
              } else if (filter === 'in_progress') {
                // "В работе" - это статус in_progress или open (старые тикеты)
                return t.status === 'in_progress' || t.status === 'open';
              } else if (filter === 'pending') {
                return t.status === 'pending';
              } else if (filter === 'closed') {
                return t.status === 'closed';
              }
              return true;
            });

            // Применяем поиск
            if (searchQuery.trim()) {
              const query = searchQuery.toLowerCase();
              filteredTickets = filteredTickets.filter(t => 
                t.id.toLowerCase().includes(query) ||
                t.subject.toLowerCase().includes(query) ||
                t.user_email?.toLowerCase().includes(query) ||
                t.user_nickname?.toLowerCase().includes(query) ||
                t.user_telegram?.toLowerCase().includes(query)
              );
            }

            if (filteredTickets.length === 0) {
              return (
                <div className="text-center py-12 bg-zinc-900/50 rounded-xl border border-zinc-800">
                  <svg className="w-12 h-12 mx-auto text-zinc-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-zinc-500">Тикетов не найдено</p>
                </div>
              );
            }

            return filteredTickets.map(ticket => {
              const needsResponse = !ticket.admin_read_at || 
                (ticket.last_message_at && (!ticket.last_admin_message_at || ticket.last_message_at > ticket.last_admin_message_at));

              return (
                <button
                  key={ticket.id}
                  onClick={() => {
                    setSelectedTicket(ticket);
                    // Отмечаем как прочитанное админом
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
                    selectedTicket?.id === ticket.id
                      ? 'border-2 border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border'
                  }`}
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
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                          searchQuery && categoryLabels[ticket.category as keyof typeof categoryLabels]?.toLowerCase().includes(searchQuery.toLowerCase())
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
                      searchQuery && ticket.subject.toLowerCase().includes(searchQuery.toLowerCase())
                        ? 'bg-yellow-500/10 px-1 rounded'
                        : ''
                    }`}>
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
                      <p className={`text-xs text-white font-medium truncate ${
                        searchQuery && (ticket.user_nickname?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        ticket.user_email?.toLowerCase().includes(searchQuery.toLowerCase()))
                          ? 'bg-yellow-500/20 px-1 rounded'
                          : ''
                      }`}>
                        {ticket.user_nickname || ticket.user_email?.split('@')[0] || 'Пользователь'}
                      </p>
                      {ticket.user_email && (
                        <p className={`text-[10px] text-zinc-400 truncate ${
                          searchQuery && ticket.user_email.toLowerCase().includes(searchQuery.toLowerCase())
                            ? 'bg-yellow-500/20 px-1 rounded'
                            : ''
                        }`}>{ticket.user_email}</p>
                      )}
                      {/* Роль пользователя */}
                      <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold inline-block mt-0.5 ${
                        ticket.user_role === 'owner' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                        ticket.user_role === 'admin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                        ticket.user_role === 'exclusive' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                      }`}>
                        {ticket.user_role === 'owner' ? 'OWNER' :
                         ticket.user_role === 'admin' ? 'ADMIN' :
                         ticket.user_role === 'exclusive' ? 'EXCLUSIVE' :
                         'BASIC'}
                      </span>
                    </div>
                    
                    {/* Кнопка просмотра профиля */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        viewUserProfile(ticket);
                      }}
                      className="p-1.5 bg-[#6050ba]/20 hover:bg-[#6050ba]/40 border border-[#6050ba]/30 rounded-lg transition-all flex-shrink-0 cursor-pointer"
                      title="Просмотреть профиль"
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          viewUserProfile(ticket);
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
            });
          })()}
        </div>

        {/* Детали тикета */}
        <div className="lg:col-span-2">
          {!selectedTicket ? (
            <div className="h-full flex items-center justify-center bg-zinc-900/50 rounded-xl border border-zinc-800">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto text-zinc-700 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-zinc-400">Выберите тикет</p>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900/50 rounded-xl border border-zinc-800 flex flex-col h-[700px]">
              {/* Заголовок тикета */}
              <div className="p-4 border-b border-zinc-800">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-lg mb-2">{selectedTicket.subject}</h3>
                    
                    {/* Информация о пользователе */}
                    <div className="flex items-center gap-3 mb-2">
                      <TicketAvatar
                        src={selectedTicket.user_avatar}
                        name={selectedTicket.user_nickname}
                        email={selectedTicket.user_email}
                        size="md"
                        role={selectedTicket.user_role}
                        showRing
                      />
                      <div className="flex-1">
                        <p className="text-sm text-white font-medium">
                          {selectedTicket.user_nickname || selectedTicket.user_email?.split('@')[0] || 'Пользователь'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                          {selectedTicket.user_email && (
                            <span>{selectedTicket.user_email}</span>
                          )}
                          {selectedTicket.user_telegram && (
                            <>
                              <span>•</span>
                              <span>@{selectedTicket.user_telegram}</span>
                            </>
                          )}
                        </div>
                        {/* Роль пользователя */}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold inline-block mt-1 ${
                          selectedTicket.user_role === 'owner' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                          selectedTicket.user_role === 'admin' ? 'bg-red-500/20 text-red-300 border border-red-500/30' :
                          selectedTicket.user_role === 'exclusive' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-zinc-500/20 text-zinc-300 border border-zinc-500/30'
                        }`}>
                          {selectedTicket.user_role === 'owner' ? 'OWNER' :
                           selectedTicket.user_role === 'admin' ? 'ADMIN' :
                           selectedTicket.user_role === 'exclusive' ? 'EXCLUSIVE' :
                           'BASIC'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <select
                      value={selectedTicket.status}
                      onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
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
                  <span>ID: {selectedTicket.id.slice(0, 8)}</span>
                  <span>•</span>
                  <span>Создан: {new Date(selectedTicket.created_at).toLocaleString('ru-RU')}</span>
                </div>

                {/* Информация о релизе - компактная карточка */}
                {selectedTicket.release && (
                  <div 
                    onClick={() => setViewingRelease(selectedTicket.release)}
                    className="mt-2 p-2 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-lg cursor-pointer hover:border-purple-500/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center gap-2.5">
                      {/* Обложка */}
                      <div className="flex-shrink-0">
                        {selectedTicket.release.artwork_url ? (
                          <img 
                            src={selectedTicket.release.artwork_url} 
                            alt={selectedTicket.release.title}
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

                      {/* Информация */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] font-medium text-purple-400 mb-0.5">Релиз по теме</p>
                            <h4 className="text-xs font-bold text-white truncate">{selectedTicket.release.title}</h4>
                            <p className="text-[10px] text-zinc-400 truncate">{selectedTicket.release.artist}</p>
                          </div>
                          <div className="ml-2 text-purple-400 group-hover:text-purple-300 transition-colors flex-shrink-0">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                        </div>
                        
                        {/* Статус */}
                        {selectedTicket.release.status && (() => {
                          const statusConfig = {
                            pending: { label: 'На модерации', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', emoji: '⏳' },
                            approved: { label: 'Одобрен', color: 'bg-green-500/20 text-green-300 border-green-500/40', emoji: '✅' },
                            rejected: { label: 'Отклонен', color: 'bg-red-500/20 text-red-300 border-red-500/40', emoji: '❌' },
                            published: { label: 'Опубликован', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', emoji: '🎵' }
                          }[selectedTicket.release.status] || { label: selectedTicket.release.status, color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40', emoji: '📀' };
                          
                          return (
                            <span className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[8px] font-medium border mt-0.5 ${statusConfig.color}`}>
                              <span>{statusConfig.emoji}</span>
                              <span>{statusConfig.label}</span>
                            </span>
                          );
                        })()}
                      </div>
                    </div>
                    <p className="mt-1 text-[9px] text-center text-purple-400/70 group-hover:text-purple-400 transition-colors">
                      Нажмите для подробной информации
                    </p>
                  </div>
                )}
              </div>

              {/* Сообщения */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4
                scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900
                hover:scrollbar-thumb-zinc-600">
                {selectedTicket.ticket_messages.map((msg, idx) => {
                  // Системное сообщение (автоответ) - специальный ID
                  const isSystemMessage = msg.sender_id === '00000000-0000-0000-0000-000000000000';
                  
                  const displayName = isSystemMessage 
                    ? 'THQ Support' 
                    : (msg.sender_nickname || msg.sender_username || msg.sender_email?.split('@')[0] || (msg.is_admin ? 'Администратор' : 'Пользователь'));
                  const displayEmail = msg.sender_email;
                  const displayAvatar = msg.sender_avatar;
                  
                  // Проверяем, является ли это первым сообщением пользователя в тикете с релизом
                  const isFirstUserMessage = idx === 0 && !msg.is_admin && selectedTicket.release_id && selectedTicket.release;
                  
                  // Реакции
                  const hasUserReaction = msg.reactions?.some(r => r.user_id === currentUserId);
                  const reactionsCount = msg.reactions?.length || 0;
                  
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_admin ? 'justify-start' : 'justify-end'} group`}
                    >
                      <div className={`max-w-[80%] ${msg.is_admin ? '' : 'flex flex-col items-end'}`}>
                        {/* Метка отправителя */}
                        <div className={`flex items-center gap-2 mb-1 ${msg.is_admin ? '' : 'flex-row-reverse'}`}>
                          <TicketAvatar
                            src={displayAvatar}
                            name={displayName}
                            email={displayEmail}
                            size="sm"
                            isAdmin={msg.is_admin}
                          />
                          <div className={`flex flex-col ${msg.is_admin ? 'items-start' : 'items-end'}`}>
                            <span className={`text-xs font-medium ${
                              msg.is_admin 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text' 
                                : 'text-blue-300'
                            }`}>
                              {displayName}
                            </span>
                            {!msg.is_admin && displayEmail && (
                              <span className="text-[10px] text-zinc-500">{displayEmail}</span>
                            )}
                            {msg.is_admin && !isSystemMessage && displayEmail && (
                              <span className="text-[10px] text-zinc-500">{displayEmail}</span>
                            )}
                          </div>
                        </div>

                        <div 
                          className={`rounded-lg p-4 relative ${
                          msg.is_admin
                            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30'
                            : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30'
                        }`}
                          onDoubleClick={() => toggleReaction(msg.id, !!hasUserReaction)}
                        >
                          <p className="text-white whitespace-pre-wrap break-words">{msg.message}</p>
                          
                          {/* Изображения */}
                          {msg.images && msg.images.length > 0 && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {msg.images.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block"
                                >
                                  <img
                                    src={url}
                                    alt={`Attachment ${index + 1}`}
                                    className="w-full h-32 object-cover rounded hover:opacity-80 transition-opacity cursor-pointer"
                                  />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Информация о релизе для первого сообщения */}
                          {isFirstUserMessage && selectedTicket.release && (
                            <div className="mt-2 pt-2 border-t border-purple-500/30">
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                </svg>
                                <span className="text-[10px] text-purple-300 font-medium">Обращение по релизу:</span>
                              </div>
                              <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1.5">
                                {selectedTicket.release.artwork_url ? (
                                  <img 
                                    src={selectedTicket.release.artwork_url} 
                                    alt={selectedTicket.release.title}
                                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                                  />
                                ) : (
                                  <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                    </svg>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-medium text-white truncate">{selectedTicket.release.title}</div>
                                  <div className="text-[10px] text-zinc-400 truncate">{selectedTicket.release.artist}</div>
                                  {selectedTicket.release.status && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-300">
                                        {selectedTicket.release.status === 'pending' && '⏳ На модерации'}
                                        {selectedTicket.release.status === 'distributed' && '🚀 На дистрибьюции'}
                                        {selectedTicket.release.status === 'rejected' && '❌ Отклонён'}
                                        {selectedTicket.release.status === 'published' && '🎵 Опубликован'}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="text-xs text-zinc-500 mt-2">
                            {new Date(msg.created_at).toLocaleString('ru-RU')}
                          </div>
                        </div>
                        
                        {/* Кнопка реакции - под сообщением */}
                        <div className={`flex items-center gap-1 mt-1 ${msg.is_admin ? 'justify-start' : 'justify-end'}`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReaction(msg.id, !!hasUserReaction);
                            }}
                            className={`h-5 px-1.5 rounded-full flex items-center gap-1 transition-all text-[10px] ${
                              hasUserReaction || reactionsCount > 0
                                ? 'bg-pink-500/30 border border-pink-400/40' 
                                : 'bg-zinc-800/60 border border-zinc-600/40 opacity-0 group-hover:opacity-100 hover:bg-pink-500/20 hover:border-pink-400/40'
                            }`}
                            title={msg.reactions?.map(r => r.user?.nickname || 'Пользователь').join(', ') || 'Поставить лайк'}
                          >
                            <span>{hasUserReaction || reactionsCount > 0 ? '❤️' : '🤍'}</span>
                            {reactionsCount > 0 && (
                              <span className="text-pink-300 font-medium">{reactionsCount}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Индикатор печати пользователя */}
                {userTyping && (
                  <div className="flex justify-start px-4 py-1 animate-fade-in">
                    <div className="bg-zinc-800/50 rounded-lg px-3 py-1.5 border border-zinc-700/50">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-300">{userTypingName}</span>
                        <span className="text-[10px] text-zinc-500">печатает</span>
                        <div className="flex gap-0.5">
                          <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Форма ответа */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-4 border-t border-zinc-800">
                  <form onSubmit={handleSendReply} className="space-y-3">
                    {/* Превью изображений */}
                    {replyImages.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {replyImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                            <button
                              type="button"
                              onClick={() => setReplyImages(replyImages.filter((_, i) => i !== index))}
                              className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2 items-center">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                        id="admin-image-upload"
                        disabled={uploading}
                      />
                      <label
                        htmlFor="admin-image-upload"
                        className={`p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors flex-shrink-0 ${
                          uploading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Прикрепить фото"
                      >
                        {uploading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                        ) : (
                          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </label>

                      <textarea
                        value={replyMessage}
                        onChange={(e) => {
                          setReplyMessage(e.target.value);
                          // Отправляем статус печати
                          if (e.target.value.trim()) {
                            fetchWithAuth(`/api/support/tickets/${selectedTicket.id}/typing`, {
                              method: 'POST',
                              body: JSON.stringify({ isTyping: true, isAdmin: true })
                            }).catch(err => console.error('Error sending typing status:', err));
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (!sending && (replyMessage.trim() || replyImages.length > 0)) {
                              const form = e.currentTarget.closest('form');
                              if (form) {
                                form.requestSubmit();
                              }
                            }
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                        placeholder="Отправить сообщение"
                        rows={1}
                        disabled={sending}
                      />

                      <button
                        type="submit"
                        disabled={sending || (!replyMessage.trim() && replyImages.length === 0)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {sending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          'Отправить'
                        )}
                      </button>
                    </div>

                    {error && (
                      <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                        {error}
                      </div>
                    )}
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно профиля пользователя */}
      {viewingUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto p-4 pt-16 pb-8">
          <div className="bg-gradient-to-br from-[#1a1a1f] to-[#0d0d0f] border border-white/10 rounded-3xl max-w-4xl w-full overflow-y-auto">
            {/* Шапка профиля */}
            <div className="sticky top-0 bg-[#1a1a1f]/95 backdrop-blur border-b border-white/10 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-4">
                <TicketAvatar
                  src={viewingUser.avatar}
                  name={viewingUser.nickname}
                  email={viewingUser.email}
                  size="xl"
                  role={viewingUser.role}
                  showRing
                  className="rounded-2xl"
                />
                <div>
                  <h2 className="text-xl font-black">{viewingUser.nickname || 'Без никнейма'}</h2>
                  <p className="text-sm text-zinc-400">{viewingUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      viewingUser.role === 'owner' ? 'bg-purple-500/20 text-purple-300' :
                      viewingUser.role === 'admin' ? 'bg-red-500/20 text-red-300' :
                      viewingUser.role === 'exclusive' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-zinc-500/20 text-zinc-300'
                    }`}>
                      {viewingUser.role?.toUpperCase() || 'BASIC'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingUser(null)}
                className="p-3 hover:bg-white/10 rounded-xl transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {profileLoading ? (
              <div className="p-12 text-center text-zinc-500">Загрузка данных...</div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Статистика */}
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <div className="text-2xl font-black text-emerald-400">{Number(viewingUser.balance || 0).toLocaleString('ru-RU', {minimumFractionDigits: 2, maximumFractionDigits: 2}).replace(/\s/g, '.')} ₽</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Баланс</div>
                  </div>
                  <div className="p-4 bg-[#6050ba]/10 border border-[#6050ba]/20 rounded-xl text-center">
                    <div className="text-2xl font-black text-[#9d8df1]">{userReleases.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Релизов</div>
                  </div>
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                    <div className="text-2xl font-black text-amber-400">{userPayouts.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Выплат</div>
                  </div>
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
                    <div className="text-2xl font-black text-blue-400">{userTickets.length}</div>
                    <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Тикетов</div>
                  </div>
                </div>
                
                {/* Все транзакции */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    Все транзакции ({userTransactions.length})
                  </h3>
                  {userTransactions.length === 0 ? (
                    <p className="text-zinc-500 text-sm">Нет транзакций</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {userTransactions.map((tx: any) => {
                        const isWithdrawalRequest = tx.source === 'withdrawal_request';
                        
                        const typeConfig: Record<string, { bg: string; text: string; label: string; icon: string }> = {
                          payout: { bg: 'bg-emerald-500/20', text: 'text-emerald-300', label: 'Выплата', icon: '+' },
                          withdrawal: { bg: 'bg-red-500/20', text: 'text-red-300', label: isWithdrawalRequest ? 'Заявка на вывод' : 'Вывод', icon: '−' },
                          refund: { bg: 'bg-blue-500/20', text: 'text-blue-300', label: 'Возврат', icon: '↺' },
                          adjustment: { bg: 'bg-yellow-500/20', text: 'text-yellow-300', label: 'Корректировка', icon: '±' },
                        };
                        const type = typeConfig[tx.type] || { bg: 'bg-zinc-500/20', text: 'text-zinc-300', label: tx.type, icon: '?' };
                        
                        const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
                          pending: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', label: 'В обработке' },
                          approved: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Одобрено' },
                          rejected: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Отклонено' },
                          completed: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Завершена' },
                          cancelled: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Отменена' },
                          failed: { bg: 'bg-orange-500/10', text: 'text-orange-400', label: 'Ошибка' },
                        };
                        const status = statusConfig[tx.status] || statusConfig.pending;
                        
                        return (
                          <div key={`${tx.source}-${tx.id}`} className="p-3 bg-black/30 rounded-lg border border-white/5 hover:border-white/10 transition">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm px-2 py-1 rounded ${type.bg} ${type.text} font-bold`}>
                                  {type.icon} {type.label}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                                  {status.label}
                                </span>
                              </div>
                              <div className={`font-bold text-sm ${tx.type === 'withdrawal' ? 'text-red-400' : 'text-emerald-400'}`}>
                                {tx.type === 'withdrawal' ? '−' : '+'}{Number(tx.amount).toLocaleString('ru-RU')} ₽
                              </div>
                            </div>
                            <div className="space-y-1">
                              {isWithdrawalRequest ? (
                                <>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-red-400 font-mono font-bold">№ ЗАЯВКИ:</span>
                                    <span className="text-red-300 font-mono text-[10px]">{tx.id}</span>
                                  </div>
                                  {tx.bank_name && (
                                    <div className="text-xs text-zinc-500">
                                      <span className="text-zinc-600">Банк:</span> {tx.bank_name} | <span className="text-zinc-600">Карта:</span> {tx.card_number}
                                    </div>
                                  )}
                                  {tx.admin_comment && (
                                    <div className="text-xs text-blue-400">Комментарий: {tx.admin_comment}</div>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="text-purple-400 font-mono font-bold">TX:</span>
                                    <span className="text-purple-300 font-mono text-[10px]">{tx.id}</span>
                                  </div>
                                  {tx.reference_id && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-blue-400 font-mono font-bold">REF:</span>
                                      <span className="text-blue-300 font-mono text-[10px]">{tx.reference_id}</span>
                                    </div>
                                  )}
                                  {tx.description && (
                                    <div className="text-xs text-zinc-500">{tx.description}</div>
                                  )}
                                </>
                              )}
                              <div className="text-[10px] text-zinc-600">
                                {new Date(tx.created_at).toLocaleString('ru-RU', { 
                                  day: 'numeric', 
                                  month: 'long', 
                                  year: 'numeric', 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Дополнительная информация */}
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl">
                  <h3 className="font-bold mb-4">Информация о профиле</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-zinc-500">ID пользователя:</span>
                      <span className="ml-2 text-zinc-300 font-mono text-xs">{viewingUser.id}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Дата регистрации:</span>
                      <span className="ml-2 text-zinc-300">{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleDateString('ru-RU') : '—'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">Роль:</span>
                      <span className="ml-2 text-zinc-300">{viewingUser.role || 'basic'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Модальное окно с информацией о релизе */}
      {viewingRelease && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4 pt-16 pb-8" onClick={() => setViewingRelease(null)}>
          <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl shadow-2xl max-w-2xl w-full overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900" onClick={(e) => e.stopPropagation()}>
            {/* Хедер */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border-b border-purple-500/30 p-6 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">Информация о релизе</h3>
                  <p className="text-sm text-purple-300">Полные данные</p>
                </div>
              </div>
              <button
                onClick={() => setViewingRelease(null)}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40"
              >
                <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Контент */}
            <div className="p-6 space-y-6">
              {/* Обложка и основная информация */}
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  {viewingRelease.artwork_url ? (
                    <img 
                      src={viewingRelease.artwork_url} 
                      alt={viewingRelease.title}
                      className="w-48 h-48 rounded-xl object-cover shadow-2xl shadow-purple-500/20"
                    />
                  ) : (
                    <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl">
                      <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h2 className="text-3xl font-black text-white mb-2">{viewingRelease.title}</h2>
                  <p className="text-xl text-purple-300 mb-4">{viewingRelease.artist}</p>
                  
                  {/* Статус */}
                  {viewingRelease.status && (() => {
                    const statusConfig: Record<string, { label: string; color: string; emoji: string }> = {
                      pending: { label: 'На модерации', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', emoji: '⏳' },
                      distributed: { label: 'На дистрибьюции', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40', emoji: '🚀' },
                      rejected: { label: 'Отклонен', color: 'bg-red-500/20 text-red-300 border-red-500/40', emoji: '❌' },
                      published: { label: 'Опубликован', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', emoji: '🎵' }
                    };
                    const config = statusConfig[viewingRelease.status] || { label: viewingRelease.status, color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40', emoji: '📀' };
                    
                    return (
                      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${config.color} mb-4`}>
                        <span className="text-2xl">{config.emoji}</span>
                        <span className="font-bold">{config.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Детали */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                  <p className="text-xs text-zinc-500 mb-1">ID Релиза</p>
                  <p className="text-sm font-mono text-white break-all">{viewingRelease.id}</p>
                </div>
                
                {viewingRelease.created_at && (
                  <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                    <p className="text-xs text-zinc-500 mb-1">Дата создания</p>
                    <p className="text-sm text-white">
                      {new Date(viewingRelease.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                )}
              </div>

              {/* Дополнительная информация */}
              <div className="p-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-xl">
                <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Дополнительная информация
                </h4>
                <div className="text-sm text-zinc-300 space-y-2">
                  <p>• Этот релиз был выбран пользователем при создании тикета</p>
                  <p>• Вы можете посмотреть полную информацию о релизе в разделе модерации</p>
                  {viewingRelease.status === 'pending' && (
                    <p className="text-yellow-300">• Релиз находится на модерации и ожидает проверки</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
