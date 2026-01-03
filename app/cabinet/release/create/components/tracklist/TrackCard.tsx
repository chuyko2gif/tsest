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

interface TrackCardProps {
  track: Track;
  index: number;
  coverPreviewUrl: string | null;
  draggedIndex: number | null;
  dragOverIndex: number | null;
  releaseType?: 'single' | 'ep' | 'album' | null;
  releaseTitle: string;
  tracks: Track[];
  setTracks: (tracks: Track[]) => void;
  onEdit: () => void;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  onDragEnd: () => void;
}

export function TrackCard({
  track,
  index,
  coverPreviewUrl,
  draggedIndex,
  dragOverIndex,
  releaseType,
  releaseTitle,
  tracks,
  setTracks,
  onEdit,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: TrackCardProps) {
  return (
    <div 
      draggable
      onDragStart={() => onDragStart(index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
        draggedIndex === index
          ? 'opacity-50 scale-95 border-purple-500/50 bg-purple-500/10'
          : dragOverIndex === index
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
      <TrackThumbnail coverPreviewUrl={coverPreviewUrl} index={index} />
      
      {/* Информация о треке */}
      <TrackInfo track={track} index={index} />
      
      {/* Кнопки управления */}
      <div className="relative flex items-center gap-2">
        <button
          onClick={onEdit}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-500/10 to-blue-500/10 hover:from-purple-500/20 hover:to-blue-500/20 rounded-xl text-sm font-semibold transition-all border border-purple-500/20 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10"
        >
          Редактировать
        </button>
        <button
          onClick={() => {
            const newTracks = tracks.filter((_, i) => i !== index);
            if (releaseType === 'single' && newTracks.length === 1) {
              newTracks[0] = { ...newTracks[0], title: releaseTitle };
            }
            setTracks(newTracks);
          }}
          className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all border border-red-500/20 hover:border-red-500/40"
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
}

function TrackThumbnail({ coverPreviewUrl, index }: { coverPreviewUrl: string | null; index: number }) {
  return (
    <div className="relative flex-shrink-0">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 to-blue-500/30 rounded-xl blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
      {coverPreviewUrl ? (
        <div className="relative w-12 h-12 rounded-xl overflow-hidden ring-1 ring-white/10 group-hover:ring-purple-500/50 transition-all">
          <img src={coverPreviewUrl} alt="Cover" className="w-full h-full object-cover" />
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
  );
}

function TrackInfo({ track, index }: { track: Track; index: number }) {
  return (
    <div className="flex-1 relative min-w-0">
      <div className="font-bold text-white text-base mb-2 group-hover:text-purple-100 transition-colors">{track.title || `Трек ${index + 1}`}</div>
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
  );
}
