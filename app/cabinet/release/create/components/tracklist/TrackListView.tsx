import React from 'react';

interface Track {
  title: string;
  link: string;
  audioFile?: File | null;
  audioMetadata?: any;
  hasDrugs: boolean;
  lyrics: string;
  language: string;
  version?: string;
  producers?: string[];
  featuring?: string[];
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
    <div className="space-y-4">
      {/* Track List */}
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
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Track Button */}
      <button
        onClick={onAddTrack}
        disabled={isAddDisabled}
        className={`w-full px-6 py-6 border-2 border-dashed rounded-2xl font-bold transition flex items-center justify-center gap-3 ${
          isAddDisabled
            ? 'bg-white/[0.02] border-white/5 text-zinc-600 cursor-not-allowed'
            : 'bg-white/[0.02] hover:bg-[#6050ba]/10 border-white/10 hover:border-[#6050ba]/50'
        }`}
      >
        <span className="text-2xl">+</span>
        <span>{getAddButtonText(releaseType, tracks.length, maxTracks)}</span>
      </button>
      
      {/* Status Messages */}
      <TrackStatusMessage releaseType={releaseType} tracksCount={tracks.length} maxTracks={maxTracks} />

      {/* Navigation */}
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <button 
          onClick={handleNext}
          disabled={!canProceed}
          className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-2"
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
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
}

function TrackRow({
  track, index, coverPreviewUrl, isDragged, isDragOver,
  onEdit, onDelete, onDragStart, onDragOver, onDrop, onDragEnd
}: TrackRowProps) {
  return (
    <div 
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(e); }}
      onDrop={(e) => { e.preventDefault(); onDrop(e); }}
      onDragEnd={onDragEnd}
      className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
        isDragged ? 'opacity-50 scale-95 border-purple-500/50 bg-purple-500/10'
          : isDragOver ? 'bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-purple-500 shadow-2xl shadow-purple-500/20 scale-[1.02]'
          : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] border-white/10 hover:border-white/20 hover:shadow-xl hover:scale-[1.01]'
      } group backdrop-blur-sm`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {/* Drag Handle */}
      <div className="relative cursor-grab active:cursor-grabbing text-zinc-600 hover:text-purple-400 transition flex-shrink-0" title="Перетащите">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="9" cy="5" r="1" fill="currentColor"/><circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="9" cy="19" r="1" fill="currentColor"/>
          <circle cx="15" cy="5" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="19" r="1" fill="currentColor"/>
        </svg>
      </div>
      
      {/* Thumbnail */}
      <div className="relative flex-shrink-0">
        {coverPreviewUrl ? (
          <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all">
            <img src={coverPreviewUrl} alt="Cover" className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-base font-black text-white drop-shadow-lg">{index + 1}</span>
            </div>
          </div>
        ) : (
          <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-base font-black ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all">
            {index + 1}
          </div>
        )}
      </div>
      
      {/* Track Info */}
      <div className="flex-1 relative min-w-0">
        <div className="font-bold text-white text-base mb-2 group-hover:text-purple-100 transition-colors">{track.title || `Трек ${index + 1}`}</div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
          {track.language && (
            <span className="flex items-center gap-1.5 text-zinc-400">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              {track.language}
            </span>
          )}
          {track.hasDrugs && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-400 rounded-lg text-[10px] font-bold ring-1 ring-red-500/30">EXPLICIT</span>
          )}
        </div>
        {(track.version || track.producers || track.featuring) && (
          <div className="flex flex-wrap gap-2 mt-2.5">
            {track.version && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-400 rounded-lg text-[10px] font-semibold ring-1 ring-orange-500/20">{track.version}</span>}
            {track.producers && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-400 rounded-lg text-[10px] font-semibold ring-1 ring-blue-500/20">{Array.isArray(track.producers) ? track.producers.join(', ') : track.producers}</span>}
            {track.featuring && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-pink-500/10 text-pink-400 rounded-lg text-[10px] font-semibold ring-1 ring-pink-500/20">{Array.isArray(track.featuring) ? track.featuring.join(', ') : track.featuring}</span>}
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="relative flex items-center gap-2">
        <button onClick={onEdit} className="px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 rounded-xl text-sm font-semibold transition-all border border-purple-500/20 hover:border-purple-500/40">Редактировать</button>
        <button onClick={onDelete} className="px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/20 hover:border-red-500/40" title="Удалить трек">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
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
}

function TrackStatusMessage({ releaseType, tracksCount, maxTracks }: TrackStatusMessageProps) {
  if (releaseType === 'single' && tracksCount === 1) {
    return (
      <div className="flex items-start gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
        </svg>
        <div className="text-sm">
          <div className="font-semibold text-emerald-400 mb-1">✓ Сингл готов</div>
          <div className="text-emerald-300/80">Название трека автоматически совпадает с названием релиза</div>
        </div>
      </div>
    );
  }
  
  if (releaseType === 'ep' && tracksCount < 2) {
    return (
      <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-orange-400 flex-shrink-0 mt-0.5" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
        <div className="text-sm">
          <div className="font-semibold text-orange-400 mb-1">⚠️ Требования для EP</div>
          <div className="text-orange-300/80">Минимум: 2 трека • Максимум: {maxTracks} треков<br/>Нужно добавить ещё {2 - tracksCount} трек{2 - tracksCount === 1 ? '' : 'а'}</div>
        </div>
      </div>
    );
  }
  
  if (releaseType === 'album' && tracksCount < 8) {
    return (
      <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-orange-400 flex-shrink-0 mt-0.5" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/>
        </svg>
        <div className="text-sm">
          <div className="font-semibold text-orange-400 mb-1">⚠️ Требования для Альбома</div>
          <div className="text-orange-300/80">Минимум: 8 треков • Максимум: {maxTracks} треков<br/>Нужно добавить ещё {8 - tracksCount} треков</div>
        </div>
      </div>
    );
  }
  
  return null;
}

// Export Track interface for use in other components
export type { Track };
