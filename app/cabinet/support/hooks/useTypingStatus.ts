import { useCallback, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, SupportUser } from '../types';

interface UseTypingStatusProps {
  user: SupportUser | null;
  selectedTicket: Ticket | null;
  setNewMessage: (msg: string) => void;
}

export function useTypingStatus({
  user,
  selectedTicket,
  setNewMessage,
}: UseTypingStatusProps) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const startTyping = useCallback(async () => {
    if (!selectedTicket || !supabase || !user) return;
    await supabase
      .from('tickets')
      .update({ is_typing: true, typing_user_id: user.id })
      .eq('id', selectedTicket.id);
  }, [selectedTicket, user]);

  const stopTyping = useCallback(async () => {
    if (!selectedTicket || !supabase) return;
    await supabase
      .from('tickets')
      .update({ is_typing: false, typing_user_id: null })
      .eq('id', selectedTicket.id);
  }, [selectedTicket]);

  const handleTyping = useCallback((value: string) => {
    setNewMessage(value);
    startTyping();
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 2000);
  }, [setNewMessage, startTyping, stopTyping]);

  return {
    startTyping,
    stopTyping,
    handleTyping,
    typingTimeoutRef,
  };
}
