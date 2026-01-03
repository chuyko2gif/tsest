'use client';

import React, { useState } from 'react';

interface SearchAndFiltersProps {
  viewMode: 'moderation' | 'archive' | 'create';
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  filterUserRole: string;
  setFilterUserRole: (role: string) => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

export default function SearchAndFilters({
  viewMode,
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  filterUserRole,
  setFilterUserRole,
  filterDate,
  setFilterDate,
  loading,
  onRefresh
}: SearchAndFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  if (viewMode === 'create') return null;

  return (
    <div className="w-full lg:w-96 relative">
      <div className="space-y-3">
        {/* Кнопка обновления и поиск */}
        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition flex items-center gap-2 disabled:opacity-50 flex-shrink-0"
            title="Обновить список релизов"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* Поиск */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={(e) => e.target.blur()}
              onKeyDown={(e) => {
                if (e.key === 'Escape' || e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              placeholder="Поиск..."
              className="w-full bg-black/30 border border-white/10 rounded-xl pl-9 sm:pl-11 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm placeholder:text-zinc-500 focus:border-[#6050ba]/50 focus:outline-none transition"
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
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2"/>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2"/>
                </svg>
              </button>
            )}
          </div>
        </div>

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
        <FiltersPanel
          viewMode={viewMode}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          filterUserRole={filterUserRole}
          setFilterUserRole={setFilterUserRole}
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showCalendar={showCalendar}
          setShowCalendar={setShowCalendar}
          calendarMonth={calendarMonth}
          setCalendarMonth={setCalendarMonth}
          calendarYear={calendarYear}
          setCalendarYear={setCalendarYear}
        />
      )}
    </div>
  );
}

interface FiltersPanelProps {
  viewMode: 'moderation' | 'archive' | 'create';
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  filterUserRole: string;
  setFilterUserRole: (role: string) => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
  calendarMonth: number;
  setCalendarMonth: (month: number) => void;
  calendarYear: number;
  setCalendarYear: (year: number) => void;
}

