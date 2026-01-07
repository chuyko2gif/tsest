"use client";
import React, { useState, useEffect, useRef, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useTheme } from '@/contexts/ThemeContext';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { supabase } from '../../../lib/supabase';
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
import SendStep from '../../create/components/SendStep';

// Компонент для редактирования Exclusive релиза
function EditExclusiveReleasePageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const releaseId = params.id as string;
  const fromPage = searchParams.get('from') || 'cabinet'; // По умолчанию cabinet
  const isDraftMode = searchParams.get('draft') === 'true'; // Режим редактирования черновика

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('release');
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);
  const [releaseStatus, setReleaseStatus] = useState('');
  const [mounted, setMounted] = useState(false); // Для portal
  
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
  const [trackHasDrugs, setTrackHasDrugs] = useState(false);
  const [trackLyrics, setTrackLyrics] = useState('');
  const [trackLanguage, setTrackLanguage] = useState('');
  const [trackVersion, setTrackVersion] = useState('');
  const [trackProducers, setTrackProducers] = useState<string[]>([]);
  const [trackFeaturing, setTrackFeaturing] = useState<string[]>([]);
  const [trackAuthors, setTrackAuthors] = useState<TrackAuthor[]>([]);
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
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  
  // Ref для отслеживания предыдущего значения promoStatus
  const prevPromoStatusRef = useRef<string | null>(null);
  const isInitialLoadRef = useRef(true);

  // Для portal
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadRelease();
  }, [releaseId]);
  
  // Автосохранение при изменении promoStatus (skip/filled) для черновиков
  useEffect(() => {
    if (releaseStatus !== 'draft' || loading || !releaseId) return;
    
    // Пропускаем первую загрузку
    if (isInitialLoadRef.current) {
      prevPromoStatusRef.current = promoStatus;
      isInitialLoadRef.current = false;
      return;
    }
    
    // Если статус изменился - сохраняем
    if (prevPromoStatusRef.current !== promoStatus) {
      handleSave(false);
      prevPromoStatusRef.current = promoStatus;
    }
  }, [promoStatus, releaseStatus, loading, releaseId]);

  // Ref для отслеживания предыдущего количества треков и авторов
  const prevTracksCountRef = useRef<number | null>(null);
  const prevContributorsCountRef = useRef<number | null>(null);
  const prevTracksAudioRef = useRef<string>('');

  // Автосохранение при изменении аудиофайлов в треках (для черновиков)
  useEffect(() => {
    if (releaseStatus !== 'draft' || loading || !releaseId) return;
    
    // Создаём "подпись" аудиофайлов
    const audioSignature = tracks.map(t => (t as any).audioFile?.name || t.link || t.originalFileName || '').join('|');
    
    // Пропускаем первую загрузку
    if (!prevTracksAudioRef.current) {
      prevTracksAudioRef.current = audioSignature;
      return;
    }
    
    // Если аудио изменилось - сохраняем
    if (prevTracksAudioRef.current !== audioSignature) {
      handleSave(false);
      prevTracksAudioRef.current = audioSignature;
    }
  }, [tracks, releaseStatus, loading, releaseId]);

  // Автосохранение при изменении треков (для черновиков)
  useEffect(() => {
    if (releaseStatus !== 'draft' || loading || !releaseId) return;
    
    // Пропускаем первую загрузку
    if (prevTracksCountRef.current === null) {
      prevTracksCountRef.current = tracks.length;
      return;
    }
    
    // Если количество треков изменилось - сохраняем
    if (prevTracksCountRef.current !== tracks.length) {
      handleSave(false);
      prevTracksCountRef.current = tracks.length;
    }
  }, [tracks.length, releaseStatus, loading, releaseId]);

  // Автосохранение при изменении авторов (для черновиков)
  useEffect(() => {
    if (releaseStatus !== 'draft' || loading || !releaseId) return;
    
    // Пропускаем первую загрузку
    if (prevContributorsCountRef.current === null) {
      prevContributorsCountRef.current = contributors.length;
      return;
    }
    
    // Если количество авторов изменилось - сохраняем
    if (prevContributorsCountRef.current !== contributors.length) {
      handleSave(false);
      prevContributorsCountRef.current = contributors.length;
    }
  }, [contributors.length, releaseStatus, loading, releaseId]);

  const loadRelease = async () => {
    if (!supabase || !releaseId) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth');
        return;
      }

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
        .from('releases_exclusive')
        .select('*')
        .eq('id', releaseId);
      
      // Обычные пользователи могут загружать только свои релизы
      if (!userIsAdmin) {
        query = query.eq('user_id', user.id);
      }
      
      const { data: release, error } = await query.single();

      if (error || !release) {
        console.error('Ошибка загрузки релиза:', error);
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
      if (release.release_artists && Array.isArray(release.release_artists) && release.release_artists.length > 0) {
        // Если это уже массив строк
        if (typeof release.release_artists[0] === 'string') {
          setReleaseArtists(release.release_artists);
        } else {
          // Если это старый формат с объектами {name, isMain} - конвертируем
          setReleaseArtists(release.release_artists.map((a: any) => a.name || a));
        }
      } else if (release.artist_name) {
        // Fallback: создаём массив из artist_name + collaborators
        const artists: string[] = [release.artist_name];
        if (release.collaborators && release.collaborators.length > 0) {
          artists.push(...release.collaborators);
        }
        setReleaseArtists(artists);
      }
      
      setTracks(release.tracks || []);
      setSelectedCountries(release.countries || []);
      setAgreedToContract(release.contract_agreed || false);
      setSelectedPlatforms(Array.isArray(release.platforms) ? release.platforms.length : 0);
      setSelectedPlatformsList(release.platforms || []);
      setFocusTrack(release.focus_track || '');
      setFocusTrackPromo(release.focus_track_promo || '');
      setAlbumDescription(release.album_description || '');
      setPromoPhotos(release.promo_photos || []);
      setReleaseStatus(release.status || '');
      setUpc(release.upc || '');
      
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
      
      // Загружаем тип релиза из базы данных (если есть), иначе определяем по количеству треков
      if (release.release_type) {
        setReleaseType(release.release_type as 'single' | 'ep' | 'album');
      } else {
        // Fallback: определяем тип релиза на основе количества треков
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
        
        const { error: uploadError } = await supabase.storage
          .from('release-covers')
          .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('release-covers')
          .getPublicUrl(fileName);
          
        coverUrl = publicUrl;
      }

      // Загрузка новых аудиофайлов треков
      const tracksWithUrls = await Promise.all(tracks.map(async (track, index) => {
        // Если есть новый audioFile, загружаем его
        if (track.audioFile && track.audioFile instanceof File && supabase) {
          try {
            const audioFileExt = track.audioFile.name.split('.').pop();
            const audioFileName = `${user.id}/${Date.now()}-track-${index}.${audioFileExt}`;
            
            const { data: audioUploadData, error: audioUploadError } = await supabase.storage
              .from('release-audio')
              .upload(audioFileName, track.audioFile, {
                contentType: track.audioFile.type,
                upsert: true
              });
            
            if (audioUploadError) {
              const { audioFile, ...trackWithoutFile } = track;
              return trackWithoutFile;
            }
            
            const { data: { publicUrl: audioUrl } } = supabase.storage
              .from('release-audio')
              .getPublicUrl(audioFileName);
            
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
              link: track.link || '',
              originalFileName: (track as any).audioFile?.name || track.originalFileName || '',
            };
          }
        }
        
        // Убираем audioFile из объекта перед сохранением (если нет File объекта, сохраняем как есть)
        if (track.audioFile) {
          const originalName = (track.audioFile as File).name;
          const { audioFile, ...trackWithoutFile } = track;
          return {
            ...trackWithoutFile,
            link: track.link || '',
            originalFileName: originalName || track.originalFileName || '',
          };
        }
        
        return track;
      }));

      // Вычисляем artistName и collaborators из releaseArtists для обратной совместимости
      const mainArtist = releaseArtists[0] || '';
      const additionalArtists = releaseArtists.slice(1);

      // Обновляем релиз
      const updateData: any = {
        title: releaseTitle,
        artist_name: mainArtist,
        genre: genre,
        subgenres: subgenres,
        release_date: releaseDate,
        collaborators: additionalArtists,
        release_artists: releaseArtists,
        contributors: contributors.length > 0 ? contributors : null,
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
      
      // Проверка доступа к релизу перед обновлением
      const checkQuery = await supabase
        .from('releases_exclusive')
        .select('*')
        .eq('id', releaseId)
        .eq('user_id', user.id)
        .single();
      
      if (checkQuery.error) {
        alert('Не удается найти релиз для обновления. Ошибка: ' + checkQuery.error.message);
        throw checkQuery.error;
      }

      // Обновляем релиз - админы могут обновлять любые релизы
      let updateQuery = supabase
        .from('releases_exclusive')
        .update(updateData)
        .eq('id', releaseId);
      
      // Обычные пользователи могут обновлять только свои релизы
      if (!isAdmin) {
        updateQuery = updateQuery.eq('user_id', user.id);
      }
      
      const { error, data } = await updateQuery;

      if (error) {
        alert('Ошибка сохранения: ' + error.message);
        throw error;
      }

      setIsFadingOut(false);
      setShowSuccessToast(true);
      
      // Если это отправка на модерацию или обычное сохранение (не черновик) - редиректим
      if (submitToModeration || releaseStatus !== 'draft') {
        setTimeout(() => setIsFadingOut(true), 1000);
        setTimeout(() => {
          setShowSuccessToast(false);
          const redirectPath = fromPage === 'admin' ? '/admin' : '/cabinet';
          router.push(redirectPath);
        }, 1400);
      } else {
        // Для сохранения черновика - просто скрываем уведомление через 2 секунды
        setTimeout(() => setIsFadingOut(true), 2000);
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 2400);
      }
    } catch (error: any) {
      alert('Ошибка при сохранении релиза: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className={`animate-pulse relative z-10 ${isLight ? 'text-gray-500' : 'text-zinc-600'}`}>Загрузка релиза...</div>
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
        return !!(releaseTitle.trim() && releaseArtists.length > 0 && genre && (coverFile || existingCoverUrl));
      case 'tracklist':
        return tracks.length >= getMinTracks(releaseType);
      case 'countries':
        return selectedCountries.length > 0;
      case 'contract':
        return agreedToContract;
      case 'platforms':
        return selectedPlatforms > 0;
      case 'promo':
        return promoStatus !== 'not-started';
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

  // Для черновиков добавляем шаг отправки
  const steps = isDraftMode && releaseStatus === 'draft'
    ? [...baseSteps, { id: 'send', label: 'Отправка', icon: '✈' }]
    : baseSteps;
  
  // Подсчёт заполненных шагов (все 6 базовых шагов, promo считается заполненным если skipped или filled)
  const completedSteps = baseSteps.filter(step => isStepComplete(step.id)).length;
  const totalSteps = baseSteps.length; // 6 шагов
  const progress = (completedSteps / totalSteps) * 100;

  // Плавный градиент от красного через оранжевый/желтый к зелёному
  const getProgressColor = () => {
    if (completedSteps === 0) return { from: '#ef4444', to: '#dc2626' }; // red
    if (completedSteps === 1) return { from: '#f97316', to: '#ea580c' }; // orange
    if (completedSteps === 2) return { from: '#fb923c', to: '#f97316' }; // orange-light
    if (completedSteps === 3) return { from: '#fbbf24', to: '#f59e0b' }; // amber
    if (completedSteps === 4) return { from: '#a3e635', to: '#84cc16' }; // lime
    if (completedSteps === 5) return { from: '#4ade80', to: '#22c55e' }; // green-light
    return { from: '#10b981', to: '#059669' }; // emerald (6/6)
  };

  const progressColor = getProgressColor();

  // Шаг выбора типа релиза для черновиков
  if (isDraftMode && releaseStatus === 'draft' && currentStep === 'type') {
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
              .from('releases_exclusive')
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
          className={`lg:hidden w-10 h-10 rounded-lg flex items-center justify-center transition-all shadow-xl backdrop-blur-sm pointer-events-auto touch-manipulation active:scale-95 ${
            isLight 
              ? 'bg-white/90 hover:bg-white border-gray-200 border' 
              : 'bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/20'
          }`}
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
        <aside className={`hidden lg:flex lg:w-64 w-full backdrop-blur-xl border rounded-3xl p-6 pb-8 flex-col lg:self-start lg:sticky lg:top-24 shadow-2xl relative overflow-hidden ${
          isLight
            ? 'bg-[rgba(255,255,255,0.45)] border-white/60 shadow-purple-500/10'
            : 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 shadow-black/20'
        }`}>
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          {/* Заголовок с кнопкой назад */}
          <div className="mb-4 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-bold text-lg bg-gradient-to-r bg-clip-text text-transparent ${
                isLight ? 'from-[#2a2550] to-[#4a4570]' : 'from-white to-zinc-300'
              }`}>
                {isDraftMode ? 'Черновик' : 'Редактирование'}
              </h3>
              <button
                onClick={() => router.push(fromPage === 'admin' ? '/admin' : '/cabinet')}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all group/back ${
                  isLight
                    ? 'bg-purple-500/10 hover:bg-purple-500/20 border border-purple-200/50 hover:border-purple-300/50'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20'
                }`}
                title="В кабинет"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-colors ${isLight ? 'text-purple-500 group-hover/back:text-purple-700' : 'text-zinc-400 group-hover/back:text-white'}`}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
            <p className={`text-xs ${isLight ? 'text-[#5a5580]' : 'text-zinc-400'}`}>Exclusive Plan</p>
          </div>
          
          {/* Индикатор типа релиза */}
          {releaseType && (
            <div className="mb-3 p-3 backdrop-blur-lg bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-blue-500/20 border border-white/20 rounded-xl relative overflow-hidden group hover:border-white/30 transition-all">
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Формат</span>
                  {/* Кнопка изменения типа - для черновиков */}
                  {isDraftMode && releaseStatus === 'draft' && (
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
                    <div className="font-bold text-sm text-white">
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
                      ? 'backdrop-blur-md bg-gradient-to-r from-purple-500/40 to-purple-600/40 text-white shadow-lg shadow-purple-500/30 border border-white/20' 
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
                    <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse shadow-lg shadow-white/50" />
                  )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Прогресс */}
          <div className="mt-auto pt-4 border-t border-white/10 relative z-10 px-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-zinc-400 font-medium">Прогресс</span>
              <div className="flex items-center font-mono text-sm leading-none">
                <span 
                  className="font-bold transition-colors duration-500 drop-shadow-sm" 
                  style={{ color: progressColor.from, textShadow: `0 0 8px ${progressColor.from}60` }}
                >
                  {completedSteps}
                </span>
                <span className="text-zinc-500 mx-0.5">/</span>
                <span className="text-zinc-400 font-bold">{totalSteps}</span>
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
                    className="flex-1 h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden relative"
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
                  <span className="text-[11px] font-semibold text-emerald-400">Готово к отправке</span>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500">
                  Осталось <span className="font-semibold" style={{ color: progressColor.from }}>{totalSteps - completedSteps}</span> {totalSteps - completedSteps === 1 ? 'шаг' : 'шагов'}
                </span>
              )}
            </div>
          </div>

          {/* Кнопки сохранения - скрываем на шаге send */}
          {isDraftMode && releaseStatus === 'draft' && currentStep !== 'send' ? (
            <div className="space-y-2 mt-3 relative z-10">
              <button
                onClick={() => setCurrentStep('send')}
                disabled={saving || completedSteps < totalSteps}
                className={`relative w-full py-3 rounded-xl text-sm font-bold transition overflow-hidden group flex items-center justify-center gap-2 ${
                  saving || completedSteps < totalSteps
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                }`}
              >
                {!(saving || completedSteps < totalSteps) && (
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                )}
                <span className="relative flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  Перейти к отправке
                </span>
              </button>
              {completedSteps < totalSteps && (
                <p className="text-xs text-zinc-500 text-center">
                  Заполните все обязательные поля для отправки
                </p>
              )}
            </div>
          ) : releaseStatus === 'pending' ? (
            <div className="space-y-2 mt-3 relative z-10">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className={`relative w-full py-3 rounded-xl text-sm font-bold transition overflow-hidden group flex items-center justify-center gap-2 ${
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
          ) : currentStep !== 'send' && (
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className={`relative w-full mt-3 py-3 rounded-xl text-sm font-bold transition overflow-hidden group flex items-center justify-center gap-2 relative z-10 ${
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
          <div className={`backdrop-blur-xl border rounded-2xl shadow-lg relative overflow-hidden ${
            isLight
              ? 'bg-[rgba(255,255,255,0.45)] border-white/60 shadow-purple-500/10'
              : 'bg-gradient-to-br from-white/[0.07] to-white/[0.02] border-white/10 shadow-black/10'
          }`}>
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
                          isComplete && step.id !== 'send' ? (isLight ? 'bg-emerald-500/30 text-emerald-700' : 'bg-emerald-500/20 text-emerald-500') : 
                          isLight ? 'bg-purple-200/70 text-purple-800' : 'bg-white/10 text-zinc-400'
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
        <section className={`flex-1 backdrop-blur-xl border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 min-h-[600px] shadow-2xl ${
          isLight
            ? 'bg-[rgba(255,255,255,0.45)] border-white/60 shadow-purple-500/5'
            : 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] border-white/10 shadow-purple-500/5'
        }`}>
          {/* Кнопка сохранения сверху когда релиз на модерации */}
          {releaseStatus === 'pending' && currentStep !== 'send' && (
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
              trackAuthors={trackAuthors}
              setTrackAuthors={setTrackAuthors}
              trackIsInstrumental={trackIsInstrumental}
              setTrackIsInstrumental={setTrackIsInstrumental}
              onNext={() => setCurrentStep('countries')}
              onBack={() => setCurrentStep('release')}
            />
          )}

          {currentStep === 'countries' && (
            <CountriesStep
              selectedCountries={selectedCountries}
              setSelectedCountries={setSelectedCountries}
              onNext={() => setCurrentStep('contract')}
              onBack={() => setCurrentStep('tracklist')}
            />
          )}

          {currentStep === 'contract' && (
            <ContractStep
              agreedToContract={agreedToContract}
              setAgreedToContract={setAgreedToContract}
              onNext={() => setCurrentStep('platforms')}
              onBack={() => setCurrentStep('countries')}
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
                if (isDraftMode && releaseStatus === 'draft') {
                  setCurrentStep('send');
                } else {
                  setCurrentStep('release');
                }
              }}
              onFilled={() => {
                setPromoStatus('filled');
                // Переход на следующий шаг после заполнения
                if (isDraftMode && releaseStatus === 'draft') {
                  setCurrentStep('send');
                } else {
                  setCurrentStep('release');
                }
              }}
              onResetSkip={() => setPromoStatus('not-started')}
              onBack={() => setCurrentStep('platforms')}
              onNext={() => isDraftMode && releaseStatus === 'draft' ? setCurrentStep('send') : setCurrentStep('release')}
            />
          )}

          {currentStep === 'send' && isDraftMode && releaseStatus === 'draft' && (
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
              contributors={contributors}
              subgenres={subgenres}
              releaseDate={releaseDate}
              selectedPlatforms={selectedPlatforms}
              agreedToContract={agreedToContract}
              focusTrack={focusTrack}
              focusTrackPromo={focusTrackPromo}
              albumDescription={albumDescription}
              promoPhotos={promoPhotos}
              promoStatus={promoStatus}
              tracks={tracks}
              platforms={selectedPlatformsList}
              countries={selectedCountries}
              onBack={() => setCurrentStep('promo')}
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

export default function EditExclusiveReleasePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>}>
      <EditExclusiveReleasePageContent />
    </Suspense>
  );
}
