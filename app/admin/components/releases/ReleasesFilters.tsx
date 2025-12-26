'use client';

import React from 'react';
import { genreList } from './types';

interface ReleasesFiltersProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterGenre: string;
  setFilterGenre: (g: string) => void;
  filterUserRole: string;
  setFilterUserRole: (r: string) => void;
  sortBy: 'date' | 'title' | 'artist';
  setSortBy: (s: 'date' | 'title' | 'artist') => void;
  order: 'asc' | 'desc';
  setOrder: (o: 'asc' | 'desc') => void;
  showFilters: boolean;
  setShowFilters: (s: boolean) => void;
}

export default function ReleasesFilters({
  searchQuery,
  setSearchQuery,
  filterGenre,
  setFilterGenre,
  filterUserRole,
  setFilterUserRole,
  sortBy,
  setSortBy,
  order,
  setOrder,
  showFilters,
  setShowFilters
}: ReleasesFiltersProps) {
  return (
    <div className="space-y-4">
      {/* Поиск */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по названию, артисту, email..."
            className="w-full px-4 py-2 pl-10 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <svg className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            showFilters ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Фильтры
        </button>
      </div>

      {/* Расширенные фильтры */}
      {showFilters && (
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {/* Жанр */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Жанр</label>
              <select
                value={filterGenre}
                onChange={(e) => setFilterGenre(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">Все жанры</option>
                {genreList.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            
            {/* Тип пользователя */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Тип артиста</label>
              <select
                value={filterUserRole}
                onChange={(e) => setFilterUserRole(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="all">Все</option>
                <option value="basic">Basic</option>
                <option value="exclusive">Exclusive</option>
              </select>
            </div>
            
            {/* Сортировка */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Сортировка</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="date">По дате</option>
                <option value="title">По названию</option>
                <option value="artist">По артисту</option>
              </select>
            </div>
            
            {/* Порядок */}
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Порядок</label>
              <select
                value={order}
                onChange={(e) => setOrder(e.target.value as any)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
              >
                <option value="desc">Сначала новые</option>
                <option value="asc">Сначала старые</option>
              </select>
            </div>
          </div>
          
          {/* Кнопка сброса */}
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterGenre('all');
              setFilterUserRole('all');
              setSortBy('date');
              setOrder('desc');
            }}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Сбросить все фильтры
          </button>
        </div>
      )}
    </div>
  );
}
