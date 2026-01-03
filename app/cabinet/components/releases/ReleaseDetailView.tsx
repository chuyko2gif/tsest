"use client";
import React from 'react';
import { Release } from './types';
import { STATUS_BADGE_STYLES, formatDate, formatDateFull, getTracksWord, copyToClipboard } from './constants';
import { SupabaseClient } from '@supabase/supabase-js';
import { MetadataItem, InfoBadge, CopyrightSection, CountriesSection, TracklistSection } from './ReleaseDetailComponents';
import { PlatformsSection, PromoSection, AdditionalInfoSection, SocialLinksSection } from './ReleaseDetailSections';

interface ReleaseDetailViewProps {
  release: Release;
  onBack: () => void;
  showCopyToast: boolean;
  setShowCopyToast: (show: boolean) => void;
  supabase?: SupabaseClient;
}

export default function ReleaseDetailView({ release, onBack, showCopyToast, setShowCopyToast, supabase }: ReleaseDetailViewProps) {
  const shouldAnimate = release.status === 'pending' || release.status === 'distributed';
  
  const handleCopyUPC = async (upc: string) => {
    const success = await copyToClipboard(upc);
    if (success) { setShowCopyToast(true); setTimeout(() => setShowCopyToast(false), 2000); }
  };

  return (
    <div className="w-full">
      {/* Кнопка назад */}
      <button onClick={onBack} className="flex items-center gap-2 mb-4 sm:mb-6 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-white/5 to-white/10 hover:from-white/10 hover:to-white/15 rounded-xl sm:rounded-2xl transition-all duration-300 group border border-white/10">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="sm:w-[18px] sm:h-[18px] group-hover:-translate-x-1 transition-transform">
          <line x1="19" y1="12" x2="5" y2="12" strokeWidth="2.5" strokeLinecap="round"/>
          <polyline points="12 19 5 12 12 5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="font-semibold text-sm sm:text-base">Назад к релизам</span>
      </button>

      {/* Шапка релиза */}
      <ReleaseHeader release={release} handleCopyUPC={handleCopyUPC} />

      {/* Copyright */}
      {release.copyright && <CopyrightSection copyright={release.copyright} />}

      {/* Страны распространения */}
      {release.countries && release.countries.length > 0 && <CountriesSection countries={release.countries} />}

      {/* Треклист */}
      {release.tracks && release.tracks.length > 0 && (
        <TracklistSection tracks={release.tracks} releaseId={release.id} releaseType={release.release_type || 'basic'} status={release.status} supabase={supabase} />
      )}

      {/* Платформы */}
      {release.platforms && release.platforms.length > 0 && <PlatformsSection platforms={release.platforms} />}

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
function ReleaseHeader({ release, handleCopyUPC }: { release: Release; handleCopyUPC: (upc: string) => void }) {
  const shouldAnimate = release.status === 'pending' || release.status === 'distributed';
  
  return (
    <div className="relative mb-4 sm:mb-8 overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-800/90 to-zinc-900/90 backdrop-blur-xl border border-white/10">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5" />
      
      <div className="relative grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 sm:gap-8 p-4 sm:p-8">
        {/* Обложка */}
        <div className="relative group mx-auto w-full max-w-xs lg:max-w-none">
          <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl sm:rounded-3xl blur-xl sm:blur-2xl opacity-50 group-hover:opacity-75 transition-opacity" />
          {release.cover_url ? (
            <img src={release.cover_url} alt={release.title} className="relative w-full aspect-square rounded-xl sm:rounded-2xl object-cover shadow-2xl ring-1 ring-white/10" />
          ) : (
            <div className="relative w-full aspect-square rounded-xl sm:rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center shadow-2xl ring-1 ring-white/10">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 18V5l12-2v13M9 18l-7 2V7l7-2M9 18l12-2M9 9l12-2"/></svg>
            </div>
          )}
        </div>

        {/* Информация */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <span className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 sm:gap-2 ${STATUS_BADGE_STYLES[release.status] || STATUS_BADGE_STYLES.draft}`}>
                {shouldAnimate ? (
                  <svg className="animate-spin h-2.5 w-2.5 sm:h-3 sm:w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                ) : <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-current"/>}
                <span className="hidden xs:inline">{getStatusText(release.status, false)}</span>
                <span className="inline xs:hidden">{getStatusText(release.status, true)}</span>
              </span>
              {release.release_type && <span className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30">{release.release_type === 'basic' ? 'Basic' : 'Exclusive'}</span>}
              {release.custom_id && <span className="px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wide bg-zinc-700/50 text-zinc-300 ring-1 ring-zinc-600/30">{release.custom_id}</span>}
            </div>
            
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black uppercase tracking-tight mb-2 sm:mb-3 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent leading-tight break-words">{release.title}</h1>
            <p className="text-lg sm:text-xl lg:text-2xl font-semibold text-zinc-400 mb-4 sm:mb-6 break-words">{release.artist_name || release.artist}</p>

            {/* Действия */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {release.upc && <button onClick={() => handleCopyUPC(release.upc!)} className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition">Копировать UPC</button>}
              {release.spotify_link && <a href={release.spotify_link} target="_blank" rel="noopener noreferrer" className="px-3 py-2 bg-green-600/10 hover:bg-green-600/20 border border-green-600/20 rounded-lg text-sm font-semibold text-emerald-300 transition">Открыть в Spotify</a>}
              {release.payment_status && <div className={`px-3 py-2 rounded-lg text-sm font-bold ${release.payment_status === 'verified' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/20'}`}>{release.payment_status === 'verified' ? 'Оплата: подтверждена' : 'Оплата: ожидает'}</div>}
              {release.contract_agreed && <div className="px-3 py-2 rounded-lg text-sm font-bold bg-emerald-400/8 text-emerald-300 border border-emerald-400/20">Договор согласован</div>}
            </div>

            {/* Метаданные */}
            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-6 gap-y-2 sm:gap-y-3 text-xs sm:text-sm">
              {release.genre && <MetadataItem icon="music" color="purple" text={release.genre} />}
              {release.release_date && <MetadataItem icon="calendar" color="blue" text={formatDateFull(release.release_date)} />}
              {release.tracks && release.tracks.length > 0 && <MetadataItem icon="play" color="green" text={`${release.tracks.length} ${getTracksWord(release.tracks.length)}`} />}
              {release.label && <MetadataItem icon="tag" color="orange" text={release.label} />}
            </div>
          </div>

          {/* Дополнительные данные */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6">
            {release.upc ? <InfoBadge label="UPC" value={release.upc} mono /> : (
              <div className="px-2.5 sm:px-4 py-2 sm:py-3 bg-yellow-500/10 rounded-lg sm:rounded-xl border border-yellow-500/30">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <div className="min-w-0"><div className="text-[9px] sm:text-[10px] text-yellow-300 uppercase tracking-wide mb-0.5">UPC</div><div className="text-[10px] sm:text-xs text-yellow-300 truncate">Не добавлен</div></div>
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

function getStatusText(status: string, short: boolean): string {
  const texts: Record<string, { full: string; short: string }> = {
    distributed: { full: 'На дистрибьюции', short: 'Дистр.' },
    rejected: { full: 'Отклонен', short: 'Откл.' },
    published: { full: 'Опубликован', short: 'Опубл.' },
    pending: { full: 'На модерации', short: 'Модер.' }
  };
  return texts[status]?.[short ? 'short' : 'full'] || status;
}
