"use client";
import React from 'react';
import { Release } from './types';
import { STATUS_BADGE_STYLES, formatDate, formatDateFull, getTracksWord, copyToClipboard } from './constants';
import { SupabaseClient } from '@supabase/supabase-js';
import { MetadataItem, InfoBadge, CopyrightSection, CountriesSection, TracklistSection } from './ReleaseDetailComponents';
import { PlatformsSection, PromoSection, ContributorsSection, AdditionalInfoSection, SocialLinksSection } from './ReleaseDetailSections';
import ReleaseStatistics from './ReleaseStatistics';
import { useTheme } from '@/contexts/ThemeContext';

interface ReleaseDetailViewProps {
  release: Release;
  onBack: () => void;
  showCopyToast: boolean;
  setShowCopyToast: (show: boolean) => void;
  supabase?: SupabaseClient;
}

export default function ReleaseDetailView({ release, onBack, showCopyToast, setShowCopyToast, supabase }: ReleaseDetailViewProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const shouldAnimate = release.status === 'pending' || release.status === 'approved';
  
  const handleCopyUPC = async (upc: string) => {
    const success = await copyToClipboard(upc);
    if (success) { setShowCopyToast(true); setTimeout(() => setShowCopyToast(false), 2000); }
  };

  return (
    <div className="w-full overflow-hidden">
      {/* Кнопка назад */}
      <button onClick={onBack} className={`flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl transition-all duration-300 group border ${
        isLight 
          ? 'bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 border-gray-300'
          : 'bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 border-white/10'
      }`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`sm:w-[18px] sm:h-[18px] group-hover:-translate-x-1 transition-transform ${isLight ? 'text-gray-800' : 'text-white'}`}>
          <line x1="19" y1="12" x2="5" y2="12" strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="12 19 5 12 12 5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className={`font-semibold text-sm sm:text-base ${isLight ? 'text-gray-800' : 'text-white'}`}>Назад к релизам</span>
      </button>

      {/* Шапка релиза */}
      <ReleaseHeader release={release} handleCopyUPC={handleCopyUPC} />

      {/* Причина отклонения - для отклонённых релизов */}
      {release.status === 'rejected' && release.rejection_reason && (
        <RejectionReasonBlock 
          reason={release.rejection_reason} 
          releaseId={release.id}
          releaseType={release.release_type || 'basic'}
        />
      )}

      {/* Copyright */}
      {release.copyright && <CopyrightSection copyright={release.copyright} />}

      {/* Авторы релиза */}
      <ContributorsSection release={release} />

      {/* Статистика релиза (сворачиваемая секция) - после авторов */}
      {(release.status === 'published' || release.status === 'distributed') && (
        <ReleaseStatistics 
          releaseId={release.id} 
          releaseType={(release.release_type as 'basic' | 'exclusive') || 'basic'} 
          coverUrl={release.cover_url}
        />
      )}

      {/* Треклист */}
      {release.tracks && release.tracks.length > 0 && (
        <TracklistSection tracks={release.tracks} releaseId={release.id} releaseType={release.release_type || 'basic'} status={release.status} supabase={supabase} coverUrl={release.cover_url} />
      )}

      {/* Промо-информация (после треклиста) */}
      <PromoSection release={release} />

      {/* Страны распространения */}
      {release.countries && release.countries.length > 0 && <CountriesSection countries={release.countries} />}

      {/* Платформы */}
      {release.platforms && release.platforms.length > 0 && <PlatformsSection platforms={release.platforms} />}

      {/* Дополнительная информация */}
      <AdditionalInfoSection release={release} />

      {/* Промо ссылки */}
      <SocialLinksSection release={release} />
    </div>
  );
}

// Компонент BandLink - компактный на мобилке, внизу обложки на ПК
function BandlinkBadge({ bandlink, isLight }: { bandlink: string; isLight: boolean }) {
  const [copied, setCopied] = React.useState(false);
  
  // Формируем полный URL - проверяем наличие протокола http:// или https://
  const fullUrl = bandlink.startsWith('http://') || bandlink.startsWith('https://') 
    ? bandlink 
    : `https://${bandlink}`;
  
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="hidden sm:flex absolute top-4 right-4 z-10 items-center gap-2">
      {/* Кнопка копирования - только иконка */}
      <button
        onClick={handleCopy}
        className={`group p-2 rounded-xl transition-all duration-300 ${
          copied
            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
            : isLight
              ? 'bg-white/90 hover:bg-white text-gray-500 hover:text-emerald-600 border border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md'
              : 'bg-zinc-800/90 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 border border-zinc-700 hover:border-emerald-500/50'
        }`}
        title={copied ? 'Скопировано!' : 'Копировать BandLink'}
      >
        {copied ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </button>
      
      {/* Кнопка открытия ссылки */}
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`group px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
          isLight
            ? 'bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50'
            : 'bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40'
        }`}
        title="Открыть BandLink"
      >
        <svg className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span>BandLink</span>
        <svg className="w-3 h-3 opacity-70 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M7 17L17 7M17 7H7M17 7v10"/>
        </svg>
      </a>
    </div>
  );
}

