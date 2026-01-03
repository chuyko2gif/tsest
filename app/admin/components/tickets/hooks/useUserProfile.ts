'use client';

import { useState } from 'react';
import { Ticket, UserProfile, UserTransaction } from '../types';

interface UseUserProfileReturn {
  viewingUser: UserProfile | null;
  setViewingUser: (user: UserProfile | null) => void;
  profileLoading: boolean;
  userReleases: any[];
  userPayouts: any[];
  userWithdrawals: any[];
  userTickets: any[];
  userTransactions: UserTransaction[];
  viewUserProfile: (ticket: Ticket) => Promise<void>;
}

export function useUserProfile(supabase: any): UseUserProfileReturn {
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [userReleases, setUserReleases] = useState<any[]>([]);
  const [userPayouts, setUserPayouts] = useState<any[]>([]);
  const [userWithdrawals, setUserWithdrawals] = useState<any[]>([]);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [userTransactions, setUserTransactions] = useState<UserTransaction[]>([]);

  const viewUserProfile = async (ticket: Ticket) => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    setProfileLoading(true);
    
    try {
      // Получаем профиль пользователя
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
      
      // Загружаем релизы
      const { data: releases } = await supabase
        .from('releases')
        .select('*')
        .eq('user_id', ticket.user_id)
        .neq('status', 'draft')
        .order('created_at', { ascending: false });
      setUserReleases(releases || []);
      
      // Загружаем выплаты
      const { data: payouts } = await supabase
        .from('payouts')
        .select(`*, transactions(*)`)
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
      
      // Загружаем тикеты
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
      
      // Объединяем транзакции и заявки
      const allTransactions: UserTransaction[] = [
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

  return {
    viewingUser,
    setViewingUser,
    profileLoading,
    userReleases,
    userPayouts,
    userWithdrawals,
    userTickets,
    userTransactions,
    viewUserProfile,
  };
}
