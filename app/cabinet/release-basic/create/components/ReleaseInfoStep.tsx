import React, { useState, useRef } from 'react';
import Link from 'next/link';

interface ReleaseInfoStepProps {
  releaseTitle: string;
  setReleaseTitle: (value: string) => void;
  artistName: string;
  setArtistName: (value: string) => void;
  collaborators: string[];
  setCollaborators: (value: string[]) => void;
  collaboratorInput: string;
  setCollaboratorInput: (value: string) => void;
  genre: string;
  setGenre: (value: string) => void;
  subgenres: string[];
  setSubgenres: (value: string[]) => void;
  subgenreInput: string;
  setSubgenreInput: (value: string) => void;
  releaseDate: string | null;
  setReleaseDate: (value: string | null) => void;
  showCalendar: boolean;
  setShowCalendar: (value: boolean) => void;
  calendarMonth: number;
  setCalendarMonth: (value: number) => void;
  calendarYear: number;
  setCalendarYear: (value: number) => void;
  coverFile: File | null;
  setCoverFile: (value: File | null) => void;
  existingCoverUrl?: string;
  onNext: () => void;
}

export default function ReleaseInfoStep({
  releaseTitle,
  setReleaseTitle,
  artistName,
  setArtistName,
  collaborators,
  setCollaborators,
  collaboratorInput,
  setCollaboratorInput,
  genre,
  setGenre,
  subgenres,
  setSubgenres,
  subgenreInput,
  setSubgenreInput,
  releaseDate,
  setReleaseDate,
  showCalendar,
  setShowCalendar,
  calendarMonth,
  setCalendarMonth,
  calendarYear,
  setCalendarYear,
  coverFile,
  setCoverFile,
  existingCoverUrl,
  onNext,
}: ReleaseInfoStepProps) {
  const [showGenreDropdown, setShowGenreDropdown] = useState(false);
  const [coverError, setCoverError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleCoverClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleDeleteCover = () => {
    setCoverFile(null);
    setCoverError('');
  };
  
  const genres = [
    'Поп',
    'Рок',
    'Хип-хоп',
    'Рэп',
    'Электронная музыка',
    'R&B',
    'Инди',
    'Метал',
    'Джаз',
    'Классика'
  ];

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Информация о релизе</h2>
            <p className="text-sm text-zinc-500 mt-1">Заполните основную информацию о вашем релизе</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8">
        {/* Левая колонка - форма */}
        <div className="space-y-5">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Название релиза *</label>
            <input 
              value={releaseTitle} 
              onChange={(e) => setReleaseTitle(e.target.value)} 
              placeholder="Введите название" 
              className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20" 
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Имя артиста *</label>
            <input 
              value={artistName} 
              onChange={(e) => setArtistName(e.target.value)}
              placeholder="Введите имя артиста"
              className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20"
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">
              Соавторы {collaborators.length > 0 && <span className="text-zinc-600 text-xs">({collaborators.length}/10)</span>}
            </label>
            <div className="flex gap-2 mb-2">
              <input 
                value={collaboratorInput} 
                onChange={(e) => setCollaboratorInput(e.target.value)} 
                placeholder="Введите ник исполнителя"
                disabled={collaborators.length >= 10}
                onKeyDown={(e) => {
                  if(e.key === 'Enter' && collaboratorInput.trim() && collaborators.length < 10) {
                    setCollaborators([...collaborators, collaboratorInput.trim()]);
                    setCollaboratorInput('');
                  }
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] disabled:opacity-50" 
              />
              <button 
                type="button" 
                onClick={() => {
                  if(collaboratorInput.trim() && collaborators.length < 10) {
                    setCollaborators([...collaborators, collaboratorInput.trim()]);
                    setCollaboratorInput('');
                  }
                }}
                disabled={collaborators.length >= 10}
                className="px-4 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl text-sm font-medium transition disabled:opacity-50"
              >
                Добавить
              </button>
            </div>
            {collaborators.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {collaborators.map((collab, idx) => (
                  <div key={idx} className="px-3 py-1.5 bg-white/5 rounded-lg text-sm flex items-center gap-2">
                    <span>{collab}</span>
                    <button onClick={() => setCollaborators(collaborators.filter((_, i) => i !== idx))} className="text-zinc-400 hover:text-white">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Жанр *</label>
              {genre ? (
                <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-br from-[#6050ba]/20 to-[#9d8df1]/10 rounded-xl border border-[#6050ba]/30">
                  <span className="text-white font-medium flex-1">{genre}</span>
                  <button onClick={() => setGenre('')} className="text-zinc-400 hover:text-white text-xl">×</button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowGenreDropdown(!showGenreDropdown)}
                    className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl border border-white/10 outline-none transition-all hover:border-[#6050ba]/50 focus:border-[#6050ba] focus:shadow-lg focus:shadow-[#6050ba]/20 text-left text-zinc-500 flex items-center justify-between"
                  >
                    <span>Выберите жанр</span>
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      className={`text-zinc-400 transition-transform ${showGenreDropdown ? 'rotate-180' : ''}`}
                    >
                      <polyline points="6 9 12 15 18 9" strokeWidth="2"/>
                    </svg>
                  </button>
                  
                  {showGenreDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowGenreDropdown(false)}
                      />
                      <div 
                        className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0f] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden z-20 origin-top"
                        style={{
                          animation: 'dropdownExpand 0.2s ease-out'
                        }}
                      >
                        <div className="max-h-64 overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                          {genres.map((genreOption) => (
                            <button
                              key={genreOption}
                              type="button"
                              onClick={() => {
                                setGenre(genreOption);
                                setShowGenreDropdown(false);
                              }}
                              className="w-full px-4 py-3 text-left text-white hover:bg-[#6050ba]/20 transition-colors border-b border-white/5 last:border-0"
                            >
                              {genreOption}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Поджанры {subgenres.length > 0 && <span className="text-zinc-600 text-xs">({subgenres.length}/5)</span>}
              </label>
              <div className="flex gap-2">
                <input 
                  value={subgenreInput} 
                  onChange={(e) => setSubgenreInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && subgenreInput.trim() && subgenres.length < 5) {
                      e.preventDefault();
                      setSubgenres([...subgenres, subgenreInput.trim()]);
                      setSubgenreInput('');
                    }
                  }}
                  placeholder="Dark Pop" 
                  disabled={subgenres.length >= 5}
                  className="flex-1 px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none disabled:opacity-50"
                />
                <button 
                  onClick={() => {
                    if(subgenreInput.trim() && subgenres.length < 5) {
                      setSubgenres([...subgenres, subgenreInput.trim()]);
                      setSubgenreInput('');
                    }
                  }}
                  disabled={subgenres.length >= 5}
                  className="px-4 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl text-sm font-medium transition disabled:opacity-50"
                >
                  +
                </button>
              </div>
              {subgenres.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {subgenres.map((sub, idx) => (
                    <div key={idx} className="px-3 py-1.5 bg-white/5 rounded-lg text-sm flex items-center gap-2">
                      <span>{sub}</span>
                      <button onClick={() => setSubgenres(subgenres.filter((_, i) => i !== idx))} className="text-zinc-400 hover:text-white">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Дата релиза</label>
            <div className="relative inline-block">
              <div 
                onClick={() => setShowCalendar(!showCalendar)}
                className="inline-flex px-4 py-2.5 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl border border-white/10 cursor-pointer items-center gap-2 text-sm hover:border-[#6050ba]/50 transition"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                  <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                  <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                  <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                </svg>
                <span className={releaseDate ? 'text-white' : 'text-zinc-500'}>
                  {releaseDate ? new Date(releaseDate + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Выберите дату'}
                </span>
              </div>
              
              {showCalendar && (() => {
                const safeMonth = Math.max(0, Math.min(11, calendarMonth));
                const safeYear = Math.max(2020, Math.min(2100, calendarYear));
                return (
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
                      
                      // Пустые ячейки до начала месяца
                      for (let i = 0; i < startDay; i++) {
                        days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
                      }
                      
                      // Дни месяца
                      for (let day = 1; day <= daysInMonth; day++) {
                        const month = safeMonth + 1;
                        const monthStr = month < 10 ? `0${month}` : `${month}`;
                        const dayStr = day < 10 ? `0${day}` : `${day}`;
                        const dateStr = `${safeYear}-${monthStr}-${dayStr}`;
                        const isSelected = releaseDate === dateStr;
                        
                        days.push(
                          <button 
                            key={`day-${day}`} 
                            onClick={() => { setReleaseDate(dateStr); setShowCalendar(false); }}
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
                );
              })()}
            </div>
          </div>
        </div>

        {/* Правая колонка - обложка */}
        <div className="lg:w-80">
          <label className="text-sm text-zinc-400 mb-3 block font-medium">Обложка *</label>
          <div className={`w-full aspect-square rounded-2xl overflow-hidden transition-all duration-300 flex items-center justify-center relative ${
            coverFile || existingCoverUrl 
              ? 'shadow-2xl shadow-purple-500/30 border-2 border-white/20 hover:border-[#6050ba] hover:shadow-purple-500/50' 
              : 'bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-2 border-white/10 hover:border-[#6050ba] hover:bg-white/[0.02] hover:shadow-xl hover:shadow-[#6050ba]/30'
          }`}>
            {/* Внутренняя рамка для загруженных изображений */}
            {(coverFile || existingCoverUrl) && (
              <div className="absolute inset-1 rounded-xl border border-white/10 pointer-events-none"></div>
            )}
            {coverFile ? (
              <div className="group relative w-full h-full">
                <img src={URL.createObjectURL(coverFile)} alt="cover" className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleCoverClick(); }} 
                    className="group/btn relative overflow-hidden p-3 bg-gradient-to-br from-white/30 to-white/10 hover:from-[#6050ba] hover:to-[#7060ca] rounded-2xl border border-white/30 hover:border-[#6050ba] transition-all duration-300 hover:scale-110 hover:rotate-3 hover:shadow-2xl hover:shadow-[#6050ba]/60 active:scale-95"
                    title="Заменить обложку"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    <svg className="w-5 h-5 text-white drop-shadow-2xl relative z-10 group-hover/btn:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <div className="absolute inset-0 rounded-2xl bg-[#6050ba] opacity-0 group-hover/btn:opacity-30 blur-2xl transition-all duration-300"></div>
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCover(); }} 
                    className="group/btn relative overflow-hidden p-3 bg-gradient-to-br from-white/30 to-white/10 hover:from-red-500 hover:to-red-600 rounded-2xl border border-white/30 hover:border-red-400 transition-all duration-300 hover:scale-110 hover:-rotate-3 hover:shadow-2xl hover:shadow-red-500/60 active:scale-95"
                    title="Удалить обложку"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    <svg className="w-5 h-5 text-white drop-shadow-2xl relative z-10 group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <div className="absolute inset-0 rounded-2xl bg-red-500 opacity-0 group-hover/btn:opacity-30 blur-2xl transition-all duration-300"></div>
                  </button>
                </div>
              </div>
            ) : existingCoverUrl ? (
              <div className="group relative w-full h-full">
                <img src={existingCoverUrl} alt="cover" className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3">
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleCoverClick(); }} 
                    className="group/btn relative overflow-hidden p-3 bg-gradient-to-br from-white/30 to-white/10 hover:from-[#6050ba] hover:to-[#7060ca] rounded-2xl border border-white/30 hover:border-[#6050ba] transition-all duration-300 hover:scale-110 hover:rotate-3 hover:shadow-2xl hover:shadow-[#6050ba]/60 active:scale-95"
                    title="Заменить обложку"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    <svg className="w-5 h-5 text-white drop-shadow-2xl relative z-10 group-hover/btn:rotate-180 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <div className="absolute inset-0 rounded-2xl bg-[#6050ba] opacity-0 group-hover/btn:opacity-30 blur-2xl transition-all duration-300"></div>
                  </button>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); handleDeleteCover(); }} 
                    className="group/btn relative overflow-hidden p-3 bg-gradient-to-br from-white/30 to-white/10 hover:from-red-500 hover:to-red-600 rounded-2xl border border-white/30 hover:border-red-400 transition-all duration-300 hover:scale-110 hover:-rotate-3 hover:shadow-2xl hover:shadow-red-500/60 active:scale-95"
                    title="Удалить обложку"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                    <svg className="w-5 h-5 text-white drop-shadow-2xl relative z-10 group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    <div className="absolute inset-0 rounded-2xl bg-red-500 opacity-0 group-hover/btn:opacity-30 blur-2xl transition-all duration-300"></div>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-400">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
                    <polyline points="21 15 16 10 5 21" strokeWidth="2"/>
                  </svg>
                </div>
                <div className="text-zinc-300 mb-1 text-sm font-medium">Загрузите обложку</div>
                <div className="text-[11px] text-zinc-500 mb-4">JPG/PNG • 3000×3000 • до 10 МБ</div>
                <label className="inline-flex items-center px-4 py-2 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl cursor-pointer text-sm font-medium transition">
                  <input
                    type="file" 
                    accept="image/png, image/jpeg" 
                    className="hidden" 
                    onChange={(e) => { 
                      const f = e.target.files?.[0]; 
                      if(f) {
                        // Проверка типа файла
                        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
                        if(!allowedTypes.includes(f.type)) {
                          setCoverError('Можно загружать только изображения формата JPG или PNG');
                          setCoverFile(null);
                          e.target.value = '';
                          return;
                        }
                        
                        // Проверка размера файла
                        const maxSize = 10 * 1024 * 1024; // 10 МБ в байтах
                        if(f.size > maxSize) {
                          setCoverError('Максимальный размер файла должен быть до 10 МБ');
                          setCoverFile(null);
                          e.target.value = '';
                        } else {
                          setCoverError('');
                          setCoverFile(f);
                        }
                      }
                    }} 
                  />
                  Выбрать файл
                </label>
                {coverError && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400 flex-shrink-0 mt-0.5">
                        <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                        <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                        <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
                      </svg>
                      <span className="text-xs text-red-400">{coverError}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Скрытый input для замены обложки */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
                if (!allowedTypes.includes(f.type)) {
                  setCoverError('Можно загружать только изображения формата JPG или PNG');
                  e.target.value = '';
                  return;
                }
                if (f.size > 10 * 1024 * 1024) {
                  setCoverError('Размер файла не должен превышать 10 МБ');
                  e.target.value = '';
                  return;
                }
                setCoverFile(f);
                setCoverError('');
                e.target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* Кнопки навигации */}
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
        <Link href="/cabinet" className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition">
          Отмена
        </Link>
        <button 
          onClick={onNext}
          className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition flex items-center gap-2"
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
}
