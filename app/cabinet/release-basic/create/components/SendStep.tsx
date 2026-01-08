import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { showSuccessToast, showErrorToast } from '@/lib/utils/showToast';
import { CONTRIBUTOR_ROLES } from './ReleaseInfoStep';
import { TrackAuthor, TRACK_AUTHOR_ROLES } from '@/components/ui/TrackAuthors';
import { useTheme } from '@/contexts/ThemeContext';

// Хелпер для форматирования авторов трека
const formatTrackAuthors = (authors: string | string[] | TrackAuthor[] | undefined): string => {
  if (!authors) return '';
  if (Array.isArray(authors) && authors.length > 0 && typeof authors[0] === 'object' && 'role' in authors[0]) {
    return (authors as TrackAuthor[]).map(a => {
      const roleLabel = TRACK_AUTHOR_ROLES.find(r => r.value === a.role)?.label || a.role;
      return `${a.fullName} (${roleLabel})`;
    }).join(', ');
  }
  if (Array.isArray(authors)) {
    return (authors as string[]).filter(a => a?.trim()).join(', ');
  }
  return authors as string;
};

type ReleaseType = 'single' | 'ep' | 'album';

interface Contributor {
  role: 'composer' | 'lyricist' | 'producer' | 'arranger' | 'performer' | 'mixer' | 'mastering' | 'other';
  fullName: string;
}

interface SendStepProps {
  releaseTitle: string;
  artistName: string;
  genre: string;
  releaseType: ReleaseType | null;
  tracksCount: number;
  coverFile: File | null;
  existingCoverUrl?: string;
  collaborators: string[];
  releaseArtists?: string[];
  subgenres: string[];
  releaseDate: string | null;
  selectedPlatforms: number;
  agreedToContract: boolean;
  focusTrack: string;
  focusTrackPromo: string;
  albumDescription: string;
  promoPhotos: string[];
  promoStatus?: 'not-started' | 'skipped' | 'filled';
  contributors?: Contributor[];
  tracks: Array<{
    title: string;
    link: string;
    audioFile?: File | null;
    audioMetadata?: {
      format: string;
      duration?: number;
      bitrate?: string;
      sampleRate?: string;
      size: number;
    } | null;
    hasDrugs: boolean;
    lyrics: string;
    language: string;
    version?: string;
    producers?: string[];
    featuring?: string[];
    authors?: TrackAuthor[];
    isInstrumental?: boolean;
    originalFileName?: string;
  }>;
  platforms: string[];
  countries: string[];
  onBack: () => void;
  paymentTransactionId?: string | null;
  draftId?: string | null;
}

