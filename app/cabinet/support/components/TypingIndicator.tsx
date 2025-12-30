'use client';
import React from 'react';

interface TypingIndicatorProps {
  nickname?: string | null;
  isAdmin?: boolean;
}

export default function TypingIndicator({ nickname, isAdmin = true }: TypingIndicatorProps) {
  // Для пользователя индикатор печатания админа - слева
  // Для админа индикатор печатания пользователя - слева
  const displayName = nickname || (isAdmin ? 'Поддержка' : 'Пользователь');
  
  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[70%] ${
        isAdmin 
          ? 'bg-white/10 border border-white/20' 
          : 'bg-[#6050ba]/20 border border-[#6050ba]/30'
      } rounded-2xl px-4 py-2.5`}>
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium ${isAdmin ? 'text-[#9d8df1]' : 'text-zinc-400'}`}>
            {displayName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className={`w-2 h-2 ${isAdmin ? 'bg-[#6050ba]' : 'bg-zinc-400'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }} />
            <span className={`w-2 h-2 ${isAdmin ? 'bg-[#6050ba]' : 'bg-zinc-400'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }} />
            <span className={`w-2 h-2 ${isAdmin ? 'bg-[#6050ba]' : 'bg-zinc-400'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-zinc-500">печатает...</span>
        </div>
      </div>
    </div>
  );
}
