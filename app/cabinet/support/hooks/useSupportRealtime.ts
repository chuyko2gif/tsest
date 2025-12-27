import React, { useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, Message, SupportUser } from '../types';
import { showNotificationToast, playNotificationSound } from '../utils';

interface UseSupportRealtimeProps {
  user: SupportUser | null;
  selectedTicket: Ticket | null;
  notifications: boolean;
  soundEnabled: boolean;
  setSelectedTicket: (ticket: Ticket | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsTyping: (typing: boolean) => void;
  loadTickets: () => void;
}

export function useSupportRealtime({
  user,
  selectedTicket,
  notifications,
  soundEnabled,
  setSelectedTicket,
  setMessages,
  setIsTyping,
  loadTickets,
}: UseSupportRealtimeProps) {
  
  // Используем refs для избежания лишних ререндеров
  const loadTicketsRef = useRef(loadTickets);
  const notificationsRef = useRef(notifications);
  const soundEnabledRef = useRef(soundEnabled);
  const selectedTicketRef = useRef(selectedTicket);
  
  // Обновляем refs при изменении значений
  useEffect(() => {
    loadTicketsRef.current = loadTickets;
  }, [loadTickets]);
  
  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);
  
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  
  useEffect(() => {
    selectedTicketRef.current = selectedTicket;
  }, [selectedTicket]);
  
  useEffect(() => {
    const userId = user?.id;
    if (!supabase || !userId) return;

    const messageSubscription = supabase
      .channel('ticket_messages')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'ticket_messages' },
        async (payload) => {
          if (!supabase) return;
          const newMsg = payload.new as Message;
          const currentTicket = selectedTicketRef.current;
          
          if (currentTicket && newMsg.ticket_id === currentTicket.id) {
            const { data } = await supabase
              .from('ticket_messages')
              .select('*, attachments:ticket_attachments(*)')
              .eq('id', newMsg.id)
              .single();
            
            if (data) {
              setMessages((prev: Message[]) => [...prev, data]);
              if (newMsg.is_admin && notificationsRef.current) {
                showNotificationToast('Новое сообщение от поддержки');
                if (soundEnabledRef.current) playNotificationSound();
              }
              if (newMsg.is_admin) {
                await supabase
                  .from('ticket_messages')
                  .update({ is_read: true })
                  .eq('id', newMsg.id);
              }
            }
          }
          loadTicketsRef.current();
        }
      )
      .subscribe();

    const ticketSubscription = supabase
      .channel('tickets_updates')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets' },
        (payload) => {
          const ticket = payload.new as Ticket;
          const currentTicket = selectedTicketRef.current;
          
          if (currentTicket && ticket.id === currentTicket.id) {
            setSelectedTicket(ticket);
            setIsTyping(ticket.is_typing && ticket.typing_user_id !== userId);
          }
          loadTicketsRef.current();
        }
      )
      .subscribe();

    return () => {
      messageSubscription.unsubscribe();
      ticketSubscription.unsubscribe();
    };
  }, [user?.id, setSelectedTicket, setMessages, setIsTyping]);
}