export default function SendStep({ 
  releaseTitle,
  artistName, 
  genre, 
  releaseType,
  tracksCount,
  coverFile,
  existingCoverUrl,
  selectedPlatforms,
  agreedToContract,
  tracks,
  platforms,
  countries,
  collaborators,
  releaseArtists = [],
  subgenres,
  releaseDate,
  focusTrack,
  focusTrackPromo,
  albumDescription,
  promoPhotos,
  promoStatus = 'not-started',
  contributors = [],
  onBack,
  paymentTransactionId,
  draftId
}: SendStepProps) {
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTrackLyrics, setSelectedTrackLyrics] = useState<{title: string; lyrics: string} | null>(null);
  const [expandedTrackIndex, setExpandedTrackIndex] = useState<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Проверка всех 6 основных шагов (без оплаты - для показа итога)
  const basicChecks = [
    {
      name: 'Релиз',
      isValid: !!(releaseTitle.trim() && genre && (coverFile || existingCoverUrl)),
      issues: [
        !releaseTitle.trim() && 'Не указано название релиза',
        !genre && 'Не выбран жанр',
        !(coverFile || existingCoverUrl) && 'Не загружена обложка'
      ].filter(Boolean)
    },
    {
      name: 'Треклист',
      isValid: (() => {
        const minTracks = releaseType === 'album' ? 8 : releaseType === 'ep' ? 2 : 1;
        return tracksCount >= minTracks;
      })(),
      issues: (() => {
        const minTracks = releaseType === 'album' ? 8 : releaseType === 'ep' ? 2 : 1;
        if (tracksCount < minTracks) {
          const typeLabel = releaseType === 'album' ? 'альбома' : releaseType === 'ep' ? 'EP' : 'сингла';
          return [`Для ${typeLabel} требуется минимум ${minTracks} ${minTracks === 1 ? 'трек' : minTracks < 5 ? 'трека' : 'треков'} (добавлено: ${tracksCount})`];
        }
        return [];
      })()
    },
    {
      name: 'Страны',
      isValid: countries.length > 0,
      issues: countries.length === 0 ? ['Не выбрано ни одной страны'] : []
    },
    {
      name: 'Договор',
      isValid: agreedToContract,
      issues: !agreedToContract ? ['Не принят договор'] : []
    },
    {
      name: 'Площадки',
      isValid: selectedPlatforms > 0,
      issues: selectedPlatforms === 0 ? ['Не выбрано ни одной площадки'] : []
    },
    {
      name: 'Промо',
      isValid: promoStatus !== 'not-started',
      issues: promoStatus === 'not-started' ? ['Заполните или пропустите шаг промо'] : []
    }
  ];

  // Проверка оплаты отдельно
  const paymentCheck = {
    name: 'Оплата',
    isValid: !!paymentTransactionId,
    issues: !paymentTransactionId ? ['Оплата не произведена'] : []
  };

  // Все проверки включая оплату (для отправки)
  const requiredChecks = [...basicChecks, paymentCheck];

  // Основные шаги валидны (для показа итога)
  const basicStepsValid = basicChecks.every(c => c.isValid);
  
  // Все валидно включая оплату (для отправки)
  const allValid = requiredChecks.every(c => c.isValid);
  const invalidSteps = requiredChecks.filter(c => !c.isValid);

  // Loading overlay component для portal - мягкая анимация
  const LoadingOverlay = () => (
    <div className={`fixed inset-0 z-[99999] ${isLight ? 'bg-gradient-to-br from-gray-50 via-white to-gray-100' : 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950'} flex items-center justify-center`} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
      {/* Мягкие фоновые круги */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-1/4 left-1/4 w-96 h-96 ${isLight ? 'bg-violet-500/10' : 'bg-violet-500/5'} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: '4s' }}></div>
        <div className={`absolute bottom-1/4 right-1/4 w-80 h-80 ${isLight ? 'bg-indigo-500/10' : 'bg-indigo-500/5'} rounded-full blur-3xl animate-pulse`} style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] ${isLight ? 'bg-purple-500/5' : 'bg-purple-500/3'} rounded-full blur-3xl`}></div>
      </div>
      
      <div className="relative text-center max-w-md px-8">
        {/* Центральная анимация - виниловая пластинка */}
        <div className="relative mb-10">
          <div className="w-36 h-36 mx-auto relative">
            {/* Внешнее свечение */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }}></div>
            
            {/* Пластинка */}
            <div className={`absolute inset-0 rounded-full ${isLight ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-zinc-800 to-zinc-900'} shadow-2xl animate-spin`} style={{ animationDuration: '3s' }}>
              {/* Текстура винила */}
              <div className={`absolute inset-2 rounded-full border ${isLight ? 'border-gray-600/50' : 'border-zinc-700/50'}`}></div>
              <div className={`absolute inset-4 rounded-full border ${isLight ? 'border-gray-600/30' : 'border-zinc-700/30'}`}></div>
              <div className={`absolute inset-6 rounded-full border ${isLight ? 'border-gray-600/20' : 'border-zinc-700/20'}`}></div>
              <div className={`absolute inset-8 rounded-full border ${isLight ? 'border-gray-600/20' : 'border-zinc-700/20'}`}></div>
              <div className={`absolute inset-10 rounded-full border ${isLight ? 'border-gray-600/30' : 'border-zinc-700/30'}`}></div>
              
              {/* Блик на пластинке */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
              
              {/* Центральный лейбл */}
              <div className={`absolute inset-[40%] rounded-full bg-gradient-to-br from-violet-400/90 to-purple-600/90 flex items-center justify-center shadow-inner`}>
                <div className={`w-2 h-2 ${isLight ? 'bg-gray-800' : 'bg-zinc-900'} rounded-full`}></div>
              </div>
            </div>
            
            {/* Плавающие ноты */}
            <div className="absolute -top-2 -right-2 text-violet-400/60 animate-bounce" style={{ animationDuration: '2s' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -left-3 text-indigo-400/50 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Текст */}
        <h3 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mb-3`}>
          Отправляем релиз
        </h3>
        <p className={`${isLight ? 'text-gray-500' : 'text-zinc-500'} mb-8 text-sm leading-relaxed`}>
          Загружаем файлы и отправляем на модерацию<br/>
          <span className={`${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>Пожалуйста, не закрывайте страницу</span>
        </p>
        
        {/* Прогресс бар - минималистичный */}
        <div className={`relative h-1 ${isLight ? 'bg-gray-200' : 'bg-zinc-800'} rounded-full overflow-hidden mb-6 mx-8`}>
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
            style={{ 
              animation: 'loading-progress 2s ease-in-out infinite',
              width: '40%'
            }}
          ></div>
        </div>
        
        {/* Мягкие точки загрузки */}
        <div className="flex justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-violet-400/70 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 bg-purple-400/70 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
          <span className="w-1.5 h-1.5 bg-indigo-400/70 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></span>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );

  return (
    <>
      {/* Full-screen loading overlay через portal */}
      {mounted && (submitting || submitSuccess) && createPortal(<LoadingOverlay />, document.body)}

      <div className="animate-fade-up">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-14 h-14 rounded-2xl ${isLight ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-1 ring-green-200' : 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 ring-1 ring-white/10'} flex items-center justify-center`}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${isLight ? 'text-green-600' : 'text-green-300'}`}>
                <path d="M22 2L11 13"/>
                <path d="M22 2L15 22L11 13L2 9L22 2z"/>
              </svg>
            </div>
            <div>
              <h2 className={`text-3xl font-black ${isLight ? 'bg-gradient-to-r from-gray-900 to-gray-600' : 'bg-gradient-to-r from-white to-zinc-400'} bg-clip-text text-transparent`}>Отправка на модерацию</h2>
              <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'} mt-1`}>Проверьте данные и отправьте релиз</p>
            </div>
          </div>
        </div>
      
        {/* Статус проверки шагов */}
        <div className={`mb-6 p-5 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.02] border-white/5'} border rounded-xl`}>
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
              <path d="M9 11l3 3L22 4" strokeWidth="2"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2"/>
            </svg>
            <span className={isLight ? 'text-gray-900' : 'text-white'}>Проверка заполнения</span>
          </h3>
          
          <div className="space-y-3">
            {requiredChecks.map((step, idx) => (
              <div 
                key={idx}
                className={`p-3 rounded-lg border transition ${
                  step.isValid 
                    ? isLight ? 'bg-green-50 border-green-200' : 'bg-emerald-500/10 border-emerald-500/20'
                    : isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  {step.isValid ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`${isLight ? 'text-green-600' : 'text-emerald-400'} flex-shrink-0`}>
                      <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`${isLight ? 'text-red-600' : 'text-red-400'} flex-shrink-0`}>
                      <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                      <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2"/>
                      <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2"/>
                    </svg>
                  )}
                  <div className="flex-1">
                    <span className={`font-bold ${
                      step.isValid 
                        ? isLight ? 'text-green-700' : 'text-emerald-300'
                        : isLight ? 'text-red-700' : 'text-red-300'
                    }`}>
                      {step.name}
                    </span>
                    {step.issues.length > 0 && (
                      <div className={`mt-1 text-xs ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                        {step.issues.map((issue, i) => (
                          <div key={i}>• {issue}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    step.isValid 
                      ? isLight ? 'text-green-600' : 'text-emerald-400'
                      : isLight ? 'text-red-600' : 'text-red-400'
                  }`}>
                    {step.isValid ? 'Готово' : 'Требуется'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Предупреждение если не все основные шаги заполнены */}
        {!basicStepsValid && (
          <div className={`mb-6 p-4 ${isLight ? 'bg-red-50 border-red-200' : 'bg-red-500/10 border-red-500/30'} border rounded-xl`}>
            <div className="flex items-start gap-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`${isLight ? 'text-red-600' : 'text-red-400'} flex-shrink-0 mt-0.5`}>
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
                <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
              </svg>
              <div>
                <div className={`${isLight ? 'text-red-700' : 'text-red-300'} font-bold mb-1`}>Заполните все шаги</div>
                <div className={`text-sm ${isLight ? 'text-red-600' : 'text-red-400'}`}>
                  Заполните все обязательные поля: {basicChecks.filter(c => !c.isValid).map(s => s.name).join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ИТОГ: Полный обзор релиза - показываем когда основные шаги заполнены */}
        {basicStepsValid && (
          <div className={`mb-6 p-5 ${isLight ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200' : 'bg-gradient-to-br from-violet-500/5 to-purple-500/5 border-violet-500/20'} border rounded-xl`}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${isLight ? 'text-violet-700' : 'text-violet-300'}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="9" y1="21" x2="9" y2="9"/>
              </svg>
              Итоговый обзор релиза
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Обложка и основная информация */}
              <div className="flex gap-4">
                {/* Обложка */}
                <div className={`w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-zinc-800 border-white/10'} border`}>
                  {(coverFile || existingCoverUrl) ? (
                    <img 
                      src={coverFile ? URL.createObjectURL(coverFile) : existingCoverUrl} 
                      alt="Обложка" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Основная информация */}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'} truncate`}>{releaseTitle || 'Без названия'}</h4>
                  <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'} flex items-center gap-1 flex-wrap mt-0.5`}>
                  {/* Артисты релиза */}
                  {releaseArtists.length > 0 ? (
                    releaseArtists.map((artist, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && <span className={isLight ? 'text-gray-400' : 'text-zinc-500'}>&</span>}
                        <span>{artist}</span>
                      </span>
                    ))
                  ) : (
                    <span className={isLight ? 'text-gray-600' : 'text-zinc-400'}>{artistName || 'Не указан'}</span>
                  )}
                </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className={`px-2 py-0.5 ${isLight ? 'bg-violet-100 text-violet-700' : 'bg-violet-500/20 text-violet-300'} rounded text-xs font-medium`}>
                      {releaseType === 'album' ? 'Альбом' : releaseType === 'ep' ? 'EP' : 'Сингл'}
                    </span>
                    <span className={`px-2 py-0.5 ${isLight ? 'bg-cyan-100 text-cyan-700' : 'bg-cyan-500/20 text-cyan-300'} rounded text-xs font-medium`}>
                      {genre}
                    </span>
                    {subgenres.filter(s => s.trim()).map((sub, idx) => (
                      <span key={idx} className={`px-2 py-0.5 ${isLight ? 'bg-gray-100 text-gray-700' : 'bg-zinc-700 text-zinc-300'} rounded text-xs`}>
                        {sub}
                      </span>
                    ))}
                  </div>
                  {releaseDate && (
                    <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'} mt-2 flex items-center gap-1`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Дата релиза: {new Date(releaseDate).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Статистика */}
              <div className="grid grid-cols-3 gap-2">
                <div className={`p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/5'} rounded-lg border`}>
                  <div className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'} uppercase tracking-wider`}>Треков</div>
                  <div className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{tracksCount}</div>
                </div>
                <div className={`p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/5'} rounded-lg border`}>
                  <div className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'} uppercase tracking-wider`}>Площадок</div>
                  <div className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{selectedPlatforms}</div>
                </div>
                <div className={`p-3 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.03] border-white/5'} rounded-lg border`}>
                  <div className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'} uppercase tracking-wider`}>Стран</div>
                  <div className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mt-1`}>{countries.length}</div>
                </div>
              </div>
            </div>
            
            {/* Авторы (Контрибьюторы) */}
            {contributors.length > 0 && (
              <div className={`mt-4 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
                <div className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'} uppercase tracking-wider mb-2 flex items-center gap-1.5`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Авторы
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {contributors.map((contributor, idx) => {
                    const roleInfo = CONTRIBUTOR_ROLES.find(r => r.value === contributor.role);
                    return (
                      <div key={idx} className={`flex items-center gap-2 p-2 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.02] border-white/5'} rounded-lg border`}>
                        <span className={`px-2 py-0.5 ${isLight ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-rose-500/20 text-rose-300 border-rose-500/20'} rounded text-[10px] font-medium min-w-[80px] text-center border`}>
                          {roleInfo?.label || contributor.role}
                        </span>
                        <span className={`text-sm ${isLight ? 'text-gray-900' : 'text-white'} truncate`}>{contributor.fullName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Треклист */}
            <div className={`mt-4 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
              <div className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'} uppercase tracking-wider mb-2 flex items-center gap-1.5`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13"/>
                  <circle cx="6" cy="18" r="3"/>
                  <circle cx="18" cy="16" r="3"/>
                </svg>
                Треклист
              </div>
              {/* Подсказка для мобильных */}
              <div className={`sm:hidden text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'} mb-2 flex items-center gap-1.5`}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Нажмите на трек для просмотра деталей
              </div>
              <div className={`space-y-2 max-h-[250px] overflow-y-auto pr-2 ${isLight ? 'scrollbar-thin scrollbar-thumb-gray-300' : 'scrollbar-thin scrollbar-thumb-white/10'}`}>
                {tracks.map((track, i) => {
                  const isExpanded = expandedTrackIndex === i;
                  return (
                  <div 
                    key={i} 
                    className={`${isLight ? 'bg-gray-50 border-gray-200 hover:border-gray-300' : 'bg-white/[0.03] border-white/5 hover:border-white/10'} rounded-xl border transition overflow-hidden`}
                  >
                    {/* Основная строка трека - кликабельна на мобильных */}
                    <div 
                      className="flex items-center gap-3 p-3 sm:cursor-default"
                      onClick={() => {
                        // Только на мобильных - переключаем раскрытие
                        if (window.innerWidth < 640) {
                          setExpandedTrackIndex(isExpanded ? null : i);
                        }
                      }}
                    >
                      {/* Миниатюра обложки с номером трека */}
                      <div className={`w-11 h-11 flex-shrink-0 rounded-lg overflow-hidden ${isLight ? 'bg-gray-100 border-gray-200' : 'bg-zinc-800 border-white/10'} border relative`}>
                        {(coverFile || existingCoverUrl) ? (
                          <img 
                            src={coverFile ? URL.createObjectURL(coverFile) : existingCoverUrl} 
                            alt="" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <path d="M9 18V5l12-2v13"/>
                              <circle cx="6" cy="18" r="3"/>
                              <circle cx="18" cy="16" r="3"/>
                            </svg>
                          </div>
                        )}
                        {/* Номер трека на обложке */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                          <span className="text-white font-bold text-sm drop-shadow-lg">{i + 1}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {/* Название трека */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-sm ${isLight ? 'text-gray-900' : 'text-white'} font-semibold truncate`}>{track.title || 'Без названия'}</span>
                          {/* На десктопе показываем бейджи в строке */}
                          <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                            {/* Продюсеры */}
                            {track.producers && track.producers.filter(p => p?.trim()).length > 0 && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-gradient-to-r from-indigo-500/15 to-blue-500/15 text-blue-300 border-blue-500/20'} text-[10px] rounded-full border`}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLight ? 'text-indigo-600' : 'text-blue-400'}>
                                  <rect x="4" y="4" width="4" height="16" rx="1"/>
                                  <rect x="10" y="8" width="4" height="12" rx="1"/>
                                  <rect x="16" y="2" width="4" height="18" rx="1"/>
                                </svg>
                                prod. {track.producers.filter(p => p?.trim()).join(', ')}
                              </span>
                            )}
                            {/* Фиты */}
                            {track.featuring && track.featuring.filter(f => f?.trim()).length > 0 && (
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-gradient-to-r from-pink-500/15 to-rose-500/15 text-pink-300 border-pink-500/20'} text-[10px] rounded-full border`}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLight ? 'text-pink-600' : 'text-pink-400'}>
                                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                  <circle cx="9" cy="7" r="4"/>
                                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                </svg>
                                feat. {track.featuring.filter(f => f?.trim()).join(', ')}
                              </span>
                            )}
                            {/* Explicit */}
                            {!track.isInstrumental && track.hasDrugs && (
                              <span className={`inline-flex items-center justify-center w-[18px] h-[18px] ${isLight ? 'bg-red-100 text-red-600 border-red-300' : 'bg-red-500/15 text-red-400 border-red-500/40'} text-[10px] font-bold rounded border leading-none`}>
                                E
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* На мобильных показываем краткую инфу */}
                        <div className={`sm:hidden flex items-center gap-1.5 mt-1 text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                          {track.producers && track.producers.filter(p => p?.trim()).length > 0 && (
                            <span>prod. {track.producers.filter(p => p?.trim()).join(', ')}</span>
                          )}
                          {track.featuring && track.featuring.filter(f => f?.trim()).length > 0 && (
                            <span>feat. {track.featuring.filter(f => f?.trim()).join(', ')}</span>
                          )}
                          {!track.isInstrumental && track.hasDrugs && (
                            <span className={`${isLight ? 'text-red-600' : 'text-red-400'} font-bold`}>E</span>
                          )}
                          {track.isInstrumental && (
                            <span className={isLight ? 'text-violet-600' : 'text-violet-400'}>Instrumental</span>
                          )}
                        </div>
                        
                        {/* Строка 2: мета-бейджи - только на десктопе */}
                        <div className="hidden sm:flex items-center gap-1.5 flex-wrap mt-1">
                          {/* Аудиофайл */}
                          {(track.audioFile?.name || track.originalFileName || track.link) && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20'} text-[10px] rounded-md border`}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 18V5l12-2v13"/>
                                <circle cx="6" cy="18" r="3"/>
                                <circle cx="18" cy="16" r="3"/>
                              </svg>
                              {(() => {
                                const name = track.audioFile?.name || track.originalFileName || track.link?.split('/').pop()?.split('?')[0] || 'audio';
                                const ext = name.includes('.') ? name.split('.').pop()?.toUpperCase() : 'WAV';
                                const baseName = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
                                const decodedName = baseName ? decodeURIComponent(baseName) : '';
                                const displayName = decodedName.length > 12 ? decodedName.substring(0, 10) + '...' : decodedName;
                                return <><span className="font-bold">{ext}</span> · {displayName}</>;
                              })()}
                            </span>
                          )}
                          {/* Язык */}
                          {!track.isInstrumental && track.language && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-cyan-100 text-cyan-700 border-cyan-200' : 'bg-gradient-to-r from-cyan-500/10 to-sky-500/10 text-cyan-300 border-cyan-500/20'} text-[10px] rounded-md border`}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="2" y1="12" x2="22" y2="12"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                              </svg>
                              {track.language}
                            </span>
                          )}
                          {/* Clean */}
                          {!track.isInstrumental && !track.hasDrugs && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-400 border-emerald-500/20'} text-[10px] rounded-md border`}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Clean
                            </span>
                          )}
                          {/* Instrumental */}
                          {track.isInstrumental && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-300 border-violet-500/25'} text-[10px] rounded-md font-bold border`}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 18V5l12-2v13"/>
                                <circle cx="6" cy="18" r="3"/>
                                <circle cx="18" cy="16" r="3"/>
                              </svg>
                              INSTRUMENTAL
                            </span>
                          )}
                          {/* Версия */}
                          {track.version && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-300 border-orange-500/20'} text-[10px] rounded-md border`}>
                              {track.version}
                            </span>
                          )}
                          {/* Авторы */}
                          {track.authors && track.authors.length > 0 && (track.authors as TrackAuthor[]).map((author, idx) => {
                            const roleLabel = TRACK_AUTHOR_ROLES.find(r => r.value === author.role)?.labelRu || author.role;
                            return (
                              <span key={idx} className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-200 border-amber-500/20'} text-[10px] rounded-md border`}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLight ? 'text-amber-600' : 'text-amber-400'}>
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                                <span className={`${isLight ? 'text-amber-700' : 'text-amber-400'} font-medium`}>{roleLabel}:</span>
                                <span>{author.fullName}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Стрелка раскрытия - только на мобильных */}
                      <div className="sm:hidden flex-shrink-0">
                        <svg 
                          width="16" 
                          height="16" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="2"
                          className={`${isLight ? 'text-gray-400' : 'text-zinc-400'} transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        >
                          <polyline points="6 9 12 15 18 9"/>
                        </svg>
                      </div>
                      
                      {/* Кнопка текста справа - только на десктопе */}
                      {track.lyrics && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTrackLyrics({ title: track.title || `Трек ${i + 1}`, lyrics: track.lyrics });
                          }}
                          className={`hidden sm:flex flex-shrink-0 px-3 py-1.5 ${isLight ? 'bg-violet-100 hover:bg-violet-200 border-violet-300 hover:border-violet-400 text-violet-700 hover:text-violet-800' : 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 hover:border-violet-500/50 text-violet-400 hover:text-violet-300'} border rounded-lg text-xs font-medium items-center gap-1.5 transition`}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                          Текст
                        </button>
                      )}
                    </div>
                    
                    {/* Раскрываемая информация - только на мобильных */}
                    <div className={`sm:hidden overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[500px]' : 'max-h-0'}`}>
                      <div className={`px-3 pb-3 pt-0 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
                        <div className="flex flex-wrap gap-1.5 pt-2">
                          {/* Аудиофайл */}
                          {(track.audioFile?.name || track.originalFileName || track.link) && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20'} text-[10px] rounded-md border`}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 18V5l12-2v13"/>
                                <circle cx="6" cy="18" r="3"/>
                                <circle cx="18" cy="16" r="3"/>
                              </svg>
                              {(() => {
                                const name = track.audioFile?.name || track.originalFileName || track.link?.split('/').pop()?.split('?')[0] || 'audio';
                                const ext = name.includes('.') ? name.split('.').pop()?.toUpperCase() : 'WAV';
                                const baseName = name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;
                                const decodedName = baseName ? decodeURIComponent(baseName) : '';
                                const displayName = decodedName.length > 12 ? decodedName.substring(0, 10) + '...' : decodedName;
                                return <><span className="font-bold">{ext}</span> · {displayName}</>;
                              })()}
                            </span>
                          )}
                          {/* Язык */}
                          {!track.isInstrumental && track.language && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-cyan-100 text-cyan-700 border-cyan-200' : 'bg-gradient-to-r from-cyan-500/10 to-sky-500/10 text-cyan-300 border-cyan-500/20'} text-[10px] rounded-md border`}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <circle cx="12" cy="12" r="10"/>
                                <line x1="2" y1="12" x2="22" y2="12"/>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                              </svg>
                              {track.language}
                            </span>
                          )}
                          {/* Clean */}
                          {!track.isInstrumental && !track.hasDrugs && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gradient-to-r from-emerald-500/10 to-green-500/10 text-emerald-400 border-emerald-500/20'} text-[10px] rounded-md border`}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Clean
                            </span>
                          )}
                          {/* Instrumental */}
                          {track.isInstrumental && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-violet-100 text-violet-700 border-violet-200' : 'bg-gradient-to-r from-violet-500/15 to-purple-500/15 text-violet-300 border-violet-500/25'} text-[10px] rounded-md font-bold border`}>
                              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M9 18V5l12-2v13"/>
                                <circle cx="6" cy="18" r="3"/>
                                <circle cx="18" cy="16" r="3"/>
                              </svg>
                              INSTRUMENTAL
                            </span>
                          )}
                          {/* Версия */}
                          {track.version && (
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-300 border-orange-500/20'} text-[10px] rounded-md border`}>
                              {track.version}
                            </span>
                          )}
                          {/* Авторы */}
                          {track.authors && track.authors.length > 0 && (track.authors as TrackAuthor[]).map((author, idx) => {
                            const roleLabel = TRACK_AUTHOR_ROLES.find(r => r.value === author.role)?.labelRu || author.role;
                            return (
                              <span key={idx} className={`inline-flex items-center gap-1 px-1.5 py-0.5 ${isLight ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-amber-500/10 text-amber-200 border-amber-500/20'} text-[10px] rounded-md border`}>
                                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={isLight ? 'text-amber-600' : 'text-amber-400'}>
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  <circle cx="12" cy="7" r="4"/>
                                </svg>
                                <span className={`${isLight ? 'text-amber-700' : 'text-amber-400'} font-medium`}>{roleLabel}:</span>
                                <span>{author.fullName}</span>
                              </span>
                            );
                          })}
                        </div>
                        {/* Кнопка текста - в раскрытом блоке на мобильных */}
                        {track.lyrics && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTrackLyrics({ title: track.title || `Трек ${i + 1}`, lyrics: track.lyrics });
                            }}
                            className={`mt-2 w-full px-3 py-2 ${isLight ? 'bg-violet-100 hover:bg-violet-200 border-violet-300 hover:border-violet-400 text-violet-700 hover:text-violet-800' : 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/30 hover:border-violet-500/50 text-violet-400 hover:text-violet-300'} border rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition`}
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <line x1="16" y1="13" x2="8" y2="13"/>
                              <line x1="16" y1="17" x2="8" y2="17"/>
                            </svg>
                            Показать текст
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
            
            {/* Промо и доп. информация */}
            {(focusTrack || promoPhotos.length > 0 || albumDescription) && (
              <div className={`mt-4 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
                <div className={`text-[10px] ${isLight ? 'text-gray-500' : 'text-zinc-500'} uppercase tracking-wider mb-2 flex items-center gap-1.5`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  Промо-материалы
                </div>
                <div className="space-y-2 text-sm">
                  {focusTrack && (
                    <div className={`flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                      <span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Фокус-трек:</span>
                      <span className={`${isLight ? 'text-violet-700' : 'text-violet-300'} font-medium`}>{focusTrack}</span>
                    </div>
                  )}
                  {promoPhotos.length > 0 && (
                    <div className={`flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                      <span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Промо-фото:</span>
                      <span className={`${isLight ? 'text-emerald-700' : 'text-emerald-300'} font-medium`}>{promoPhotos.length} шт.</span>
                    </div>
                  )}
                  {albumDescription && (
                    <div className={isLight ? 'text-gray-600' : 'text-zinc-400'}>
                      <span className={isLight ? 'text-gray-500' : 'text-zinc-500'}>Описание:</span>
                      <p className={`mt-1 text-xs ${isLight ? 'text-gray-500' : 'text-zinc-400'} line-clamp-2`}>{albumDescription}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Статус оплаты */}
            <div className={`mt-4 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
              {paymentTransactionId ? (
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-2 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-emerald-600' : 'text-emerald-400'}>
                      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
                      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
                      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4Z"/>
                    </svg>
                    <span className={`text-sm ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>Оплачено с баланса</span>
                  </div>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-emerald-600' : 'text-emerald-400'}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </div>
              ) : (
                <div className={`p-3 ${isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/30'} border rounded-lg`}>
                  <div className={`flex items-center gap-2 ${isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span className="text-sm font-medium">Оплата не произведена</span>
                  </div>
                  <p className={`text-xs ${isLight ? 'text-amber-600' : 'text-amber-400/70'} mt-1`}>Вернитесь на шаг оплаты и оплатите с баланса</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className={`mt-8 pt-6 ${isLight ? 'border-gray-200' : 'border-white/10'} flex justify-between`}>
          <button onClick={onBack} className={`px-6 py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl font-bold transition flex items-center gap-2`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
            Назад
          </button>
          <button 
            onClick={() => {
              if (!allValid || submitting) return;
              setShowConfirmDialog(true);
            }}
            disabled={!allValid || submitting}
            className={`px-8 py-4 rounded-xl font-black transition flex items-center gap-2 relative overflow-hidden ${
              allValid && !submitting
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white cursor-pointer' 
                : submitting
                  ? 'bg-gradient-to-r from-purple-600 via-blue-500 to-purple-600 text-white cursor-wait animate-gradient-x'
                  : isLight 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                {/* Animated shimmer background */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                {/* Spinning rocket icon */}
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor"
                  className="animate-bounce"
                  strokeWidth="2"
                >
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                </svg>
                <span className="relative z-10">Отправляем релиз...</span>
                {/* Pulsing dots */}
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                </span>
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="22" y1="2" x2="11" y2="13" strokeWidth="2"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2" strokeWidth="2"/>
                </svg>
                Отправить на модерацию
              </>
            )}
          </button>
        </div>

        {/* Диалог подтверждения отправки */}
        {/* Модалка просмотра текста песни - через portal для центрирования на экране */}
        {mounted && selectedTrackLyrics && createPortal(
          <div 
            className={`fixed inset-0 z-[99999] flex items-center justify-center ${isLight ? 'bg-black/50' : 'bg-black/80'} backdrop-blur-sm`}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
            onClick={() => setSelectedTrackLyrics(null)}
          >
            <div 
              className={`${isLight ? 'bg-white border-gray-200' : 'bg-gradient-to-b from-zinc-900 to-zinc-950 border-white/10'} border rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col shadow-2xl animate-fade-up`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${isLight ? 'bg-violet-100 border-violet-200' : 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 border-violet-500/20'} flex items-center justify-center border`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={isLight ? 'text-violet-600' : 'text-violet-400'} strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                    </svg>
                  </div>
                  <div>
                    <h3 className={`font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Текст песни</h3>
                    <p className={`text-sm ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>{selectedTrackLyrics.title}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Кнопка копирования */}
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedTrackLyrics.lyrics);
                      showSuccessToast('Текст скопирован');
                    }}
                    className={`w-10 h-10 rounded-xl ${isLight ? 'bg-emerald-100 hover:bg-emerald-200 border-emerald-200 hover:border-emerald-300' : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 hover:border-emerald-500/50'} border flex items-center justify-center transition group`}
                    title="Копировать текст"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${isLight ? 'text-emerald-600 group-hover:text-emerald-700' : 'text-emerald-400 group-hover:text-emerald-300'}`}>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </svg>
                  </button>
                  {/* Кнопка закрытия */}
                  <button
                    onClick={() => setSelectedTrackLyrics(null)}
                    className={`w-10 h-10 rounded-xl ${isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-gray-300' : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-white/20'} border flex items-center justify-center transition group`}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${isLight ? 'text-gray-500 group-hover:text-gray-600' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className={`flex-1 overflow-y-auto ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-black/30 border-white/5'} rounded-xl p-5 border shadow-inner`}>
                <pre className={`${isLight ? 'text-gray-700' : 'text-zinc-300'} text-sm whitespace-pre-wrap font-sans leading-relaxed`}>
                  {selectedTrackLyrics.lyrics}
                </pre>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Диалог подтверждения отправки - через portal для центрирования на экране */}
        {mounted && showConfirmDialog && createPortal(
          <div 
            className={`fixed inset-0 z-[99999] flex items-center justify-center ${isLight ? 'bg-black/40' : 'bg-black/70'} backdrop-blur-sm`}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}
          >
            <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-zinc-900 border-white/10'} border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-fade-up`}>
              <div className="text-center mb-6">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${isLight ? 'bg-amber-100' : 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'} flex items-center justify-center`}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={isLight ? 'text-amber-600' : 'text-amber-400'} strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <h3 className={`text-xl font-bold ${isLight ? 'text-gray-900' : 'text-white'} mb-2`}>Подтверждение отправки</h3>
                <p className={`${isLight ? 'text-gray-500' : 'text-zinc-400'} text-sm`}>
                  Вы уверены, что хотите отправить релиз на модерацию?
                </p>
              </div>
              
              <div className={`${isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'} border rounded-xl p-4 mb-6`}>
                <div className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`${isLight ? 'text-amber-600' : 'text-amber-400'} flex-shrink-0 mt-0.5`} strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/>
                    <line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div className={`text-sm ${isLight ? 'text-amber-800' : 'text-amber-200'}`}>
                    <p className="font-medium mb-1">Пожалуйста, проверьте:</p>
                    <ul className={`${isLight ? 'text-amber-700' : 'text-amber-300/80'} space-y-1`}>
                      <li>• Правильность названия релиза и имени артиста</li>
                      <li>• Качество обложки и аудиофайлов</li>
                      <li>• Корректность текстов песен</li>
                      <li>• Выбранные площадки и страны</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmDialog(false)}
                  className={`flex-1 px-5 py-3.5 ${isLight ? 'bg-gray-100 hover:bg-gray-200 border-gray-200 hover:border-gray-300 text-gray-700 hover:text-gray-900' : 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 hover:border-zinc-600 text-zinc-300 hover:text-white'} border rounded-xl font-bold transition`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Отмена
                  </span>
                </button>
                <button
                  onClick={async () => {
                    setShowConfirmDialog(false);
                    
                    setSubmitting(true);
                    
                    try {
                      if (!supabase) throw new Error('Supabase не инициализирован');
                      
                      const { data: { user } } = await supabase.auth.getUser();
                      if (!user) throw new Error('Пользователь не авторизован');
                
                // Загрузка обложки
                let coverUrl = existingCoverUrl || '';
                if (coverFile) {
                  const fileExt = coverFile.name.split('.').pop();
                  const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                  
                  const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('release-covers')
                    .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
                  
                  if (uploadError) throw uploadError;
                  
                  const { data: { publicUrl } } = supabase.storage
                    .from('release-covers')
                    .getPublicUrl(fileName);
                    
                  coverUrl = publicUrl;
                }
                
                // Загрузка аудиофайлов треков
                
                const tracksWithUrls = await Promise.all(tracks.map(async (track, index) => {
                  // Проверяем, что audioFile - это реальный File объект
                  const isValidFile = track.audioFile && 
                    track.audioFile instanceof File && 
                    track.audioFile.size > 0;
                  
                  if (isValidFile && track.audioFile) {
                    try {
                      const audioFileExt = track.audioFile.name.split('.').pop();
                      const audioFileName = `${user.id}/${Date.now()}-track-${index}.${audioFileExt}`;
                      
                      const { data: audioUploadData, error: audioUploadError } = await supabase!.storage
                        .from('release-audio')
                        .upload(audioFileName, track.audioFile, {
                          contentType: track.audioFile.type,
                          upsert: true
                        });
                      
                      if (audioUploadError) {
                        console.error(`Ошибка загрузки аудио для трека ${index}:`, audioUploadError);
                        // Продолжаем без URL, если ошибка
                        return {
                          title: track.title,
                          link: track.link || '',
                          hasDrugs: track.hasDrugs,
                          lyrics: track.lyrics,
                          language: track.language,
                          version: track.version,
                          producers: track.producers,
                          featuring: track.featuring,
                          authors: track.authors,
                          audioMetadata: track.audioMetadata,
                        };
                      }
                      
                      const { data: { publicUrl: audioUrl } } = supabase!.storage
                        .from('release-audio')
                        .getPublicUrl(audioFileName);
                      
                      return {
                        title: track.title,
                        link: audioUrl, // Записываем URL загруженного файла
                        audio_url: audioUrl, // Дублируем для совместимости
                        hasDrugs: track.hasDrugs,
                        lyrics: track.lyrics,
                        language: track.language,
                        version: track.version,
                        producers: track.producers,
                        featuring: track.featuring,
                        authors: track.authors,
                        audioMetadata: track.audioMetadata,
                      };
                    } catch (err) {
                      console.error(`Ошибка при загрузке аудио для трека ${index}:`, err);
                      return {
                        title: track.title,
                        link: track.link || '',
                        hasDrugs: track.hasDrugs,
                        lyrics: track.lyrics,
                        language: track.language,
                        version: track.version,
                        producers: track.producers,
                        featuring: track.featuring,
                        authors: track.authors,
                        audioMetadata: track.audioMetadata,
                      };
                    }
                  }
                  
                  // Если audioFile нет, возвращаем трек как есть (без File объекта)
                  return {
                    title: track.title,
                    link: track.link || '',
                    hasDrugs: track.hasDrugs,
                    lyrics: track.lyrics,
                    language: track.language,
                    version: track.version,
                    producers: track.producers,
                    featuring: track.featuring,
                    authors: track.authors,
                    audioMetadata: track.audioMetadata,
                  };
                                }));
                
                // Создание релиза в базе (Basic - платные релизы)
                const releaseData: any = {
                  user_id: user.id,
                  title: releaseTitle,
                  artist_name: artistName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Artist',
                  cover_url: coverUrl,
                  genre: genre,
                  subgenres: subgenres,
                  release_date: releaseDate,
                  collaborators: collaborators,
                  tracks: tracksWithUrls,
                  countries: countries,
                  contract_agreed: agreedToContract,
                  contract_agreed_at: agreedToContract ? new Date().toISOString() : null,
                  platforms: platforms,
                  focus_track: focusTrack,
                  focus_track_promo: focusTrackPromo,
                  album_description: albumDescription,
                  promo_photos: promoPhotos,
                  is_promo_skipped: promoStatus === 'skipped',
                  status: 'pending',
                  payment_status: 'verified', // Оплачено через баланс
                  payment_transaction_id: paymentTransactionId,
                  payment_amount: 500,
                };
                
                // Если есть draftId — обновляем существующий черновик (убираем статус draft)
                if (draftId) {
                  const { error: updateError } = await supabase
                    .from('releases_basic')
                    .update({ ...releaseData, status: 'pending', status_updated_at: new Date().toISOString(), updated_at: new Date().toISOString() })
                    .eq('id', draftId)
                    .eq('user_id', user.id)
                    .select();

                  if (updateError) {
                    throw updateError;
                  }
                  
                  // Сохраняем контрибьюторов если есть
                  if (contributors.length > 0) {
                    // Удаляем старых контрибьюторов
                    await supabase
                      .from('release_contributors')
                      .delete()
                      .eq('release_id', draftId)
                      .eq('release_type', 'basic');
                    
                    // Добавляем новых
                    const contributorsData = contributors.map(c => ({
                      release_id: draftId,
                      release_type: 'basic',
                      role: c.role,
                      full_name: c.fullName
                    }));
                    
                    const { error: contribError } = await supabase
                      .from('release_contributors')
                      .insert(contributorsData);
                    
                    if (contribError) {
                      // Некритичная ошибка - продолжаем
                    }
                  }
                } else {
                  const { data: newRelease, error: insertError } = await supabase
                    .from('releases_basic')
                    .insert(releaseData)
                    .select()
                    .single();

                  if (insertError) {
                    throw insertError;
                  }
                  
                  // Сохраняем контрибьюторов если есть
                  if (contributors.length > 0 && newRelease?.id) {
                    const contributorsData = contributors.map(c => ({
                      release_id: newRelease.id,
                      release_type: 'basic',
                      role: c.role,
                      full_name: c.fullName
                    }));
                    
                    const { error: contribError } = await supabase
                      .from('release_contributors')
                      .insert(contributorsData);
                    
                    if (contribError) {
                      // Некритичная ошибка - продолжаем
                    }
                  }
                  
                  // Проверяем custom_id
                  if (!newRelease?.custom_id) {
                    // custom_id не сгенерирован - некритично
                  }
                }
                
                // Удаляем возможные оставшиеся черновики с тем же названием (без риска удалить только что обновлённый релиз)
                try {
                  await supabase
                    .from('releases_basic')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('status', 'draft')
                    .eq('title', releaseTitle);
                } catch {
                  // Некритично - продолжаем
                }

                showSuccessToast('Релиз успешно отправлен на модерацию!', 5000);
                setSubmitSuccess(true);
                router.push('/cabinet');
              } catch (error: any) {
                showErrorToast('Ошибка при отправке релиза: ' + (error?.message || 'неизвестная ошибка'), 8000);
                setSubmitting(false); // Только при ошибке сбрасываем
              }
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Отправка...
                    </span>
                  ) : 'Да, отправить'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}
