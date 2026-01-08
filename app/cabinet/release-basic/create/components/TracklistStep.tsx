import React, { useState, useEffect } from 'react';
import { TrackListView, TrackEditor, Track } from './tracklist';
import { showErrorToast } from '@/lib/utils/showToast';
import { TrackAuthor } from '@/components/ui/TrackAuthors';
import { useTheme } from '@/contexts/ThemeContext';

interface AudioMetadata {
  format: string;
  duration?: number;
  bitrate?: string;
  sampleRate?: string;
  size: number;
}

interface TracklistStepProps {
  releaseTitle: string;
  releaseType?: 'single' | 'ep' | 'album' | null;
  selectedTracksCount?: number;
  coverFile?: File | null;
  existingCoverUrl?: string;
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
  trackAuthors?: TrackAuthor[];
  setTrackAuthors?: (value: TrackAuthor[]) => void;
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
  trackIsInstrumental?: boolean;
  setTrackIsInstrumental?: (value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function TracklistStep({
  releaseTitle, releaseType, selectedTracksCount, coverFile, existingCoverUrl, tracks, setTracks,
  currentTrack, setCurrentTrack, trackTitle, setTrackTitle, trackLink, setTrackLink,
  trackAudioFile, setTrackAudioFile, trackAudioMetadata, setTrackAudioMetadata,
  trackAuthors, setTrackAuthors,
  trackHasDrugs, setTrackHasDrugs, trackLyrics, setTrackLyrics, trackLanguage, setTrackLanguage,
  trackVersion, setTrackVersion, trackProducers, setTrackProducers, trackFeaturing, setTrackFeaturing,
  trackIsInstrumental, setTrackIsInstrumental,
  onNext, onBack,
}: TracklistStepProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  // Cover preview URL
  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (existingCoverUrl) {
      setCoverPreviewUrl(existingCoverUrl);
    } else {
      setCoverPreviewUrl(null);
    }
  }, [coverFile, existingCoverUrl]);

  // Auto-sync single track title with release title
  useEffect(() => {
    // Только если releaseTitle НЕ пустой - синхронизируем
    // Это предотвращает перезапись title пустой строкой при загрузке
    if (releaseType === 'single' && tracks.length === 1 && releaseTitle && releaseTitle.trim() && tracks[0].title !== releaseTitle) {
      setTracks([{ ...tracks[0], title: releaseTitle }]);
    }
  }, [releaseType, releaseTitle, tracks, setTracks]);

  // Auto-fill title for new single track
  useEffect(() => {
    if (currentTrack !== null && currentTrack === tracks.length && releaseTitle && releaseType === 'single') {
      setTrackTitle(releaseTitle);
    }
  }, [currentTrack, tracks.length, releaseTitle, releaseType, setTrackTitle]);

  // Sync trackTitle when editing single's track
  useEffect(() => {
    if (releaseType === 'single' && currentTrack !== null && currentTrack < tracks.length && tracks.length === 1) {
      setTrackTitle(releaseTitle);
    }
  }, [releaseType, releaseTitle, currentTrack, tracks.length, setTrackTitle]);

  const maxTracks = releaseType === 'single' ? 1 : releaseType === 'ep' ? (selectedTracksCount || 7) : (selectedTracksCount || 50);

