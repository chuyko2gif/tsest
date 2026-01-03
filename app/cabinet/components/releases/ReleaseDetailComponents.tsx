import React, { ReactNode } from 'react';
import { Release, Track } from './types';
import { STATUS_BADGE_STYLES, formatDate, formatDateFull, getTracksWord } from './constants';
import AudioPlayer from '@/components/ui/AudioPlayer';
import { SupabaseClient } from '@supabase/supabase-js';

// Компонент метаданных
export function MetadataItem({ icon, color, text }: { icon: string; color: string; text: string }) {
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
export function InfoBadge({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="px-2.5 sm:px-4 py-2 sm:py-3 bg-white/5 rounded-lg sm:rounded-xl border border-white/10 hover:bg-white/10 transition-colors">
      <div className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wide mb-0.5 sm:mb-1">{label}</div>
      <div className={`font-${mono ? 'mono' : 'semibold'} font-bold text-[10px] sm:text-xs text-white truncate`}>{value}</div>
    </div>
  );
}

// Секция Copyright
export function CopyrightSection({ copyright }: { copyright: string }) {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10">
      <div className="flex items-start gap-2 sm:gap-3">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M15 9a3 3 0 1 0 0 6"/>
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
export function CountriesSection({ countries }: { countries: string[] }) {
  return (
    <div className="mb-4 sm:mb-6 p-3 sm:p-5 bg-gradient-to-br from-white/5 to-white/[0.02] rounded-xl sm:rounded-2xl border border-white/10">
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
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

// Бейдж метаданных трека
export function MetadataBadge({ color, icon, label, value }: { color: string; icon: string; label: string; value?: string }) {
  const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
    blue: { bg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20 hover:border-blue-500/40', text: 'text-blue-300' },
    green: { bg: 'from-green-500/10 to-green-600/5', border: 'border-green-500/20 hover:border-green-500/40', text: 'text-green-300' },
    orange: { bg: 'from-orange-500/10 to-orange-600/5', border: 'border-orange-500/20 hover:border-orange-500/40', text: 'text-orange-300' },
    pink: { bg: 'from-pink-500/10 to-pink-600/5', border: 'border-pink-500/20 hover:border-pink-500/40', text: 'text-pink-300' }
  };

  const iconColors: Record<string, string> = { blue: 'text-blue-400', green: 'text-green-400', orange: 'text-orange-400', pink: 'text-pink-400' };

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

// Метаданные трека
export function TrackMetadata({ track }: { track: Track }) {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {track.language && <MetadataBadge color="blue" icon="globe" label={track.language} />}
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
      {track.version && <MetadataBadge color="orange" icon="tag" label={track.version} />}
      {track.featuring && <MetadataBadge color="pink" icon="users" label="feat." value={Array.isArray(track.featuring) ? track.featuring.join(', ') : track.featuring} />}
    </div>
  );
}

// Компонент трека
export function TrackItem({ track, index, canPlay, releaseId, releaseType, supabase }: { 
  track: Track; index: number; canPlay: boolean; releaseId: string; releaseType: 'basic' | 'exclusive'; supabase?: SupabaseClient;
}) {
  return (
    <details className="group relative bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl hover:from-white/10 hover:to-white/5 transition-all duration-300 border border-white/10 hover:border-purple-500/30">
      <summary className="cursor-pointer p-5 list-none">
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            {canPlay && supabase && track.link ? (
              <AudioPlayer releaseId={releaseId} releaseType={releaseType} trackIndex={index} supabase={supabase} variant="compact"/>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-base font-black ring-1 ring-white/10">{index + 1}</div>
              </>
            )}
          </div>
          <div className="flex-1 relative min-w-0">
            <h4 className="font-bold text-lg mb-1 text-white group-hover:text-purple-100 transition-colors">{track.title}</h4>
            {(track.producers || track.producer) && (
              <p className="text-sm text-zinc-500">
                <span className="text-zinc-600">prod.</span> {track.producers ? (Array.isArray(track.producers) ? track.producers.join(', ') : track.producers) : track.producer}
              </p>
            )}
          </div>
          <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform flex-shrink-0 mt-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </summary>
      <div className="px-5 pb-5">
        <div className="pt-3 border-t border-white/10">
          <TrackMetadata track={track} />
          {track.explicit && (
            <div className="mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold ring-1 ring-red-500/30">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                EXPLICIT CONTENT
              </span>
            </div>
          )}
          {track.lyrics && (
            <details className="mt-3 group/lyrics">
              <summary className="cursor-pointer text-sm text-purple-400 hover:text-purple-300 font-medium flex items-center gap-2 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Текст песни</span>
                <svg className="w-4 h-4 group-open/lyrics:rotate-180 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div className="mt-3 p-4 bg-black/30 rounded-xl text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed border border-white/10">{track.lyrics}</div>
            </details>
          )}
        </div>
      </div>
    </details>
  );
}

// Секция треклиста
export function TracklistSection({ tracks, releaseId, releaseType, status, supabase }: { 
  tracks: Track[]; releaseId: string; releaseType: 'basic' | 'exclusive'; status: string; supabase?: SupabaseClient;
}) {
  const canPlay = status === 'published' || status === 'distributed';
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-5">
        <svg className="w-6 h-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>
        </svg>
        <h3 className="font-bold text-2xl">Треклист</h3>
        <span className="ml-auto text-xs text-zinc-500 bg-white/5 px-3 py-1 rounded-full">{tracks.length} {getTracksWord(tracks.length)}</span>
      </div>
      <div className="space-y-2">
        {tracks.map((track, idx) => (
          <TrackItem key={idx} track={track} index={idx} canPlay={canPlay} releaseId={releaseId} releaseType={releaseType} supabase={supabase}/>
        ))}
      </div>
    </div>
  );
}
