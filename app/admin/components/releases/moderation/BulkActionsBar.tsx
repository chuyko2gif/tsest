'use client';

import React from 'react';

interface BulkActionsBarProps {
  totalCount: number;
  selectedCount: number;
  onSelectAll: () => void;
  onPublish: () => void;
  onDelete: () => void;
  isPublishing: boolean;
}

export default function BulkActionsBar({
  totalCount,
  selectedCount,
  onSelectAll,
  onPublish,
  onDelete,
  isPublishing
}: BulkActionsBarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="mb-4 p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative w-5 h-5">
            <input 
              type="checkbox"
              checked={allSelected}
              onChange={onSelectAll}
              className="peer absolute opacity-0 w-full h-full cursor-pointer z-10"
            />
            <div className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 peer-checked:bg-[#6050ba] peer-checked:border-[#6050ba] transition-all duration-200 group-hover:border-[#6050ba]/50 absolute inset-0"></div>
            <svg 
              className="w-3.5 h-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 peer-checked:scale-100 transition-transform duration-200 pointer-events-none" 
              viewBox="0 0 12 10" 
              fill="none"
            >
              <path d="M1 5L4.5 8.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="text-sm font-medium group-hover:text-white transition-colors">
            Выбрать все ({totalCount})
          </span>
        </label>
        {selectedCount > 0 && (
          <span className="text-sm text-zinc-400">
            Выбрано: {selectedCount}
          </span>
        )}
      </div>
      
      {selectedCount > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={onPublish}
            disabled={isPublishing}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-black rounded-xl font-bold transition flex items-center gap-2"
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
                Публикуем...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                </svg>
                Опубликовать
              </>
            )}
          </button>
          
          <button
            onClick={onDelete}
            disabled={isPublishing}
            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-zinc-700 disabled:text-zinc-500 border-2 border-red-500/40 hover:border-red-500/60 text-red-400 rounded-xl font-bold transition flex items-center gap-2"
          >
            {isPublishing ? (
              <>
                <div className="w-4 h-4 border-2 border-red-400/20 border-t-red-400 rounded-full animate-spin"></div>
                Удаляем...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                Удалить
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
