"use client";
import React from 'react';
import { Release } from './types';

interface ReleasesHeaderProps {
  showArchive: boolean;
  setShowArchive: (show: boolean) => void;
  releases: Release[];
  filteredCount: number;
}

export default function ReleasesHeader({
  showArchive,
  setShowArchive,
  releases,
  filteredCount
}: ReleasesHeaderProps) {
  const draftsCount = releases.filter(r => r.status === 'draft').length;

  if (showArchive) {
    return (
      <div className="flex items-center gap-4">
        <button
          onClick={() => setShowArchive(false)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="text-sm font-medium">Назад</span>
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-black uppercase tracking-tight">Архив (Черновики)</h2>
          <p className="text-sm text-zinc-500 mt-1">
            Показано: {filteredCount} из {draftsCount}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight">Мои релизы</h2>
        <p className="text-sm text-zinc-500 mt-1">
          Найдено: {filteredCount} из {releases.length}
        </p>
      </div>
      <button
        onClick={() => setShowArchive(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
        <span className="text-sm font-medium">Архив ({draftsCount})</span>
      </button>
    </div>
  );
}
