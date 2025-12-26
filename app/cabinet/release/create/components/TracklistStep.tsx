import React from 'react';

interface Track {
  title: string;
  link: string;
  hasDrugs: boolean;
  lyrics: string;
  language: string;
  version?: string;
  producers?: string[];
  featuring?: string[];
}

interface TracklistStepProps {
  releaseTitle: string;
  tracks: Track[];
  setTracks: (tracks: Track[]) => void;
  currentTrack: number | null;
  setCurrentTrack: (index: number | null) => void;
  trackTitle: string;
  setTrackTitle: (value: string) => void;
  trackLink: string;
  setTrackLink: (value: string) => void;
  trackHasDrugs: boolean;
  setTrackHasDrugs: (value: boolean) => void;
  trackLyrics: string;
  setTrackLyrics: (value: string) => void;
  trackLanguage: string;
  setTrackLanguage: (value: string) => void;
  trackVersion?: string;
  setTrackVersion?: (value: string) => void;
  trackProducers?: string[];
  setTrackProducers?: (value: string[]) => void;
  trackFeaturing?: string[];
  setTrackFeaturing?: (value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function TracklistStep({
  releaseTitle,
  tracks,
  setTracks,
  currentTrack,
  setCurrentTrack,
  trackTitle,
  setTrackTitle,
  trackLink,
  setTrackLink,
  trackHasDrugs,
  setTrackHasDrugs,
  trackLyrics,
  setTrackLyrics,
  trackLanguage,
  setTrackLanguage,
  trackVersion,
  setTrackVersion,
  trackProducers,
  setTrackProducers,
  trackFeaturing,
  setTrackFeaturing,
  onNext,
  onBack,
}: TracklistStepProps) {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newTracks = [...tracks];
    const draggedTrack = newTracks[draggedIndex];
    newTracks.splice(draggedIndex, 1);
    newTracks.splice(dropIndex, 0, draggedTrack);
    setTracks(newTracks);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Автоматически обновляем название единственного трека при изменении названия релиза
  React.useEffect(() => {
    if (tracks.length === 1 && releaseTitle) {
      const updatedTracks = [...tracks];
      if (updatedTracks[0].title !== releaseTitle) {
        updatedTracks[0] = { ...updatedTracks[0], title: releaseTitle };
        setTracks(updatedTracks);
      }
    }
  }, [releaseTitle, tracks, setTracks]);

  // Автозаполнение названия трека при создании первого трека
  React.useEffect(() => {
    if (currentTrack !== null && currentTrack === tracks.length) {
      if (tracks.length === 0 && releaseTitle) {
        // Если создаем первый трек, автоматически используем название релиза
        setTrackTitle(releaseTitle);
      } else if (tracks.length >= 1) {
        // Если создаем второй или последующий трек, очищаем поле
        setTrackTitle('');
      }
    }
  }, [currentTrack, tracks.length, releaseTitle]);

  // Синхронизация trackTitle при редактировании единственного трека
  React.useEffect(() => {
    if (currentTrack !== null && currentTrack < tracks.length && tracks.length === 1) {
      setTrackTitle(releaseTitle);
    }
  }, [releaseTitle, currentTrack, tracks.length, setTrackTitle]);

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h2 className="text-3xl font-black uppercase tracking-tight">Треклист</h2>
        <p className="text-sm text-zinc-500 mt-1">Добавьте треки в ваш релиз</p>
      </div>

      {currentTrack === null ? (
        <div className="space-y-4">
          {tracks.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm text-zinc-400 mb-4 flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polygon points="10 8 16 12 10 16 10 8"/>
                </svg>
                Треки в релизе ({tracks.length})
              </h4>
              <div className="space-y-3">
                {tracks.map((track, idx) => {
                  // Скрываем перетаскиваемый элемент полностью из DOM
                  if (draggedIndex === idx) {
                    return null;
                  }
                  
                  return (
                  <div 
                    key={`${track.title}-${track.link}-${idx}`} 
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
                        dragOverIndex === idx
                        ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500 shadow-2xl shadow-purple-500/20 scale-[1.02]'
                        : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] border-white/10 hover:border-white/20 hover:shadow-xl hover:scale-[1.01]'
                    } group backdrop-blur-sm`}
                  >
                    {/* Градиентный фон */}
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Иконка перетаскивания */}
                    <div className="relative cursor-grab active:cursor-grabbing text-zinc-600 hover:text-purple-400 transition flex-shrink-0" title="Перетащите для изменения порядка">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="9" cy="5" r="1" fill="currentColor"/>
                        <circle cx="9" cy="12" r="1" fill="currentColor"/>
                        <circle cx="9" cy="19" r="1" fill="currentColor"/>
                        <circle cx="15" cy="5" r="1" fill="currentColor"/>
                        <circle cx="15" cy="12" r="1" fill="currentColor"/>
                        <circle cx="15" cy="19" r="1" fill="currentColor"/>
                      </svg>
                    </div>
                    
                    {/* Номер трека */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-base font-black ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all">
                        {idx + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 relative min-w-0">
                      <div className="font-bold text-white text-base mb-2 group-hover:text-purple-100 transition-colors">{track.title || `Трек ${idx + 1}`}</div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                        {track.language && (
                          <span className="flex items-center gap-1.5 text-zinc-400">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="10"/>
                              <line x1="2" y1="12" x2="22" y2="12"/>
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                            </svg>
                            {track.language}
                          </span>
                        )}
                        {track.hasDrugs && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold ring-1 ring-red-500/30">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                            </svg>
                            EXPLICIT
                          </span>
                        )}
                      </div>
                      {(track.version || track.producers || track.featuring) && (
                        <div className="flex flex-wrap gap-2 mt-2.5">
                          {track.version && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-400 rounded-lg text-[10px] font-semibold ring-1 ring-orange-500/20">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                                <line x1="7" y1="7" x2="7.01" y2="7"/>
                              </svg>
                              {track.version}
                            </span>
                          )}
                          {track.producers && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-semibold ring-1 ring-blue-500/20">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                <circle cx="12" cy="7" r="4"/>
                              </svg>
                              {Array.isArray(track.producers) ? track.producers.join(', ') : track.producers}
                            </span>
                          )}
                          {track.featuring && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-500/10 text-pink-400 rounded-lg text-[10px] font-semibold ring-1 ring-pink-500/20">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                <circle cx="9" cy="7" r="4"/>
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                              </svg>
                              {Array.isArray(track.featuring) ? track.featuring.join(', ') : track.featuring}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Кнопки управления */}
                    <div className="relative flex items-center gap-2">
                      <button
                        onClick={() => {
                          setCurrentTrack(idx);
                          setTrackTitle(track.title);
                          setTrackLink(track.link);
                          setTrackHasDrugs(track.hasDrugs);
                          setTrackLyrics(track.lyrics);
                          setTrackLanguage(track.language);
                          if (setTrackVersion) setTrackVersion(track.version || '');
                          if (setTrackProducers) {
                            setTrackProducers(
                              Array.isArray(track.producers) ? track.producers : 
                              track.producers ? [track.producers] : []
                            );
                          }
                          if (setTrackFeaturing) {
                            setTrackFeaturing(
                              Array.isArray(track.featuring) ? track.featuring : 
                              track.featuring ? [track.featuring] : []
                            );
                          }
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 rounded-xl text-sm font-semibold transition-all border border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => {
                          const newTracks = tracks.filter((_, i) => i !== idx);
                          // Если после удаления остался 1 трек, обновляем его название на название релиза
                          if (newTracks.length === 1) {
                            newTracks[0] = { ...newTracks[0], title: releaseTitle };
                          }
                          setTracks(newTracks);
                        }}
                        className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10"
                        title="Удалить трек"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          <line x1="10" y1="11" x2="10" y2="17"/>
                          <line x1="14" y1="11" x2="14" y2="17"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => setCurrentTrack(tracks.length)}
            className="w-full px-6 py-6 bg-white/[0.02] hover:bg-[#6050ba]/10 border-2 border-dashed border-white/10 hover:border-[#6050ba]/50 rounded-2xl font-bold transition flex items-center justify-center gap-3"
          >
            <span className="text-2xl">+</span>
            <span>Добавить трек</span>
          </button>

          {/* Кнопки навигации */}
          <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
            <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
              Назад
            </button>
            <button 
              onClick={onNext}
              disabled={tracks.length === 0}
              className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-2"
            >
              Далее
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-bold">
              {currentTrack < tracks.length ? `Редактирование трека ${currentTrack + 1}` : 'Новый трек'}
            </h4>
            <button
              onClick={() => { setCurrentTrack(null); setTrackTitle(''); setTrackLink(''); setTrackHasDrugs(false); setTrackLyrics(''); setTrackLanguage(''); }}
              className="text-sm text-zinc-400 hover:text-white flex items-center gap-1"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
              К списку
            </button>
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">
              Название трека *
              {((tracks.length === 1 && currentTrack < tracks.length) || (tracks.length === 0 && currentTrack === 0)) && (
                <span className="ml-2 text-xs text-emerald-400">(Автоматически совпадает с названием релиза)</span>
              )}
            </label>
            <input 
              value={(tracks.length === 1 && currentTrack < tracks.length) || (tracks.length === 0 && currentTrack === 0) ? releaseTitle : trackTitle} 
              onChange={(e) => setTrackTitle(e.target.value)} 
              placeholder={releaseTitle || "Введите название"}
              disabled={(tracks.length === 1 && currentTrack < tracks.length) || (tracks.length === 0 && currentTrack === 0)}
              className={`w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none transition-all ${
                ((tracks.length === 1 && currentTrack < tracks.length) || (tracks.length === 0 && currentTrack === 0)) ? 'opacity-60 cursor-not-allowed ring-2 ring-emerald-500/20' : 'hover:border-white/20 focus:border-[#6050ba] focus:ring-2 focus:ring-[#6050ba]/20'
              }`}
            />
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Ссылка на трек (Яндекс Диск / Google Drive) *</label>
            <input value={trackLink} onChange={(e) => setTrackLink(e.target.value)} placeholder="https://..." className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none" />
          </div>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Язык трека</label>
            <select value={trackLanguage} onChange={(e) => setTrackLanguage(e.target.value)} className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl border border-white/10 outline-none appearance-none cursor-pointer">
              <option value="" className="bg-[#1a1a1c]">Выберите язык</option>
              <option className="bg-[#1a1a1c]">Русский</option>
              <option className="bg-[#1a1a1c]">Английский</option>
              <option className="bg-[#1a1a1c]">Инструментальная</option>
            </select>
          </div>

          {/* Дополнительные поля */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Версия (опционально)</label>
              <input 
                value={trackVersion || ''} 
                onChange={(e) => setTrackVersion && setTrackVersion(e.target.value)} 
                placeholder="Remix, Acoustic..." 
                className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none" 
              />
            </div>

            {/* Продюсеры */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Продюсеры (до 10)</label>
              <div className="space-y-2">
                {trackProducers && trackProducers.map((producer, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={producer} 
                      onChange={(e) => {
                        if (setTrackProducers) {
                          const newProducers = [...trackProducers];
                          newProducers[idx] = e.target.value;
                          setTrackProducers(newProducers);
                        }
                      }}
                      placeholder={`Продюсер ${idx + 1}`} 
                      className="flex-1 px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (setTrackProducers) {
                          setTrackProducers(trackProducers.filter((_, i) => i !== idx));
                        }
                      }}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {(!trackProducers || trackProducers.length < 10) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (setTrackProducers) {
                        setTrackProducers([...(trackProducers || []), '']);
                      }
                    }}
                    className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl text-sm text-zinc-400 hover:text-white transition"
                  >
                    + Добавить продюсера
                  </button>
                )}
              </div>
            </div>

            {/* Featuring */}
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">Featuring / Соавторы (до 10)</label>
              <div className="space-y-2">
                {trackFeaturing && trackFeaturing.map((feat, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      value={feat} 
                      onChange={(e) => {
                        if (setTrackFeaturing) {
                          const newFeaturing = [...trackFeaturing];
                          newFeaturing[idx] = e.target.value;
                          setTrackFeaturing(newFeaturing);
                        }
                      }}
                      placeholder={`Артист ${idx + 1}`} 
                      className="flex-1 px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none" 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (setTrackFeaturing) {
                          setTrackFeaturing(trackFeaturing.filter((_, i) => i !== idx));
                        }
                      }}
                      className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {(!trackFeaturing || trackFeaturing.length < 10) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (setTrackFeaturing) {
                        setTrackFeaturing([...(trackFeaturing || []), '']);
                      }
                    }}
                    className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl text-sm text-zinc-400 hover:text-white transition"
                  >
                    + Добавить соавтора
                  </button>
                )}
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition">
            <input type="checkbox" checked={trackHasDrugs} onChange={(e) => setTrackHasDrugs(e.target.checked)} className="w-5 h-5 rounded" />
            <div>
              <div className="text-sm font-medium">Explicit Content</div>
              <div className="text-xs text-zinc-500">Трек содержит нецензурную лексику или упоминание веществ</div>
            </div>
          </label>

          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Текст песни</label>
            <textarea value={trackLyrics} onChange={(e) => setTrackLyrics(e.target.value)} placeholder="Введите текст..." rows={8} className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none resize-none overflow-y-auto" style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}} />
          </div>

          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                // Проверяем, будет ли это единственный трек после сохранения
                const willBeSingleTrack = currentTrack < tracks.length ? tracks.length === 1 : tracks.length === 0;
                
                // Для сингла всегда используем название релиза
                const finalTitle = willBeSingleTrack ? releaseTitle : trackTitle;
                
                // Проверяем наличие названия релиза для сингла
                if (willBeSingleTrack && (!releaseTitle || !releaseTitle.trim())) {
                  alert('Сначала заполните название релиза на предыдущем шаге');
                  return;
                }
                
                if (!finalTitle || !finalTitle.trim() || !trackLink || !trackLink.trim()) { alert('Заполните название и ссылку'); return; }
                const newTrack = { 
                  title: finalTitle, 
                  link: trackLink, 
                  hasDrugs: trackHasDrugs, 
                  lyrics: trackLyrics, 
                  language: trackLanguage,
                  version: trackVersion || undefined,
                  producers: trackProducers && trackProducers.filter(p => p.trim()).length > 0 ? trackProducers.filter(p => p.trim()) : undefined,
                  featuring: trackFeaturing && trackFeaturing.filter(f => f.trim()).length > 0 ? trackFeaturing.filter(f => f.trim()) : undefined
                };
                if (currentTrack < tracks.length) {
                  setTracks(tracks.map((t, i) => i === currentTrack ? newTrack : t));
                } else {
                  setTracks([...tracks, newTrack]);
                }
                setCurrentTrack(null); 
                setTrackTitle(''); 
                setTrackLink(''); 
                setTrackHasDrugs(false); 
                setTrackLyrics(''); 
                setTrackLanguage('');
                if (setTrackVersion) setTrackVersion('');
                if (setTrackProducers) setTrackProducers([]);
                if (setTrackFeaturing) setTrackFeaturing([]);
              }}
              className="flex-1 px-6 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition"
            >
              {currentTrack < tracks.length ? 'Сохранить' : 'Добавить трек'}
            </button>
            <button onClick={() => { 
              setCurrentTrack(null); 
              setTrackTitle(''); 
              setTrackLink(''); 
              setTrackHasDrugs(false); 
              setTrackLyrics(''); 
              setTrackLanguage('');
              if (setTrackVersion) setTrackVersion('');
              if (setTrackProducers) setTrackProducers([]);
              if (setTrackFeaturing) setTrackFeaturing([]);
            }} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition">
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
