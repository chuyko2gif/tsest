import React, { useState, useEffect } from 'react';
import { TrackListView, TrackEditor, Track } from './tracklist';

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
  releaseTitle, releaseType, selectedTracksCount, coverFile, tracks, setTracks,
  currentTrack, setCurrentTrack, trackTitle, setTrackTitle, setTrackLink,
  trackAudioFile, setTrackAudioFile, trackAudioMetadata, setTrackAudioMetadata,
  trackHasDrugs, setTrackHasDrugs, trackLyrics, setTrackLyrics, trackLanguage, setTrackLanguage,
  trackVersion, setTrackVersion, trackProducers, setTrackProducers, trackFeaturing, setTrackFeaturing,
  onNext, onBack,
}: TracklistStepProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);

  // Cover preview URL
  useEffect(() => {
    if (coverFile) {
      const url = URL.createObjectURL(coverFile);
      setCoverPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setCoverPreviewUrl(null);
  }, [coverFile]);

  // Auto-sync single track title with release title
  useEffect(() => {
    if (releaseType === 'single' && tracks.length === 1 && releaseTitle && tracks[0].title !== releaseTitle) {
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
    setTrackHasDrugs(track.hasDrugs);
    setTrackLyrics(track.lyrics);
    setTrackLanguage(track.language);
    if (setTrackVersion) setTrackVersion(track.version || '');
    if (setTrackProducers) setTrackProducers(Array.isArray(track.producers) ? track.producers : track.producers ? [track.producers] : []);
    if (setTrackFeaturing) setTrackFeaturing(Array.isArray(track.featuring) ? track.featuring : track.featuring ? [track.featuring] : []);
  };

  const handleDeleteTrack = (index: number) => {
    const newTracks = tracks.filter((_, i) => i !== index);
    if (releaseType === 'single' && newTracks.length === 1) {
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
    setTrackHasDrugs(false); setTrackLyrics(''); setTrackLanguage('');
    if (setTrackVersion) setTrackVersion('');
    if (setTrackProducers) setTrackProducers([]);
    if (setTrackFeaturing) setTrackFeaturing([]);
  };

  const handleSaveTrack = () => {
    const isSingleRelease = releaseType === 'single';
    const finalTitle = isSingleRelease ? releaseTitle : trackTitle;
    
    if (isSingleRelease && (!releaseTitle || !releaseTitle.trim())) {
      alert('Сначала заполните название релиза на предыдущем шаге'); return;
    }
    if (!finalTitle || !finalTitle.trim()) { alert('Заполните название трека'); return; }
    if (!trackAudioFile) { alert('Загрузите аудиофайл (WAV или FLAC)'); return; }
    
    const newTrack: Track = { 
      title: finalTitle, link: '',
      audioFile: trackAudioFile || undefined,
      audioMetadata: trackAudioMetadata || undefined,
      hasDrugs: trackHasDrugs, lyrics: trackLyrics, language: trackLanguage,
      version: trackVersion || undefined,
      producers: trackProducers?.filter(p => p.trim()).length ? trackProducers.filter(p => p.trim()) : undefined,
      featuring: trackFeaturing?.filter(f => f.trim()).length ? trackFeaturing.filter(f => f.trim()) : undefined
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
      <div className="mb-6">
        <h2 className="text-3xl font-black uppercase tracking-tight">Треклист</h2>
        <p className="text-sm text-zinc-500 mt-1">
          {releaseType === 'single' && 'Добавьте трек в ваш сингл (макс. 1)'}
          {releaseType === 'ep' && selectedTracksCount && `Добавьте треки в ваш EP (макс. ${selectedTracksCount})`}
          {releaseType === 'ep' && !selectedTracksCount && 'Добавьте треки в ваш EP (от 2 до 7)'}
          {releaseType === 'album' && selectedTracksCount && `Добавьте треки в ваш альбом (макс. ${selectedTracksCount})`}
          {releaseType === 'album' && !selectedTracksCount && 'Добавьте треки в ваш альбом (от 8 до 50)'}
          {!releaseType && 'Добавьте треки в ваш релиз'}
        </p>
        
        {releaseType && tracks.length > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 rounded-lg">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
            </svg>
            <span className="text-sm font-semibold">
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
        />
      ) : (
        <TrackEditor
          currentTrack={currentTrack}
          tracksLength={tracks.length}
          releaseType={releaseType}
          releaseTitle={releaseTitle}
          trackTitle={trackTitle}
          setTrackTitle={setTrackTitle}
          trackAudioFile={trackAudioFile}
          setTrackAudioFile={setTrackAudioFile}
          trackAudioMetadata={trackAudioMetadata}
          setTrackAudioMetadata={setTrackAudioMetadata}
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
          onSave={handleSaveTrack}
          onCancel={resetTrackForm}
        />
      )}
    </div>
  );
}
