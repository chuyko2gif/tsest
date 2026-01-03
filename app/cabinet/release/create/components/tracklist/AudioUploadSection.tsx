import React, { useState } from 'react';

interface AudioMetadata {
  format: string;
  duration?: number;
  bitrate?: string;
  sampleRate?: string;
  size: number;
}

interface AudioUploadSectionProps {
  trackAudioFile?: File | null;
  setTrackAudioFile?: (file: File | null) => void;
  trackAudioMetadata?: AudioMetadata | null;
  setTrackAudioMetadata?: (metadata: AudioMetadata | null) => void;
}

export function AudioUploadSection({
  trackAudioFile,
  setTrackAudioFile,
  trackAudioMetadata,
  setTrackAudioMetadata
}: AudioUploadSectionProps) {
  const [uploadError, setUploadError] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const analyzeAudioFile = async (file: File): Promise<AudioMetadata | null> => {
    try {
      setIsAnalyzing(true);
      setUploadError('');

      const fileName = file.name.toLowerCase();
      const isWav = fileName.endsWith('.wav');
      const isFlac = fileName.endsWith('.flac');
      
      if (!isWav && !isFlac) {
        setUploadError('❌ MP3 не принимается. Загрузите WAV или FLAC');
        return null;
      }

      const metadata: AudioMetadata = {
        format: isWav ? 'WAV' : 'FLAC',
        size: file.size,
      };

      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        metadata.duration = audioBuffer.duration;
        metadata.sampleRate = `${audioBuffer.sampleRate / 1000} kHz`;
        
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

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const metadata = await analyzeAudioFile(file);
    if (metadata && setTrackAudioFile && setTrackAudioMetadata) {
      setTrackAudioFile(file);
      setTrackAudioMetadata(metadata);
    } else if (!metadata) {
      e.target.value = '';
      if (setTrackAudioFile) setTrackAudioFile(null);
      if (setTrackAudioMetadata) setTrackAudioMetadata(null);
    }
  };

  return (
    <div>
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>
        Аудиофайл
        <span className="text-red-400 text-[10px]">*</span>
      </label>
      
      {uploadError && (
        <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {uploadError}
        </div>
      )}

      {trackAudioFile && trackAudioMetadata ? (
        <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-white truncate">{trackAudioFile.name}</div>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-zinc-400">
                <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
                  {trackAudioMetadata.format}
                </span>
                {trackAudioMetadata.duration && (
                  <span className="inline-flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {formatDuration(trackAudioMetadata.duration)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                  </svg>
                  {trackAudioMetadata.sampleRate}
                </span>
                <span>{formatFileSize(trackAudioMetadata.size)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (setTrackAudioFile) setTrackAudioFile(null);
                if (setTrackAudioMetadata) setTrackAudioMetadata(null);
              }}
              className="w-10 h-10 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 rounded-xl text-red-400 transition-all border border-red-500/20 hover:border-red-500/40"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <label className="block cursor-pointer group">
          <input
            type="file"
            accept=".wav,.flac"
            onChange={handleAudioFileChange}
            className="hidden"
          />
          <div className="relative overflow-hidden border-2 border-dashed border-white/10 hover:border-purple-500/40 rounded-2xl p-6 transition-all bg-gradient-to-br from-white/[0.02] to-transparent hover:from-purple-500/5 hover:to-blue-500/5">
            <div className="text-center">
              {isAnalyzing ? (
                <>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <svg className="animate-spin w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-purple-400 font-semibold">Анализ файла...</span>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                  </div>
                  <span className="text-sm text-zinc-400">Нажмите для загрузки или перетащите файл</span>
                  <div className="flex flex-wrap justify-center gap-2 mt-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-[10px] font-semibold">WAV</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-semibold">FLAC</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 mt-2">Минимальная частота: 44.1 kHz</p>
                </>
              )}
            </div>
          </div>
        </label>
      )}
    </div>
  );
}
