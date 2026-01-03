'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import SupportSidebar from '@/app/cabinet/components/support/SupportSidebar';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';
import { useSupportWidget } from '@/lib/hooks/useSupportWidget';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function GlobalSupportWidget() {
  const pathname = usePathname();
  const supportWidget = useSupportWidget();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Проверка на мобильное устройство
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Не показываем на админ панели, странице авторизации и регистрации
  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname === '/auth' || pathname === '/register' || pathname === '/reset-password' || pathname === '/change-email';

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setIsAuthenticated(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();

    // Подписываемся на изменения состояния авторизации
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        setIsAuthenticated(!!session?.user);
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await fetchWithAuth('/api/support/unread-count');
      const data = await response.json();
      if (response.ok) {
        setUnreadCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  }, []);

  useEffect(() => {
    if (!isAdminPage && !isAuthPage && isAuthenticated) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdminPage, isAuthPage, isAuthenticated, loadUnreadCount]);

  // Не рендерим если:
  // 1. Админ панель
  // 2. Страница авторизации
  // 3. Пользователь НЕ авторизован
  if (isAdminPage || isAuthPage || !isAuthenticated) {
    return null;
  }

  const handleClose = () => {
    supportWidget.close();
    loadUnreadCount();
  };

  return (
    <SupportSidebar 
      isOpen={supportWidget.isOpen}
      onOpen={supportWidget.open}
      onClose={handleClose}
      unreadCount={unreadCount}
      onUpdateUnreadCount={loadUnreadCount}
      isMobile={isMobile}
    />
  );
}