// Мобильный компонент BandLink - под информацией о релизе
function MobileBandlinkBadge({ bandlink, isLight }: { bandlink: string; isLight: boolean }) {
  const [copied, setCopied] = React.useState(false);
  
  const fullUrl = bandlink.startsWith('http://') || bandlink.startsWith('https://') 
    ? bandlink 
    : `https://${bandlink}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="sm:hidden mt-4 flex items-center gap-2">
      {/* Кнопка копирования - только иконка */}
      <button
        onClick={handleCopy}
        className={`p-2.5 rounded-xl transition-all ${
          copied
            ? 'bg-emerald-500 text-white'
            : isLight
              ? 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
        }`}
        title={copied ? 'Скопировано!' : 'Копировать'}
      >
        {copied ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
        )}
      </button>
      
      {/* Кнопка открытия */}
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-center transition-all flex items-center justify-center gap-2 ${
          isLight
            ? 'bg-gradient-to-r from-purple-500 to-violet-500 text-white shadow-md'
            : 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg shadow-purple-500/20'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span>Открыть BandLink</span>
      </a>
    </div>
  );
}

// Шапка релиза
function ReleaseHeader({ release, handleCopyUPC }: { release: Release; handleCopyUPC: (upc: string) => void }) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const shouldAnimate = release.status === 'pending' || release.status === 'approved';
  
  return (
    <div className={`release-detail-header relative mb-4 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl backdrop-blur-xl border ${
      isLight 
        ? 'bg-white/80 border-gray-200 shadow-xl' 
        : 'bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 border-white/10'
    }`}>
      <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-br from-purple-100/50 via-transparent to-blue-100/50' : 'bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5'}`} />
      
      {/* BandLink в правом верхнем углу */}
      {release.status === 'published' && (release as any).bandlink && (
        <BandlinkBadge bandlink={(release as any).bandlink} isLight={isLight} />
      )}
      
      <div className="relative grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 sm:gap-8 p-4 sm:p-8">
        {/* Обложка */}
        <div className="release-detail-cover relative group mx-auto w-full max-w-[200px] sm:max-w-xs lg:max-w-none">
          <div className={`absolute -inset-2 sm:-inset-4 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl opacity-50 group-hover:opacity-75 transition-opacity ${
            isLight ? 'bg-gradient-to-br from-purple-300/40 to-blue-300/40' : 'bg-gradient-to-br from-purple-500/20 to-blue-500/20'
          }`} />
          {release.cover_url ? (
            <img 
              src={release.cover_url} 
              alt={release.title} 
              className={`relative w-full aspect-square rounded-xl sm:rounded-2xl object-cover shadow-2xl ring-1 ${isLight ? 'ring-gray-200' : 'ring-white/10'}`}
              loading="eager"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                const placeholder = (e.target as HTMLImageElement).nextElementSibling;
                if (placeholder) (placeholder as HTMLElement).style.display = 'flex';
              }}
            />
          ) : null}
          <div 
            className={`relative w-full aspect-square rounded-xl sm:rounded-2xl items-center justify-center shadow-2xl ring-1 ${
              isLight ? 'bg-gradient-to-br from-gray-100 to-gray-200 ring-gray-200' : 'bg-gradient-to-br from-zinc-800 to-zinc-900 ring-white/10'
            } ${release.cover_url ? 'hidden' : 'flex'}`}
          >
            <svg className={`w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 ${isLight ? 'text-gray-400' : 'text-zinc-600'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13M9 18l-7 2V7l7-2M9 18l12-2M9 9l12-2"/></svg>
          </div>
        </div>

        {/* Информация */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mb-2 sm:mb-4">
              <span className={`px-2 sm:px-4 py-0.5 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-1 sm:gap-2 ${STATUS_BADGE_STYLES[release.status] || STATUS_BADGE_STYLES.draft}`}>
                {shouldAnimate ? (
                  <svg className="animate-spin h-2 w-2 sm:h-3 sm:w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                ) : <span className="w-1 h-1 sm:w-2 sm:h-2 rounded-full bg-current"/>}
                <span className="hidden xs:inline">{getStatusText(release.status, false)}</span>
                <span className="inline xs:hidden">{getStatusText(release.status, true)}</span>
              </span>
              {release.release_type && <span className={`px-2 sm:px-4 py-0.5 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-bold uppercase tracking-wide ring-1 ${
                isLight ? 'bg-purple-100 text-purple-700 ring-purple-300' : 'bg-purple-500/20 text-purple-400 ring-purple-500/30'
              }`}>{release.release_type === 'basic' ? 'Basic' : 'Exclusive'}</span>}
              {release.custom_id && <span className={`px-2 sm:px-4 py-0.5 sm:py-1.5 rounded-full text-[9px] sm:text-xs font-bold tracking-wide ring-1 ${
                isLight ? 'bg-gray-100 text-gray-700 ring-gray-300' : 'bg-zinc-700/50 text-zinc-300 ring-zinc-600/30'
              }`}>{release.custom_id}</span>}
            </div>
            
            <h1 className={`release-detail-title text-xl sm:text-3xl lg:text-5xl font-black uppercase tracking-tight mb-1.5 sm:mb-3 bg-clip-text text-transparent leading-tight break-words ${
              isLight ? 'bg-gradient-to-r from-gray-900 to-gray-600' : 'bg-gradient-to-r from-white to-zinc-400'
            }`}>{release.title}</h1>
            <div className={`release-detail-artist text-base sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-6 break-words flex items-center flex-wrap gap-1 ${
              isLight ? 'text-gray-600' : 'text-zinc-400'
            }`}>
              {release.release_artists && release.release_artists.length > 0 ? (
                release.release_artists.map((artist: string, idx: number) => (
                  <span key={idx} className="flex items-center gap-1">
                    {idx > 0 && <span className={isLight ? 'text-gray-400' : 'text-zinc-500'}>&</span>}
                    <span>{artist}</span>
                  </span>
                ))
              ) : (
                <span>{release.artist_name || release.artist}</span>
              )}
            </div>

            {/* Действия */}
            <div className="release-detail-actions flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              {release.upc && (
                <button 
                  onClick={() => handleCopyUPC(release.upc!)} 
                  className={`group relative px-3 sm:px-4 py-2 sm:py-2.5 border rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 shadow-lg hover:scale-105 active:scale-95 ${
                    isLight 
                      ? 'bg-gradient-to-br from-purple-100 via-purple-50 to-blue-100 hover:from-purple-200 hover:via-purple-100 hover:to-blue-200 border-purple-300 hover:border-purple-400 text-purple-700 hover:text-purple-800 shadow-purple-200/50 hover:shadow-purple-300/50'
                      : 'bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-blue-600/20 hover:from-purple-600/30 hover:via-purple-500/20 hover:to-blue-600/30 border-purple-500/30 hover:border-purple-400/50 text-purple-200 hover:text-purple-100 shadow-purple-500/10 hover:shadow-purple-500/20'
                  }`}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 blur-sm transition-opacity rounded-lg sm:rounded-xl ${
                    isLight ? 'bg-gradient-to-r from-purple-200/0 via-purple-200/40 to-purple-200/0' : 'bg-gradient-to-r from-purple-400/0 via-purple-400/20 to-purple-400/0'
                  }`} />
                  <div className="relative flex items-center gap-1.5 sm:gap-2">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden sm:inline">Копировать UPC</span>
                    <span className="inline sm:hidden">UPC</span>
                  </div>
                </button>
              )}
              {release.spotify_link && <a href={release.spotify_link} target="_blank" rel="noopener noreferrer" className={`px-2.5 sm:px-3 py-1.5 sm:py-2 border rounded-lg text-xs sm:text-sm font-semibold transition ${
                isLight ? 'bg-green-50 hover:bg-green-100 border-green-300 text-green-700' : 'bg-green-600/10 hover:bg-green-600/20 border-green-600/20 text-emerald-300'
              }`}>Spotify</a>}
              {release.payment_status && <div className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold border ${
                release.payment_status === 'verified' 
                  ? (isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20')
                  : (isLight ? 'bg-yellow-50 text-yellow-700 border-yellow-300' : 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20')
              }`}>{release.payment_status === 'verified' ? '✓ Оплата' : '⏳ Оплата'}</div>}
              {release.contract_agreed && <div className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold border ${
                isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-400/8 text-emerald-300 border-emerald-400/20'
              }`}>✓ Договор</div>}
            </div>

            {/* Метаданные */}
            <div className="release-metadata flex flex-wrap items-center gap-x-2 sm:gap-x-6 gap-y-1.5 sm:gap-y-3 text-[10px] sm:text-sm">
              {release.genre && <MetadataItem icon="music" color="purple" text={release.genre} isLight={isLight} />}
              {release.release_date && <MetadataItem icon="calendar" color="blue" text={formatDateFull(release.release_date)} isLight={isLight} />}
              {release.tracks && release.tracks.length > 0 && <MetadataItem icon="play" color="green" text={`${release.tracks.length} ${getTracksWord(release.tracks.length)}`} isLight={isLight} />}
              {release.label && <MetadataItem icon="tag" color="orange" text={release.label} isLight={isLight} />}
            </div>
          </div>

          {/* Дополнительные данные */}
          <div className="release-info-badges grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-3 sm:mt-6">
            {release.upc ? <InfoBadge label="UPC" value={release.upc} mono isLight={isLight} /> : (
              <div className={`px-2.5 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl border ${
                isLight ? 'bg-yellow-50 border-yellow-300' : 'bg-yellow-500/10 border-yellow-500/30'
              }`}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <svg className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 ${isLight ? 'text-yellow-600' : 'text-yellow-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <div className="min-w-0"><div className={`text-[8px] sm:text-[10px] uppercase tracking-wide mb-0.5 ${isLight ? 'text-yellow-700' : 'text-yellow-300'}`}>UPC</div><div className={`text-[10px] sm:text-xs truncate ${isLight ? 'text-yellow-700' : 'text-yellow-300'}`}>Не добавлен</div></div>
                </div>
              </div>
            )}
            {release.language && <InfoBadge label="Язык" value={release.language} isLight={isLight} />}
            {release.created_at && <InfoBadge label="Создан" value={formatDate(release.created_at)} isLight={isLight} />}
          </div>
          
          {/* Mobile BandLink */}
          {release.status === 'published' && (release as any).bandlink && (
            <MobileBandlinkBadge bandlink={(release as any).bandlink} isLight={isLight} />
          )}
        </div>
      </div>
    </div>
  );
}

