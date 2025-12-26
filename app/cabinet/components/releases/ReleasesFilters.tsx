"use client";
import React from 'react';
import { Release, FilterState } from './types';
import { FILTER_OPTIONS, SORT_OPTIONS } from './constants';

interface ReleasesFiltersProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  releases: Release[];
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  totalCount: number;
  filteredCount: number;
}

export default function ReleasesFilters({
  filters,
  setFilters,
  releases,
  showFilters,
  setShowFilters,
  totalCount,
  filteredCount
}: ReleasesFiltersProps) {
  const genres = Array.from(new Set(releases.map(r => r.genre).filter(Boolean))) as string[];

  return (
    <div className="w-full lg:w-96 relative">
      <div className="space-y-3">
        {/* Поиск */}
        <SearchInput 
          value={filters.searchQuery}
          onChange={(value) => setFilters(prev => ({ ...prev, searchQuery: value }))}
        />

        {/* Кнопка показать фильтры */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="w-full flex items-center justify-between px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-sm hover:border-[#6050ba]/50 transition"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" strokeWidth="2"/>
            </svg>
            <span>Фильтры и сортировка</span>
          </div>
          <svg 
            className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <polyline points="6 9 12 15 18 9" strokeWidth="2"/>
          </svg>
        </button>
      </div>

      {/* Выпадающая панель фильтров */}
      {showFilters && (
        <FilterPanel 
          filters={filters}
          setFilters={setFilters}
          genres={genres}
        />
      )}
    </div>
  );
}

// Компонент поиска
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchInput({ value, onChange }: SearchInputProps) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Поиск по названию, артисту, жанру..."
        className="w-full bg-black/30 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm placeholder:text-zinc-500 focus:border-[#6050ba]/50 focus:outline-none transition"
      />
      <svg 
        className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <circle cx="11" cy="11" r="8" strokeWidth="2"/>
        <path d="m21 21-4.35-4.35" strokeWidth="2"/>
      </svg>
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
            <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
          </svg>
        </button>
      )}
    </div>
  );
}

// Панель фильтров
interface FilterPanelProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  genres: string[];
}

function FilterPanel({ filters, setFilters, genres }: FilterPanelProps) {
  const hasActiveFilters = filters.searchQuery || filters.filterStatus !== 'all' || filters.filterGenre !== 'all';

  return (
    <div className="absolute top-full left-0 right-0 mt-3 space-y-3 p-4 bg-[#0d0d0f] border border-white/10 rounded-xl shadow-2xl z-50">
      {/* Фильтр по статусу */}
      <div>
        <label className="text-xs text-zinc-400 mb-2 block font-medium">Статус</label>
        <div className="grid grid-cols-2 gap-2">
          {FILTER_OPTIONS.map((status) => (
            <button
              key={status.value}
              onClick={() => setFilters(prev => ({ ...prev, filterStatus: status.value }))}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition ${
                filters.filterStatus === status.value
                  ? 'bg-[#6050ba] text-white'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
              }`}
            >
              <span className="mr-1">{status.icon}</span>
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Фильтр по жанру */}
      <div>
        <label className="text-xs text-zinc-400 mb-2 block font-medium">Жанр</label>
        <select 
          value={filters.filterGenre} 
          onChange={(e) => setFilters(prev => ({ ...prev, filterGenre: e.target.value }))} 
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#6050ba]/50 focus:outline-none transition"
        >
          <option value="all">Все жанры</option>
          {genres.map((genre) => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>
      </div>

      {/* Сортировка */}
      <div>
        <label className="text-xs text-zinc-400 mb-2 block font-medium">Сортировка</label>
        <div className="flex gap-2">
          <select 
            value={filters.sortBy} 
            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))} 
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-[#6050ba]/50 focus:outline-none transition"
          >
            {SORT_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button 
            onClick={() => setFilters(prev => ({ ...prev, order: prev.order === 'asc' ? 'desc' : 'asc' }))} 
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition text-sm font-bold"
          >
            {filters.order === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      {/* Кнопка сброса */}
      {hasActiveFilters && (
        <button
          onClick={() => setFilters(prev => ({
            ...prev,
            searchQuery: '',
            filterStatus: 'all',
            filterGenre: 'all'
          }))}
          className="w-full px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm font-medium transition"
        >
          Сбросить фильтры
        </button>
      )}
    </div>
  );
}
