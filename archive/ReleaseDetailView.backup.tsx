"use client";
import React, { ReactNode } from 'react';
import { Release, Track } from './types';
import { STATUS_BADGE_STYLES, formatDate, formatDateFull, getTracksWord, copyToClipboard } from './constants';
import { PlatformBadge, MAIN_PLATFORMS } from './PlatformIcons';
import AudioPlayer from '@/components/AudioPlayer';
import { SupabaseClient } from '@supabase/supabase-js';

interface ReleaseDetailViewProps {
  release: Release;
  onBack: () => void;
  showCopyToast: boolean;
  setShowCopyToast: (show: boolean) => void;
  supabase?: SupabaseClient;
}

export default function ReleaseDetailView({ 
  release, 
  onBack, 
  showCopyToast, 
  setShowCopyToast,
  supabase
}: ReleaseDetailViewProps) {
  const shouldAnimate = release.status === 'pending' || release.status === 'distributed';
  
  const handleCopyUPC = async (upc: string) => {
    const success = await copyToClipboard(upc);
    if (success) {
      setShowCopyToast(true);
      setTimeout(() => setShowCopyToast(false), 2000);
    }
  };

  return (
    <div className="w-full">
      {/* Кнопка назад */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 rounded-xl sm:rounded-2xl transition-all duration-300 group border border-white/10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="sm:w-[18px] sm:h-[18px] group-hover:-translate-x-1 transition-transform">
          <line x1="19" y1="12" x2="5" y2="12" strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="12 19 5 12 12 5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-semibold text-sm sm:text-base">Назад к релизам</span>
      </button>



      {/* Шапка релиза */}
      <ReleaseHeader release={release} />

      {/* Copyright */}
      {release.copyright && <CopyrightSection copyright={release.copyright} />}

      {/* Страны распространения */}
      {release.countries && release.countries.length > 0 && (
        <CountriesSection countries={release.countries} />
      )}

      {/* Треклист */}
      {release.tracks && release.tracks.length > 0 && (
        <TracklistSection 
          tracks={release.tracks} 
          onCopyUPC={handleCopyUPC}
          releaseId={release.id}
          releaseType={release.release_type || 'basic'}
          status={release.status}
          supabase={supabase}
        />
      )}

      {/* Платформы */}
      {release.platforms && release.platforms.length > 0 && (
        <PlatformsSection platforms={release.platforms} />
      )}

      {/* Промо-информация */}
      <PromoSection release={release} />

      {/* Дополнительная информация */}
      <AdditionalInfoSection release={release} />

      {/* Промо ссылки */}
      <SocialLinksSection release={release} />
    </div>
  );
}

// Шапка релиза
function ReleaseHeader({ release }: { release: Release }) {
  const shouldAnimate = release.status === 'pending' || release.status === 'distributed';
  
  return (
    <div className="relative mb-4 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border border-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
      
      <div className="relative grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 sm:gap-8 p-4 sm:p-8">
        {/* Обложка */}
        <div className="relative group mx-auto w-full max-w-xs lg:max-w-none">
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
          {release.cover_url ? (
            <div className="relative">
              <img 
                src={release.cover_url} 
                alt={release.title} 
                className="relative w-full aspect-square rounded-xl sm:rounded-2xl object-cover shadow-2xl ring-1 ring-white/10" 
              />
            </div>
          ) : (
            <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-2xl ring-1 ring-white/10">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13M9 18l-7 2V7l7-2M9 18l12-2M9 9l12-2"/>
              </svg>
            </div>
          )}
        </div>

        {/* Информация */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 sm:gap-2 ${STATUS_BADGE_STYLES[release.status] || STATUS_BADGE_STYLES.draft}`}>
                {shouldAnimate ? (
                  <svg className="animate-spin h-2.5 w-2.5 sm:h-3 sm:w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current"></span>
                )}
                <span className="hidden xs:inline">
                  {release.status === 'distributed' ? 'На дистрибьюции' : 
                   release.status === 'rejected' ? 'Отклонен' : 
                   release.status === 'published' ? 'Опубликован' :
                   release.status === 'pending' ? 'На модерации' : 
                   release.status}
                </span>
                <span className="inline xs:hidden">
                  {release.status === 'distributed' ? 'Дистр.' : 
                   release.status === 'rejected' ? 'Откл.' : 
                   release.status === 'published' ? 'Опубл.' :
                   release.status === 'pending' ? 'Модер.' : 
                   release.status}
                </span>
              </span>
              {release.release_type && (
                <span className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">
                  {release.release_type === 'basic' ? 'Basic' : 'Exclusive'}
                </span>
              )}
              {release.custom_id && (
                <span className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600/30">
                  {release.custom_id}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black uppercase tracking-tight mb-2 sm:mb-3 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent leading-tight break-words">
              {release.title}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-zinc-400 mb-4 sm:mb-6 break-words">{release.artist_name || release.artist}</p>

            {/* Действия и метаданные */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {release.upc && (
                <button
                  onClick={() => handleCopyUPC(release.upc!)}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition"
                >
                  Копировать UPC
                </button>
              )}

              {release.spotify_link && (
                <a
                  href={release.spotify_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-600/20 rounded-lg text-sm font-semibold text-emerald-300 transition"
                >
                  Открыть в Spotify
                </a>
              )}

              {release.payment_status && (
                <div className={`px-3 py-2 rounded-lg text-sm font-bold ${release.payment_status === 'verified' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'}`}>
                  {release.payment_status === 'verified' ? 'Оплата: подтверждена' : 'Оплата: ожидает'}
                </div>
              )}

              {release.contract_agreed && (
                <div className="px-3 py-2 rounded-lg text-sm font-bold bg-emerald-400/8 text-emerald-300 border border-emerald-400/20">
                  Договор согласован
                </div>
              )}
            </div>

            {/* Метаданные */}
            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-6 gap-y-2 sm:gap-y-3 text-xs sm:text-sm">
              {release.genre && (
                <MetadataItem icon="music" color="purple" text={release.genre} />
              )}
              {release.release_date && (
                <MetadataItem icon="calendar" color="blue" text={formatDateFull(release.release_date)} />
              )}
              {release.tracks && release.tracks.length > 0 && (
                <MetadataItem icon="play" color="green" text={`${release.tracks.length} ${getTracksWord(release.tracks.length)}`} />
              )}
              {release.label && (
                <MetadataItem icon="tag" color="orange" text={release.label} />
              )}
            </div>
          </div>

          {/* Дополнительные данные */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6">
            {release.upc ? (
              <InfoBadge label="UPC" value={release.upc} mono />
            ) : (
              <div className="px-2.5 sm:px-4 py-2 sm:py-3 bg-yellow-500/10 rounded-lg sm:rounded-xl border border-yellow-500/30">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="min-w-0">
                    <div className="text-[9px] sm:text-[10px] text-yellow-300 uppercase tracking-wide mb-0.5">UPC</div>
                    <div className="text-[10px] sm:text-xs text-yellow-300 truncate">Не добавлен</div>
                  </div>
                </div>
              </div>
            )}
            {release.language && <InfoBadge label="Язык" value={release.language} />}
            {release.created_at && <InfoBadge label="Создан" value={formatDate(release.created_at)} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// Компонент метаданных
function MetadataItem({ icon, color, text }: { icon: string; color: string; text: string }) {
  const colorClasses: Record<string, string> = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400'
  };

  const icons: Record<string, ReactNode> = {
    music: <path d="M9 18V5l12-2v13M9 18l-7 2V7l7-2M9 18l12-2M9 9l12-2"/>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    play: <><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>
  };

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <svg className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${colorClasses[color]} flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        {icons[icon]}
      </svg>
      <span className="text-zinc-400 text-xs sm:text-sm truncate">{text}</span>
    </div>
  );
}

// Бейдж информации
function InfoBadge({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-2.5 sm:px-4 py-2 sm:py-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
      <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5 sm:mb-1">{label}</div>
      <div className={`font-${mono ? 'mono' : 'semibold'} font-bold text-[10px] sm:text-xs text-white truncate`}>{value}</div>
    </div>
  );
}

// Секция Copyright
function CopyrightSection({ copyright }: { copyright: string }) {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
      <div className="flex items-start gap-2 sm:gap-3">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M15 9a3 3 0 1 0 0 6"/>
        </svg>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-xs text-zinc-500 uppercase tracking-wide mb-1">Copyright</div>
          <div className="text-xs sm:text-sm text-zinc-300 break-words">{copyright}</div>
        </div>
      </div>
    </div>
  );
}

// Секция стран
function CountriesSection({ countries }: { countries: string[] }) {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-5 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <h3 className="font-bold text-base sm:text-lg">Страны распространения</h3>
        <span className="ml-auto text-[10px] sm:text-xs text-zinc-500 bg-white/5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">{countries.length} стран</span>
      </div>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {countries.map((country, idx) => (
          <span key={idx} className="px-3 py-1.5 bg-white/10 hover:bg-white/15 rounded-lg text-xs font-medium transition-colors border border-white/10">
            {country}
          </span>
        ))}
      </div>
    </div>
  );
}

// Секция треклиста
function TracklistSection({ 
  tracks, 
  onCopyUPC, 
  releaseId, 
  releaseType, 
  status,
  supabase
}: { 
  tracks: Track[]; 
  onCopyUPC: (upc: string) => void;
  releaseId: string;
  releaseType: 'basic' | 'exclusive';
  status: string;
  supabase?: SupabaseClient;
}) {
  // Плеер доступен только для опубликованных и на дистрибьюции релизов
  const canPlay = status === 'published' || status === 'distributed';

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-5">
        <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
        <h3 className="font-bold text-2xl">Треклист</h3>
        <span className="ml-auto text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full">
          {tracks.length} {getTracksWord(tracks.length)}
        </span>
      </div>
      <div className="space-y-2">
        {tracks.map((track, idx) => (
          <TrackItem 
            key={idx} 
            track={track} 
            index={idx} 
            onCopyUPC={onCopyUPC}
            canPlay={canPlay}
            releaseId={releaseId}
            releaseType={releaseType}
            supabase={supabase}
          />
        ))}
      </div>
    </div>
  );
}

