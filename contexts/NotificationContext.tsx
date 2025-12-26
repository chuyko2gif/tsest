'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { FinanceNotification, FinanceNotificationContainer } from '@/components/FinanceNotification';

interface NotificationContextType {
  addNotification: (notification: Omit<FinanceNotification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<FinanceNotification[]>([]);

  const addNotification = useCallback((notification: Omit<FinanceNotification, 'id' | 'timestamp'>) => {
    const newNotification: FinanceNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
    };

    setNotifications((prev) => [...prev, newNotification]);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <FinanceNotificationContainer notifications={notifications} onClose={removeNotification} />
    </NotificationContext.Provider>
  );
};
