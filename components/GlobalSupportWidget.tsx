'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import SupportSidebar from '@/app/cabinet/components/SupportSidebar';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';
import { useSupportWidget } from '@/lib/useSupportWidget';

export default function GlobalSupportWidget() {
  const pathname = usePathname();
  const supportWidget = useSupportWidget();
  const [unreadCount, setUnreadCount] = useState(0);

  // Не показываем на админ панели, странице авторизации и регистрации
  const isAdminPage = pathname?.startsWith('/admin');
  const isAuthPage = pathname === '/auth' || pathname === '/register' || pathname === '/reset-password' || pathname === '/change-email';

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
    if (!isAdminPage && !isAuthPage) {
      loadUnreadCount();
      const interval = setInterval(loadUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdminPage, isAuthPage, loadUnreadCount]);

  // Не рендерим на админ панели и странице авторизации
  if (isAdminPage || isAuthPage) {
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
    />
  );
}
