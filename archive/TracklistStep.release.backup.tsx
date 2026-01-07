import React, { useState } from 'react';

interface AudioMetadata {
  format: string;
  duration?: number;
  bitrate?: string;
  sampleRate?: string;
  size: number;
}

interface Track {
  title: string;
  link: string;
  audioFile?: File | null;
  audioMetadata?: AudioMetadata | null;
  hasDrugs: boolean;
  lyrics: string;
  language: string;
  version?: string;
  producers?: string[];
  featuring?: string[];
}

interface TracklistStepProps {
  releaseTitle: string;
  releaseType?: 'single' | 'ep' | 'album' | null;
  coverFile?: File | null;
  tracks: Track[];
  setTracks: (tracks: Track[]) => void;
  currentTrack: number | null;
  setCurrentTrack: (index: number | null) => void;
  trackTitle: string;
  setTrackTitle: (value: string) => void;
  trackLink: string;
  setTrackLink: (value: string) => void;
  trackAudioFile?: File | null;
  setTrackAudioFile?: (value: File | null) => void;
  trackAudioMetadata?: AudioMetadata | null;
  setTrackAudioMetadata?: (value: AudioMetadata | null) => void;
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
  releaseType,
  coverFile,
  tracks,
  setTracks,
  currentTrack,
  setCurrentTrack,
  trackTitle,
  setTrackTitle,
  trackLink,
  setTrackLink,
  trackAudioFile,
  setTrackAudioFile,
  trackAudioMetadata,
  setTrackAudioMetadata,
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
  const [uploadError, setUploadError] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  // Создаем preview URL для обложки
  React.useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setCoverPreviewUrl(null);
    }
  }, [coverFile]);

  // Функция для анализа аудиофайла
  const analyzeAudioFile = async (file: File): Promise<AudioMetadata | null> => {
    try {
      setIsAnalyzing(true);
      setUploadError('');

      // Проверка расширения файла
      const fileName = file.name.toLowerCase();
      const isWav = fileName.endsWith('.wav');
      const isFlac = fileName.endsWith('.flac');
      
      if (!isWav && !isFlac) {
        setUploadError('❌ MP3 не принимается. Загрузите WAV или FLAC');
        return null;
      }

      // Базовая метаинформация
      const metadata: AudioMetadata = {
        format: isWav ? 'WAV' : 'FLAC',
        size: file.size,
      };

      // Попытка получить duration через Web Audio API
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        metadata.duration = audioBuffer.duration;
        metadata.sampleRate = `${audioBuffer.sampleRate / 1000} kHz`;
        
        // Проверка частоты дискретизации
        if (audioBuffer.sampleRate < 44100) {
          setUploadError(`⚠️ Частота дискретизации слишком низкая: ${audioBuffer.sampleRate / 1000} kHz. Минимум: 44.1 kHz`);
          return null;
        }
        
        audioContext.close();
      } catch (e) {
        console.warn('Не удалось получить метаданные через Web Audio API:', e);
      }

      return metadata;
    } catch (error) {
      console.error('Ошибка анализа файла:', error);
      setUploadError('Ошибка анализа файла');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Обработчик загрузки аудиофайла
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const metadata = await analyzeAudioFile(file);
    if (metadata && setTrackAudioFile && setTrackAudioMetadata) {
      setTrackAudioFile(file);
      setTrackAudioMetadata(metadata);
    } else if (!metadata) {
      // Если файл не прошел валидацию, сбрасываем input
      e.target.value = '';
      if (setTrackAudioFile) setTrackAudioFile(null);
      if (setTrackAudioMetadata) setTrackAudioMetadata(null);
    }
  };

  // Функция форматирования размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Функция форматирования длительности
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Определяем максимальное количество треков
  const getMaxTracks = () => {
    if (releaseType === 'single') return 1;
    if (releaseType === 'ep') return 7;
    if (releaseType === 'album') return 50;
    return 50;
  };

  const maxTracks = getMaxTracks();

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

  // Автоматически обновляем название единственного трека при изменении названия релиза (только для сингла)
  React.useEffect(() => {
    if (releaseType === 'single' && tracks.length === 1 && releaseTitle) {
      const updatedTracks = [...tracks];
      if (updatedTracks[0].title !== releaseTitle) {
        updatedTracks[0] = { ...updatedTracks[0], title: releaseTitle };
        setTracks(updatedTracks);
      }
    }
  }, [releaseType, releaseTitle, tracks, setTracks]);

  // Автозаполнение названия трека при создании первого трека (только для сингла)
  React.useEffect(() => {
    if (currentTrack !== null && currentTrack === tracks.length) {
      if (tracks.length === 0 && releaseTitle && releaseType === 'single') {
        // Если создаем первый трек сингла, автоматически используем название релиза
        setTrackTitle(releaseTitle);
      } else {
        // Для EP/альбома или последующих треков очищаем поле
        setTrackTitle('');
      }
    }
  }, [currentTrack, tracks.length, releaseTitle, releaseType]);

  // Синхронизация trackTitle при редактировании единственного трека (только для сингла)
  React.useEffect(() => {
    if (releaseType === 'single' && currentTrack !== null && currentTrack < tracks.length && tracks.length === 1) {
      setTrackTitle(releaseTitle);
    }
  }, [releaseType, releaseTitle, currentTrack, tracks.length, setTrackTitle]);

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h2 className="text-3xl font-black uppercase tracking-tight">Треклист</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {releaseType === 'single' && 'Добавьте трек в ваш сингл (макс. 1)'}
          {releaseType === 'ep' && 'Добавьте треки в ваш EP (от 2 до 7)'}
          {releaseType === 'album' && 'Добавьте треки в ваш альбом (от 8 до 50)'}
          {!releaseType && 'Добавьте треки в ваш релиз'}
        </p>
        
        {/* Счетчик треков */}
        {releaseType && tracks.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            <span className="text-sm font-semibold">
              {releaseType === 'single' && `Треков: ${tracks.length} / 1`}
              {releaseType === 'ep' && `Треков: ${tracks.length} / 7 (минимум 2)`}
              {releaseType === 'album' && `Треков: ${tracks.length} / 50 (минимум 8)`}
            </span>
          </div>
        )}
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
                {tracks.map((track, idx) => (
                  <div 
                    key={`track-${idx}-${track.title}`} 
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
                        draggedIndex === idx
                        ? 'opacity-50 scale-95 border-purple-500/50 bg-purple-500/10'
                        : dragOverIndex === idx
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
                    
                    {/* Миниатюра обложки с номером трека */}
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                      {coverPreviewUrl ? (
                        <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all">
                          <img 
                            src={coverPreviewUrl} 
                            alt="Cover" 
                            className="w-full h-full object-cover"
                          />
                          {/* Номер трека поверх обложки */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-base font-black text-white drop-shadow-lg">{idx + 1}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-base font-black ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all">
                          {idx + 1}
                        </div>
                      )}
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
                          // Если после удаления остался 1 трек И это сингл, обновляем его название на название релиза
                          if (releaseType === 'single' && newTracks.length === 1) {
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
                ))}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              if (releaseType === 'single' && tracks.length >= 1) {
                alert('❌ Для сингла можно добавить только 1 трек');
                return;
              }
              if (releaseType === 'ep' && tracks.length >= maxTracks) {
                alert(`❌ Для EP максимум ${maxTracks} треков`);
                return;
              }
              if (releaseType === 'album' && tracks.length >= maxTracks) {
                alert(`❌ Для альбома максимум ${maxTracks} треков`);
                return;
              }
              setCurrentTrack(tracks.length);
            }}
            disabled={
              (releaseType === 'single' && tracks.length >= 1) ||
              (releaseType === 'ep' && tracks.length >= maxTracks) ||
              (releaseType === 'album' && tracks.length >= maxTracks)
            }
            className={`w-full px-6 py-6 border-2 border-dashed rounded-2xl font-bold transition flex items-center justify-center gap-3 ${
              (releaseType === 'single' && tracks.length >= 1) ||
              (releaseType === 'ep' && tracks.length >= maxTracks) ||
              (releaseType === 'album' && tracks.length >= maxTracks)
                ? 'bg-white/[0.02] border-white/5 text-zinc-600 cursor-not-allowed'
                : 'bg-white/[0.02] hover:bg-[#6050ba]/10 border-white/10 hover:border-[#6050ba]/50'
            }`}
          >
            <span className="text-2xl">+</span>
            <span>
              {releaseType === 'single' && tracks.length >= 1 
                ? 'Сингл может содержать только 1 трек'
                : releaseType === 'ep' && tracks.length >= maxTracks
                  ? `Вы выбрали максимум ${maxTracks} треков для EP`
                  : releaseType === 'album' && tracks.length >= maxTracks
                    ? `Вы выбрали максимум ${maxTracks} треков для альбома`
                    : 'Добавить трек'}
            </span>
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
              {releaseType === 'single' && (
                <span className="ml-2 text-xs text-emerald-400">(Автоматически совпадает с названием релиза)</span>
              )}
            </label>
            <input 
              value={releaseType === 'single' ? releaseTitle : trackTitle} 
              onChange={(e) => setTrackTitle(e.target.value)} 
              placeholder={releaseTitle || "Введите название"}
              disabled={releaseType === 'single'}
              className={`w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none transition-all ${
                releaseType === 'single' ? 'opacity-60 cursor-not-allowed ring-2 ring-emerald-500/20' : 'hover:border-white/20 focus:border-[#6050ba] focus:ring-2 focus:ring-[#6050ba]/20'
              }`}
            />
          </div>

          {/* Загрузка аудиофайла */}
          <div className="space-y-3">
            <div>
              <label className="text-sm text-zinc-400 mb-2 block">
                Аудиофайл * <span className="text-zinc-500 text-xs">(WAV или FLAC, минимум 44.1 kHz)</span>
              </label>
              
              <div className="relative">
                <input
                  type="file"
                  accept=".wav,.flac"
                  onChange={handleAudioFileChange}
                  className="hidden"
                  id="audio-upload"
                />
                <label
                  htmlFor="audio-upload"
                  className={`flex items-center justify-center gap-3 w-full px-6 py-5 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
                    trackAudioFile && trackAudioMetadata && !uploadError
                      ? 'border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10'
                      : 'border-white/20 bg-white/[0.02] hover:border-purple-500/50 hover:bg-purple-500/5'
                  }`}
                >
                  {isAnalyzing ? (
                    <>
                      <svg className="animate-spin w-6 h-6 text-purple-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      <span className="text-sm font-medium text-purple-300">Анализ файла...</span>
                    </>
                  ) : trackAudioFile && trackAudioMetadata ? (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span className="text-sm font-medium text-emerald-300">{trackAudioFile.name}</span>
                    </>
                  ) : (
                    <>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-purple-400" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      <span className="text-sm font-medium text-zinc-300">Нажмите для загрузки WAV/FLAC файла</span>
                    </>
                  )}
                </label>
              </div>

              {uploadError && (
                <div className="flex items-start gap-2 mt-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <span className="text-sm text-red-400">{uploadError}</span>
                </div>
              )}

              {/* Метаданные файла */}
              {trackAudioFile && trackAudioMetadata && !uploadError && (
                <div className="mt-3 p-4 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-zinc-500 mb-1">Формат</div>
                      <div className="font-mono text-white bg-white/5 px-2 py-1 rounded">{trackAudioMetadata.format}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 mb-1">Размер</div>
                      <div className="font-mono text-white bg-white/5 px-2 py-1 rounded">{formatFileSize(trackAudioMetadata.size)}</div>
                    </div>
                    {trackAudioMetadata.duration && (
                      <div>
                        <div className="text-zinc-500 mb-1">Длительность</div>
                        <div className="font-mono text-white bg-white/5 px-2 py-1 rounded">{formatDuration(trackAudioMetadata.duration)}</div>
                      </div>
                    )}
                    {trackAudioMetadata.sampleRate && (
                      <div>
                        <div className="text-zinc-500 mb-1">Частота</div>
                        <div className="font-mono text-white bg-white/5 px-2 py-1 rounded">{trackAudioMetadata.sampleRate}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
                // Проверяем тип релиза для определения названия трека
                const isSingleRelease = releaseType === 'single';
                
                // Для сингла всегда используем название релиза, для EP/альбома - название трека
                const finalTitle = isSingleRelease ? releaseTitle : trackTitle;
                
                // Проверяем наличие названия релиза для сингла
                if (isSingleRelease && (!releaseTitle || !releaseTitle.trim())) {
                  alert('Сначала заполните название релиза на предыдущем шаге');
                  return;
                }
                
                // Проверяем наличие названия и аудиофайла
                if (!finalTitle || !finalTitle.trim()) { 
                  alert('Заполните название трека'); 
                  return; 
                }
                if (!trackAudioFile) { 
                  alert('Загрузите аудиофайл (WAV или FLAC)'); 
                  return; 
                }
                
                const newTrack = { 
                  title: finalTitle, 
                  link: '', // Оставляем для совместимости, но не используем
                  audioFile: trackAudioFile,
                  audioMetadata: trackAudioMetadata,
                  hasDrugs: trackHasDrugs, 
                  lyrics: trackLyrics, 
                  language: trackLanguage,
                  version: trackVersion || undefined,
                  producers: trackProducers && trackProducers.filter(p => p.trim()).length > 0 ? trackProducers.filter(p => p.trim()) : undefined,
                  featuring: trackFeaturing && trackFeaturing.filter(f => f.trim()).length > 0 ? trackFeaturing.filter(f => f.trim()) : undefined
                };
                // Дополнительная проверка для сингла при добавлении нового трека
                if (releaseType === 'single' && currentTrack >= tracks.length && tracks.length >= 1) {
                  alert('❌ Для сингла можно добавить только 1 трек');
                  return;
                }

                if (currentTrack < tracks.length) {
                  setTracks(tracks.map((t, i) => i === currentTrack ? newTrack : t));
                } else {
                  setTracks([...tracks, newTrack]);
                }
                setCurrentTrack(null); 
                setTrackTitle(''); 
                setTrackLink(''); 
                if (setTrackAudioFile) setTrackAudioFile(null);
                if (setTrackAudioMetadata) setTrackAudioMetadata(null);
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
              if (setTrackAudioFile) setTrackAudioFile(null);
              if (setTrackAudioMetadata) setTrackAudioMetadata(null);
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