function FiltersPanel({
  viewMode,
  statusFilter,
  setStatusFilter,
  filterUserRole,
  setFilterUserRole,
  filterDate,
  setFilterDate,
  searchQuery,
  setSearchQuery,
  showCalendar,
  setShowCalendar,
  calendarMonth,
  setCalendarMonth,
  calendarYear,
  setCalendarYear
}: FiltersPanelProps) {
  const hasFilters = searchQuery || filterDate || filterUserRole !== 'all' || (viewMode === 'archive' && statusFilter !== 'all');

  return (
    <div className="absolute top-full left-0 right-0 mt-3 space-y-4 p-5 bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50">
      {/* Фильтр по статусу (только в архиве) */}
      {viewMode === 'archive' && (
        <div className="space-y-2">
          <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Статус релиза
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'all', label: 'Все', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
              { value: 'distributed', label: 'На дистрибьюции', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'blue' },
              { value: 'published', label: 'Опубликован', icon: 'M5 13l4 4L19 7', color: 'green' },
              { value: 'rejected', label: 'Отклонённые', icon: 'M6 18L18 6M6 6l12 12', color: 'red' }
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`group relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  statusFilter === status.value
                    ? status.color === 'blue' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : status.color === 'green' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
                    : status.color === 'red' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-[#6050ba] to-[#8070da] text-white shadow-lg shadow-[#6050ba]/30'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={status.icon} />
                  </svg>
                  {status.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Фильтр по типу пользователя */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Тип подписки
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'all', label: 'Все' },
            { value: 'basic', label: 'Basic' },
            { value: 'exclusive', label: 'Exclusive' }
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => setFilterUserRole(type.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                filterUserRole === type.value
                  ? 'bg-gradient-to-r from-[#6050ba] to-[#8070da] text-white shadow-lg shadow-[#6050ba]/30'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Фильтр по дате */}
      <div className="space-y-2">
        <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Дата релиза
        </label>
        <DatePicker
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          showCalendar={showCalendar}
          setShowCalendar={setShowCalendar}
          calendarMonth={calendarMonth}
          setCalendarMonth={setCalendarMonth}
          calendarYear={calendarYear}
          setCalendarYear={setCalendarYear}
        />
      </div>

      {/* Кнопка сброса */}
      {hasFilters && (
        <button
          onClick={() => {
            setSearchQuery('');
            setFilterDate('');
            setFilterUserRole('all');
            if (viewMode === 'archive') setStatusFilter('all');
          }}
          className="w-full mt-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold text-sm transition-all border border-red-500/20 hover:border-red-500/40 flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Сбросить все фильтры
        </button>
      )}
    </div>
  );
}

interface DatePickerProps {
  filterDate: string;
  setFilterDate: (date: string) => void;
  showCalendar: boolean;
  setShowCalendar: (show: boolean) => void;
  calendarMonth: number;
  setCalendarMonth: (month: number) => void;
  calendarYear: number;
  setCalendarYear: (year: number) => void;
}

function DatePicker({
  filterDate,
  setFilterDate,
  showCalendar,
  setShowCalendar,
  calendarMonth,
  setCalendarMonth,
  calendarYear,
  setCalendarYear
}: DatePickerProps) {
  const safeMonth = Math.max(0, Math.min(11, calendarMonth));
  const safeYear = Math.max(2020, Math.min(2100, calendarYear));

  return (
    <div className="relative inline-block w-full">
      <div 
        onClick={() => setShowCalendar(!showCalendar)}
        className="w-full inline-flex px-4 py-2.5 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl border border-white/10 cursor-pointer items-center gap-2 text-sm hover:border-[#6050ba]/50 transition"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
          <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
          <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
          <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
        </svg>
        <span className={filterDate ? 'text-white' : 'text-zinc-500'}>
          {filterDate ? new Date(filterDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Выберите дату релиза'}
        </span>
        {filterDate && (
          <button
            onClick={(e) => { e.stopPropagation(); setFilterDate(''); }}
            className="ml-auto text-zinc-400 hover:text-white transition"
            title="Очистить дату"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {showCalendar && (
        <div className="absolute z-50 mt-1 p-3 bg-[#0d0d0f] border border-[#6050ba]/30 rounded-xl shadow-2xl w-72">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => {
              if (safeMonth === 0) {
                setCalendarMonth(11);
                setCalendarYear(safeYear - 1);
              } else {
                setCalendarMonth(safeMonth - 1);
              }
            }} className="p-1 hover:bg-white/5 rounded-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
            </button>
            <div className="font-bold text-sm">{new Date(safeYear, safeMonth).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
            <button onClick={() => {
              if (safeMonth === 11) {
                setCalendarMonth(0);
                setCalendarYear(safeYear + 1);
              } else {
                setCalendarMonth(safeMonth + 1);
              }
            }} className="p-1 hover:bg-white/5 rounded-md">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => (
              <div key={day} className="text-center text-[10px] text-zinc-500 font-bold py-1">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {(() => {
              const firstDay = new Date(safeYear, safeMonth, 1).getDay();
              const daysInMonth = new Date(safeYear, safeMonth + 1, 0).getDate();
              const startDay = firstDay === 0 ? 6 : firstDay - 1;
              const days = [];
              
              for (let i = 0; i < startDay; i++) {
                days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
              }
              
              for (let day = 1; day <= daysInMonth; day++) {
                const month = safeMonth + 1;
                const monthStr = month < 10 ? `0${month}` : `${month}`;
                const dayStr = day < 10 ? `0${day}` : `${day}`;
                const dateStr = `${safeYear}-${monthStr}-${dayStr}`;
                const isSelected = filterDate === dateStr;
                
                days.push(
                  <button 
                    key={`day-${day}`} 
                    onClick={() => { setFilterDate(dateStr); setShowCalendar(false); }}
                    className={`w-8 h-8 rounded-md text-xs font-medium transition-all ${
                      isSelected 
                        ? 'bg-gradient-to-br from-[#6050ba] to-[#9d8df1] text-white' 
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {day}
                  </button>
                );
              }
              
              return days;
            })()}
          </div>
        </div>
      )}
      
      {filterDate && (
        <div className="text-xs text-zinc-500 flex items-center gap-1 mt-2">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Показаны релизы с датой выхода {new Date(filterDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
      )}
    </div>
  );
}