function getStatusText(status: string, short: boolean): string {
  const texts: Record<string, { full: string; short: string }> = {
    approved: { full: 'Одобрен', short: 'Одобр.' },
    rejected: { full: 'Отклонён', short: 'Откл.' },
    published: { full: 'Выложен', short: 'Вылож.' },
    pending: { full: 'На модерации', short: 'Модер.' }
  };
  return texts[status]?.[short ? 'short' : 'full'] || status;
}

// Блок с причиной отклонения релиза
function RejectionReasonBlock({ reason, releaseId, releaseType }: { reason: string; releaseId: string; releaseType: string }) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  // Формируем URL для редактирования
  const editUrl = releaseType === 'basic' 
    ? `/cabinet/release-basic/edit/${releaseId}`
    : `/cabinet/release/edit/${releaseId}`;
  
  return (
    <div className={`mb-4 sm:mb-6 p-4 sm:p-6 rounded-2xl border-2 ${
      isLight 
        ? 'bg-gradient-to-br from-red-50 via-red-100/50 to-orange-50 border-red-300 shadow-lg shadow-red-200/30' 
        : 'bg-gradient-to-br from-red-950/40 via-red-900/30 to-red-950/20 border-red-500/40 shadow-lg shadow-red-900/20'
    }`}>
      {/* Заголовок */}
      <div className="flex items-start gap-3 mb-3 sm:mb-4">
        <div className={`flex-shrink-0 p-2 sm:p-2.5 rounded-xl ${
          isLight ? 'bg-red-200/60' : 'bg-red-500/20'
        }`}>
          <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${isLight ? 'text-red-600' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className={`text-sm sm:text-base font-bold uppercase tracking-wide ${
            isLight ? 'text-red-700' : 'text-red-400'
          }`}>
            Релиз отклонён модератором
          </h3>
          <p className={`text-[10px] sm:text-xs mt-0.5 ${
            isLight ? 'text-red-600/70' : 'text-red-400/60'
          }`}>
            Пожалуйста, исправьте указанные замечания и отправьте релиз повторно
          </p>
        </div>
      </div>
      
      {/* Причина отклонения */}
      <div className={`p-3 sm:p-4 rounded-xl ${
        isLight ? 'bg-white/70 border border-red-200' : 'bg-black/20 border border-red-500/20'
      }`}>
        <div className={`flex items-center gap-2 mb-2 ${
          isLight ? 'text-red-600' : 'text-red-400'
        }`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
          <span className="text-xs sm:text-sm font-semibold uppercase tracking-wide">Причина отклонения:</span>
        </div>
        <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words ${
          isLight ? 'text-red-700/80' : 'text-red-300/70'
        }`}>
          {reason}
        </p>
      </div>
      
      {/* Кнопка редактирования */}
      <a
        href={editUrl}
        className={`mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
          isLight
            ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
            : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30'
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
        Редактировать и отправить снова
      </a>
    </div>
  );
}
