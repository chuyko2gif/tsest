'use client';

import React, { useState, ReactNode, useMemo, useCallback } from 'react';
import { SupportWidgetContext } from '@/lib/useSupportWidget';

export default function SupportWidgetProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const contextValue = useMemo(() => ({
    isOpen,
    open,
    close,
    toggle,
  }), [isOpen, open, close, toggle]);

  return (
    <SupportWidgetContext.Provider value={contextValue}>
      {children}
    </SupportWidgetContext.Provider>
  );
}
