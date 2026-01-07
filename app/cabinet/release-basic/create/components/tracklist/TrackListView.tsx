import React from 'react';
import { TrackAuthor } from '@/components/ui/TrackAuthors';
import { useTheme } from '@/contexts/ThemeContext';

export interface Track {
  title: string;
  link: string;
  audioFile?: File | null;
  audioMetadata?: any;
  authors?: TrackAuthor[]; // Авторы (ФИО + роль) - перед explicit
  hasDrugs: boolean;
  lyrics: string;
  language: string;
  version?: string;
  producers?: string[];
  featuring?: string[];
  isInstrumental?: boolean;
  existingAudioUrl?: string; // URL для уже загруженных треков
  originalFileName?: string; // Оригинальное название файла
}

interface TrackListViewProps {
  tracks: Track[];
  releaseType?: 'single' | 'ep' | 'album' | null;
  releaseTitle: string;
  maxTracks: number;
  coverPreviewUrl: string | null;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  onEditTrack: (index: number) => void;
  onDeleteTrack: (index: number) => void;
  onAddTrack: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
  onNext: () => void;
  onBack: () => void;
}

export function TrackListView({
  tracks,
  releaseType,
  releaseTitle,
  maxTracks,
  coverPreviewUrl,
  draggedIndex,
  dragOverIndex,
  onEditTrack,
  onDeleteTrack,
  onAddTrack,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onNext,
  onBack
}: TrackListViewProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  const isAddDisabled = 
    (releaseType === 'single' && tracks.length >= 1) ||
    (releaseType === 'ep' && tracks.length >= maxTracks) ||
    (releaseType === 'album' && tracks.length >= maxTracks);

  const canProceed = tracks.length > 0 &&
    !(releaseType === 'ep' && tracks.length < 2) &&
    !(releaseType === 'album' && tracks.length < 8);

  const handleNext = () => {
    if (releaseType === 'ep' && tracks.length < 2) {
      alert('❌ Для EP требуется минимум 2 трека');
      return;
    }
    if (releaseType === 'album' && tracks.length < 8) {
      alert('❌ Для альбома требуется минимум 8 треков');
      return;
    }
    if (tracks.length === 0) {
      alert('❌ Добавьте хотя бы один трек');
      return;
    }
    onNext();
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Track List */}
      {tracks.length > 0 && (
        <div className="mb-4 sm:mb-6">
          <h4 className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'} mb-3 sm:mb-4 flex items-center gap-2`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 sm:w-[18px] sm:h-[18px]">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            Треки в релизе ({tracks.length})
          </h4>
          <div className="space-y-2 sm:space-y-3">
            {tracks.map((track, idx) => (
              <TrackRow
                key={`track-${idx}-${track.title}`}
                track={track}
                index={idx}
                coverPreviewUrl={coverPreviewUrl}
                isDragged={draggedIndex === idx}
                isDragOver={dragOverIndex === idx}
                releaseType={releaseType}
                releaseTitle={releaseTitle}
                onEdit={() => onEditTrack(idx)}
                onDelete={() => onDeleteTrack(idx)}
                onDragStart={() => onDragStart(idx)}
                onDragOver={(e) => onDragOver(e, idx)}
                onDrop={(e) => onDrop(e, idx)}
                onDragEnd={onDragEnd}
                isLight={isLight}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Track Button */}
      <button
        onClick={onAddTrack}
        disabled={isAddDisabled}
        className={`w-full px-4 sm:px-6 py-4 sm:py-6 border-2 border-dashed rounded-xl sm:rounded-2xl font-bold transition flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 touch-manipulation ${
          isAddDisabled
            ? isLight 
              ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-white/[0.02] border-white/5 text-zinc-600 cursor-not-allowed'
            : isLight
              ? 'bg-purple-600 hover:bg-purple-700 border-purple-600 hover:border-purple-700 text-white shadow-lg shadow-purple-500/30'
              : 'bg-gradient-to-br from-purple-500/5 to-violet-500/5 hover:from-purple-500/10 hover:to-violet-500/10 border-purple-500/20 hover:border-purple-500/40 text-purple-200/80 hover:text-purple-100'
        }`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-5 h-5 sm:w-6 sm:h-6 ${isLight && !isAddDisabled ? 'text-white' : isLight ? 'text-gray-400' : 'text-purple-400/70'}`}>
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        <span className="text-sm sm:text-base">{getAddButtonText(releaseType, tracks.length, maxTracks)}</span>
      </button>
      
      {/* Status Messages */}
      <TrackStatusMessage releaseType={releaseType} tracksCount={tracks.length} maxTracks={maxTracks} isLight={isLight} />

      {/* Navigation */}
      <div className={`mt-6 sm:mt-8 pt-4 sm:pt-6 border-t ${isLight ? 'border-gray-200' : 'border-white/10'} flex justify-between`}>
        <button onClick={onBack} className={`px-4 sm:px-6 py-2.5 sm:py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10'} rounded-xl font-bold transition flex items-center gap-2 text-sm sm:text-base touch-manipulation`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <button 
          onClick={handleNext}
          disabled={!canProceed}
          className="px-6 sm:px-8 py-2.5 sm:py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-2 text-sm sm:text-base touch-manipulation"
          style={{ color: 'white' }}
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" className="w-4 h-4"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
}

// Helper Components
interface TrackRowProps {
  track: Track;
  index: number;
  coverPreviewUrl: string | null;
  isDragged: boolean;
  isDragOver: boolean;
  releaseType?: 'single' | 'ep' | 'album' | null;
  releaseTitle: string;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isLight: boolean;
}

function TrackRow({
  track, index, coverPreviewUrl, isDragged, isDragOver,
  onEdit, onDelete, onDragStart, onDragOver, onDrop, onDragEnd, isLight
}: TrackRowProps) {
  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDrop={(e) => { e.preventDefault(); onDrop(e); }}
      onDragEnd={onDragEnd}
      className={`relative flex items-center gap-2 sm:gap-4 p-2 sm:p-5 rounded-lg sm:rounded-2xl border-2 transition-all duration-300 ${
        isDragged ? 'opacity-50 scale-95 border-purple-500/50 bg-purple-500/10'
          : isDragOver ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500 shadow-2xl shadow-purple-500/20 scale-[1.02]'
          : isLight 
            ? 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-lg hover:scale-[1.01]'
            : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] border-white/10 hover:border-white/20 hover:shadow-xl hover:scale-[1.01]'
      } group backdrop-blur-sm`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ${isLight ? 'from-purple-100/50 to-blue-100/50' : ''}`} />
      
      {/* Drag Icon */}
      <div className={`relative cursor-grab active:cursor-grabbing ${isLight ? 'text-gray-400 hover:text-purple-500' : 'text-zinc-600 hover:text-purple-400'} transition flex-shrink-0 hidden sm:flex`} title="Перетащите">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/>
          <circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
        </svg>
      </div>
      
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        {coverPreviewUrl ? (
          <div className={`relative w-8 h-8 sm:w-12 sm:h-12 rounded-md sm:rounded-xl overflow-hidden ring-1 ${isLight ? 'ring-gray-200 group-hover:ring-purple-300' : 'ring-white/10 group-hover:ring-purple-500/50'} transition-all`}>
            <img src={coverPreviewUrl} alt="Cover" className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-xs sm:text-base font-black drop-shadow-lg" style={{ color: 'white' }}>{index + 1}</span>
            </div>
          </div>
        ) : (
          <div className={`relative w-8 h-8 sm:w-12 sm:h-12 rounded-md sm:rounded-xl ${isLight ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'} flex items-center justify-center text-xs sm:text-base font-black ring-1 ${isLight ? 'ring-purple-400 group-hover:ring-purple-500' : 'ring-white/10 group-hover:ring-purple-500/50'} transition-all`} style={{ color: 'white' }}>
            {index + 1}
          </div>
        )}
      </div>
      
      {/* Track Info - основной блок с информацией */}
      <div className="flex-1 relative min-w-0">
        {/* Строка 1: Название + prod. + feat. */}
        <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-0.5 sm:gap-y-1 mb-1 sm:mb-1.5">
          <span className={`font-bold ${isLight ? 'text-gray-900 group-hover:text-purple-700' : 'text-white group-hover:text-purple-100'} text-sm sm:text-base transition-colors truncate max-w-[100px] sm:max-w-none`}>
            {track.title || `Трек ${index + 1}`}
          </span>
          {/* Продюсеры */}
          {track.producers && track.producers.length > 0 && track.producers.some((p: string) => p.trim()) && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 ${isLight ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-blue-300 border-blue-500/30'} text-[10px] sm:text-xs rounded-full border`}>
              <span className="font-medium">prod.</span> <span className="truncate max-w-[60px] sm:max-w-none">{track.producers.filter((p: string) => p.trim()).join(', ')}</span>
            </span>
          )}
          {/* Featuring */}
          {track.featuring && track.featuring.length > 0 && track.featuring.some((f: string) => f.trim()) && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 ${isLight ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-gradient-to-r from-pink-500/20 to-rose-500/20 text-pink-300 border-pink-500/30'} text-[10px] sm:text-xs rounded-full border`}>
              <span className="font-medium">ft.</span> <span className="truncate max-w-[60px] sm:max-w-none">{track.featuring.filter((f: string) => f.trim()).join(', ')}</span>
            </span>
          )}
          {/* Explicit */}
          {!track.isInstrumental && track.hasDrugs && (
            <span className={`inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-transparent ${isLight ? 'text-red-500 border-red-400' : 'text-red-400/80 border-red-400/60'} text-[10px] sm:text-xs font-bold rounded border`}>
              E
            </span>
          )}
        </div>
        
        {/* Строка 2: Мета-данные */}
        <div className="flex flex-wrap items-center gap-x-1 sm:gap-x-2 gap-y-0.5 sm:gap-y-1 text-[10px] sm:text-xs">
          {/* Аудиофайл - формат и название */}
          {(track.audioFile || track.link || track.originalFileName) && (
            <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 ${isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-400 border-emerald-500/25'} rounded-md sm:rounded-lg border`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-2.5 h-2.5 sm:w-[10px] sm:h-[10px]">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
              {(() => {
                const fileName = track.audioFile?.name || track.originalFileName || track.link?.split('/').pop()?.split('?')[0] || '';
                const ext = fileName.includes('.') ? fileName.split('.').pop()?.toUpperCase() : 'WAV';
                const baseName = fileName.includes('.') ? fileName.slice(0, fileName.lastIndexOf('.')) : fileName;
                const decodedName = baseName ? decodeURIComponent(baseName) : '';
                const displayName = decodedName.length > 15 ? decodedName.substring(0, 12) + '...' : decodedName;
                return (
                  <>
                    <span className="font-bold">{ext}</span>
                    {displayName && <span className={`hidden sm:inline ${isLight ? 'text-emerald-600' : 'text-emerald-300/70'}`}>· {displayName}</span>}
                  </>
                );
              })()}
            </span>
          )}
          {/* Язык */}
          {!track.isInstrumental && track.language && (
            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 ${isLight ? 'bg-cyan-100 text-cyan-700 border-cyan-200' : 'bg-gradient-to-r from-cyan-500/15 to-sky-500/15 text-cyan-300 border-cyan-500/25'} rounded-md sm:rounded-lg border`}>
              {track.language}
            </span>
          )}
          {/* Clean */}
          {!track.isInstrumental && !track.hasDrugs && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 ${isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-400 border-emerald-500/20'} rounded-md sm:rounded-lg font-medium border`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-2.5 h-2.5 sm:w-[10px] sm:h-[10px]">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Clean
            </span>
          )}
          {/* Версия */}
          {track.version && (
            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 ${isLight ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gradient-to-r from-orange-500/15 to-amber-500/15 text-orange-300 border-orange-500/25'} rounded-md sm:rounded-lg border`}>
              {track.version}
            </span>
          )}
          {/* Instrumental */}
          {track.isInstrumental && (
            <span className={`inline-flex items-center gap-0.5 px-1.5 sm:px-2 py-0.5 sm:py-1 ${isLight ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-300 border-violet-500/30'} rounded-md sm:rounded-lg font-bold border`}>
              INSTRUMENTAL
            </span>
          )}
          {/* Авторы */}
          {track.authors && track.authors.length > 0 && (
            <span className={`inline-flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 ${isLight ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-300 border-amber-500/25'} rounded-md sm:rounded-lg border`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`w-2.5 h-2.5 sm:w-[10px] sm:h-[10px] ${isLight ? 'text-amber-500' : 'text-amber-400'}`}>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="truncate max-w-[60px] sm:max-w-none">{track.authors.map((a: any) => a.fullName).join(', ')}</span>
            </span>
          )}
        </div>
      </div>
      
      {/* Actions - компактные кнопки */}
      <div className="relative flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <button onClick={onEdit} className={`w-7 h-7 sm:w-auto sm:h-auto sm:px-4 sm:py-2.5 flex items-center justify-center ${isLight ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 border-purple-600 hover:border-purple-700 text-white' : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 border-purple-500/20 hover:border-purple-500/40'} rounded-md sm:rounded-xl text-xs sm:text-sm font-semibold transition-all border`}>
          <span className="hidden sm:inline">Редактировать</span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`sm:hidden ${isLight ? 'text-white' : 'text-purple-300'}`}>
            <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
        </button>
        <button onClick={onDelete} className={`w-7 h-7 sm:w-auto sm:h-auto sm:px-3 sm:py-2.5 flex items-center justify-center ${isLight ? 'bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300' : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40'} text-red-400 rounded-md sm:rounded-xl transition-all border`} title="Удалить трек">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

function getAddButtonText(releaseType: 'single' | 'ep' | 'album' | null | undefined, count: number, max: number): string {
  if (releaseType === 'single' && count >= 1) return 'Сингл может содержать только 1 трек';
  if (releaseType === 'ep' && count >= max) return `Вы выбрали максимум ${max} треков для EP`;
  if (releaseType === 'album' && count >= max) return `Вы выбрали максимум ${max} треков для альбома`;
  return 'Добавить трек';
}

interface TrackStatusMessageProps {
  releaseType?: 'single' | 'ep' | 'album' | null;
  tracksCount: number;
  maxTracks: number;
  isLight: boolean;
}

function TrackStatusMessage({ releaseType, tracksCount, maxTracks, isLight }: TrackStatusMessageProps) {
  if (releaseType === 'single' && tracksCount === 1) {
    return (
      <div className={`flex items-start gap-3 p-4 ${isLight ? 'bg-emerald-50 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/20'} border rounded-xl`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        <div className="text-sm">
          <div className={`font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-400'} mb-1`}>✓ Сингл готов</div>
          <div className={isLight ? 'text-emerald-600' : 'text-emerald-300/80'}>Название трека автоматически совпадает с названием релиза</div>
        </div>
      </div>
    );
  }
  
  if (releaseType === 'ep' && tracksCount < 2) {
    return (
      <div className={`flex items-start gap-3 p-4 ${isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/10 border-orange-500/20'} border rounded-xl`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-orange-400 flex-shrink-0 mt-0.5" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
        <div className="text-sm">
          <div className={`font-semibold ${isLight ? 'text-orange-700' : 'text-orange-400'} mb-1`}>⚠️ Требования для EP</div>
          <div className={isLight ? 'text-orange-600' : 'text-orange-300/80'}>Минимум: 2 трека • Максимум: {maxTracks} треков<br/>Нужно добавить ещё {2 - tracksCount} трек{2 - tracksCount === 1 ? '' : 'а'}</div>
        </div>
      </div>
    );
  }
  
  if (releaseType === 'album' && tracksCount < 8) {
    return (
      <div className={`flex items-start gap-3 p-4 ${isLight ? 'bg-orange-50 border-orange-200' : 'bg-orange-500/10 border-orange-500/20'} border rounded-xl`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-orange-400 flex-shrink-0 mt-0.5" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
        <div className="text-sm">
          <div className={`font-semibold ${isLight ? 'text-orange-700' : 'text-orange-400'} mb-1`}>⚠️ Требования для Альбома</div>
          <div className={isLight ? 'text-orange-600' : 'text-orange-300/80'}>Минимум: 8 треков • Максимум: {maxTracks} треков<br/>Нужно добавить ещё {8 - tracksCount} треков</div>
        </div>
      </div>
    );
  }
  
  return null;
}
