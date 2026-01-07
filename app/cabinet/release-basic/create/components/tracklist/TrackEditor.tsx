import React from 'react';
import { AudioUploadSection } from './AudioUploadSection';
import TrackAuthors, { TrackAuthor } from '@/components/ui/TrackAuthors';
import { useTheme } from '@/contexts/ThemeContext';

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
  trackLink?: string;
  trackOriginalFileName?: string;
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
  trackLink,
  trackOriginalFileName,
  trackAudioFile,
  setTrackAudioFile,
  trackAudioMetadata,
  setTrackAudioMetadata,
  trackAuthors,
  setTrackAuthors,
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
  trackIsInstrumental,
  setTrackIsInstrumental,
  onSave,
  onCancel
}: TrackEditorProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const isSingleRelease = releaseType === 'single';

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <h4 className={`text-base sm:text-lg font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
          {currentTrack < tracksLength ? `Редактирование трека ${currentTrack + 1}` : 'Новый трек'}
        </h4>
        <button 
          onClick={onCancel} 
          className={`px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm ${isLight ? 'text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-gray-300' : 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'} rounded-lg transition flex items-center gap-1 sm:gap-1.5 border touch-manipulation`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          <span className="hidden sm:inline">К списку</span>
          <span className="sm:hidden">Назад</span>
        </button>
      </div>

      {/* Title */}
      <div>
        <label className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'} mb-2 flex items-center gap-2`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-sky-400/70 w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
          </svg>
          Название трека *
          {isSingleRelease && <span className="ml-2 text-xs text-emerald-400">(Автоматически совпадает с названием сингла)</span>}
        </label>
        <input 
          value={isSingleRelease ? releaseTitle : trackTitle} 
          onChange={(e) => setTrackTitle(e.target.value)} 
          placeholder={releaseTitle || "Введите название"}
          disabled={isSingleRelease}
          className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 ${isLight ? 'bg-white border-gray-300 placeholder:text-gray-400' : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10'} rounded-xl border outline-none transition-all text-sm sm:text-base ${
            isSingleRelease ? 'opacity-60 cursor-not-allowed ring-2 ring-emerald-500/20' : isLight ? 'hover:border-gray-400 focus:border-[#6050ba] focus:ring-2 focus:ring-[#6050ba]/20' : 'hover:border-white/20 focus:border-[#6050ba] focus:ring-2 focus:ring-[#6050ba]/20'
          } ${isLight ? 'text-gray-900' : 'text-white'}`}
        />
      </div>

      {/* Audio Upload */}
      <AudioUploadSection
        trackAudioFile={trackAudioFile}
        setTrackAudioFile={setTrackAudioFile}
        trackAudioMetadata={trackAudioMetadata}
        setTrackAudioMetadata={setTrackAudioMetadata}
        existingAudioUrl={trackLink}
        originalFileName={trackOriginalFileName}
      />

      {/* Instrumental Toggle */}
      <label className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 ${isLight ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' : 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:bg-blue-500/15'} rounded-xl border cursor-pointer transition group`}>
        <div className="relative">
          <input 
            type="checkbox" 
            checked={trackIsInstrumental || false} 
            onChange={(e) => {
              setTrackIsInstrumental?.(e.target.checked);
              if (e.target.checked) {
                setTrackLanguage('');
                setTrackLyrics('');
              }
            }} 
            className="sr-only peer" 
          />
          <div className={`w-11 h-6 ${isLight ? 'bg-gray-300' : 'bg-zinc-700'} rounded-full peer peer-checked:bg-blue-500 transition-colors`}></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
        </div>
        <div>
          <div className={`text-xs sm:text-sm font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Инструментал</div>
          <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Трек без слов — текст и язык не требуются</div>
        </div>
      </label>

      {/* Language - only show if not instrumental */}
      {!trackIsInstrumental && (
        <div>
          <label className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'} mb-2 flex items-center gap-2`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-violet-400/70 w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
              <path d="M5 8l6 6"/>
              <path d="M4 14l6-6 2-3"/>
              <path d="M2 5h12"/>
              <path d="M7 2h1"/>
              <path d="M22 22l-5-10-5 10"/>
              <path d="M14 18h6"/>
            </svg>
            Язык трека
          </label>
          <select value={trackLanguage} onChange={(e) => setTrackLanguage(e.target.value)} className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] border-white/10'} rounded-xl border outline-none appearance-none cursor-pointer text-sm sm:text-base`}>
            <option value="" className={isLight ? 'bg-white' : 'bg-[#1a1a1c]'}>Выберите язык</option>
            <option className={isLight ? 'bg-white' : 'bg-[#1a1a1c]'}>Русский</option>
            <option className={isLight ? 'bg-white' : 'bg-[#1a1a1c]'}>Английский</option>
          </select>
        </div>
      )}

      {/* Additional Fields */}
      <div className="space-y-4">
        <div>
          <label className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'} mb-2 flex items-center gap-2`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-400/70 w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            Версия (опционально)
          </label>
          <input 
            value={trackVersion || ''} 
            onChange={(e) => setTrackVersion?.(e.target.value)} 
            placeholder="Remix, Acoustic, Extended, Sped Up..." 
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 ${isLight ? 'bg-white border-gray-300 placeholder:text-gray-400 text-gray-900' : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10'} rounded-xl border outline-none text-sm sm:text-base`} 
          />
        </div>

        {/* Producers */}
        <div>
          <label className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'} mb-2 flex items-center gap-2`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400/70 w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
              <rect x="4" y="4" width="4" height="16" rx="1"/>
              <rect x="10" y="8" width="4" height="12" rx="1"/>
              <rect x="16" y="2" width="4" height="18" rx="1"/>
            </svg>
            Продюсеры {trackProducers && trackProducers.filter(p => p.trim()).length > 0 && (
              <span className={`${isLight ? 'text-gray-400' : 'text-zinc-600'} text-xs`}>({trackProducers.filter(p => p.trim()).length}/10)</span>
            )}
          </label>
          <div className="flex gap-1.5 sm:gap-2">
            <input 
              id="producer-input"
              placeholder="Имя продюсера"
              disabled={trackProducers && trackProducers.filter(p => p.trim()).length >= 10}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && setTrackProducers && (!trackProducers || trackProducers.filter(p => p.trim()).length < 10)) {
                  setTrackProducers([...(trackProducers || []).filter(p => p.trim()), value]);
                  e.target.value = '';
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && setTrackProducers && (!trackProducers || trackProducers.filter(p => p.trim()).length < 10)) {
                    setTrackProducers([...(trackProducers || []).filter(p => p.trim()), value]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 ${isLight ? 'bg-white border-gray-300 placeholder:text-gray-400 text-gray-900' : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10'} rounded-xl border outline-none disabled:opacity-50 text-sm sm:text-base`} 
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('producer-input') as HTMLInputElement;
                const value = input?.value.trim();
                if (value && setTrackProducers && (!trackProducers || trackProducers.filter(p => p.trim()).length < 10)) {
                  setTrackProducers([...(trackProducers || []).filter(p => p.trim()), value]);
                  input.value = '';
                  input.focus();
                }
              }}
              disabled={trackProducers && trackProducers.filter(p => p.trim()).length >= 10}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 ${isLight ? 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-400 hover:text-blue-600' : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-400/50 hover:text-blue-300'} border rounded-xl transition disabled:opacity-30 touch-manipulation`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 sm:w-5 sm:h-5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          {trackProducers && trackProducers.filter(p => p.trim()).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {trackProducers.filter(p => p.trim()).map((producer, idx) => (
                <div key={idx} className={`px-3 py-1.5 ${isLight ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-blue-500/10 border-blue-500/20 text-blue-300'} border rounded-lg text-sm flex items-center gap-2`}>
                  <span>prod. {producer}</span>
                  <button type="button" onClick={() => setTrackProducers?.(trackProducers.filter((_, i) => i !== idx))}
                    className={`${isLight ? 'text-blue-400 hover:text-red-500' : 'text-blue-400/50 hover:text-red-400'} transition`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featuring */}
        <div>
          <label className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'} mb-2 flex items-center gap-2`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-400/70 w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Featuring артисты {trackFeaturing && trackFeaturing.filter(f => f.trim()).length > 0 && (
              <span className={`${isLight ? 'text-gray-400' : 'text-zinc-600'} text-xs`}>({trackFeaturing.filter(f => f.trim()).length}/10)</span>
            )}
            <span className={`${isLight ? 'text-gray-400' : 'text-zinc-600'} text-xs ml-1`}>(feat. в названии трека)</span>
          </label>
          <div className="flex gap-1.5 sm:gap-2">
            <input 
              id="featuring-input"
              placeholder="Имя артиста"
              disabled={trackFeaturing && trackFeaturing.filter(f => f.trim()).length >= 10}
              onBlur={(e) => {
                const value = e.target.value.trim();
                if (value && setTrackFeaturing && (!trackFeaturing || trackFeaturing.filter(f => f.trim()).length < 10)) {
                  setTrackFeaturing([...(trackFeaturing || []).filter(f => f.trim()), value]);
                  e.target.value = '';
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value && setTrackFeaturing && (!trackFeaturing || trackFeaturing.filter(f => f.trim()).length < 10)) {
                    setTrackFeaturing([...(trackFeaturing || []).filter(f => f.trim()), value]);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 ${isLight ? 'bg-white border-gray-300 placeholder:text-gray-400 text-gray-900' : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10'} rounded-xl border outline-none disabled:opacity-50 text-sm sm:text-base`} 
            />
            <button
              type="button"
              onClick={() => {
                const input = document.getElementById('featuring-input') as HTMLInputElement;
                const value = input?.value.trim();
                if (value && setTrackFeaturing && (!trackFeaturing || trackFeaturing.filter(f => f.trim()).length < 10)) {
                  setTrackFeaturing([...(trackFeaturing || []).filter(f => f.trim()), value]);
                  input.value = '';
                  input.focus();
                }
              }}
              disabled={trackFeaturing && trackFeaturing.filter(f => f.trim()).length >= 10}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 ${isLight ? 'bg-pink-50 hover:bg-pink-100 border-pink-200 text-pink-400 hover:text-pink-600' : 'bg-pink-500/10 hover:bg-pink-500/20 border-pink-500/20 text-pink-400/50 hover:text-pink-300'} border rounded-xl transition touch-manipulation`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 sm:w-5 sm:h-5">
                <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
          </div>
          {trackFeaturing && trackFeaturing.filter(f => f.trim()).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {trackFeaturing.filter(f => f.trim()).map((feat, idx) => (
                <div key={idx} className={`px-3 py-1.5 ${isLight ? 'bg-pink-100 border-pink-200 text-pink-700' : 'bg-pink-500/10 border-pink-500/20 text-pink-300'} border rounded-lg text-sm flex items-center gap-2`}>
                  <span>feat. {feat}</span>
                  <button type="button" onClick={() => setTrackFeaturing?.(trackFeaturing.filter((_, i) => i !== idx))}
                    className={`${isLight ? 'text-pink-400 hover:text-red-500' : 'text-pink-400/50 hover:text-red-400'} transition`}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Authors (Авторы/ФИО) - компонент с ролями */}
        {setTrackAuthors && (
          <TrackAuthors
            authors={trackAuthors || []}
            setAuthors={setTrackAuthors}
            maxAuthors={20}
            compact
          />
        )}
      </div>

      {/* Explicit Content */}
      <label className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 ${isLight ? 'bg-red-50 border-red-200 hover:bg-red-100' : 'bg-gradient-to-r from-red-500/10 to-orange-500/5 border-red-500/15 hover:bg-red-500/15'} rounded-xl border cursor-pointer transition group`}>
        <div className="relative">
          <input 
            type="checkbox" 
            checked={trackHasDrugs} 
            onChange={(e) => setTrackHasDrugs(e.target.checked)} 
            className="sr-only peer" 
          />
          <div className={`w-11 h-6 ${isLight ? 'bg-gray-300' : 'bg-zinc-700'} rounded-full peer peer-checked:bg-red-500/60 transition-colors`}></div>
          <div className="absolute left-1 top-1 w-4 h-4 bg-white/90 rounded-full transition-transform peer-checked:translate-x-5"></div>
        </div>
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400/70 w-3.5 h-3.5 sm:w-4 sm:h-4">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <div className={`text-xs sm:text-sm font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>Explicit Content</div>
            <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Трек содержит нецензурную лексику или упоминание веществ</div>
          </div>
        </div>
      </label>

      {/* Lyrics - only show if not instrumental */}
      {!trackIsInstrumental && (
        <div>
          <label className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'} mb-2 flex items-center gap-2`}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400/70 w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
            Текст песни
          </label>
          <textarea value={trackLyrics} onChange={(e) => setTrackLyrics(e.target.value)} placeholder="Введите текст..." rows={8} 
            className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 ${isLight ? 'bg-white border-gray-300 placeholder:text-gray-400 text-gray-900' : 'bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10'} rounded-xl border outline-none resize-none overflow-y-auto text-sm sm:text-base`} 
            style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}} />
        </div>
      )}

      {/* Actions */}
      <div className={`flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
        <button onClick={onSave} className={`flex-1 px-4 sm:px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 touch-manipulation text-sm sm:text-base ${
          isLight 
            ? 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 shadow-lg shadow-purple-500/30' 
            : 'bg-gradient-to-r from-purple-500/50 to-violet-500/50 hover:from-purple-500/70 hover:to-violet-500/70'
        }`} style={{ color: 'white' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4 sm:w-[18px] sm:h-[18px]">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {currentTrack < tracksLength ? 'Сохранить' : 'Добавить трек'}
        </button>
        <button onClick={onCancel} className={`px-4 sm:px-6 py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10'} rounded-xl font-bold transition touch-manipulation text-sm sm:text-base`}>Отмена</button>
      </div>
    </div>
  );
}
