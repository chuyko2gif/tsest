"use client";
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Ticket, TicketMessage } from '../lib/types';

interface SupportTabProps {
  userId: string;
}

export default function SupportTab({ userId }: SupportTabProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTicketSubject, setNewTicketSubject] = useState('');
  const [newTicketMessage, setNewTicketMessage] = useState('');
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [showNewMessageNotification, setShowNewMessageNotification] = useState(false);
  const [newAdminMessage, setNewAdminMessage] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTickets = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setTickets(data);
      }
    } catch (err) {
      console.error('Error loading tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setMessages(data);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  useEffect(() => {
    if (userId) {
      loadTickets();
      
      if (supabase) {
        const ticketChannel = supabase
          .channel('ticket-messages-realtime')
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'ticket_messages',
          }, async (payload: any) => {
            if (!supabase) return;
            console.log('🔔 Новое сообщение в тикете:', payload);
            const newMsg = payload.new;
            
            if (newMsg && newMsg.is_admin) {
              const { data: ticket } = await supabase
                .from('tickets')
                .select('*')
                .eq('id', newMsg.ticket_id)
                .eq('user_id', userId)
                .single();
              
              if (ticket) {
                setNewAdminMessage({ ...newMsg, ticket });
                setShowNewMessageNotification(true);
                
                if (selectedTicket && selectedTicket.id === newMsg.ticket_id) {
                  loadMessages(newMsg.ticket_id);
                }
                
                loadTickets();
              }
            }
          })
          .subscribe();
        
        return () => {
          if (supabase) {
            supabase.removeChannel(ticketChannel);
          }
        };
      }
    }
  }, [userId, selectedTicket]);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const createTicket = async () => {
    if (!supabase || !newTicketSubject.trim() || !newTicketMessage.trim()) return;
    
    setCreatingTicket(true);
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          user_id: userId,
          subject: newTicketSubject.trim(),
          status: 'open'
        })
        .select()
        .single();
      
      if (ticketError || !ticket) {
        console.error('Error creating ticket:', ticketError);
        return;
      }

      await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: ticket.id,
          user_id: userId,
          message: newTicketMessage.trim(),
          is_admin: false
        });

      setNewTicketSubject('');
      setNewTicketMessage('');
      setShowNewTicketForm(false);
      loadTickets();
      setSelectedTicket(ticket);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setCreatingTicket(false);
    }
  };

  const sendReply = async () => {
    if (!supabase || !replyText.trim() || !selectedTicket) return;
    
    setSending(true);
    try {
      const { error } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: userId,
          message: replyText.trim(),
          is_admin: false
        });
      
      if (!error) {
        setReplyText('');
        loadMessages(selectedTicket.id);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setSending(false);
    }
  };

  const statusColors = {
    open: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', label: 'Открыт' },
    in_progress: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'В работе' },
    closed: { bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', label: 'Закрыт' }
  };

  if (loading) {
    return <div className="text-zinc-600 py-8 text-center">Загрузка...</div>;
  }

  return (
    <div className="animate-fade-up">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Поддержка</h2>
          <p className="text-sm text-zinc-500">Задайте вопрос администрации</p>
        </div>
        {!selectedTicket && !showNewTicketForm && (
          <button
            onClick={() => setShowNewTicketForm(true)}
            className="px-6 py-3 bg-[#6050ba] hover:bg-[#5040aa] rounded-xl font-bold text-sm transition"
          >
            + Новый тикет
          </button>
        )}
      </div>

      {showNewTicketForm && !selectedTicket && (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 mb-6 animate-fade-up">
          <h3 className="text-lg font-bold mb-4">Создать обращение</h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Тема</label>
              <input
                type="text"
                value={newTicketSubject}
                onChange={(e) => setNewTicketSubject(e.target.value)}
                placeholder="Кратко опишите проблему"
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm focus:border-[#6050ba]/50 transition"
              />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Сообщение</label>
              <textarea
                value={newTicketMessage}
                onChange={(e) => setNewTicketMessage(e.target.value)}
                placeholder="Подробно опишите вашу проблему или вопрос..."
                className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm resize-none h-32 focus:border-[#6050ba]/50 transition"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={createTicket}
                disabled={!newTicketSubject.trim() || !newTicketMessage.trim() || creatingTicket}
                className="flex-1 py-3 bg-[#6050ba] hover:bg-[#5040aa] disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition"
              >
                {creatingTicket ? 'Создание...' : 'Отправить'}
              </button>
              <button
                onClick={() => { setShowNewTicketForm(false); setNewTicketSubject(''); setNewTicketMessage(''); }}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {!selectedTicket ? (
        <>
          {tickets.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
              <p className="text-4xl mb-4">📭</p>
              <p className="text-zinc-400 mb-2">У вас пока нет обращений</p>
              <p className="text-xs text-zinc-600">Нажмите "Новый тикет" чтобы создать обращение</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map(ticket => {
                const sc = statusColors[ticket.status];
                return (
                  <button
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`w-full p-4 ${sc.bg} border ${sc.border} rounded-xl text-left hover:scale-[1.005] transition-all`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 ${sc.bg} ${sc.text} rounded-full border ${sc.border}`}>
                            {sc.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-white truncate">{ticket.subject}</h3>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] text-zinc-600">
                          {new Date(ticket.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <button
            onClick={() => { setSelectedTicket(null); setMessages([]); }}
            className="text-sm text-zinc-400 hover:text-white transition flex items-center gap-2 mb-4"
          >
            ← Назад к списку
          </button>

          <div className={`p-4 ${statusColors[selectedTicket.status].bg} border ${statusColors[selectedTicket.status].border} rounded-xl mb-4`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[10px] px-2 py-0.5 ${statusColors[selectedTicket.status].bg} ${statusColors[selectedTicket.status].text} rounded-full border ${statusColors[selectedTicket.status].border}`}>
                {statusColors[selectedTicket.status].label}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white">{selectedTicket.subject}</h2>
          </div>

          <div className="bg-black/20 rounded-xl p-4 max-h-80 overflow-y-auto space-y-3 mb-4">
            {messages.length === 0 ? (
              <div className="text-zinc-600 text-center py-8">Загрузка сообщений...</div>
            ) : (
              messages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl max-w-[80%] ${
                    msg.is_admin 
                      ? 'bg-[#6050ba]/20 border border-[#6050ba]/30 ml-auto' 
                      : 'bg-white/5 border border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold ${msg.is_admin ? 'text-[#9d8df1]' : 'text-zinc-400'}`}>
                      {msg.is_admin ? '🔴 Поддержка' : '👤 Вы'}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(msg.created_at).toLocaleString('ru-RU')}
                    </span>
                  </div>
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {selectedTicket.status !== 'closed' ? (
            <div className="space-y-3">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Напишите ответ..."
                className="w-full p-4 bg-black/30 border border-white/10 rounded-xl text-sm resize-none h-20 focus:border-[#6050ba]/50 transition"
              />
              <button
                onClick={sendReply}
                disabled={!replyText.trim() || sending}
                className="w-full py-3 bg-[#6050ba] hover:bg-[#5040aa] disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-xl font-bold text-sm transition"
              >
                {sending ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          ) : (
            <div className="text-center py-4 bg-zinc-800/50 rounded-xl text-zinc-500 text-sm">
              Этот тикет закрыт. Создайте новый, если у вас есть вопросы.
            </div>
          )}
        </>
      )}
      
      {/* Уведомление о новом сообщении от администратора */}
      {showNewMessageNotification && newAdminMessage && (
        <div className="fixed bottom-6 left-6 z-[150] animate-in slide-in-from-left duration-300">
          <div 
            className="bg-gradient-to-br from-[#1a1a1f] to-[#0d0d0f] border border-[#6050ba]/50 rounded-2xl p-4 shadow-2xl max-w-sm"
            style={{ boxShadow: '0 0 40px rgba(96, 80, 186, 0.3)' }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-[#6050ba]/20 border border-[#6050ba]/30 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-[#6050ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-white mb-1">Новый ответ в тикете!</div>
                <div className="text-xs text-zinc-400 mb-2 truncate">
                  {newAdminMessage.ticket?.subject || 'Тикет'}
                </div>
                <div className="text-xs text-zinc-300 line-clamp-2">
                  {newAdminMessage.message}
                </div>
              </div>
              <button
                onClick={() => setShowNewMessageNotification(false)}
                className="text-zinc-500 hover:text-white transition p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  setSelectedTicket(newAdminMessage.ticket);
                  setShowNewMessageNotification(false);
                }}
                className="flex-1 py-2 bg-[#6050ba] hover:bg-[#5040aa] rounded-lg font-bold text-xs transition"
              >
                Открыть тикет
              </button>
              <button
                onClick={() => setShowNewMessageNotification(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition"
              >
                Позже
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
