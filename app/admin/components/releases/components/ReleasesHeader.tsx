'use client';

import React from 'react';

interface ReleasesHeaderProps {
  viewMode: 'moderation' | 'archive' | 'create';
  setViewMode: (mode: 'moderation' | 'archive' | 'create') => void;
  setStatusFilter: (status: string) => void;
  totalCount: number;
  filteredCount: number;
}

export default function ReleasesHeader({
  viewMode,
  setViewMode,
  setStatusFilter,
  totalCount,
  filteredCount
}: ReleasesHeaderProps) {
  return (
    <div className="flex-1">
      <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight mb-2 text-center lg:text-left">
        Управление релизами
      </h2>
      <p className="text-xs sm:text-sm text-zinc-500 mb-3 sm:mb-4">
        Найдено: {filteredCount} из {totalCount}
      </p>
      
      {/* Переключатель режимов */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setViewMode('moderation');
            setStatusFilter('pending');
          }}
          className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition ${
            viewMode === 'moderation' 
              ? 'bg-[#6050ba] text-white' 
              : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          Модерация
        </button>
        <button
          onClick={() => {
            setViewMode('archive');
            setStatusFilter('all');
          }}
          className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition ${
            viewMode === 'archive' 
              ? 'bg-[#6050ba] text-white' 
              : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          Архив
        </button>
        <button
          onClick={() => setViewMode('create')}
          className={`px-3 sm:px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            viewMode === 'create' 
              ? 'bg-emerald-500 text-white' 
              : 'bg-white/5 text-zinc-400 hover:bg-white/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Добавить релиз
        </button>
      </div>
    </div>
  );
}
