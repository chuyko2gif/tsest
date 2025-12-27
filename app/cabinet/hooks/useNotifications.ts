import { useState, useCallback } from 'react';

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export interface ConfirmDialogState {
  show: boolean;
  message: string;
  description?: string;
  type?: 'standard' | 'danger';
  confirmText?: string;
  cancelText?: string;
  resolve: ((value: boolean) => void) | null;
}

export function useNotifications() {
  const [notification, setNotification] = useState<NotificationState>({
    show: false, 
    message: '', 
    type: 'success'
  });
  
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    show: false, 
    message: '',
    description: undefined,
    type: 'standard',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    resolve: null
  });
  
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  }, []);
  
  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, show: false }));
  }, []);
  
  // Promise-based confirm dialog
  const confirm = useCallback((
    message: string, 
    description?: string,
    type: 'standard' | 'danger' = 'standard',
    confirmText?: string,
    cancelText?: string
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmDialog({
        show: true,
        message,
        description,
        type,
        confirmText: confirmText || 'Подтвердить',
        cancelText: cancelText || 'Отмена',
        resolve,
      });
    });
  }, []);
  
  const handleConfirm = useCallback(() => {
    if (confirmDialog.resolve) {
      confirmDialog.resolve(true);
    }
    setConfirmDialog(prev => ({ ...prev, show: false, resolve: null }));
  }, [confirmDialog]);
  
  const handleCancel = useCallback(() => {
    if (confirmDialog.resolve) {
      confirmDialog.resolve(false);
    }
    setConfirmDialog(prev => ({ ...prev, show: false, resolve: null }));
  }, [confirmDialog]);
  
  return {
    notification,
    confirmDialog,
    showNotification,
    hideNotification,
    confirm,
    handleConfirm,
    handleCancel,
  };
}

export type UseNotificationsReturn = ReturnType<typeof useNotifications>;
