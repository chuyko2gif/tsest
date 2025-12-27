import { useState, useCallback } from 'react';

interface ConfirmOptions {
  message: string;
  description?: string;
  type?: 'standard' | 'danger';
  confirmText?: string;
  cancelText?: string;
}

interface ConfirmState extends ConfirmOptions {
  show: boolean;
  resolve: ((value: boolean) => void) | null;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>({
    show: false,
    message: '',
    description: undefined,
    type: 'standard',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        show: true,
        message: options.message,
        description: options.description,
        type: options.type || 'standard',
        confirmText: options.confirmText || 'Подтвердить',
        cancelText: options.cancelText || 'Отмена',
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (state.resolve) {
      state.resolve(true);
    }
    setState((prev) => ({ ...prev, show: false, resolve: null }));
  }, [state]);

  const handleCancel = useCallback(() => {
    if (state.resolve) {
      state.resolve(false);
    }
    setState((prev) => ({ ...prev, show: false, resolve: null }));
  }, [state]);

  return {
    confirm,
    confirmState: state,
    handleConfirm,
    handleCancel,
  };
}
