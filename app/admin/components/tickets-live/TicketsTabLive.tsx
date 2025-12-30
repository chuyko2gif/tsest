'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  is_admin: boolean;
  is_read: boolean;
  created_at: string;
  attachments?: Attachment[];
  reactions?: MessageReaction[];
  user?: {
    nickname: string;
    avatar: string;
  };
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

interface Attachment {
  id: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size: number;
}

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  last_message_at: string;
  last_message_preview: string;
  unread_count: number;
  is_typing: boolean;
  typing_user_id: string;
  typing_nickname?: string | null;
  typing_is_admin?: boolean;
  archived_at: string | null;
  user?: {
    nickname: string;
    email: string;
    avatar: string;
    member_id: string;
  };
}

export default function TicketsTabLive({ supabase, currentUser }: { supabase: any; currentUser: any }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'answered' | 'closed'>('all');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadTickets();
    
    // Подписка на новые сообщения
    const messageSubscription = supabase
      .channel('admin_ticket_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'ticket_messages' },
        (payload: any) => {
          handleNewMessage(payload.new as Message);
        }
      )
      .subscribe();

    // Подписка на изменения тикетов
    const ticketSubscription = supabase
      .channel('admin_tickets_updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets' },
        (payload: any) => {
          handleTicketUpdate(payload.new as Ticket);
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      ticketSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('tickets')
        .select(`
          *,
          user:profiles!user_id (
            nickname,
            email,
            avatar,
            member_id
          )
        `)
        .is('archived_at', null)
        .order('last_message_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTickets(data || []);
    } catch (e) {
      console.error('Ошибка загрузки тикетов:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    try {
      const { data, error } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          attachments:ticket_attachments(*),
          reactions:ticket_message_reactions(
            id,
            message_id,
            user_id,
            reaction,
            created_at,
            user:profiles(nickname, avatar)
          ),
          user:profiles(nickname, avatar)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      // Отмечаем сообщения пользователя как прочитанные
      await supabase
        .from('ticket_messages')
        .update({ is_read: true })
        .eq('ticket_id', ticketId)
        .eq('is_admin', false)
        .eq('is_read', false);
    } catch (e) {
      console.error('Ошибка загрузки сообщений:', e);
    }
  };

  const handleNewMessage = async (message: Message) => {
    // Если сообщение в текущем открытом тикете
    if (selectedTicket && message.ticket_id === selectedTicket.id) {
      // Загружаем полное сообщение с вложениями
      const { data } = await supabase
        .from('ticket_messages')
        .select(`
          *,
          attachments:ticket_attachments(*),
          user:profiles(nickname, avatar)
        `)
        .eq('id', message.id)
        .single();
      
      if (data) {
        setMessages(prev => [...prev, data]);
        
        // Отмечаем как прочитанное если это от пользователя
        if (!data.is_admin) {
          await supabase
            .from('ticket_messages')
            .update({ is_read: true })
            .eq('id', data.id);
        }
      }
    }

    // Обновляем список тикетов
    loadTickets();
  };

  const handleTicketUpdate = (ticket: Ticket) => {
    setTickets(prev => 
      prev.map(t => t.id === ticket.id ? { ...t, ...ticket } : t)
    );

    if (selectedTicket && selectedTicket.id === ticket.id) {
      setSelectedTicket({ ...selectedTicket, ...ticket });
      setIsTyping(ticket.is_typing && ticket.typing_user_id !== currentUser.id);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || sending) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: currentUser.id,
          message: newMessage,
          is_admin: true,
        });

      if (error) throw error;

      // Обновляем статус тикета на "answered"
      await supabase
        .from('tickets')
        .update({ status: 'answered' })
        .eq('id', selectedTicket.id);

      setNewMessage('');
      stopTyping();
    } catch (e) {
      console.error('Ошибка отправки:', e);
      alert('Ошибка отправки сообщения');
    } finally {
      setSending(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!selectedTicket) return;

    setUploadingFile(true);
    try {
      // Загружаем файл в storage (админ может загружать в любую папку)
      const fileName = `admin/${selectedTicket.id}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Получаем публичный URL
      const { data: urlData } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(fileName);

      // Создаем сообщение с вложением
      const { data: messageData, error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: currentUser.id,
          message: `📎 Прикреплен файл: ${file.name}`,
          is_admin: true,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      // Создаем запись о вложении
      await supabase
        .from('ticket_attachments')
        .insert({
          message_id: messageData.id,
          file_url: urlData.publicUrl,
          file_name: file.name,
          file_type: file.type,
          file_size: file.size,
        });

      // Обновляем статус
      await supabase
        .from('tickets')
        .update({ status: 'answered' })
        .eq('id', selectedTicket.id);

    } catch (e) {
      console.error('Ошибка загрузки файла:', e);
      alert('Ошибка загрузки файла');
    } finally {
      setUploadingFile(false);
    }
  };

  const changeTicketStatus = async (ticketId: string, status: string) => {
    try {
      await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId);

      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
    } catch (e) {
      console.error('Ошибка изменения статуса:', e);
    }
  };

  const startTyping = async () => {
    if (!selectedTicket) return;

    await supabase
      .from('tickets')
      .update({ 
        is_typing: true,
        typing_user_id: currentUser.id,
        typing_nickname: currentUser.nickname || currentUser.email || 'Администратор',
        typing_is_admin: true,
      })
      .eq('id', selectedTicket.id);
  };

  const stopTyping = async () => {
    if (!selectedTicket) return;

    await supabase
      .from('tickets')
      .update({ 
        is_typing: false,
        typing_user_id: null,
        typing_nickname: null,
        typing_is_admin: false,
      })
      .eq('id', selectedTicket.id);
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    if (!selectedTicket) return;

    startTyping();

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleReaction = async (messageId: string, hasReaction: boolean) => {
    if (!currentUser) return;
    
    try {
      if (hasReaction) {
        // Удаляем реакцию
        await supabase
          .from('ticket_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', currentUser.id);
        
        // Обновляем локальное состояние
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: msg.reactions?.filter(r => r.user_id !== currentUser.id) || []
            };
          }
          return msg;
        }));
      } else {
        // Добавляем реакцию
        const { data, error } = await supabase
          .from('ticket_message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUser.id,
            reaction: '❤️'
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Обновляем локальное состояние
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: [...(msg.reactions || []), data]
            };
          }
          return msg;
        }));
      }
    } catch (e) {
      console.error('Ошибка реакции:', e);
    }
  };

  const selectTicket = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    loadMessages(ticket.id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'answered': return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'closed': return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
      default: return 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return '🟢 Открыт';
      case 'answered': return '💬 Ответили';
      case 'closed': return '⚫ Закрыт';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Фильтры */}
      <div className="flex gap-2">
        {['all', 'open', 'answered', 'closed'].map(f => (
          <button
            key={f}
            onClick={() => { setFilter(f as any); loadTickets(); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
              filter === f
                ? 'bg-[#6050ba] text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {f === 'all' ? 'Все' : f === 'open' ? 'Открытые' : f === 'answered' ? 'Отвеченные' : 'Закрытые'}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Список тикетов */}
        <div className="lg:col-span-1 space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-zinc-500">Загрузка...</div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">Нет тикетов</div>
          ) : (
            tickets.map(ticket => (
              <div
                key={ticket.id}
                onClick={() => selectTicket(ticket)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedTicket?.id === ticket.id
                    ? 'bg-[#6050ba]/20 border-[#6050ba]/50'
                    : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05]'
                }`}
              >
                <div className="flex items-start gap-3 mb-2">
                  {ticket.user?.avatar && (
                    <div 
                      className="w-10 h-10 rounded-full bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url(${ticket.user.avatar})` }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-sm truncate">{ticket.user?.nickname || 'Пользователь'}</h3>
                      {ticket.unread_count > 0 && (
                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold">
                          {ticket.unread_count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 truncate">{ticket.subject}</p>
                  </div>
                </div>
                
                {ticket.last_message_preview && (
                  <p className="text-xs text-zinc-600 truncate mb-2">{ticket.last_message_preview}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(ticket.status)}`}>
                    {getStatusLabel(ticket.status)}
                  </span>
                  <span className="text-[10px] text-zinc-600">
                    {new Date(ticket.last_message_at || ticket.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Окно чата */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden h-[calc(100vh-300px)] flex flex-col">
              {/* Шапка чата */}
              <div className="p-4 bg-white/[0.05] border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {selectedTicket.user?.avatar && (
                      <div 
                        className="w-12 h-12 rounded-xl bg-cover bg-center"
                        style={{ backgroundImage: `url(${selectedTicket.user.avatar})` }}
                      />
                    )}
                    <div>
                      <h2 className="font-bold">{selectedTicket.user?.nickname || 'Пользователь'}</h2>
                      <p className="text-xs text-zinc-500">{selectedTicket.user?.email}</p>
                      <p className="text-xs text-zinc-600">{selectedTicket.subject}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedTicket.status !== 'closed' && (
                      <button
                        onClick={() => changeTicketStatus(selectedTicket.id, 'closed')}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold transition"
                      >
                        Закрыть
                      </button>
                    )}
                    {selectedTicket.status === 'closed' && (
                      <button
                        onClick={() => changeTicketStatus(selectedTicket.id, 'open')}
                        className="px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg text-xs font-bold transition"
                      >
                        Открыть
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 text-xs">
                  <span className={`px-2 py-1 rounded-lg border ${getStatusColor(selectedTicket.status)}`}>
                    {getStatusLabel(selectedTicket.status)}
                  </span>
                  <span className="px-2 py-1 bg-zinc-500/10 text-zinc-400 rounded-lg">
                    Создан {new Date(selectedTicket.created_at).toLocaleDateString('ru-RU')}
                  </span>
                </div>
              </div>

              {/* Сообщения */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => {
                  const hasUserReaction = message.reactions?.some(r => r.user_id === currentUser.id);
                  const reactionsCount = message.reactions?.length || 0;
                  
                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.is_admin ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div 
                        className={`max-w-[70%] ${message.is_admin ? 'bg-[#6050ba]/20 border-[#6050ba]/30' : 'bg-white/10 border-white/20'} border rounded-2xl p-3 cursor-pointer select-none transition-transform relative hover:scale-[1.01]`}
                        onDoubleClick={() => toggleReaction(message.id, !!hasUserReaction)}
                      >
                        {/* Кнопка лайка - компактная сбоку */}
                        <div className={`absolute top-1/2 -translate-y-1/2 ${message.is_admin ? '-left-7' : '-right-7'} flex items-center gap-1`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleReaction(message.id, !!hasUserReaction);
                            }}
                            className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
                              hasUserReaction || reactionsCount > 0
                                ? 'bg-pink-500/20 border border-pink-400/50 opacity-100' 
                                : 'bg-white/10 border border-white/20 opacity-0 group-hover:opacity-100 hover:bg-pink-500/20 hover:border-pink-400/50'
                            }`}
                            title={hasUserReaction ? 'Убрать лайк' : 'Поставить лайк'}
                          >
                            <span className="text-[10px]">{hasUserReaction || reactionsCount > 0 ? '❤️' : '🤍'}</span>
                          </button>
                        </div>
                        {!message.is_admin && message.user && (
                          <div className="flex items-center gap-2 mb-2">
                            {message.user.avatar && (
                              <div 
                                className="w-6 h-6 rounded-full bg-cover bg-center"
                                style={{ backgroundImage: `url(${message.user.avatar})` }}
                              />
                            )}
                            <span className="text-xs font-bold text-zinc-400">
                              {message.user.nickname}
                            </span>
                          </div>
                        )}
                        
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map(att => (
                              <a
                                key={att.id}
                                href={att.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                </svg>
                                {att.file_name}
                              </a>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-[10px] text-zinc-600 mt-1">
                          {new Date(message.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        
                        {/* Reactions badge с информацией кто поставил */}
                        {reactionsCount > 0 && (
                          <div 
                            className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-zinc-800/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1 border border-pink-400/30 cursor-default"
                            title={message.reactions?.map(r => r.user?.nickname || 'Пользователь').join(', ')}
                          >
                            <span className="text-[10px]">❤️</span>
                            <span className="text-[10px] text-pink-400 font-medium">{reactionsCount}</span>
                            {message.reactions && message.reactions[0]?.user?.nickname && (
                              <span className="text-[10px] text-zinc-400 max-w-[50px] truncate">
                                {message.reactions[0].user.nickname}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {isTyping && (
                  <div className={`flex ${selectedTicket?.typing_is_admin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${
                      selectedTicket?.typing_is_admin 
                        ? 'bg-[#6050ba]/20 border-[#6050ba]/30' 
                        : 'bg-white/10 border-white/20'
                    } border rounded-2xl p-3`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-zinc-400">
                          {selectedTicket?.typing_nickname || (selectedTicket?.typing_is_admin ? 'Администратор' : 'Пользователь')}
                        </span>
                      </div>
                      <div className="flex gap-1 items-center">
                        <span className={`w-2 h-2 ${selectedTicket?.typing_is_admin ? 'bg-[#6050ba]' : 'bg-zinc-400'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></span>
                        <span className={`w-2 h-2 ${selectedTicket?.typing_is_admin ? 'bg-[#6050ba]' : 'bg-zinc-400'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
                        <span className={`w-2 h-2 ${selectedTicket?.typing_is_admin ? 'bg-[#6050ba]' : 'bg-zinc-400'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
                        <span className="text-xs text-zinc-500 ml-2">печатает...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* Поле ввода */}
              {selectedTicket.status !== 'closed' && (
                <div className="p-4 bg-white/[0.05] border-t border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])}
                      className="hidden"
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition disabled:opacity-50"
                      title="Прикрепить файл"
                    >
                      {uploadingFile ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      )}
                    </button>
                    
                    <input
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                      placeholder="Введите ответ..."
                      className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6050ba]/50"
                      disabled={sending}
                    />
                    
                    <button
                      onClick={sendMessage}
                      disabled={sending || !newMessage.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-[#6050ba] to-[#8b5cf6] hover:from-[#7c4dff] hover:to-[#9d8df1] rounded-xl font-bold transition disabled:opacity-50"
                    >
                      {sending ? '...' : 'Отправить'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-[calc(100vh-300px)] flex items-center justify-center text-zinc-500">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>Выберите тикет для ответа</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
