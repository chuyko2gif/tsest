'use client';

import React from 'react';

interface Draft {
  id: number;
  title: string;
  content: string;
  category: string;
  updated_at: string;
}

interface DraftsModalProps {
  show: boolean;
  drafts: Draft[];
  onClose: () => void;
  onLoadDraft: (draft: Draft) => void;
  onDeleteDraft: (id: number) => void;
}

export function DraftsModal({ show, drafts, onClose, onLoadDraft, onDeleteDraft }: DraftsModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-start justify-center overflow-y-auto p-4 pt-16 pb-8">
      <div className="bg-[#1a1a1f] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-3xl w-full overflow-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Мои черновики</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {drafts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-zinc-500">Черновиков пока нет</p>
          </div>
        ) : (
          <div className="space-y-3">
            {drafts.map((draft) => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onLoad={() => onLoadDraft(draft)}
                onDelete={() => onDeleteDraft(draft.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DraftCardProps {
  draft: Draft;
  onLoad: () => void;
  onDelete: () => void;
}

function DraftCard({ draft, onLoad, onDelete }: DraftCardProps) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 hover:border-purple-500/50 transition-all cursor-pointer">
      <div className="flex gap-4">
        {/* Иконка */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
          </div>
        </div>

        {/* Информация */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="font-bold text-white truncate">
              {draft.title || 'Без заголовка'}
            </h4>
            <span className="flex-shrink-0 text-[10px] px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-400 border-amber-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
              <span>ЧЕРНОВИК</span>
            </span>
          </div>
          
          <p className="text-sm text-zinc-400 line-clamp-2 mb-2">
            {draft.content || 'Пустой черновик'}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {draft.category || 'Новость'}
            </span>
            <span className="text-[10px] text-zinc-500">
              Изменено: {new Date(draft.updated_at).toLocaleString('ru-RU', { 
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' 
              })}
            </span>
          </div>

          {/* Кнопки */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={(e) => { e.stopPropagation(); onLoad(); }}
              className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 rounded-lg text-xs font-bold transition"
            >
              Загрузить
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
