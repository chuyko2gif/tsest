"use client";
import React, { useEffect } from 'react';

export interface ToastProps {
  show?: boolean;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  onClose: () => void;
  duration?: number;
}

export default function Toast({ show = true, message, type, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const colors = {
    success: {
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/50',
      text: 'text-emerald-300',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-300',
      icon: '✕'
    },
    info: {
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/50',
      text: 'text-blue-300',
      icon: 'ℹ'
    },
    warning: {
      bg: 'bg-yellow-500/20',
      border: 'border-yellow-500/50',
      text: 'text-yellow-300',
      icon: '⚠'
    }
  };

  const config = colors[type];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-xl ${config.bg} ${config.border} shadow-2xl min-w-[280px] max-w-[400px]`}>
        <div className={`w-8 h-8 rounded-full ${config.bg} border ${config.border} flex items-center justify-center ${config.text} font-bold text-lg shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${config.text}`}>{message}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-6 h-6 rounded-lg hover:bg-white/10 transition flex items-center justify-center text-zinc-400 hover:text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
