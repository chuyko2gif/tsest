'use client';

import React from 'react';

interface ReleaseInfoModalProps {
  release: any;
  onClose: () => void;
}

export default function ReleaseInfoModal({ release, onClose }: ReleaseInfoModalProps) {
  if (!release) return null;

  const statusConfig: Record<string, { label: string; color: string; emoji: string }> = {
    pending: { label: 'На модерации', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40', emoji: '⏳' },
    approved: { label: 'Одобрен', color: 'bg-green-500/20 text-green-300 border-green-500/40', emoji: '✅' },
    rejected: { label: 'Отклонен', color: 'bg-red-500/20 text-red-300 border-red-500/40', emoji: '❌' },
    published: { label: 'Опубликован', color: 'bg-purple-500/20 text-purple-300 border-purple-500/40', emoji: '🎵' }
  };

  const status = statusConfig[release.status] || { 
    label: release.status, 
    color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/40', 
    emoji: '📀' 
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-purple-500/30 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900" onClick={(e) => e.stopPropagation()}>
        {/* Хедер */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-900/50 to-blue-900/50 backdrop-blur-sm border-b border-purple-500/30 p-6 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Информация о релизе</h3>
              <p className="text-sm text-purple-300">Полные данные</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20 hover:border-red-500/40"
          >
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Контент */}
        <div className="p-6 space-y-6">
          {/* Обложка и основная информация */}
          <div className="flex gap-6">
            <div className="flex-shrink-0">
              {release.artwork_url ? (
                <img 
                  src={release.artwork_url} 
                  alt={release.title}
                  className="w-48 h-48 rounded-xl object-cover shadow-2xl shadow-purple-500/20"
                />
              ) : (
                <div className="w-48 h-48 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-2xl">
                  <svg className="w-24 h-24 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-3xl font-black text-white mb-2">{release.title}</h2>
              <p className="text-xl text-purple-300 mb-4">{release.artist}</p>
              
              {/* Статус */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border-2 ${status.color} mb-4`}>
                <span className="text-2xl">{status.emoji}</span>
                <span className="font-bold">{status.label}</span>
              </div>
            </div>
          </div>

          {/* Детали */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
              <p className="text-xs text-zinc-500 mb-1">ID Релиза</p>
              <p className="text-sm font-mono text-white break-all">{release.id}</p>
            </div>
            
            {release.created_at && (
              <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl">
                <p className="text-xs text-zinc-500 mb-1">Дата создания</p>
                <p className="text-sm text-white">
                  {new Date(release.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Дополнительная информация */}
          <div className="p-6 bg-gradient-to-br from-purple-900/10 to-blue-900/10 border border-purple-500/20 rounded-xl">
            <h4 className="text-sm font-bold text-purple-300 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Дополнительная информация
            </h4>
            <div className="text-sm text-zinc-300 space-y-2">
              <p>• Этот релиз был выбран пользователем при создании тикета</p>
              <p>• Вы можете посмотреть полную информацию о релизе в разделе модерации</p>
              {release.status === 'pending' && (
                <p className="text-yellow-300">• Релиз находится на модерации и ожидает проверки</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