// Компонент трека
function TrackItem({ 
  track, 
  index, 
  onCopyUPC,
  canPlay,
  releaseId,
  releaseType,
  supabase
}: { 
  track: Track; 
  index: number; 
  onCopyUPC: (upc: string) => void;
  canPlay: boolean;
  releaseId: string;
  releaseType: 'basic' | 'exclusive';
  supabase?: SupabaseClient;
}) {
  return (
    <details className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-white/10 hover:border-purple-500/30">
      <summary className="cursor-pointer p-5 list-none">
        <div className="flex items-start gap-5">
          {/* Номер трека / Кнопка плеера */}
          <div className="relative flex-shrink-0">
            {canPlay && supabase && track.link ? (
              <AudioPlayer
                releaseId={releaseId}
                releaseType={releaseType}
                trackIndex={index}
                supabase={supabase}
                variant="compact"
              />
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-base font-black ring-1 ring-white/10">
                  {index + 1}
                </div>
              </>
            )}
          </div>
          
          <div className="flex-1 relative min-w-0">
            {/* Название и базовая информация */}
            <h4 className="font-bold text-lg mb-1 text-white group-hover:text-purple-100 transition-colors">
              {track.title}
            </h4>
            {(track.producers || track.producer) && (
              <p className="text-sm text-zinc-500">
                <span className="text-zinc-600">prod.</span> {track.producers ? (Array.isArray(track.producers) ? track.producers.join(', ') : track.producers) : track.producer}
              </p>
            )}
          </div>

          {/* Стрелка раскрытия */}
          <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform flex-shrink-0 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </summary>

      {/* Развернутый контент */}
      <div className="px-5 pb-5">
        <div className="pt-3 border-t border-white/10">
          <div className="flex-1 relative min-w-0">
            {/* Метаданные трека */}
            <TrackMetadata track={track} />

            {/* Explicit badge */}
            {track.explicit && (
              <div className="mb-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold ring-1 ring-red-500/30">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                  EXPLICIT CONTENT
                </span>
              </div>
            )}

            {/* Текст песни */}
            {track.lyrics && (
              <details className="mt-3 group/lyrics">
                <summary className="cursor-pointer text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2 transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                    <line x1="16" y1="13" x2="8" y2="13"/>
                    <line x1="16" y1="17" x2="8" y2="17"/>
                    <polyline points="10 9 9 9 8 9"/>
                  </svg>
                  <span>Текст песни</span>
                  <svg className="w-4 h-4 group-open/lyrics:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </summary>
                <div className="mt-3 p-4 bg-black/30 rounded-xl text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed border border-white/10">
                  {track.lyrics}
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}

// Метаданные трека
function TrackMetadata({ track }: { track: Track }) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {track.language && (
        <MetadataBadge color="blue" icon="globe" label={track.language} />
      )}
      {track.isrc ? (
        <MetadataBadge color="green" icon="grid" label="ISRC" value={track.isrc} />
      ) : (
        <div className="px-2.5 py-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/30">
          <div className="flex items-center gap-1.5">
            <svg className="w-3 h-3 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-xs text-yellow-300">ISRC не добавлен</span>
          </div>
        </div>
      )}
      {track.version && (
        <MetadataBadge color="orange" icon="tag" label={track.version} />
      )}
      {track.featuring && (
        <MetadataBadge 
          color="pink" 
          icon="users" 
          label="feat." 
          value={Array.isArray(track.featuring) ? track.featuring.join(', ') : track.featuring} 
        />
      )}
    </div>
  );
}

// Бейдж метаданных
function MetadataBadge({ color, icon, label, value }: { color: string; icon: string; label: string; value?: string }) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20 hover:border-blue-500/40', text: 'text-blue-300' },
    green: { bg: 'from-green-500/10 to-green-600/5', border: 'border-green-500/20 hover:border-green-500/40', text: 'text-green-300' },
    orange: { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/20 hover:border-orange-500/40', text: 'text-orange-300' },
    pink: { bg: 'from-pink-500/10 to-pink-600/5', border: 'border-pink-500/20 hover:border-pink-500/40', text: 'text-pink-300' }
  };

  const iconColors: Record<string, string> = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    pink: 'text-pink-400'
  };

  const icons: Record<string, ReactNode> = {
    globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    grid: <><path d="M3 3h18v18H3z"/><path d="M3 9h18M9 21V9"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>
  };

  const colors = colorClasses[color];

  return (
    <div className="group/meta relative overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-r ${colors.bg} opacity-0 group-hover/meta:opacity-100 transition-opacity rounded-xl`} />
      <div className={`relative flex items-center gap-2 px-3 py-2 bg-gradient-to-br ${colors.bg} rounded-xl border ${colors.border} transition-colors`}>
        <svg className={`w-4 h-4 ${iconColors[color]} flex-shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          {icons[icon]}
        </svg>
        {value ? (
          <div className="flex flex-col">
            <span className={`text-[10px] ${iconColors[color].replace('400', '500/70')} uppercase tracking-wider leading-none`}>{label}</span>
            <span className={`text-sm font-medium ${colors.text}`}>{value}</span>
          </div>
        ) : (
          <span className={`text-sm font-medium ${colors.text}`}>{label}</span>
        )}
      </div>
    </div>
  );
}

// Секция платформ
function PlatformsSection({ platforms }: { platforms: string[] }) {
  const filteredPlatforms = platforms.filter(p => MAIN_PLATFORMS.includes(p));
  
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-5">
        <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
        </svg>
        <h3 className="font-bold text-2xl">Платформы распространения</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {filteredPlatforms.map((platform, idx) => (
          <PlatformBadge key={idx} platform={platform} index={idx} />
        ))}
      </div>
    </div>
  );
}

// Промо секция
function PromoSection({ release }: { release: Release }) {
  if (!release.focus_track && !release.focus_track_promo && !(release.album_description && release.tracks && release.tracks.length > 1)) {
    return null;
  }

  return (
    <div className="mb-6 space-y-3">
      <h3 className="font-bold text-xl mb-4">Промо-информация</h3>
      
      {(release.focus_track || release.focus_track_promo) && (
        <PromoAccordion
          title="Фокус-трек и промо"
          icon="play"
        >
          {release.focus_track && (
            <div>
              <div className="text-xs text-zinc-500 mb-1">Фокус-трек</div>
              <div className="font-medium text-white">{release.focus_track}</div>
            </div>
          )}
          {release.focus_track_promo && (
            <div>
              <div className="text-xs text-zinc-500 mb-1">Промо-текст</div>
              <div className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{release.focus_track_promo}</div>
            </div>
          )}
        </PromoAccordion>
      )}
      
      {release.album_description && release.tracks && release.tracks.length > 1 && (
        <PromoAccordion title="Промо альбома" icon="book">
          <div className="text-sm text-zinc-300 whitespace-pre-wrap break-words">{release.album_description}</div>
        </PromoAccordion>
      )}
      
      {release.promo_photos && release.promo_photos.length > 0 && (
        <PromoAccordion title={`Промо-фотографии (${release.promo_photos.length})`} icon="image">
          {release.promo_photos.map((photo, index) => (
            <div key={index} className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
              <span className="text-xs text-zinc-500 font-mono">#{index + 1}</span>
              <a 
                href={photo} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-[#6050ba] hover:text-[#9d8df1] transition flex-1 truncate"
              >
                {photo}
              </a>
              <button
                onClick={() => navigator.clipboard.writeText(photo)}
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded transition"
              >
                Копировать
              </button>
            </div>
          ))}
        </PromoAccordion>
      )}
    </div>
  );
}

// Аккордеон промо
function PromoAccordion({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const icons: Record<string, ReactNode> = {
    play: <><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></>
  };

  return (
    <details className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-[#6050ba]/50 transition group">
      <summary className="cursor-pointer font-medium flex items-center justify-between">
        <span className="flex items-center gap-2">
          <svg className="w-5 h-5 text-[#6050ba]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {icons[icon]}
          </svg>
          {title}
        </span>
        <svg className="w-5 h-5 text-zinc-500 group-open:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </summary>
      <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
        {children}
      </div>
    </details>
  );
}

// Секция дополнительной информации
function AdditionalInfoSection({ release }: { release: Release }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {release.description && (
        <div className="p-4 bg-white/5 rounded-xl md:col-span-2">
          <div className="text-xs text-zinc-500 mb-2">Дополнительное описание</div>
          <div className="text-sm whitespace-pre-wrap">{release.description}</div>
        </div>
      )}

      {release.price && (
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="text-xs text-zinc-500 mb-1">Цена</div>
          <div className="font-bold text-lg">{release.price} ₽</div>
        </div>
      )}

      {release.credits && (
        <div className="p-4 bg-white/5 rounded-xl md:col-span-2">
          <div className="text-xs text-zinc-500 mb-2">Участники / Титры</div>
          <div className="text-sm">{release.credits}</div>
        </div>
      )}

      {release.collaborators && release.collaborators.length > 0 && (
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="text-xs text-zinc-500 mb-2">Коллаборации</div>
          <div className="flex flex-wrap gap-2">
            {release.collaborators.map((collab, idx) => (
              <span key={idx} className="px-2 py-1 bg-white/5 rounded text-sm">{collab}</span>
            ))}
          </div>
        </div>
      )}

      {release.subgenres && release.subgenres.length > 0 && (
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="text-xs text-zinc-500 mb-2">Поджанры</div>
          <div className="flex flex-wrap gap-2">
            {release.subgenres.map((subgenre, idx) => (
              <span key={idx} className="px-2 py-1 bg-white/5 rounded text-sm">{subgenre}</span>
            ))}
          </div>
        </div>
      )}

      {release.contract_agreed && (
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="text-xs text-zinc-500 mb-1">Договор</div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span className="text-emerald-400 font-medium">Согласован</span>
          </div>
          {release.contract_agreed_at && (
            <div className="text-xs text-zinc-500 mt-1">{formatDate(release.contract_agreed_at)}</div>
          )}
        </div>
      )}

      {release.payment_status && (
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="text-xs text-zinc-500 mb-1">Статус оплаты</div>
          <div className={`font-bold ${release.payment_status === 'verified' ? 'text-emerald-400' : 'text-yellow-400'}`}>
            {release.payment_status === 'verified' ? 'Подтверждена' : 
             release.payment_status === 'pending' ? 'Ожидает проверки' : 
             release.payment_status}
          </div>
          {release.payment_amount && <div className="text-sm mt-1">{release.payment_amount} ₽</div>}
        </div>
      )}

      {release.payment_receipt_url && (
        <div className="p-4 bg-white/5 rounded-xl">
          <div className="text-xs text-zinc-500 mb-2">Чек оплаты</div>
          <a href={release.payment_receipt_url} target="_blank" rel="noopener noreferrer" 
             className="text-[#6050ba] hover:text-[#7060ca] text-sm underline">
            Посмотреть чек
          </a>
        </div>
      )}
    </div>
  );
}

// Секция социальных ссылок
function SocialLinksSection({ release }: { release: Release }) {
  const links = [
    { key: 'spotify_link', name: 'Spotify', color: 'green-500' },
    { key: 'apple_music_link', name: 'Apple Music', color: 'pink-500' },
    { key: 'youtube_link', name: 'YouTube', color: 'red-500' },
    { key: 'soundcloud_link', name: 'SoundCloud', color: 'orange-500' },
    { key: 'vk_link', name: 'ВКонтакте', color: 'blue-500' },
    { key: 'instagram_link', name: 'Instagram', color: 'purple-500' }
  ].filter(link => release[link.key as keyof Release]);

  if (links.length === 0) return null;

  return (
    <div className="mb-6">
      <h3 className="font-bold text-xl mb-4">Промо и социальные сети</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {links.map(link => (
          <a 
            key={link.key}
            href={release[link.key as keyof Release] as string} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-3 bg-white/5 rounded-lg hover:bg-white/10 transition flex items-center gap-3"
          >
            <div className={`w-10 h-10 rounded-lg bg-${link.color}/20 flex items-center justify-center text-${link.color.replace('-500', '-400')}`}>
              <SocialIcon name={link.name} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-zinc-500">{link.name}</div>
              <div className="text-sm truncate">Открыть</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

// Иконки соцсетей
function SocialIcon({ name }: { name: string }) {
  const icons: Record<string, ReactNode> = {
    'Spotify': <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>,
    'Apple Music': <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.997 6.124c0-.738-.065-1.47-.24-2.19-.317-1.31-1.062-2.31-2.18-3.043C21.003.517 20.373.285 19.7.164c-.517-.093-1.038-.135-1.564-.15-.04-.003-.083-.01-.124-.013H5.988c-.152.01-.303.017-.455.026C4.786.07 4.043.15 3.34.428 2.004.958 1.04 1.88.475 3.208c-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18-.013.32-.013.64-.013.96v9.288c0 .32 0 .64.013.96.012.59.09 1.174.232 1.75.328 1.33 1.04 2.36 2.128 3.11.358.248.745.43 1.15.572.69.24 1.406.355 2.144.368.27.005.54.01.81.01h12.02c.26 0 .522-.005.782-.01.958-.024 1.875-.22 2.718-.655.74-.38 1.323-.915 1.776-1.615.44-.68.663-1.43.752-2.235.053-.478.075-.957.08-1.437.004-.335.004-.67.004-1.005V6.124z"/></svg>,
    'YouTube': <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>,
    'SoundCloud': <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c0-.057-.045-.1-.09-.1"/></svg>,
    'ВКонтакте': <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>,
    'Instagram': <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
  };

  return icons[name] || null;
}

