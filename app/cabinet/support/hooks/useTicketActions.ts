import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, Message, SupportUser } from '../types';

interface UseTicketActionsProps {
  user: SupportUser | null;
  selectedTicket: Ticket | null;
  setMessages: (messages: Message[]) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  setTickets: (tickets: Ticket[]) => void;
  setSending: (sending: boolean) => void;
  setNewMessage: (msg: string) => void;
  setShowNewTicket: (show: boolean) => void;
  setNewTicketSubject: (subject: string) => void;
  setNewTicketMessage: (message: string) => void;
  stopTyping: () => void;
}

export function useTicketActions({
  user,
  selectedTicket,
  setMessages,
  setSelectedTicket,
  setTickets,
  setSending,
  setNewMessage,
  setShowNewTicket,
  setNewTicketSubject,
  setNewTicketMessage,
  stopTyping,
}: UseTicketActionsProps) {
  
  // Загрузка тикетов
  const loadTickets = useCallback(async () => {
    const userId = user?.id;
    if (!userId || !supabase) {
      console.log('❌ Невозможно загрузить тикеты: user или supabase не инициализированы');
      return;
    }
    
    console.log('🔄 Загрузка тикетов для пользователя:', userId);
    
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('last_message_at', { ascending: false });
    
    if (error) {
      console.error('❌ Ошибка загрузки тикетов:', error);
    } else {
      console.log('✅ Загружено тикетов:', data?.length || 0);
    }
    
    setTickets(data || []);
  }, [user?.id, setTickets]);
  
  // Выбор тикета
  const selectTicket = useCallback(async (ticket: Ticket) => {
    if (!supabase) return;
    setSelectedTicket(ticket);
    
    const { data } = await supabase
      .from('ticket_messages')
      .select('*, attachments:ticket_attachments(*)')
      .eq('ticket_id', ticket.id)
      .order('created_at', { ascending: true });
    
    const messagesWithProfiles = (data || []).map((msg: any) => ({
      ...msg,
      user_avatar: msg.sender_avatar || null,
      user_nickname: msg.sender_nickname || null,
      user_email: msg.sender_email || null
    }));
    
    setMessages(messagesWithProfiles);

    await supabase
      .from('ticket_messages')
      .update({ is_read: true })
      .eq('ticket_id', ticket.id)
      .eq('is_admin', true)
      .eq('is_read', false);
  }, [setSelectedTicket, setMessages]);
  
  // Отправка сообщения
  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || !selectedTicket || !supabase || !user) return;

    setSending(true);
    try {
      await supabase.from('ticket_messages').insert({
        ticket_id: selectedTicket.id,
        user_id: user.id,
        message: message,
        is_admin: false,
      });

      setNewMessage('');
      stopTyping();
    } catch (e) {
      console.error('Ошибка:', e);
    } finally {
      setSending(false);
    }
  }, [selectedTicket, user, setSending, setNewMessage, stopTyping]);
  
  // Создание тикета
  const createTicket = useCallback(async (subject: string, message: string) => {
    if (!subject.trim() || !message.trim() || !supabase || !user) {
      alert('Заполните все поля');
      return;
    }

    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          user_id: user.id,
          subject: subject,
          status: 'open',
        })
        .select()
        .single();

      if (ticketError) throw ticketError;

      await supabase.from('ticket_messages').insert({
        ticket_id: ticket.id,
        user_id: user.id,
        message: message,
        is_admin: false,
      });

      setNewTicketSubject('');
      setNewTicketMessage('');
      setShowNewTicket(false);
      loadTickets();
      selectTicket(ticket);
    } catch (e) {
      console.error('Ошибка:', e);
      alert('Ошибка создания тикета');
    }
  }, [user, setNewTicketSubject, setNewTicketMessage, setShowNewTicket, loadTickets, selectTicket]);
  
  // Закрытие тикета
  const closeTicket = useCallback(async (ticketId: string) => {
    if (!confirm('Закрыть тикет? Он будет архивирован.') || !supabase || !user) return;
    
    await supabase
      .from('tickets')
      .update({ status: 'closed', closed_by: user.id })
      .eq('id', ticketId);
    
    loadTickets();
    setSelectedTicket(null);
  }, [user, loadTickets, setSelectedTicket]);
  
  // Удаление тикета
  const deleteTicket = useCallback(async (ticketId: string) => {
    if (!confirm('Удалить тикет без возможности восстановления?') || !supabase) return;
    
    await supabase
      .from('tickets')
      .delete()
      .eq('id', ticketId);
    
    loadTickets();
    if (selectedTicket?.id === ticketId) {
      setSelectedTicket(null);
    }
  }, [loadTickets, selectedTicket, setSelectedTicket]);
  
  return {
    loadTickets,
    selectTicket,
    sendMessage,
    createTicket,
    closeTicket,
    deleteTicket,
  };
}
