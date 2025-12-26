'use client';
import React from 'react';

interface NotificationBannerProps {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export default function NotificationBanner({ show, message, type }: NotificationBannerProps) {
  if (!show) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`px-6 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
        type === 'success' 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
          : 'bg-red-500/10 border-red-500/30 text-red-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
}
