'use client';
import React from 'react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export default function EmptyState({
  title = 'Выберите тикет',
  description = 'Выберите тикет из списка слева или создайте новый',
  onAction,
  actionLabel = 'Создать тикет',
}: EmptyStateProps) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 mx-auto mb-6 bg-white/5 rounded-2xl flex items-center justify-center">
          <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 mb-6">{description}</p>
        {onAction && (
          <button
            onClick={onAction}
            className="px-6 py-3 bg-gradient-to-r from-[#6050ba] to-[#8b5cf6] hover:from-[#7060ca] hover:to-[#9d8df1] rounded-xl font-bold text-sm transition"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
