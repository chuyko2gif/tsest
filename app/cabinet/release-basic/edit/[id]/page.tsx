"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '../../../lib/supabase';
import DepositModal from '@/app/cabinet/components/finance/DepositModal';
import { showSuccessToast as showToastSuccess, showErrorToast as showToastError } from '@/lib/utils/showToast';
import { TrackAuthor } from '@/components/ui/TrackAuthors';
import {
  ReleaseInfoStep,
  TracklistStep,
  CountriesStep,
  ContractStep,
  PlatformsStep,
  PromoStep,
  ReleaseTypeSelector,
} from '../../create/components';
import PaymentStep from '../../../release-basic/create/components/PaymentStep';
import SendStep from '../../../release-basic/create/components/SendStep';

// Fullscreen Loading Overlay для сохранения релиза
function FullscreenLoadingOverlay({ message = "Сохраняем релиз" }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
      {/* Мягкие фоновые круги */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative text-center max-w-md px-8">
        {/* Центральная анимация - виниловая пластинка */}
        <div className="relative mb-10">
          <div className="w-36 h-36 mx-auto relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }}></div>
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-2xl animate-spin" style={{ animationDuration: '3s' }}>
              <div className="absolute inset-2 rounded-full border border-zinc-700/50"></div>
              <div className="absolute inset-4 rounded-full border border-zinc-700/30"></div>
              <div className="absolute inset-6 rounded-full border border-zinc-700/20"></div>
              <div className="absolute inset-8 rounded-full border border-zinc-700/20"></div>
              <div className="absolute inset-10 rounded-full border border-zinc-700/30"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
              <div className="absolute inset-[40%] rounded-full bg-gradient-to-br from-violet-400/90 to-purple-600/90 flex items-center justify-center shadow-inner">
                <div className="w-2 h-2 bg-zinc-900 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-3">{message}</h3>
        <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
          Загружаем файлы и сохраняем данные<br/>
          <span className="text-zinc-600">Пожалуйста, не закрывайте страницу</span>
        </p>
        
        <div className="relative h-1 bg-zinc-800 rounded-full overflow-hidden mb-6 mx-8">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
            style={{ animation: 'loading-progress 2s ease-in-out infinite', width: '40%' }}
          ></div>
        </div>
        
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
}

// Компонент для редактирования Basic релиза
export default function EditBasicReleasePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const releaseId = params.id as string;
  const fromPage = searchParams.get('from') || 'cabinet'; // По умолчанию cabinet
  const isDraftModeFromUrl = searchParams.get('draft') === 'true'; // Режим редактирования черновика из URL
  const initialStep = searchParams.get('step') || 'release'; // Начальный шаг (по умолчанию release)

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);
  const [releaseStatus, setReleaseStatus] = useState('');
  
  // isDraftMode - true если это черновик ИЛИ релиз ожидающий оплаты
  const isDraftMode = isDraftModeFromUrl || releaseStatus === 'draft' || releaseStatus === 'awaiting_payment';
  
  // Release form state
  const [releaseTitle, setReleaseTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState('');
  const [genre, setGenre] = useState('');
  const [subgenres, setSubgenres] = useState<string[]>([]);
  const [subgenreInput, setSubgenreInput] = useState('');
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  const [releaseArtists, setReleaseArtists] = useState<string[]>([]); // Новый массив артистов
  const [contributors, setContributors] = useState<Array<{role: 'composer' | 'lyricist' | 'producer' | 'arranger' | 'performer' | 'mixer' | 'mastering' | 'other'; fullName: string}>>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [upc, setUpc] = useState('');
  
  // Tracklist state
  const [tracks, setTracks] = useState<Array<{
    title: string;
    link: string;
    audioFile?: File | null;
    audioMetadata?: { format: string; duration?: number; bitrate?: string; sampleRate?: string; size: number } | null;
    hasDrugs: boolean;
    lyrics: string;
    language: string;
    version?: string;
    producers?: string[];
    featuring?: string[];
    authors?: TrackAuthor[];
    isrc?: string;
    isInstrumental?: boolean;
    originalFileName?: string;
  }>>([]);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackLink, setTrackLink] = useState('');
  const [trackAudioFile, setTrackAudioFile] = useState<File | null>(null);
  const [trackAudioMetadata, setTrackAudioMetadata] = useState<{ format: string; duration?: number; bitrate?: string; sampleRate?: string; size: number } | null>(null);
  const [trackAuthors, setTrackAuthors] = useState<TrackAuthor[]>([]);
  const [trackHasDrugs, setTrackHasDrugs] = useState(false);
  const [trackLyrics, setTrackLyrics] = useState('');
  const [trackLanguage, setTrackLanguage] = useState('');
  const [trackVersion, setTrackVersion] = useState('');
  const [trackProducers, setTrackProducers] = useState<string[]>([]);
  const [trackFeaturing, setTrackFeaturing] = useState<string[]>([]);
  const [trackIsInstrumental, setTrackIsInstrumental] = useState(false);
  const [releaseType, setReleaseType] = useState<'single' | 'ep' | 'album' | null>(null);
  const [selectedTracksCount, setSelectedTracksCount] = useState<number | undefined>(undefined);
  
  // Countries state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  
  // Contract state
  const [agreedToContract, setAgreedToContract] = useState(false);
  
  // Platforms state
  const [selectedPlatforms, setSelectedPlatforms] = useState(0);
  const [selectedPlatformsList, setSelectedPlatformsList] = useState<string[]>([]);
  
  // Promo state
  const [focusTrack, setFocusTrack] = useState('');
  const [focusTrackPromo, setFocusTrackPromo] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [promoPhotos, setPromoPhotos] = useState<string[]>([]);
  const [promoStatus, setPromoStatus] = useState<'not-started' | 'skipped' | 'filled'>('not-started');
  
  const [saving, setSaving] = useState(false);
  const [isPayingLater, setIsPayingLater] = useState(false); // Отдельное состояние для "Оплатить позже"
  const [mounted, setMounted] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [lastAutoSave, setLastAutoSave] = useState<string | null>(null);
  const [autoSaveMessage, setAutoSaveMessage] = useState('');
  
  // Mount effect для portal
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Payment state - через баланс
  const [userId, setUserId] = useState<string | null>(null);
  const [paymentTransactionId, setPaymentTransactionId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false); // Флаг оплаченности релиза
  const [showDepositModal, setShowDepositModal] = useState(false);

  useEffect(() => {
    loadRelease();
  }, [releaseId]);
  
  // Предупреждение при попытке уйти со страницы с несохранёнными данными
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Предупреждаем если есть несохранённая оплата
      if (isPaid && !paymentTransactionId) {
        e.preventDefault();
        e.returnValue = 'У вас есть оплаченный релиз, который ещё не сохранён. Вы уверены, что хотите уйти?';
        return e.returnValue;
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isPaid, paymentTransactionId]);

  // Функция для получения текущего состояния завершённости шагов
  const getStepsCompletionState = useCallback(() => {
    return {
      release: !!(releaseTitle.trim() && genre && releaseDate && (coverFile || existingCoverUrl)),
      tracklist: tracks.length > 0,
      countries: selectedCountries.length > 0,
      contract: agreedToContract,
      platforms: selectedPlatforms > 0,
      promo: !!((focusTrack && focusTrackPromo) || albumDescription)
    };
  }, [releaseTitle, genre, releaseDate, coverFile, existingCoverUrl, tracks.length, selectedCountries.length, agreedToContract, selectedPlatforms, focusTrack, focusTrackPromo, albumDescription]);

  // Ref для хранения предыдущего состояния шагов
  const prevStepsRef = useRef<Record<string, boolean> | null>(null);
  const isInitialLoadRef = useRef(true);
  const dataLoadedAtRef = useRef<number | null>(null);

  // Автосохранение при завершении шага
  useEffect(() => {
    if (!isDraftMode || releaseStatus !== 'draft' || loading || !userId || !releaseId) return;
    
    const currentSteps = getStepsCompletionState();
    
    // Пропускаем первую загрузку
    if (isInitialLoadRef.current) {
      prevStepsRef.current = currentSteps;
      isInitialLoadRef.current = false;
      dataLoadedAtRef.current = Date.now();
      return;
    }
    
    // Защита от слишком раннего автосохранения (ждём 2 секунды после загрузки)
    if (dataLoadedAtRef.current && Date.now() - dataLoadedAtRef.current < 2000) {
      prevStepsRef.current = currentSteps;
      return;
    }
    
    // Проверяем, был ли какой-то шаг только что завершён
    if (prevStepsRef.current) {
      const stepNames: Record<string, string> = {
        release: 'Релиз',
        tracklist: 'Треклист',
        countries: 'Страны',
        contract: 'Договор',
        platforms: 'Площадки',
        promo: 'Промо'
      };
      
      for (const [stepId, isComplete] of Object.entries(currentSteps)) {
        const wasComplete = prevStepsRef.current[stepId];
        // Если шаг был не завершён, а теперь завершён - сохраняем
        if (!wasComplete && isComplete) {
          handleAutoSave(stepNames[stepId]);
          break; // Сохраняем только один раз за изменение
        }
      }
    }
    
    prevStepsRef.current = currentSteps;
  }, [getStepsCompletionState, isDraftMode, releaseStatus, loading, userId, releaseId]);

  // Ref для отслеживания предыдущего значения promoStatus
  const prevPromoStatusRef = useRef<string | null>(null);

  // Автосохранение при изменении promoStatus (skip/filled)
  useEffect(() => {
    if (!isDraftMode || releaseStatus !== 'draft' || loading || !userId || !releaseId) return;
    
    // Пропускаем первую загрузку
    if (prevPromoStatusRef.current === null) {
      prevPromoStatusRef.current = promoStatus;
      return;
    }
    
    // Если статус изменился - сохраняем
    if (prevPromoStatusRef.current !== promoStatus) {
      handleAutoSave('Промо');
      prevPromoStatusRef.current = promoStatus;
    }
  }, [promoStatus, isDraftMode, releaseStatus, loading, userId, releaseId]);

  // Ref для отслеживания предыдущего количества треков и авторов
  const prevTracksCountRef = useRef<number | null>(null);
  const prevContributorsCountRef = useRef<number | null>(null);
  const isDataLoadedRef = useRef(false);
  const prevTracksAudioRef = useRef<string>('');

  // Автосохранение при изменении аудиофайлов в треках
  useEffect(() => {
    if (!isDraftMode || releaseStatus !== 'draft' || loading || !userId || !releaseId) return;
    
    // Создаём "подпись" аудиофайлов (названия файлов)
    const audioSignature = tracks.map(t => (t as any).audioFile?.name || t.link || t.originalFileName || '').join('|');
    
    // Пропускаем первую загрузку
    if (!prevTracksAudioRef.current) {
      prevTracksAudioRef.current = audioSignature;
      return;
    }
    
    // Защита от слишком раннего автосохранения
    if (dataLoadedAtRef.current && Date.now() - dataLoadedAtRef.current < 2000) {
      prevTracksAudioRef.current = audioSignature;
      return;
    }
    
    // Если аудио изменилось - сохраняем
    if (prevTracksAudioRef.current !== audioSignature) {
      handleAutoSave('Треклист (аудио)');
      prevTracksAudioRef.current = audioSignature;
    }
  }, [tracks, isDraftMode, releaseStatus, loading, userId, releaseId]);

  // Автосохранение при изменении треков
  useEffect(() => {
    // Не сохраняем пока данные не загружены полностью
    if (!isDraftMode || releaseStatus !== 'draft' || loading || !userId || !releaseId) return;
    
    // Пропускаем первую загрузку - ждём пока данные реально загрузятся
    if (prevTracksCountRef.current === null) {
      prevTracksCountRef.current = tracks.length;
      // Отмечаем что данные загружены только если есть хоть какие-то данные
      // или если это действительно пустой релиз
      isDataLoadedRef.current = true;
      return;
    }
    
    // Защита от слишком раннего автосохранения (ждём 2 секунды после загрузки)
    if (dataLoadedAtRef.current && Date.now() - dataLoadedAtRef.current < 2000) {
      prevTracksCountRef.current = tracks.length;
      return;
    }
    
    // Защита от сохранения пустых треков если раньше были треки
    if (prevTracksCountRef.current > 0 && tracks.length === 0) {
      return;
    }
    
    // Если количество треков изменилось - сохраняем
    if (prevTracksCountRef.current !== tracks.length) {
      handleAutoSave('Треклист');
      prevTracksCountRef.current = tracks.length;
    }
  }, [tracks.length, isDraftMode, releaseStatus, loading, userId, releaseId]);

  // Автосохранение при изменении авторов
  useEffect(() => {
    if (!isDraftMode || releaseStatus !== 'draft' || loading || !userId || !releaseId) return;
    
    // Пропускаем первую загрузку
    if (prevContributorsCountRef.current === null) {
      prevContributorsCountRef.current = contributors.length;
      return;
    }
    
    // Если количество авторов изменилось - сохраняем
    if (prevContributorsCountRef.current !== contributors.length) {
      handleAutoSave('Авторы');
      prevContributorsCountRef.current = contributors.length;
    }
  }, [contributors.length, isDraftMode, releaseStatus, loading, userId, releaseId]);

  // Функция автосохранения (без редиректа)
  const handleAutoSave = async (stepName: string) => {
    if (!supabase || !releaseId || !userId || saving) return;
    
    const sb = supabase; // local alias for TypeScript
    try {
      // Загружаем обложку если есть новая
      let coverUrl = existingCoverUrl;
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await sb.storage
          .from('release-covers')
          .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
        
        if (!uploadError) {
          const { data: { publicUrl } } = sb.storage
            .from('release-covers')
            .getPublicUrl(fileName);
          coverUrl = publicUrl;
          setExistingCoverUrl(publicUrl);
          setCoverFile(null);
        }
      }
      
      // Подготавливаем треки для сохранения - загружаем аудио файлы если есть
      
      const tracksForSave = await Promise.all(tracks.map(async (track, index) => {
        let audioUrl = track.link || '';
        let originalFileName = track.originalFileName || '';
        
        // Если есть новый аудио файл - ВСЕГДА загружаем его (даже если есть старый link)
        const hasAudioFile = !!(track as any).audioFile;
        
        if (hasAudioFile) {
          try {
            const audioFile = (track as any).audioFile as File;
            const audioExt = audioFile.name.split('.').pop();
            const audioFileName = `${userId}/track-${Date.now()}-${index}.${audioExt}`;
            
            const { error: audioError } = await sb.storage
              .from('release-audio')
              .upload(audioFileName, audioFile, { contentType: audioFile.type, upsert: true });
            
            if (!audioError) {
              const { data: { publicUrl } } = sb.storage
                .from('release-audio')
                .getPublicUrl(audioFileName);
              audioUrl = publicUrl;
              originalFileName = audioFile.name;
            } else {
              // Если загрузка не удалась, сохраняем хотя бы originalFileName
              originalFileName = audioFile.name || originalFileName;
            }
          } catch {
            // Ошибка загрузки аудио
          }
        }
        
        return {
          title: track.title,
          link: audioUrl,
          hasDrugs: track.hasDrugs || false,
          lyrics: track.lyrics || '',
          language: track.language || '',
          version: track.version || '',
          producers: track.producers || [],
          featuring: track.featuring || [],
          isrc: track.isrc || '',
          isInstrumental: track.isInstrumental || false,
          audioMetadata: track.audioMetadata || null,
          originalFileName: originalFileName,
        };
      }));
      
      const { error: updateError } = await supabase
        .from('releases_basic')
        .update({
          title: releaseTitle,
          artist_name: releaseArtists.length > 0 ? releaseArtists[0] : artistName,
          genre: genre,
          subgenres: subgenres,
          release_date: releaseDate,
          collaborators: releaseArtists.length > 1 ? releaseArtists.slice(1) : collaborators,
          contributors: contributors.length > 0 ? contributors : null,
          release_artists: releaseArtists.length > 0 ? releaseArtists : null,
          tracks: tracksForSave,
          countries: selectedCountries,
          contract_agreed: agreedToContract,
          platforms: selectedPlatformsList,
          focus_track: focusTrack,
          focus_track_promo: focusTrackPromo,
          album_description: albumDescription,
          promo_photos: promoPhotos,
          is_promo_skipped: promoStatus === 'skipped',
          cover_url: coverUrl,
          release_type: releaseType,
          updated_at: new Date().toISOString()
        })
        .eq('id', releaseId)
        .eq('user_id', userId);
      
      if (!updateError) {
        // Обновляем tracks state с загруженными URL (чтобы не загружать повторно)
        const updatedTracks = tracks.map((track, index) => {
          const savedTrack = tracksForSave[index];
          if (savedTrack.link && savedTrack.link !== track.link) {
            return {
              ...track,
              link: savedTrack.link,
              originalFileName: savedTrack.originalFileName,
              audioFile: undefined // Убираем File объект
            };
          }
          return track;
        });
        
        // Проверяем, изменились ли треки
        const hasChanges = updatedTracks.some((t, i) => t.link !== tracks[i].link);
        if (hasChanges) {
          setTracks(updatedTracks);
        }
        
        setAutoSaveMessage(`✓ Шаг "${stepName}" сохранён`);
        setLastAutoSave(new Date().toISOString());
        setTimeout(() => setAutoSaveMessage(''), 3000);
      }
    } catch (error) {
      console.error('Ошибка автосохранения:', error);
    }
  };

  const loadRelease = async () => {
    if (!supabase || !releaseId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }
      
      // Сохраняем userId
      setUserId(user.id);

      // Получаем профиль для nickname и проверяем роль
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, role')
        .eq('id', user.id)
        .single();
      
      const userIsAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'owner';
      setIsAdmin(userIsAdmin);

      // Загружаем релиз - админы могут загружать любые релизы
      let query = supabase
        .from('releases_basic')
        .select('*')
        .eq('id', releaseId);
      
      // Обычные пользователи могут загружать только свои релизы
      if (!userIsAdmin) {
        query = query.eq('user_id', user.id);
      }
      
      const { data: release, error } = await query.single();

      if (error || !release) {
        alert('Релиз не найден или у вас нет прав на его редактирование');
        router.push(userIsAdmin ? '/admin' : '/cabinet');
        return;
      }

      // Обычные пользователи могут редактировать только pending, draft и awaiting_payment релизы
      // Админы могут редактировать любые релизы
      const editableStatuses = ['pending', 'draft', 'awaiting_payment'];
      if (!userIsAdmin && !editableStatuses.includes(release.status)) {
        alert('Редактирование возможно только для релизов на модерации, черновиков или ожидающих оплаты');
        router.push('/cabinet');
        return;
      }

      // Заполняем форму данными релиза
      setReleaseTitle(release.title || '');
      setArtistName(release.artist_name || '');
      setExistingCoverUrl(release.cover_url || '');
      setGenre(release.genre || '');
      setSubgenres(release.subgenres || []);
      setReleaseDate(release.release_date || null);
      setCollaborators(release.collaborators || []);
      setContributors(release.contributors || []);
      
      // Восстанавливаем releaseArtists
      if (release.release_artists && Array.isArray(release.release_artists)) {
        setReleaseArtists(release.release_artists);
      } else if (release.artist_name) {
        // Fallback: создаём массив из artist_name + collaborators
        const artists = [release.artist_name];
        if (release.collaborators && release.collaborators.length > 0) {
          artists.push(...release.collaborators);
        }
        setReleaseArtists(artists);
      }
      
      setTracks(release.tracks || []);
      
      setSelectedCountries(release.countries || []);
      setAgreedToContract(release.contract_agreed || false);
      setSelectedPlatformsList(release.platforms || []);
      setSelectedPlatforms((release.platforms || []).length);
      setFocusTrack(release.focus_track || '');
      setFocusTrackPromo(release.focus_track_promo || '');
      setAlbumDescription(release.album_description || '');
      setPromoPhotos(release.promo_photos || []);
      setReleaseStatus(release.status || '');
      setUpc(release.upc || '');
      
      // Загружаем ID транзакции оплаты (если оплачено через баланс)
      if (release.payment_transaction_id) {
        setPaymentTransactionId(release.payment_transaction_id);
      }
      
      // Загружаем статус оплаты
      if (release.is_paid) {
        setIsPaid(true);
      }
      
      // Определяем статус промо на основе данных
      // 1. Если есть данные промо (фото, описание, фокус-трек) - filled
      // 2. Если is_promo_skipped = true - skipped  
      // 3. Для релизов на модерации/одобренных без промо-данных - skipped (промо обязателен для отправки)
      // 4. Иначе - not-started
      if (release.focus_track || (release.promo_photos && release.promo_photos.length > 0) || release.album_description) {
        setPromoStatus('filled');
      } else if (release.is_promo_skipped) {
        setPromoStatus('skipped');
      } else if (['pending', 'approved', 'rejected', 'distributed'].includes(release.status)) {
        // Для отправленных релизов без промо-данных - значит промо был пропущен
        setPromoStatus('skipped');
      } else {
        // Для черновиков без флага - считаем не начатым
        setPromoStatus('not-started');
      }
      
      // Загружаем тип релиза из БД (если есть)
      if (release.release_type) {
        setReleaseType(release.release_type as 'single' | 'ep' | 'album');
      } else {
        // Фолбэк: определяем тип релиза на основе количества треков
        const tracksCount = (release.tracks || []).length;
        if (tracksCount === 1) {
          setReleaseType('single');
        } else if (tracksCount >= 2 && tracksCount <= 7) {
          setReleaseType('ep');
        } else if (tracksCount >= 8) {
          setReleaseType('album');
        }
      }
      
      // Загружаем выбранное количество треков
      if (release.selected_tracks_count) {
        setSelectedTracksCount(release.selected_tracks_count);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки релиза:', error);
      alert('Ошибка загрузки релиза');
      router.push(isAdmin ? '/admin' : '/cabinet');
    }
  };

  const handleSave = async (submitToModeration = false) => {
    if (!supabase || !releaseId) return;
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      // Если загружена новая обложка, загружаем её
      let coverUrl = existingCoverUrl; // Сохраняем существующую обложку
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase!.storage
          .from('release-covers')
          .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase!.storage
          .from('release-covers')
          .getPublicUrl(fileName);
          
        coverUrl = publicUrl;
      }

      // Загрузка новых аудиофайлов треков
      const tracksWithUrls = await Promise.all(tracks.map(async (track: any, index: number) => {
        // Если есть новый audioFile, загружаем его
        if (track.audioFile && track.audioFile instanceof File) {
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
              // Возвращаем трек с существующим link
              const { audioFile, ...trackWithoutFile } = track;
              return trackWithoutFile;
            }
            
            const { data: { publicUrl: audioUrl } } = supabase!.storage
              .from('release-audio')
              .getPublicUrl(audioFileName);
            
            // Возвращаем трек с новым URL (без audioFile)
            const { audioFile, ...trackWithoutFile } = track;
            return {
              ...trackWithoutFile,
              link: audioUrl,
              audio_url: audioUrl,
              originalFileName: track.audioFile?.name || track.originalFileName || '',
            };
          } catch {
            const { audioFile, ...trackWithoutFile } = track;
            return {
              ...trackWithoutFile,
              originalFileName: track.audioFile?.name || track.originalFileName || '',
            };
          }
        }
        
        // Убираем audioFile из объекта (если есть) перед сохранением в БД
        if (track.audioFile) {
          const { audioFile, ...trackWithoutFile } = track;
          return {
            ...trackWithoutFile,
            originalFileName: track.audioFile?.name || track.originalFileName || '',
          };
        }
        
        return track;
      }));

      // Обновляем релиз
      const updateData: any = {
        title: releaseTitle,
        artist_name: releaseArtists.length > 0 ? releaseArtists[0] : artistName,
        genre: genre,
        subgenres: subgenres,
        release_date: releaseDate,
        collaborators: releaseArtists.length > 1 ? releaseArtists.slice(1) : collaborators,
        contributors: contributors.length > 0 ? contributors : null,
        release_artists: releaseArtists.length > 0 ? releaseArtists : null,
        release_type: releaseType,
        tracks: tracksWithUrls,
        countries: selectedCountries,
        contract_agreed: agreedToContract,
        contract_agreed_at: agreedToContract ? new Date().toISOString() : null,
        platforms: selectedPlatformsList,
        focus_track: focusTrack,
        focus_track_promo: focusTrackPromo,
        album_description: albumDescription,
        promo_photos: promoPhotos,
        is_promo_skipped: promoStatus === 'skipped',
        updated_at: new Date().toISOString()
      };
      
      // ТОЛЬКО при отправке на модерацию меняем статус draft -> pending
      if (submitToModeration && releaseStatus === 'draft') {
        updateData.status = 'pending';
      }
      
      // Всегда сохраняем cover_url (или существующий, или новый)
      if (coverUrl) {
        updateData.cover_url = coverUrl;
      }

      // Обновляем релиз - админы могут обновлять любые релизы
      let updateQuery: any = supabase
        .from('releases_basic')
        .update(updateData)
        .eq('id', releaseId);
      
      // Обычные пользователи могут обновлять только свои релизы
      if (!isAdmin) {
        updateQuery = updateQuery.eq('user_id', user.id);
      }
      
      // select() ДОЛЖЕН быть последним в цепочке
      updateQuery = updateQuery.select();
      
      const { error, data } = await updateQuery;

      if (error) {
        alert('Ошибка сохранения: ' + error.message);
        throw error;
      }

      setIsFadingOut(false);
      setShowSuccessToast(true);
      setTimeout(() => setIsFadingOut(true), 1000);
      setTimeout(() => {
        setShowSuccessToast(false);
        const redirectPath = fromPage === 'admin' ? '/admin' : '/cabinet';
        router.push(redirectPath);
      }, 1400);
    } catch (error: any) {
      alert('Ошибка при сохранении релиза: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setSaving(false);
    }
  };

  // Обработчик "Оплатить позже" - сохраняет релиз со статусом awaiting_payment
  const handlePayLater = async () => {
    if (!supabase || !releaseId || !userId) return;
    
    if (!canProceedToPayment) {
      alert('Заполните все обязательные поля');
      return;
    }
    
    setIsPayingLater(true);
    try {
      // Загружаем обложку если есть новая
      let coverUrl = existingCoverUrl;
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('release-covers')
          .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('release-covers')
            .getPublicUrl(fileName);
          coverUrl = publicUrl;
        }
      }
      
      // Обновляем релиз со статусом awaiting_payment
      // Расчёт стоимости в зависимости от типа релиза
      const paymentAmount = releaseType === 'single' ? 500 : releaseType === 'ep' ? 1000 : releaseType === 'album' ? 1500 : 500;
      
      const { error: updateError } = await supabase
        .from('releases_basic')
        .update({
          title: releaseTitle,
          artist_name: releaseArtists.length > 0 ? releaseArtists[0] : artistName,
          genre: genre,
          subgenres: subgenres,
          release_date: releaseDate,
          collaborators: releaseArtists.length > 1 ? releaseArtists.slice(1) : collaborators,
          release_artists: releaseArtists.length > 0 ? releaseArtists : null,
          tracks: tracks,
          countries: selectedCountries,
          contract_agreed: agreedToContract,
          platforms: selectedPlatformsList,
          focus_track: focusTrack,
          focus_track_promo: focusTrackPromo,
          album_description: albumDescription,
          promo_photos: promoPhotos,
          cover_url: coverUrl,
          release_type: releaseType,
          status: 'awaiting_payment',
          payment_status: 'pending',
          payment_amount: paymentAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', releaseId)
        .eq('user_id', userId);
      
      if (updateError) throw updateError;
      
      setIsFadingOut(false);
      setShowSuccessToast(true);
      setTimeout(() => setIsFadingOut(true), 1000);
      setTimeout(() => {
        setShowSuccessToast(false);
        router.push('/cabinet');
      }, 1400);
    } catch (error: any) {
      console.error('Ошибка сохранения:', error);
      alert('Ошибка: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setIsPayingLater(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="text-zinc-600 animate-pulse relative z-10">Загрузка релиза...</div>
      </div>
    );
  }

  // Минимальное количество треков в зависимости от типа релиза
  const getMinTracks = (type: typeof releaseType): number => {
    if (type === 'ep') return 2;
    if (type === 'album') return 8;
    return 1; // single
  };

  // Проверка заполненности каждого шага
  const isStepComplete = (stepId: string): boolean => {
    switch(stepId) {
      case 'release':
        return !!(releaseTitle.trim() && genre && releaseDate && (coverFile || existingCoverUrl));
      case 'tracklist':
        return tracks.length >= getMinTracks(releaseType);
      case 'countries':
        return selectedCountries.length > 0;
      case 'contract':
        return agreedToContract;
      case 'platforms':
        return selectedPlatforms > 0;
      case 'promo':
        // Промо считается завершенным если: пропущен ИЛИ заполнены фокус-трек с описанием ИЛИ описание альбома
        return promoStatus === 'skipped' || promoStatus === 'filled' || !!(
          (focusTrack && focusTrackPromo) || 
          albumDescription
        );
      case 'payment':
        return !!paymentTransactionId || isPaid;
      case 'send':
        return false; // Финальный шаг
      default:
        return false;
    }
  };

  // Базовые шаги
  const baseSteps = [
    { id: 'release', label: 'Релиз', icon: '1' },
    { id: 'tracklist', label: 'Треклист', icon: '2' },
    { id: 'countries', label: 'Страны', icon: '3' },
    { id: 'contract', label: 'Договор', icon: '4' },
    { id: 'platforms', label: 'Площадки', icon: '5' },
    { id: 'promo', label: 'Промо', icon: '6' },
  ];
  
  // Для черновиков и релизов ожидающих оплаты добавляем шаги оплаты и отправки
  const canShowPaymentSteps = isDraftMode && (releaseStatus === 'draft' || releaseStatus === 'awaiting_payment');
  const steps = canShowPaymentSteps
    ? [...baseSteps, { id: 'payment', label: 'Оплата', icon: '₽' }, { id: 'send', label: 'Отправка', icon: '✈' }]
    : baseSteps;

  // Подсчёт заполненных шагов (все 6 базовых шагов, promo считается заполненным если skipped или filled)
  const completedSteps = baseSteps.filter(step => isStepComplete(step.id)).length;
  const totalSteps = baseSteps.length; // 6 шагов
  const progress = (completedSteps / totalSteps) * 100;

  // Плавный градиент от красного через оранжевый/желтый к зелёному (6 шагов)
  const getProgressColor = () => {
    if (completedSteps === 0) return { from: '#ef4444', to: '#dc2626' }; // red
    if (completedSteps === 1) return { from: '#f97316', to: '#ea580c' }; // orange
    if (completedSteps === 2) return { from: '#fbbf24', to: '#f59e0b' }; // amber
    if (completedSteps === 3) return { from: '#facc15', to: '#eab308' }; // yellow
    if (completedSteps === 4) return { from: '#a3e635', to: '#84cc16' }; // lime
    if (completedSteps === 5) return { from: '#4ade80', to: '#22c55e' }; // green-light
    return { from: '#10b981', to: '#059669' }; // emerald (6/6)
  };

  const progressColor = getProgressColor();
  
  // Проверка можно ли перейти к оплате (все обязательные шаги заполнены)
  const canProceedToPayment = !!(
    releaseTitle.trim() && 
    genre && 
    releaseDate &&
    (coverFile || existingCoverUrl) && 
    tracks.length >= getMinTracks(releaseType) && 
    selectedCountries.length > 0 &&
    agreedToContract && 
    selectedPlatforms > 0
  );

  // Шаг выбора типа релиза для черновиков (заблокирован после оплаты)
  if (isDraftMode && (releaseStatus === 'draft' || releaseStatus === 'awaiting_payment') && currentStep === 'type') {
    // Если статус не draft/awaiting_payment, значит уже оплачено - нельзя менять тип
    // (но это условие уже в if выше, поэтому здесь можно сразу показывать селектор)
    return (
      <ReleaseTypeSelector 
        onSelectType={async (type: 'single' | 'ep' | 'album') => {
          setReleaseType(type);
          // Очищаем треки если меняем тип и их больше чем разрешено
          if (type === 'single' && tracks.length > 1) {
            setTracks([tracks[0]]); // Оставляем только первый трек
          }
          // Сохраняем тип релиза в БД
          if (supabase && releaseId) {
            await supabase
              .from('releases_basic')
              .update({ release_type: type, updated_at: new Date().toISOString() })
              .eq('id', releaseId);
          }
          setCurrentStep('release');
        }}
        onBack={() => setCurrentStep('release')}
      />
    );
  }

  return (
    <>
      {/* Full-screen loading overlay только для "Оплатить позже" */}
      {mounted && isPayingLater && createPortal(<FullscreenLoadingOverlay message="Сохраняем релиз" />, document.body)}
      
      {/* Модалка пополнения баланса */}
      {showDepositModal && userId && (
        <DepositModal
          userId={userId}
          onClose={() => setShowDepositModal(false)}
          showNotification={(message, type) => {
            if (type === 'success') {
              showToastSuccess(message);
            } else {
              showToastError(message);
            }
          }}
        />
      )}
      
      {/* Мобильная кнопка назад - рендерится через Portal в body */}
      {mounted && createPortal(
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push(fromPage === 'admin' ? '/admin' : '/cabinet');
          }}
          style={{ 
            position: 'fixed',
            top: 'max(0.5rem, env(safe-area-inset-top))', 
            left: '0.5rem', 
            zIndex: 99999,
            willChange: 'transform',
            isolation: 'isolate'
          }}
          className={`lg:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-xl backdrop-blur-sm pointer-events-auto touch-manipulation active:scale-95 ${isLight ? 'bg-white/90 hover:bg-gray-100/90 border-gray-200' : 'bg-zinc-900/90 hover:bg-zinc-800/90 border-white/20'} border`}
          title="В кабинет"
          aria-label="Вернуться в кабинет"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`pointer-events-none ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>,
        document.body
      )}
      
      <div className={`min-h-screen pt-16 sm:pt-20 relative z-10 ${isLight ? 'text-gray-900' : 'text-white'}`}>
        <AnimatedBackground />
        
        <div className="max-w-[1600px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-stretch relative z-10">
        
          {/* Боковая панель с шагами - Glassmorphism (как в создании релиза) - только для десктопа */}
          <aside className={`hidden lg:flex lg:w-64 w-full backdrop-blur-xl border rounded-3xl p-6 pb-8 flex-col lg:self-start lg:sticky lg:top-24 shadow-2xl relative overflow-hidden ${isLight ? 'bg-[rgba(255,255,255,0.45)] border-white/60 shadow-purple-500/10' : 'bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-white/10 shadow-black/20'}`}>
            {/* Декоративный градиент */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
            {/* Заголовок с кнопкой назад */}
            <div className="mb-4 relative z-10">
              <div className="flex items-center justify-between mb-2">
                <h3 className={`font-bold text-lg bg-gradient-to-r bg-clip-text text-transparent ${isLight ? 'from-[#2a2550] to-[#4a4570]' : 'from-white to-zinc-300'}`}>
                  {isDraftMode ? 'Черновик' : 'Редактирование'}
                </h3>
                <button
                  onClick={() => router.push(fromPage === 'admin' ? '/admin' : '/cabinet')}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all group/back ${isLight ? 'bg-purple-100/50 hover:bg-purple-200/50 border border-purple-200 hover:border-purple-300' : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'}`}
                  title="В кабинет"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-colors ${isLight ? 'text-purple-500 group-hover/back:text-purple-700' : 'text-zinc-400 group-hover/back:text-white'}`}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
              <p className={`text-xs ${isLight ? 'text-[#5a5580]' : 'text-zinc-400'}`}>Basic Plan</p>
            </div>
          
            {/* Индикатор типа релиза */}
            {releaseType && (
              <div className={`mb-3 p-3 backdrop-blur-lg border rounded-xl relative overflow-hidden group transition-all ${isLight ? 'bg-gradient-to-br from-purple-100/50 via-purple-50/50 to-blue-100/50 border-purple-200 hover:border-purple-300' : 'bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-blue-500/20 border-white/20 hover:border-white/30'}`}>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Формат</span>
                    {/* Кнопка изменения типа - скрыта если есть оплата */}
                    {canShowPaymentSteps && !paymentTransactionId && (
                      <button
                        onClick={() => setCurrentStep('type')}
                        className="flex items-center gap-1 px-2 py-0.5 backdrop-blur-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 hover:border-purple-400/60 rounded-lg text-[10px] font-semibold text-purple-300 hover:text-purple-200 transition-all"
                        title="Изменить тип релиза"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                  {/* Индикатор блокировки если оплачено */}
                  {paymentTransactionId && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1" title="Тип заблокирован после оплаты">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </svg>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Иконка типа */}
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                    releaseType === 'single' ? 'bg-purple-500/20' :
                    releaseType === 'ep' ? 'bg-blue-500/20' :
                    'bg-emerald-500/20'
                  }`}>
                    {releaseType === 'single' && (
                      <svg className="w-3 h-3 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                    )}
                    {releaseType === 'ep' && (
                      <svg className="w-3 h-3 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                    {releaseType === 'album' && (
                      <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Текст */}
                  <div className="flex-1">
                    <div className={`font-bold text-sm ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      {releaseType === 'single' && 'Сингл'}
                      {releaseType === 'ep' && 'EP'}
                      {releaseType === 'album' && 'Альбом'}
                    </div>
                    <div className={`text-[10px] font-medium ${
                      releaseType === 'single' ? 'text-purple-400' :
                      releaseType === 'ep' ? 'text-blue-400' :
                      'text-emerald-400'
                    }`}>
                      {releaseType === 'single' && '1 трек'}
                      {releaseType === 'ep' && '2-7 треков'}
                      {releaseType === 'album' && '8-50 треков'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2 relative z-10">
            {steps.map((step) => {
              const isComplete = isStepComplete(step.id);
              const isCurrent = currentStep === step.id;
              const isPromoSkipped = step.id === 'promo' && promoStatus === 'skipped';
              const isPromoFilled = step.id === 'promo' && promoStatus === 'filled';
              
              return (
                <button 
                  key={step.id} 
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 transition-all relative overflow-hidden group/step ${
                    isCurrent 
                      ? isLight
                        ? 'bg-purple-500/20 text-purple-700 border border-purple-300/50'
                        : 'backdrop-blur-md bg-gradient-to-r from-purple-500/40 to-purple-600/40 text-white shadow-lg shadow-purple-500/30 border border-white/20'
                      : isLight
                        ? 'bg-purple-50/50 text-[#5a5580] hover:bg-purple-100/50 border border-transparent'
                        : 'backdrop-blur-sm bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent hover:border-white/10'
                  }`}
                >
                  {/* Hover эффект */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/10 to-purple-500/0 opacity-0 group-hover/step:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 flex items-center gap-3 w-full">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isPromoFilled ? 'bg-emerald-500/20 text-emerald-400' :
                    isPromoSkipped ? 'bg-yellow-500/20 text-yellow-400' :
                    isComplete && step.id !== 'send' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'
                  }`}>
                    {(isComplete || isPromoSkipped || isPromoFilled) && step.id !== 'send' ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                      </svg>
                    ) : step.id === 'send' ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </span>
                  <span className="text-sm font-medium">{step.label}</span>
                  {isPromoSkipped && (
                    <span className="ml-auto text-[10px] text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">Пропущено</span>
                  )}
                  {isCurrent && !isPromoSkipped && (
                    <span className={`ml-auto w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-purple-500 shadow-lg shadow-purple-500/50' : 'bg-white shadow-lg shadow-white/50'}`} />
                  )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Прогресс */}
          <div className={`mt-auto pt-4 sm:pt-6 border-t px-1 ${isLight ? 'border-purple-200/50' : 'border-white/10'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-medium ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Прогресс</span>
              <div className="flex items-center font-mono text-sm leading-none">
                <span 
                  className="font-bold transition-colors duration-500 drop-shadow-sm" 
                  style={{ color: progressColor.from, textShadow: `0 0 8px ${progressColor.from}60` }}
                >
                  {completedSteps}
                </span>
                <span className={`mx-0.5 ${isLight ? 'text-gray-400' : 'text-zinc-500'}`}>/</span>
                <span className={`font-bold ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>{totalSteps}</span>
              </div>
            </div>
            
            {/* Сегментированный прогресс-бар с красивым свечением */}
            <div className="relative">
              {/* Свечение под прогресс-баром */}
              {completedSteps > 0 && (
                <div 
                  className="absolute -inset-1 rounded-xl blur-md opacity-40 transition-all duration-700"
                  style={{ 
                    background: `linear-gradient(90deg, ${progressColor.from}, ${progressColor.to})`,
                    width: `${(completedSteps / totalSteps) * 100}%`
                  }}
                />
              )}
              
              {/* Фоновые сегменты */}
              <div className="flex gap-1.5 relative">
                {Array.from({ length: totalSteps }, (_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 h-3 rounded-full overflow-hidden relative ${isLight ? 'bg-purple-100/50 border border-purple-200/50' : 'bg-white/5 border border-white/10'}`}
                  >
                    {/* Заполненный сегмент */}
                    <div 
                      className={`absolute inset-0 transition-all duration-500 ease-out ${
                        i < completedSteps ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      }`}
                      style={{ 
                        background: `linear-gradient(135deg, ${progressColor.from}, ${progressColor.to})`,
                        boxShadow: i < completedSteps ? `0 0 12px ${progressColor.from}80, 0 0 4px ${progressColor.from}, inset 0 1px 0 rgba(255,255,255,0.4)` : 'none',
                        transitionDelay: `${i * 60}ms`
                      }}
                    >
                      {/* Верхний блик */}
                      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent rounded-t-full" />
                      {/* Анимированный блик на последнем заполненном */}
                      {i === completedSteps - 1 && completedSteps > 0 && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Статус */}
            <div className="flex items-center justify-center mt-3 gap-2">
              {completedSteps === totalSteps ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
                  <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  <span className="text-[11px] font-semibold text-emerald-400">Готово к оплате</span>
                </div>
              ) : (
                <span className={`text-[11px] ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                  Осталось <span className="font-semibold" style={{ color: progressColor.from }}>{totalSteps - completedSteps}</span> {totalSteps - completedSteps === 1 ? 'шаг' : 'шагов'}
                </span>
              )}
            </div>
          </div>

          {/* Кнопки - скрываем на шагах payment и send */}
          {canShowPaymentSteps && currentStep !== 'payment' && currentStep !== 'send' ? (
            <div className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
              {/* Статус автосохранения */}
              {autoSaveMessage && (
                <div className="text-xs text-emerald-400 text-center py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 animate-pulse">
                  {autoSaveMessage}
                </div>
              )}
              <button
                onClick={() => setCurrentStep('payment')}
                disabled={saving || !canProceedToPayment}
                className={`relative w-full py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition overflow-hidden group flex items-center justify-center gap-2 ${
                  saving || !canProceedToPayment
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-purple-400 text-white shadow-lg shadow-purple-500/20'
                }`}
              >
                {!(saving || !canProceedToPayment) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
                <span className="relative flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Перейти к оплате
                </span>
              </button>
              {!canProceedToPayment && (
                <p className="text-xs text-zinc-500 text-center">
                  Заполните все обязательные поля для перехода к оплате
                </p>
              )}
            </div>
          ) : releaseStatus === 'pending' ? (
            <div className="space-y-2 mt-3 relative z-10">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className={`relative w-full py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition overflow-hidden group flex items-center justify-center gap-2 ${
                  saving
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/20'
                }`}
              >
                {!saving && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
                <span className="relative flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                    <polyline points="17 21 17 13 7 13 7 21"/>
                    <polyline points="7 3 7 8 15 8"/>
                  </svg>
                  {saving ? 'Сохранение...' : 'Сохранить изменения'}
                </span>
              </button>
              <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                На модерации
              </p>
            </div>
          ) : currentStep !== 'payment' && currentStep !== 'send' && (
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className={`relative w-full mt-3 sm:mt-4 py-3 sm:py-4 rounded-xl text-sm sm:text-base font-bold transition overflow-hidden group flex items-center justify-center gap-2 ${
                saving
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-black shadow-lg shadow-emerald-500/20'
              }`}
            >
              {!saving && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              )}
              <span className="relative flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </span>
            </button>
          )}
        </aside>

        {/* Мобильная версия - компактная полоса прогресса с раскрывающимся списком */}
        <div className="lg:hidden w-full mb-3 order-first">
          <div className={`backdrop-blur-xl border rounded-2xl shadow-lg relative overflow-hidden ${isLight ? 'bg-[rgba(255,255,255,0.45)] border-white/60 shadow-purple-500/10' : 'bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-white/10 shadow-black/10'}`}>
            {/* Декоративный градиент */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
            
            {/* Основная строка - кликабельная */}
            <div 
              className="relative z-10 p-3 cursor-pointer"
              onClick={() => setMobileStepsOpen(!mobileStepsOpen)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Текущий шаг */}
                  <div className="flex items-center gap-2">
                    <div>
                      <div className={`text-xs font-medium ${isLight ? 'text-purple-600' : 'text-purple-400'}`}>
                        {steps.find(s => s.id === currentStep)?.label || 'Редактирование'}
                      </div>
                      <div className={`text-[10px] ${isLight ? 'text-[#5a5580]' : 'text-zinc-500'}`}>
                        {releaseType ? (releaseType === 'single' ? 'Сингл' : releaseType === 'ep' ? 'EP' : 'Альбом') : ''}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Стрелка раскрытия */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isLight ? 'bg-purple-500/10 hover:bg-purple-500/20' : 'bg-white/5 hover:bg-white/10'} ${!mobileStepsOpen ? 'animate-bounce-subtle' : ''}`}>
                  <svg 
                    width="20" height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2.5" 
                    className={`transition-transform duration-200 ${isLight ? 'text-purple-500' : 'text-zinc-300'} ${mobileStepsOpen ? 'rotate-180' : ''}`}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                
                {/* Прогресс справа */}
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: totalSteps }, (_, i) => (
                      <div 
                        key={i} 
                        className={`w-4 h-1.5 rounded-full transition-all duration-300 ${i < completedSteps ? '' : isLight ? 'bg-purple-200/50' : 'bg-white/10'}`}
                        style={i < completedSteps ? { 
                          background: `linear-gradient(135deg, ${progressColor.from}, ${progressColor.to})`,
                          boxShadow: `0 0 4px ${progressColor.from}60`
                        } : undefined}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-bold" style={{ color: progressColor.from }}>
                    {completedSteps}/{totalSteps}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Раскрывающийся список шагов */}
            {mobileStepsOpen && (
              <div className={`relative z-10 px-3 pb-3 pt-1 border-t ${isLight ? 'border-purple-200/50' : 'border-white/10'}`}>
                <div className="space-y-1.5">
                  {steps.map((step) => {
                    const isComplete = isStepComplete(step.id);
                    const isCurrent = currentStep === step.id;
                    const isPromoSkipped = step.id === 'promo' && promoStatus === 'skipped';
                    const isPromoFilled = step.id === 'promo' && promoStatus === 'filled';
                    
                    return (
                      <button 
                        key={step.id} 
                        onClick={() => {
                          setCurrentStep(step.id);
                          setMobileStepsOpen(false);
                        }}
                        className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center gap-2.5 transition-all ${
                          isCurrent 
                            ? isLight
                              ? 'bg-purple-500/20 text-purple-900 border border-purple-300/50 font-semibold'
                              : 'bg-gradient-to-r from-purple-500/30 to-purple-600/30 text-white border border-white/20'
                            : isLight
                              ? 'bg-purple-50/50 text-gray-900 hover:bg-purple-100/50 border border-transparent'
                              : 'bg-white/5 text-zinc-400 hover:bg-white/10 border border-transparent hover:border-white/10'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isPromoFilled ? (isLight ? 'bg-emerald-500/30 text-emerald-700' : 'bg-emerald-500/20 text-emerald-500') :
                          isPromoSkipped ? (isLight ? 'bg-yellow-500/30 text-yellow-700' : 'bg-yellow-500/20 text-yellow-500') :
                          isComplete && step.id !== 'send' ? (isLight ? 'bg-emerald-500/30 text-emerald-700' : 'bg-emerald-500/20 text-emerald-500') : isLight ? 'bg-purple-200/70 text-purple-800' : 'bg-white/10 text-zinc-400'
                        }`}>
                          {(isComplete || isPromoSkipped || isPromoFilled) && step.id !== 'send' ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                            </svg>
                          ) : step.id === 'send' ? (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="22" y1="2" x2="11" y2="13"/>
                              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                            </svg>
                          ) : (
                            step.icon
                          )}
                        </span>
                        <span className={`text-sm font-medium flex-1 ${isLight ? 'text-gray-900' : ''}`}>{step.label}</span>
                        {isCurrent && (
                          <span className={`w-2 h-2 rounded-full animate-pulse ${isLight ? 'bg-purple-500' : 'bg-white'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Основной контент - Glassmorphism */}
        <section className={`flex-1 backdrop-blur-xl border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 min-h-[600px] shadow-2xl ${isLight ? 'bg-white/80 border-gray-200 shadow-purple-500/5' : 'bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-white/10 shadow-purple-500/5'}`}>
          {/* Кнопка сохранения сверху когда релиз на модерации */}
          {releaseStatus === 'pending' && currentStep !== 'send' && currentStep !== 'payment' && (
            <div className={`mb-6 p-4 rounded-xl border flex items-center justify-between ${isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isLight ? 'bg-amber-100' : 'bg-amber-500/20'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLight ? 'text-amber-600' : 'text-amber-400'}>
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>
                <div>
                  <p className={`font-semibold ${isLight ? 'text-amber-800' : 'text-amber-300'}`}>Релиз на модерации</p>
                  <p className={`text-sm ${isLight ? 'text-amber-600' : 'text-amber-400/70'}`}>Вы можете редактировать и сохранять изменения</p>
                </div>
              </div>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className={`px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 ${
                  saving
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-white shadow-lg shadow-emerald-500/20'
                }`}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                  <polyline points="17 21 17 13 7 13 7 21"/>
                  <polyline points="7 3 7 8 15 8"/>
                </svg>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          )}
          
          {currentStep === 'release' && (
            <ReleaseInfoStep
              releaseTitle={releaseTitle}
              setReleaseTitle={setReleaseTitle}
              artistName={artistName}
              setArtistName={setArtistName}
              collaborators={collaborators}
              setCollaborators={setCollaborators}
              collaboratorInput={collaboratorInput}
              setCollaboratorInput={setCollaboratorInput}
              releaseArtists={releaseArtists}
              setReleaseArtists={setReleaseArtists}
              genre={genre}
              setGenre={setGenre}
              subgenres={subgenres}
              setSubgenres={setSubgenres}
              subgenreInput={subgenreInput}
              setSubgenreInput={setSubgenreInput}
              releaseDate={releaseDate}
              setReleaseDate={setReleaseDate}
              showCalendar={showCalendar}
              setShowCalendar={setShowCalendar}
              calendarMonth={calendarMonth}
              setCalendarMonth={setCalendarMonth}
              calendarYear={calendarYear}
              setCalendarYear={setCalendarYear}
              coverFile={coverFile}
              setCoverFile={setCoverFile}
              existingCoverUrl={existingCoverUrl}
              contributors={contributors}
              setContributors={setContributors}
              onNext={() => setCurrentStep('tracklist')}
            />
          )}

          {currentStep === 'tracklist' && (
            <TracklistStep
              releaseTitle={releaseTitle}
              releaseType={releaseType}
              coverFile={coverFile}
              existingCoverUrl={existingCoverUrl}
              tracks={tracks}
              setTracks={setTracks}
              currentTrack={currentTrack}
              setCurrentTrack={setCurrentTrack}
              trackTitle={trackTitle}
              setTrackTitle={setTrackTitle}
              trackLink={trackLink}
              setTrackLink={setTrackLink}
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
              onBack={() => setCurrentStep('release')}
              onNext={() => setCurrentStep('countries')}
            />
          )}

          {currentStep === 'countries' && (
            <CountriesStep
              selectedCountries={selectedCountries}
              setSelectedCountries={setSelectedCountries}
              onBack={() => setCurrentStep('tracklist')}
              onNext={() => setCurrentStep('contract')}
            />
          )}

          {currentStep === 'contract' && (
            <ContractStep
              agreedToContract={agreedToContract}
              setAgreedToContract={setAgreedToContract}
              onBack={() => setCurrentStep('countries')}
              onNext={() => setCurrentStep('platforms')}
            />
          )}

          {currentStep === 'platforms' && (
            <PlatformsStep
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              selectedPlatformsList={selectedPlatformsList}
              setSelectedPlatformsList={setSelectedPlatformsList}
              onBack={() => setCurrentStep('contract')}
              onNext={() => setCurrentStep('promo')}
            />
          )}

          {currentStep === 'promo' && (
            <PromoStep
              focusTrack={focusTrack}
              setFocusTrack={setFocusTrack}
              focusTrackPromo={focusTrackPromo}
              setFocusTrackPromo={setFocusTrackPromo}
              albumDescription={albumDescription}
              setAlbumDescription={setAlbumDescription}
              promoPhotos={promoPhotos}
              setPromoPhotos={setPromoPhotos}
              tracks={tracks}
              promoStatus={promoStatus}
              onSkip={() => {
                setPromoStatus('skipped');
                // Переход на следующий шаг после пропуска
                if (canShowPaymentSteps) {
                  setCurrentStep('payment');
                } else {
                  setCurrentStep('release');
                }
              }}
              onFilled={() => {
                setPromoStatus('filled');
                // Переход на следующий шаг после заполнения
                if (canShowPaymentSteps) {
                  setCurrentStep('payment');
                } else {
                  setCurrentStep('release');
                }
              }}
              onResetSkip={() => setPromoStatus('not-started')}
              onBack={() => setCurrentStep('platforms')}
              onNext={() => canShowPaymentSteps ? setCurrentStep('payment') : setCurrentStep('release')}
            />
          )}

          {currentStep === 'payment' && canShowPaymentSteps && (
            <PaymentStep
              onNext={() => setCurrentStep('send')}
              onBack={() => setCurrentStep('promo')}
              onPaymentComplete={async (transactionId, alreadyPaid) => {
                setPaymentTransactionId(transactionId);
                setIsPaid(true);
                
                // Сразу сохраняем оплату в черновик (защита от обновления страницы)
                if (releaseId && supabase && !alreadyPaid) {
                  try {
                    await supabase
                      .from('releases_basic')
                      .update({
                        is_paid: true,
                        payment_transaction_id: transactionId,
                        paid_at: new Date().toISOString()
                      })
                      .eq('id', releaseId);
                  } catch {
                    // Ошибка сохранения оплаты
                  }
                }
              }}
              onPayLater={handlePayLater}
              canPayLater={canProceedToPayment}
              userId={userId}
              releaseId={releaseId} // Передаём ID релиза для привязки оплаты
              releaseType={releaseType}
              tracksCount={tracks.length}
              releaseTitle={releaseTitle}
              releaseArtist={releaseArtists[0] || artistName}
              isPaid={isPaid} // Передаём статус оплаты
              onOpenDeposit={() => setShowDepositModal(true)}
            />
          )}

          {currentStep === 'send' && canShowPaymentSteps && (
            <SendStep
              releaseTitle={releaseTitle}
              artistName={artistName}
              genre={genre}
              releaseType={releaseType}
              tracksCount={tracks.length}
              coverFile={coverFile}
              existingCoverUrl={existingCoverUrl}
              collaborators={collaborators}
              releaseArtists={releaseArtists}
              subgenres={subgenres}
              releaseDate={releaseDate}
              selectedPlatforms={selectedPlatforms}
              agreedToContract={agreedToContract}
              focusTrack={focusTrack}
              focusTrackPromo={focusTrackPromo}
              albumDescription={albumDescription}
              promoPhotos={promoPhotos}
              promoStatus={promoStatus}
              contributors={contributors}
              tracks={tracks}
              platforms={selectedPlatformsList}
              countries={selectedCountries}
              onBack={() => setCurrentStep('payment')}
              paymentTransactionId={paymentTransactionId}
              draftId={releaseId}
            />
          )}
        </section>
      </div>
      
      {/* Toast уведомление (центр экрана) */}
      {showSuccessToast && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className={`pointer-events-auto bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-[90%] ${isFadingOut ? 'animate-fade-out' : 'animate-fade-in'}`}>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div>
              <div className="font-bold text-lg">
                {releaseStatus === 'draft' && !saving ? 'Черновик сохранен!' : 'Успешно сохранено!'}
              </div>
              <div className="text-sm text-white/90">
                {releaseStatus === 'draft' && !saving ? 'Изменения сохранены' : 'Релиз обновлен'}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
