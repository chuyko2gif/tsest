'use client';

import React, { useState } from 'react';

interface ReleasesFiltersProps {
  viewMode: 'moderation' | 'archive' | 'create';
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  filterUserRole: string;
  setFilterUserRole: (role: string) => void;
  filterDate: string;
  setFilterDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onReset: () => void;
}

export default function ReleasesFiltersPanel({
  viewMode,
  statusFilter,
  setStatusFilter,
  filterUserRole,
  setFilterUserRole,
  filterDate,
  setFilterDate,
  searchQuery,
  setSearchQuery,
  onReset
}: ReleasesFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const hasFilters = searchQuery || filterDate || filterUserRole !== 'all' || (viewMode === 'archive' && statusFilter !== 'all');

  return (
    <div className="w-full lg:w-96 relative">
      <div className="space-y-3">
        {/* Поиск */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск..."
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
        <div className="absolute top-full left-0 right-0 mt-3 space-y-4 p-5 bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl z-50">
          {/* Фильтр по статусу (только в архиве) */}
          {viewMode === 'archive' && (
            <div className="space-y-2">
              <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Статус релиза</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: 'Все', color: 'from-[#6050ba] to-[#8070da]' },
                  { value: 'distributed', label: 'На дистрибьюции', color: 'from-blue-500 to-blue-600' },
                  { value: 'published', label: 'Опубликован', color: 'from-green-500 to-green-600' },
                  { value: 'rejected', label: 'Отклонённые', color: 'from-red-500 to-red-600' }
                ].map((status) => (
                  <button
                    key={status.value}
                    onClick={() => setStatusFilter(status.value)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      statusFilter === status.value
                        ? `bg-gradient-to-r ${status.color} text-white shadow-lg`
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {status.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Фильтр по типу пользователя */}
          <div className="space-y-2">
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Тип подписки</label>
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
                      ? 'bg-gradient-to-r from-[#6050ba] to-[#8070da] text-white shadow-lg'
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
            <label className="text-xs text-zinc-400 uppercase tracking-wider font-bold">Дата релиза</label>
            <div className="relative inline-block w-full">
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full inline-flex px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 cursor-pointer items-center gap-2 text-sm hover:border-[#6050ba]/50 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
                <span className={filterDate ? 'text-white' : 'text-zinc-500'}>
                  {filterDate ? new Date(filterDate + 'T00:00:00').toLocaleDateString('ru-RU') : 'Выберите дату'}
                </span>
                {filterDate && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setFilterDate(''); }}
                    className="ml-auto text-zinc-400 hover:text-white transition"
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
                      if (calendarMonth === 0) {
                        setCalendarMonth(11);
                        setCalendarYear(calendarYear - 1);
                      } else {
                        setCalendarMonth(calendarMonth - 1);
                      }
                    }} className="p-1 hover:bg-white/5 rounded-md">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
                    </button>
                    <div className="font-bold text-sm">{new Date(calendarYear, calendarMonth).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}</div>
                    <button onClick={() => {
                      if (calendarMonth === 11) {
                        setCalendarMonth(0);
                        setCalendarYear(calendarYear + 1);
                      } else {
                        setCalendarMonth(calendarMonth + 1);
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
                      const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                      const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                      const startDay = firstDay === 0 ? 6 : firstDay - 1;
                      const days = [];
                      
                      for (let i = 0; i < startDay; i++) {
                        days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
                      }
                      
                      for (let day = 1; day <= daysInMonth; day++) {
                        const month = calendarMonth + 1;
                        const monthStr = month < 10 ? `0${month}` : `${month}`;
                        const dayStr = day < 10 ? `0${day}` : `${day}`;
                        const dateStr = `${calendarYear}-${monthStr}-${dayStr}`;
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
            </div>
          </div>

          {/* Кнопка сброса */}
          {hasFilters && (
            <button
              onClick={onReset}
              className="w-full mt-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl font-semibold text-sm transition-all border border-red-500/20 hover:border-red-500/40 flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Сбросить все фильтры
            </button>
          )}
        </div>
      )}
    </div>
  );
}
