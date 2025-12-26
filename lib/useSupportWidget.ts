'use client';

import { createContext, useContext } from 'react';

interface SupportWidgetContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const SupportWidgetContext = createContext<SupportWidgetContextType | null>(null);

export const useSupportWidget = () => {
  const context = useContext(SupportWidgetContext);
  
  if (!context) {
    throw new Error('useSupportWidget must be used within a SupportWidgetProvider');
  }
  return context;
};