  // Drag handlers
  const handleDragStart = (index: number) => setDraggedIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => { e.preventDefault(); setDragOverIndex(index); };
  const handleDragEnd = () => { setDraggedIndex(null); setDragOverIndex(null); };
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null); setDragOverIndex(null); return;
    }
    const newTracks = [...tracks];
    const [draggedTrack] = newTracks.splice(draggedIndex, 1);
    newTracks.splice(dropIndex, 0, draggedTrack);
    setTracks(newTracks);
    setDraggedIndex(null); setDragOverIndex(null);
  };

  // Track management
  const handleEditTrack = (index: number) => {
    const track = tracks[index];
    setCurrentTrack(index);
    setTrackTitle(track.title);
    setTrackLink(track.link);
    if (setTrackAudioFile) setTrackAudioFile(track.audioFile || null);
    if (setTrackAudioMetadata) setTrackAudioMetadata(track.audioMetadata || null);
    if (setTrackAuthors) setTrackAuthors(Array.isArray(track.authors) ? track.authors : []);
    setTrackHasDrugs(track.hasDrugs);
    setTrackLyrics(track.lyrics);
    setTrackLanguage(track.language);
    if (setTrackVersion) setTrackVersion(track.version || '');
    if (setTrackProducers) setTrackProducers(Array.isArray(track.producers) ? track.producers : track.producers ? [track.producers] : []);
    if (setTrackFeaturing) setTrackFeaturing(Array.isArray(track.featuring) ? track.featuring : track.featuring ? [track.featuring] : []);
    if (setTrackIsInstrumental) setTrackIsInstrumental(track.isInstrumental || false);
  };

  const handleDeleteTrack = (index: number) => {
    const newTracks = tracks.filter((_, i) => i !== index);
    if (releaseType === 'single' && newTracks.length === 1 && releaseTitle && releaseTitle.trim()) {
      newTracks[0] = { ...newTracks[0], title: releaseTitle };
    }
    setTracks(newTracks);
  };

  const handleAddTrack = () => {
    if (releaseType === 'single' && tracks.length >= 1) { alert('❌ Для сингла можно добавить только 1 трек'); return; }
    if (releaseType === 'ep' && tracks.length >= maxTracks) { alert(`❌ Для EP вы выбрали максимум ${maxTracks} треков`); return; }
    if (releaseType === 'album' && tracks.length >= maxTracks) { alert(`❌ Для альбома вы выбрали максимум ${maxTracks} треков`); return; }
    setCurrentTrack(tracks.length);
  };

  const resetTrackForm = () => {
    setCurrentTrack(null); setTrackTitle(''); setTrackLink('');
    if (setTrackAudioFile) setTrackAudioFile(null);
    if (setTrackAudioMetadata) setTrackAudioMetadata(null);
    if (setTrackAuthors) setTrackAuthors([]);
    setTrackHasDrugs(false); setTrackLyrics(''); setTrackLanguage('');
    if (setTrackVersion) setTrackVersion('');
    if (setTrackProducers) setTrackProducers([]);
    if (setTrackFeaturing) setTrackFeaturing([]);
    if (setTrackIsInstrumental) setTrackIsInstrumental(false);
  };

  const handleSaveTrack = () => {
    const isSingleRelease = releaseType === 'single';
    const finalTitle = isSingleRelease ? releaseTitle : trackTitle;
    
    if (isSingleRelease && (!releaseTitle || !releaseTitle.trim())) {
      showErrorToast('Сначала заполните название релиза на предыдущем шаге'); return;
    }
    if (!finalTitle || !finalTitle.trim()) { showErrorToast('Заполните название трека'); return; }
    // Проверяем наличие аудио: либо новый файл, либо уже загруженный URL
    const existingTrack = currentTrack !== null && currentTrack < tracks.length ? tracks[currentTrack] : null;
    const existingTrackLink = existingTrack?.link || '';
    const existingOriginalFileName = existingTrack?.originalFileName || '';
    if (!trackAudioFile && !existingTrackLink) { showErrorToast('Загрузите аудиофайл (WAV или FLAC)'); return; }
    
    // Проверка на дублирование названий
    const normalizedTitle = finalTitle.trim().toLowerCase();
    const duplicateIndex = tracks.findIndex((t, i) => 
      t.title.trim().toLowerCase() === normalizedTitle && i !== currentTrack
    );
    if (duplicateIndex !== -1) {
      showErrorToast(`Трек с названием "${finalTitle}" уже существует в треклисте`);
      return;
    }
    
    const newTrack: Track = { 
      title: finalTitle,
      // Сохраняем существующий link если нет нового файла
      link: trackAudioFile ? '' : existingTrackLink,
      audioFile: trackAudioFile || undefined,
      audioMetadata: trackAudioMetadata || existingTrack?.audioMetadata || undefined,
      originalFileName: trackAudioFile?.name || existingOriginalFileName,
      authors: trackAuthors && trackAuthors.length > 0 ? trackAuthors : undefined,
      hasDrugs: trackHasDrugs, 
      lyrics: trackIsInstrumental ? '' : trackLyrics, 
      language: trackIsInstrumental ? '' : trackLanguage,
      version: trackVersion || undefined,
      producers: trackProducers?.filter(p => p.trim()).length ? trackProducers.filter(p => p.trim()) : undefined,
      featuring: trackFeaturing?.filter(f => f.trim()).length ? trackFeaturing.filter(f => f.trim()) : undefined,
      isInstrumental: trackIsInstrumental || false
    };
    
    if (currentTrack !== null && currentTrack < tracks.length) {
      setTracks(tracks.map((t, i) => i === currentTrack ? newTrack : t));
    } else {
      setTracks([...tracks, newTrack]);
    }
    resetTrackForm();
  };

  return (
    <div className="animate-fade-up">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-2">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center ring-1 ${isLight ? 'bg-purple-100 ring-purple-200' : 'bg-gradient-to-br from-purple-500/20 to-violet-500/20 ring-purple-500/20'}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`sm:w-5 sm:h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <h2 className={`text-xl sm:text-3xl font-black uppercase tracking-tight ${isLight ? 'text-gray-900' : 'text-white'}`}>Треклист</h2>
        </div>
        <p className={`text-xs sm:text-sm mt-1 ml-10 sm:ml-13 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
          {releaseType === 'single' && 'Добавьте трек в ваш сингл (макс. 1)'}
          {releaseType === 'ep' && selectedTracksCount && `Добавьте треки в ваш EP (макс. ${selectedTracksCount})`}
          {releaseType === 'ep' && !selectedTracksCount && 'Добавьте треки в ваш EP (от 2 до 7)'}
          {releaseType === 'album' && selectedTracksCount && `Добавьте треки в ваш альбом (макс. ${selectedTracksCount})`}
          {releaseType === 'album' && !selectedTracksCount && 'Добавьте треки в ваш альбом (от 8 до 50)'}
          {!releaseType && 'Добавьте треки в ваш релиз'}
        </p>
        
        {releaseType && tracks.length > 0 && (
          <div className={`mt-2.5 sm:mt-3 inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg border ${isLight ? 'bg-purple-50 border-purple-200' : 'bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-500/20'}`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
            <span className={`text-xs sm:text-sm font-semibold ${isLight ? 'text-purple-700' : 'text-purple-200/80'}`}>
              {releaseType === 'single' && `Треков: ${tracks.length} / 1`}
              {releaseType === 'ep' && `Треков: ${tracks.length} / ${maxTracks} (минимум 2)`}
              {releaseType === 'album' && `Треков: ${tracks.length} / ${maxTracks} (минимум 8)`}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      {currentTrack === null ? (
        <TrackListView
          tracks={tracks}
          releaseType={releaseType}
          releaseTitle={releaseTitle}
          maxTracks={maxTracks}
          coverPreviewUrl={coverPreviewUrl}
          draggedIndex={draggedIndex}
          dragOverIndex={dragOverIndex}
          onEditTrack={handleEditTrack}
          onDeleteTrack={handleDeleteTrack}
          onAddTrack={handleAddTrack}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDragEnd={handleDragEnd}
          onNext={onNext}
          onBack={onBack}
          isLight={isLight}
        />
      ) : (
        <TrackEditor
          currentTrack={currentTrack}
          tracksLength={tracks.length}
          releaseType={releaseType}
          releaseTitle={releaseTitle}
          trackTitle={trackTitle}
          setTrackTitle={setTrackTitle}
          trackLink={trackLink}
          trackOriginalFileName={currentTrack !== null && currentTrack < tracks.length ? tracks[currentTrack]?.originalFileName : undefined}
          trackAudioFile={trackAudioFile}
          setTrackAudioFile={setTrackAudioFile}
          trackAudioMetadata={trackAudioMetadata}
          setTrackAudioMetadata={setTrackAudioMetadata}
          trackAuthors={trackAuthors}
          setTrackAuthors={setTrackAuthors}
          trackHasDrugs={trackHasDrugs}
          setTrackHasDrugs={setTrackHasDrugs}
          trackLyrics={trackLyrics}
          setTrackLyrics={setTrackLyrics}
          trackLanguage={trackLanguage}
          setTrackLanguage={setTrackLanguage}
          trackVersion={trackVersion}
          setTrackVersion={setTrackVersion}
          trackProducers={trackProducers}
          setTrackProducers={setTrackProducers}
          trackFeaturing={trackFeaturing}
          setTrackFeaturing={setTrackFeaturing}
          trackIsInstrumental={trackIsInstrumental}
          setTrackIsInstrumental={setTrackIsInstrumental}
          onSave={handleSaveTrack}
          onCancel={resetTrackForm}
          isLight={isLight}
        />
      )}
    </div>
  );
}
