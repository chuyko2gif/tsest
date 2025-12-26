'use client';

import React, { useState } from 'react';
import SupportContent from './support/SupportContent';

interface SupportSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
  unreadCount: number;
  onUpdateUnreadCount?: () => void;
}

export default function SupportSidebar({ isOpen, onClose, onOpen, unreadCount, onUpdateUnreadCount }: SupportSidebarProps) {
  const [isWidgetHidden, setIsWidgetHidden] = useState(false);

  return (
    <>
      {/* Виджет поддержки */}
      {!isOpen && !isWidgetHidden && (
        <div className="fixed bottom-6 right-6 z-[9999]">
          <div 
            onClick={onOpen}
            className="relative bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-2 border-blue-400/30 rounded-full shadow-2xl p-3 cursor-pointer transition-all hover:scale-110 group"
            title="Открыть поддержку"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-[20px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-zinc-900 transition-all duration-300 ease-in-out">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-[9998]"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-full w-[380px] bg-zinc-900 border-l border-zinc-800 shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/95">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Поддержка
            {unreadCount > 0 && (
              <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-red-500 rounded-full transition-all duration-300 ease-in-out">
                {unreadCount}
              </span>
            )}
          </h2>
          
          <button
            onClick={onClose}
            className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all duration-200 border border-red-500/20 hover:border-red-500/40"
            title="Закрыть"
          >
            <svg className="w-5 h-5 text-red-400 hover:text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-65px)] overflow-y-auto">
          <SupportContent onClose={onClose} onUpdateUnreadCount={onUpdateUnreadCount} />
        </div>
      </div>
    </>
  );
}
