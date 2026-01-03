import React from 'react';
import { AudioUploadSection } from './AudioUploadSection';

interface AudioMetadata {
  format: string;
  duration?: number;
  bitrate?: string;
  sampleRate?: string;
  size: number;
}

interface TrackEditorProps {
  currentTrack: number;
  tracksLength: number;
  releaseType?: 'single' | 'ep' | 'album' | null;
  releaseTitle: string;
  trackTitle: string;
  setTrackTitle: (value: string) => void;
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
  onSave: () => void;
  onCancel: () => void;
}

export function TrackEditor({
  currentTrack,
  tracksLength,
  releaseType,
  releaseTitle,
  trackTitle,
  setTrackTitle,
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
  onSave,
  onCancel
}: TrackEditorProps) {
  const isSingleRelease = releaseType === 'single';

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-bold">
          {currentTrack < tracksLength ? `Редактирование трека ${currentTrack + 1}` : 'Новый трек'}
        </h4>
        <button onClick={onCancel} className="text-sm text-zinc-400 hover:text-white flex items-center gap-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          К списку
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">
          Название трека *
          {isSingleRelease && <span className="ml-2 text-xs text-emerald-400">(Автоматически совпадает с названием сингла)</span>}
        </label>
        <input 
          value={isSingleRelease ? releaseTitle : trackTitle} 
          onChange={(e) => setTrackTitle(e.target.value)} 
          placeholder={releaseTitle || "Введите название"}
          disabled={isSingleRelease}
          className={`w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none transition-all ${
            isSingleRelease ? 'opacity-60 cursor-not-allowed ring-2 ring-emerald-500/20' : 'hover:border-white/20 focus:border-[#6050ba] focus:ring-2 focus:ring-[#6050ba]/20'
          }`}
        />
      </div>

      {/* Audio Upload */}
      <AudioUploadSection
        trackAudioFile={trackAudioFile}
        setTrackAudioFile={setTrackAudioFile}
        trackAudioMetadata={trackAudioMetadata}
        setTrackAudioMetadata={setTrackAudioMetadata}
      />

      {/* Language */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">Язык трека</label>
        <select value={trackLanguage} onChange={(e) => setTrackLanguage(e.target.value)} className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl border border-white/10 outline-none appearance-none cursor-pointer">
          <option value="" className="bg-[#1a1a1c]">Выберите язык</option>
          <option className="bg-[#1a1a1c]">Русский</option>
          <option className="bg-[#1a1a1c]">Английский</option>
          <option className="bg-[#1a1a1c]">Инструментальная</option>
        </select>
      </div>

      {/* Additional Fields */}
      <div className="space-y-4">
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Версия (опционально)</label>
          <input 
            value={trackVersion || ''} 
            onChange={(e) => setTrackVersion?.(e.target.value)} 
            placeholder="Remix, Acoustic..." 
            className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none" 
          />
        </div>

        {/* Producers */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Продюсеры (до 10)</label>
          <div className="space-y-2">
            {trackProducers?.map((producer, idx) => (
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
                <button type="button" onClick={() => setTrackProducers?.(trackProducers.filter((_, i) => i !== idx))}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition">✕</button>
              </div>
            ))}
            {(!trackProducers || trackProducers.length < 10) && (
              <button type="button" onClick={() => setTrackProducers?.([...(trackProducers || []), ''])}
                className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl text-sm text-zinc-400 hover:text-white transition">
                + Добавить продюсера
              </button>
            )}
          </div>
        </div>

        {/* Featuring */}
        <div>
          <label className="text-sm text-zinc-400 mb-2 block">Featuring / Соавторы (до 10)</label>
          <div className="space-y-2">
            {trackFeaturing?.map((feat, idx) => (
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
                <button type="button" onClick={() => setTrackFeaturing?.(trackFeaturing.filter((_, i) => i !== idx))}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition">✕</button>
              </div>
            ))}
            {(!trackFeaturing || trackFeaturing.length < 10) && (
              <button type="button" onClick={() => setTrackFeaturing?.([...(trackFeaturing || []), ''])}
                className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl text-sm text-zinc-400 hover:text-white transition">
                + Добавить соавтора
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Explicit Content */}
      <label className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer hover:bg-white/10 transition">
        <input type="checkbox" checked={trackHasDrugs} onChange={(e) => setTrackHasDrugs(e.target.checked)} className="w-5 h-5 rounded" />
        <div>
          <div className="text-sm font-medium">Explicit Content</div>
          <div className="text-xs text-zinc-500">Трек содержит нецензурную лексику или упоминание веществ</div>
        </div>
      </label>

      {/* Lyrics */}
      <div>
        <label className="text-sm text-zinc-400 mb-2 block">Текст песни</label>
        <textarea value={trackLyrics} onChange={(e) => setTrackLyrics(e.target.value)} placeholder="Введите текст..." rows={8} 
          className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none resize-none overflow-y-auto" 
          style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}} />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-white/10">
        <button onClick={onSave} className="flex-1 px-6 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition">
          {currentTrack < tracksLength ? 'Сохранить' : 'Добавить трек'}
        </button>
        <button onClick={onCancel} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition">Отмена</button>
      </div>
    </div>
  );
}
