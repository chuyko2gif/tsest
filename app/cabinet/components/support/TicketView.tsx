'use client';
import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../../lib/fetchWithAuth';
import { statusColors, statusLabels, categoryLabels } from './TicketCard';
import TicketAvatar from '@/components/icons/TicketAvatar';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface TicketViewProps {
  ticket: any;
  onBack: () => void;
  onUpdate: () => void;
  onClose: () => void;
  onUpdateUnreadCount?: () => void;
}

export default function TicketView({ ticket, onBack, onUpdate, onClose, onUpdateUnreadCount }: TicketViewProps) {
  const [messages, setMessages] = useState(ticket.ticket_messages || []);
  const [newMessage, setNewMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [currentStatus, setCurrentStatus] = useState(ticket.status);
  const [adminTyping, setAdminTyping] = useState(false);
  const [adminTypingName, setAdminTypingName] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Получаем текущего пользователя
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
    };
    getUser();
  }, []);

  // Функция для переключения реакции
  const toggleReaction = async (messageId: string, hasReaction: boolean) => {
    if (!supabase || !currentUserId) return;
    
    try {
      if (hasReaction) {
        // Удаляем реакцию
        await supabase
          .from('ticket_message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', currentUserId);
        
        // Обновляем локально
        setMessages((prev: any[]) => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              reactions: (msg.reactions || []).filter((r: any) => r.user_id !== currentUserId)
            };
          }
          return msg;
        }));
      } else {
        // Добавляем реакцию
        const { data } = await supabase
          .from('ticket_message_reactions')
          .insert({
            message_id: messageId,
            user_id: currentUserId,
            reaction: '❤️'
          })
          .select()
          .single();
        
        if (data) {
          setMessages((prev: any[]) => prev.map(msg => {
            if (msg.id === messageId) {
              return {
                ...msg,
                reactions: [...(msg.reactions || []), data]
              };
            }
            return msg;
          }));
        }
      }
    } catch (e) {
      console.error('Ошибка реакции:', e);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > prevMessagesLengthRef.current) {
      scrollToBottom();
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (adminTyping) {
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [adminTyping]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const response = await fetchWithAuth(`/api/support/tickets/${ticket.id}/messages`);
        const data = await response.json();
        if (response.ok) {
          setMessages(data.messages || []);
        }
      } catch (err) {
        console.error('Error loading messages:', err);
      }
    };

    const loadTicket = async () => {
      try {
        const response = await fetchWithAuth(`/api/support/tickets/${ticket.id}`);
        const data = await response.json();
        if (response.ok && data.ticket) {
          if (data.ticket.status === 'closed' && currentStatus !== 'closed') {
            setCurrentStatus('closed');
            onUpdate();
            setTimeout(() => onBack(), 500);
            return;
          }
          if (data.ticket.status !== currentStatus) {
            setCurrentStatus(data.ticket.status);
            onUpdate();
          }
        }
      } catch (err) {
        console.error('Error loading ticket:', err);
      }
    };

    const markAsRead = async () => {
      try {
        const response = await fetchWithAuth(`/api/support/tickets/${ticket.id}/read`, { method: 'POST' });
        if (response.ok) {
          onUpdateUnreadCount?.();
        }
      } catch (err) {
        console.error('Error marking as read:', err);
      }
    };

    // Отмечаем как прочитанное сразу при открытии
    markAsRead();
    loadMessages();
    loadTicket();
    
    // Интервал загрузки сообщений - каждый раз отмечаем как прочитанное
    const interval = setInterval(() => {
      loadMessages();
      loadTicket();
      markAsRead(); // Отмечаем прочитанным при каждом обновлении
    }, 2000);

    const typingInterval = setInterval(async () => {
      try {
        const response = await fetchWithAuth(`/api/support/tickets/${ticket.id}/typing`);
        const data = await response.json();
        if (response.ok && data.isTyping && data.isAdmin && data.username) {
          setAdminTyping(true);
          setAdminTypingName(data.username);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setAdminTyping(false);
            setAdminTypingName('');
          }, 3000);
        } else {
          setAdminTyping(false);
          setAdminTypingName('');
        }
      } catch (err) {
        console.error('Error checking typing status:', err);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(typingInterval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    };
  }, [ticket.id, onUpdateUnreadCount, onUpdate, onBack, currentStatus]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    const uploadedUrls: string[] = [];
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError(`Файл "${file.name}" не является изображением.`);
          setTimeout(() => setError(''), 3000);
          e.target.value = '';
          setUploading(false);
          return;
        }
        if (file.size > MAX_FILE_SIZE) {
          setError(`Файл "${file.name}" слишком большой. Максимум 10 МБ.`);
          setTimeout(() => setError(''), 3000);
          e.target.value = '';
          setUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', file);
        const response = await fetchWithAuth('/api/support/upload', { method: 'POST', body: formData });
        const data = await response.json();

        if (response.ok) {
          uploadedUrls.push(data.url);
        } else {
          setError(data.error || 'Ошибка загрузки изображения');
          e.target.value = '';
          break;
        }
      }

      if (uploadedUrls.length > 0) {
        setImages([...images, ...uploadedUrls]);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Ошибка загрузки изображений');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && images.length === 0) return;

    setSending(true);
    setError('');

    try {
      const response = await fetchWithAuth(`/api/support/tickets/${ticket.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage, images }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([...messages, data.message]);
        setNewMessage('');
        setImages([]);
        onUpdate();
      } else {
        setError(data.error || 'Ошибка отправки сообщения');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/10 bg-white/5 backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <button
            onClick={onBack}
            className="px-3 py-1.5 flex items-center gap-1.5 text-sm text-white bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-white/20 hover:border-white/30 rounded-lg transition-all duration-200 group flex-shrink-0 shadow-lg"
            title="Назад к списку тикетов"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="font-semibold">Назад</span>
          </button>
          
          <div className="flex-1 min-w-0 text-right">
            <h3 className="text-sm font-bold text-white mb-1 truncate">{ticket.subject}</h3>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                statusColors[ticket.status as keyof typeof statusColors] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
              }`}>
                {statusLabels[ticket.status as keyof typeof statusLabels] || ticket.status}
              </span>
              
              {ticket.category && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  {categoryLabels[ticket.category] || ticket.category}
                </span>
              )}
              <span className="text-[10px] text-zinc-500">#{ticket.id.slice(0, 8)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg: any, idx: number) => {
          const isFromAdmin = msg.is_admin === true;
          // Системное сообщение (автоответ) - специальный ID
          const isSystemMessage = msg.sender_id === '00000000-0000-0000-0000-000000000000';
          
          const displayName = isSystemMessage 
            ? 'THQ Support' 
            : (msg.sender_nickname || msg.sender_username || msg.sender_email?.split('@')[0] || (isFromAdmin ? 'Поддержка' : 'Пользователь'));
          const displayAvatar = msg.sender_avatar;
          const displayEmail = msg.sender_email;
          const isFirstUserMessage = idx === 0 && !isFromAdmin && ticket?.release_id && ticket?.release;
          
          // Реакции
          const hasUserReaction = msg.reactions?.some((r: any) => r.user_id === currentUserId);
          const reactionsCount = msg.reactions?.length || 0;
          
          return (
            <div key={msg.id} className={`flex ${isFromAdmin ? 'justify-start' : 'justify-end'} group`}>
              <div className={`max-w-[85%] ${isFromAdmin ? '' : 'flex flex-col items-end'} relative`}>
                <div className={`flex items-center gap-2 mb-1 ${isFromAdmin ? '' : 'flex-row-reverse'}`}>
                  <TicketAvatar
                    src={displayAvatar}
                    name={displayName}
                    email={displayEmail}
                    size="xs"
                    isAdmin={isFromAdmin}
                  />
                  <div className={`flex flex-col ${isFromAdmin ? 'items-start' : 'items-end'}`}>
                    <span className={`text-xs font-medium ${isFromAdmin ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text' : 'text-blue-300'}`}>
                      {displayName}
                    </span>
                  </div>
                </div>

                <div className={`px-3 py-2 rounded-lg backdrop-blur-md border ${
                  isFromAdmin
                    ? 'bg-green-500/20 border-green-500/40'
                    : 'bg-blue-500/20 border-blue-500/40'
                }`}
                style={{ boxShadow: isFromAdmin ? '0 4px 16px 0 rgba(34, 197, 94, 0.2)' : '0 4px 16px 0 rgba(59, 130, 246, 0.2)' }}
                onDoubleClick={() => toggleReaction(msg.id, hasUserReaction)}
                >
                  {msg.message && <p className="text-sm text-white whitespace-pre-wrap break-words">{msg.message}</p>}

                  {msg.images && msg.images.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {msg.images.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                          <img src={url} alt="" className="max-w-[200px] rounded cursor-pointer hover:opacity-80 transition-opacity" />
                        </a>
                      ))}
                    </div>
                  )}

                  {isFirstUserMessage && ticket.release && (
                    <div className="mt-3 pt-3 border-t border-purple-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                        </svg>
                        <span className="text-xs text-purple-300 font-medium">Обращение по релизу:</span>
                      </div>
                      <div className="flex items-center gap-3 bg-black/30 rounded-lg p-2">
                        {ticket.release.artwork_url ? (
                          <img src={ticket.release.artwork_url} alt={ticket.release.title} className="w-12 h-12 rounded object-cover flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                            </svg>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{ticket.release.title}</div>
                          <div className="text-xs text-zinc-400 truncate">{ticket.release.artist}</div>
                          {ticket.release.status && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                              {ticket.release.status === 'pending' && '⏳ На модерации'}
                              {ticket.release.status === 'distributed' && '📤 На дистрибьюции'}
                              {ticket.release.status === 'rejected' && '❌ Отклонён'}
                              {ticket.release.status === 'published' && '🎵 Опубликован'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-1 text-[10px] text-zinc-500">
                    {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
                
                {/* Кнопка реакции - под сообщением */}
                <div className={`flex items-center gap-1 mt-1 ${isFromAdmin ? 'justify-start' : 'justify-end'}`}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleReaction(msg.id, hasUserReaction);
                    }}
                    className={`h-5 px-1.5 rounded-full flex items-center gap-1 transition-all text-[10px] ${
                      hasUserReaction || reactionsCount > 0
                        ? 'bg-pink-500/30 border border-pink-400/40' 
                        : 'bg-zinc-800/60 border border-zinc-600/40 opacity-0 group-hover:opacity-100 hover:bg-pink-500/20 hover:border-pink-400/40'
                    }`}
                    title={msg.reactions?.map((r: any) => r.user?.nickname || 'Пользователь').join(', ') || 'Поставить лайк'}
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
        <div ref={messagesEndRef} />

        {adminTyping && (
          <div className="flex justify-start px-4 py-1 animate-fade-in">
            <div className="bg-white/5 backdrop-blur-md rounded-lg px-3 py-1.5 border border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-300">{adminTypingName}</span>
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
      </div>

      {/* Input */}
      {ticket.status !== 'closed' && (
        <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-md">
          <form onSubmit={handleSendMessage} className="space-y-3">
            <textarea
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (e.target.value.trim()) {
                  fetchWithAuth(`/api/support/tickets/${ticket.id}/typing`, {
                    method: 'POST',
                    body: JSON.stringify({ isTyping: true, isAdmin: false })
                  }).catch(err => console.error('Error sending typing status:', err));
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (newMessage.trim() || images.length > 0) {
                    const form = e.currentTarget.closest('form');
                    if (form) form.requestSubmit();
                  }
                }
              }}
              placeholder="Отправить сообщение"
              className="w-full px-3 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none"
              rows={2}
            />

            <div className="flex items-center gap-2">
              <label className="flex-1 cursor-pointer">
                <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" />
                <div className="px-3 py-2 bg-white/5 backdrop-blur-md hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-sm text-zinc-400 hover:text-white transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {uploading ? 'Загрузка...' : 'Прикрепить'}
                </div>
              </label>

              <button
                type="submit"
                disabled={sending || uploading || (!newMessage.trim() && images.length === 0)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500/40 to-purple-500/40 backdrop-blur-md hover:from-blue-500/50 hover:to-purple-500/50 border border-white/20 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                style={{ boxShadow: '0 4px 16px 0 rgba(59, 130, 246, 0.3)' }}
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Отправка...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Отправить
                  </>
                )}
              </button>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt="" className="w-20 h-20 object-cover rounded-lg border-2 border-zinc-700" />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="p-2 bg-red-500/10 backdrop-blur-md border border-red-500/30 rounded text-red-400 text-xs">{error}</div>
            )}
          </form>
        </div>
      )}
    </div>
  );
}
