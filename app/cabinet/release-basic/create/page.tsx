"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import { supabase } from '../../lib/supabase';
import {
  ReleaseInfoStep,
  TracklistStep,
  CountriesStep,
  ContractStep,
  PlatformsStep,
  PromoStep,
  PaymentStep,
  SendStep,
  ReleaseTypeSelector,
} from './components';

export type ReleaseType = 'single' | 'ep' | 'album';

// Компонент боковой панели шагов
function StepsSidebar({ 
  currentStep, 
  setCurrentStep,
  releaseTitle,
  releaseType,
  selectedTracksCount,
  genre,
  coverFile,
  tracksCount,
  agreedToContract,
  selectedPlatforms,
  selectedCountries,
  focusTrack,
  focusTrackPromo,
  albumDescription,
  paymentReceiptUrl
}: { 
  currentStep: string; 
  setCurrentStep: (step: string) => void;
  releaseTitle: string;
  releaseType: ReleaseType | null;
  selectedTracksCount: number | undefined;
  genre: string;
  coverFile: File | null;
  tracksCount: number;
  agreedToContract: boolean;
  selectedPlatforms: number;
  selectedCountries: string[];
  focusTrack: string;
  focusTrackPromo: string;
  albumDescription: string;
  paymentReceiptUrl: string;
}) {
  // Проверка заполненности каждого шага
  const isStepComplete = (stepId: string): boolean => {
    switch(stepId) {
      case 'release':
        return !!(releaseTitle.trim() && genre && coverFile);
      case 'tracklist':
        return tracksCount > 0;
      case 'countries':
        return selectedCountries.length > 0;
      case 'contract':
        return agreedToContract;
      case 'platforms':
        return selectedPlatforms > 0;
      case 'promo':
        // Промо считается завершенным, если заполнены фокус-трек с описанием ИЛИ описание альбома
        return !!(
          (focusTrack && focusTrackPromo) || 
          albumDescription
        );
      case 'payment':
        return !!paymentReceiptUrl;
      case 'send':
        return false; // Финальный шаг
      default:
        return false;
    }
  };

  const steps = [
    { id: 'release', label: 'Релиз', icon: '1' },
    { id: 'tracklist', label: 'Треклист', icon: '2' },
    { id: 'countries', label: 'Страны', icon: '3' },
    { id: 'contract', label: 'Договор', icon: '4' },
    { id: 'platforms', label: 'Площадки', icon: '5' },
    { id: 'promo', label: 'Промо', icon: '6' },
    { id: 'payment', label: 'Оплата', icon: '₽' },
    { id: 'send', label: 'Отправка', icon: '✈' },
  ];

  // Подсчёт заполненных обязательных шагов
  const completedSteps = steps.filter(step => 
    step.id !== 'send' && isStepComplete(step.id)
  ).length;
  const totalRequiredSteps = steps.length - 1; // Исключаем "Отправка"
  const progress = (completedSteps / totalRequiredSteps) * 100;

  // Динамические цвета прогресс-бара
  const getProgressColorClass = () => {
    if (progress >= 100) return 'from-emerald-500 via-green-400 to-emerald-500 shadow-emerald-500/50';
    if (progress >= 50) return 'from-amber-500 via-yellow-400 to-amber-500 shadow-amber-500/50';
    return 'from-red-500 via-rose-400 to-red-500 shadow-red-500/50';
  };

  return (
    <aside className="lg:w-64 w-full backdrop-blur-xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-3xl p-6 flex flex-col lg:self-start lg:sticky lg:top-24 shadow-2xl shadow-black/20 relative overflow-hidden">
      {/* Декоративный градиент */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
      
      <div className="mb-6 relative z-10">
        <h3 className="font-bold text-lg bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">Создание релиза</h3>
        <p className="text-xs text-zinc-400 mt-1">Basic Plan</p>
      </div>
      
      {/* Индикатор типа релиза */}
      {releaseType && (
        <div className="mb-4 p-4 backdrop-blur-lg bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-blue-500/20 border border-white/20 rounded-xl relative overflow-hidden group hover:border-white/30 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
          {/* Фоновый блик */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Формат</span>
              <button
                onClick={() => setCurrentStep('type')}
                className="flex items-center gap-1.5 px-2.5 py-1 backdrop-blur-md bg-purple-500/20 hover:bg-purple-500/30 border border-purple-400/40 hover:border-purple-400/60 rounded-lg text-xs font-semibold text-purple-300 hover:text-purple-200 transition-all group/btn shadow-lg shadow-purple-500/10"
                title="Изменить тип релиза"
              >
                <svg className="w-3.5 h-3.5 group-hover/btn:rotate-90 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Изменить</span>
              </button>
            </div>
            
            <div className="flex items-center gap-2.5">
              {/* Иконка типа */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                releaseType === 'single' ? 'bg-purple-500/20' :
                releaseType === 'ep' ? 'bg-blue-500/20' :
                'bg-emerald-500/20'
              }`}>
                {releaseType === 'single' && (
                  <svg className="w-4 h-4 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                )}
                {releaseType === 'ep' && (
                  <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
                {releaseType === 'album' && (
                  <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                )}
              </div>
              
              {/* Текст */}
              <div className="flex-1">
                <div className="font-black text-base text-white mb-0.5">
                  {releaseType === 'single' && 'Сингл'}
                  {releaseType === 'ep' && 'EP'}
                  {releaseType === 'album' && 'Альбом'}
                </div>
                <div className={`text-xs font-medium ${
                  releaseType === 'single' ? 'text-purple-400' :
                  releaseType === 'ep' ? 'text-blue-400' :
                  'text-emerald-400'
                }`}>
                  {releaseType === 'single' && '1 трек'}
                  {releaseType === 'ep' && (selectedTracksCount ? `${selectedTracksCount} треков выбрано` : '2-7 треков')}
                  {releaseType === 'album' && (selectedTracksCount ? `${selectedTracksCount} треков выбрано` : '8-50 треков')}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-2 relative z-10">
        {steps.map((step, idx) => {
          const isComplete = isStepComplete(step.id);
          const isCurrent = currentStep === step.id;
          
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
                isComplete && step.id !== 'send' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'
              }`}>
                {isComplete && step.id !== 'send' ? (
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
              {isCurrent && (
                <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse shadow-lg shadow-white/50" />
              )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Прогресс */}
      <div className="mt-auto pt-6 border-t border-white/10 relative z-10">
        <div className="text-xs text-zinc-400 mb-2 font-medium">Прогресс заполнения</div>
        <div className="h-2.5 backdrop-blur-sm bg-white/5 rounded-full overflow-hidden border border-white/10 shadow-inner">
          <div 
            className={`h-full bg-gradient-to-r ${getProgressColorClass()} transition-all duration-500 shadow-lg`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-xs text-zinc-300 mt-2 text-center font-medium">
          {completedSteps} из {totalRequiredSteps} шагов
        </div>
      </div>
    </aside>
  );
}

export default function CreateReleaseBasicPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('type'); // Начинаем с выбора типа
  const [releaseType, setReleaseType] = useState<ReleaseType | null>(null); // Тип релиза
  const [selectedTracksCount, setSelectedTracksCount] = useState<number | undefined>(undefined); // Выбранное количество треков
  
  // Release info state
  const [releaseTitle, setReleaseTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [genre, setGenre] = useState('');
  const [subgenres, setSubgenres] = useState<string[]>([]);
  const [subgenreInput, setSubgenreInput] = useState('');
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [collaboratorInput, setCollaboratorInput] = useState('');
  
  // Calendar state
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  
  // Tracklist state
  const [tracks, setTracks] = useState<Array<{
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
  }>>([]);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackLink, setTrackLink] = useState('');
  const [trackAudioFile, setTrackAudioFile] = useState<File | null>(null);
  const [trackAudioMetadata, setTrackAudioMetadata] = useState<{
    format: string;
    duration?: number;
    bitrate?: string;
    sampleRate?: string;
    size: number;
  } | null>(null);
  const [trackHasDrugs, setTrackHasDrugs] = useState(false);
  const [trackLyrics, setTrackLyrics] = useState('');
  const [trackLanguage, setTrackLanguage] = useState('');
  const [trackVersion, setTrackVersion] = useState('');
  const [trackProducers, setTrackProducers] = useState<string[]>([]);
  const [trackFeaturing, setTrackFeaturing] = useState<string[]>([]);
  
  // Countries state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  
  // Platforms state
  const [selectedPlatforms, setSelectedPlatforms] = useState(0);
  const [selectedPlatformsList, setSelectedPlatformsList] = useState<string[]>([]);
  
  // Contract state
  const [agreedToContract, setAgreedToContract] = useState(false);
  
  // Promo state
  const [focusTrack, setFocusTrack] = useState('');
  const [focusTrackPromo, setFocusTrackPromo] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [promoPhotos, setPromoPhotos] = useState<string[]>([]);
  
  // Payment state
  const [paymentReceiptUrl, setPaymentReceiptUrl] = useState('');
  
  // Draft state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      if (!supabase) { setLoading(false); return; }
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/auth');
        return;
      }
      
      setUser(user);
      const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Artist';
      setNickname(displayName);
      setLoading(false);
    };
    
    getUser();
  }, [router]);
  
  // Автосохранение черновика при изменении полей
  useEffect(() => {
    if (!user || !supabase || currentStep !== 'release') return;
    
    // Сохраняем только если выбран жанр (обязательное поле в БД)
    if (!genre) return;
    
    const timeoutId = setTimeout(() => {
      console.log('💾 [BASIC] Автосохранение...');
      saveDraft();
    }, 2000);
    
    return () => clearTimeout(timeoutId);
  }, [releaseTitle, artistName, genre, subgenres, releaseDate, collaborators, coverFile, currentStep, user]);
  
  // Функция автосохранения черновика
  const saveDraft = async () => {
    if (!user || !supabase || isSavingDraft) return null;
    
    console.log('🔄 [BASIC] Начинаем сохранение черновика...');
    console.log('User ID:', user.id);
    
    setIsSavingDraft(true);
    try {
      let coverUrl = null;
      if (coverFile) {
        console.log('📤 Загружаем обложку...');
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('releases')
          .upload(fileName, coverFile, { upsert: true });
        
        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('releases')
            .getPublicUrl(fileName);
          coverUrl = publicUrl;
          console.log('✅ Обложка загружена');
        }
      }
      
      const draftData = {
        user_id: user.id,
        title: releaseTitle || 'Без названия',
        artist_name: artistName || nickname,
        cover_url: coverUrl,
        genre: genre,
        subgenres: subgenres.length > 0 ? subgenres : null,
        release_date: releaseDate,
        collaborators: collaborators.length > 0 ? collaborators : null,
        status: 'draft',
        created_at: new Date().toISOString()
      };
      
      console.log('💾 Данные:', draftData);
      
      if (draftId) {
        console.log('🔄 Обновляем черновик:', draftId);
        const { error } = await supabase
          .from('releases_basic')
          .update(draftData)
          .eq('id', draftId);
        
        if (error) {
          console.error('❌ Ошибка:', error);
          throw error;
        }
        console.log('✅ Обновлен!');
        return draftId;
      } else {
        console.log('➕ Создаем новый черновик...');
        const { data, error } = await supabase
          .from('releases_basic')
          .insert([draftData])
          .select()
          .single();
        
        if (error) {
          console.error('❌ Ошибка:', error);
          throw error;
        }
        if (data) {
          console.log('✅ Создан! ID:', data.id);
          setDraftId(data.id);
          return data.id;
        }
      }
    } catch (error) {
      console.error('❌ ОШИБКА:', error);
      alert('Ошибка сохранения черновика. Проверьте консоль.');
    } finally {
      setIsSavingDraft(false);
    }
    return null;
  };
  
  // Обработчик перехода на следующий шаг
  const handleNextStep = async (nextStep: string) => {
    if (currentStep === 'release') {
      const savedId = await saveDraft();
      if (savedId) {
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-fade-in';
        notification.textContent = '✓ Черновик сохранен';
        document.body.appendChild(notification);
        setTimeout(() => {
          notification.style.opacity = '0';
          notification.style.transform = 'translateY(-10px)';
          notification.style.transition = 'all 0.3s ease-out';
          setTimeout(() => document.body.removeChild(notification), 300);
        }, 2000);
      }
    }
    setCurrentStep(nextStep);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative">
        <AnimatedBackground />
        <div className="text-zinc-600 animate-pulse relative z-10">Загрузка...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Шаг 0: Выбор типа релиза
  if (currentStep === 'type') {
    return (
      <ReleaseTypeSelector 
        onSelectType={(type: 'single' | 'ep' | 'album', tracksCount?: number) => {
          setReleaseType(type);
          setSelectedTracksCount(tracksCount);
          setCurrentStep('release');
        }}
        onBack={() => router.push('/cabinet')}
      />
    );
  }

  return (
    <div className="min-h-screen pt-20 text-white relative z-10">
      <AnimatedBackground />
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-stretch relative z-10">
        
        {/* Боковая панель с шагами */}
        <StepsSidebar 
          currentStep={currentStep} 
          setCurrentStep={setCurrentStep}
          releaseTitle={releaseTitle}
          releaseType={releaseType}
          selectedTracksCount={selectedTracksCount}
          genre={genre}
          coverFile={coverFile}
          tracksCount={tracks.length}
          agreedToContract={agreedToContract}
          selectedPlatforms={selectedPlatforms}
          selectedCountries={selectedCountries}
          focusTrack={focusTrack}
          focusTrackPromo={focusTrackPromo}
          albumDescription={albumDescription}
          paymentReceiptUrl={paymentReceiptUrl}
        />

        {/* Основной контент */}
        <section className="flex-1 backdrop-blur-xl bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 min-h-[500px] shadow-2xl shadow-black/20 relative overflow-hidden">
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          <div className="relative z-10">
          {/* Кнопка возврата */}
          <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/10">
            <button 
              onClick={() => router.push('/cabinet')}
              className="px-4 sm:px-6 py-2.5 sm:py-3 backdrop-blur-sm bg-white/5 hover:bg-white/10 rounded-xl font-medium transition flex items-center gap-2 text-sm sm:text-base border border-transparent hover:border-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="flex-shrink-0">
                <polyline points="15 18 9 12 15 6" strokeWidth="2"/>
              </svg>
              <span className="hidden sm:inline">Вернуться в кабинет</span>
              <span className="sm:hidden">Назад</span>
            </button>
          </div>

          {/* Шаг 1: Информация о релизе */}
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
              onNext={() => handleNextStep('tracklist')}
            />
          )}

          {/* Шаг 2: Треклист */}
          {currentStep === 'tracklist' && (
            <TracklistStep
              releaseTitle={releaseTitle}
              releaseType={releaseType}
              selectedTracksCount={selectedTracksCount}
              coverFile={coverFile}
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
              onNext={() => setCurrentStep('countries')}
              onBack={() => setCurrentStep('release')}
            />
          )}

          {/* Шаг 3: Страны */}
          {currentStep === 'countries' && (
            <CountriesStep
              selectedCountries={selectedCountries}
              setSelectedCountries={setSelectedCountries}
              onNext={() => setCurrentStep('contract')}
              onBack={() => setCurrentStep('tracklist')}
            />
          )}

          {/* Шаг 4: Договор */}
          {currentStep === 'contract' && (
            <ContractStep
              agreedToContract={agreedToContract}
              setAgreedToContract={setAgreedToContract}
              onNext={() => setCurrentStep('platforms')}
              onBack={() => setCurrentStep('countries')}
            />
          )}

          {/* Шаг 5: Площадки */}
          {currentStep === 'platforms' && (
            <PlatformsStep
              selectedPlatforms={selectedPlatforms}
              setSelectedPlatforms={setSelectedPlatforms}
              selectedPlatformsList={selectedPlatformsList}
              setSelectedPlatformsList={setSelectedPlatformsList}
              onNext={() => setCurrentStep('promo')}
              onBack={() => setCurrentStep('contract')}
            />
          )}

          {/* Шаг 6: Промо */}
          {currentStep === 'promo' && (
            <PromoStep
              tracks={tracks}
              focusTrack={focusTrack}
              setFocusTrack={setFocusTrack}
              focusTrackPromo={focusTrackPromo}
              setFocusTrackPromo={setFocusTrackPromo}
              albumDescription={albumDescription}
              setAlbumDescription={setAlbumDescription}
              promoPhotos={promoPhotos}
              setPromoPhotos={setPromoPhotos}
              onNext={() => setCurrentStep('payment')}
              onBack={() => setCurrentStep('platforms')}
            />
          )}

          {/* Шаг 7: Оплата */}
          {currentStep === 'payment' && (
            <PaymentStep
              userId={user?.id}
              onPaymentSubmit={(receiptUrl) => setPaymentReceiptUrl(receiptUrl)}
              onNext={() => setCurrentStep('send')}
              onBack={() => setCurrentStep('promo')}
            />
          )}

          {/* Шаг 8: Отправка */}
          {currentStep === 'send' && (
            <SendStep
              releaseTitle={releaseTitle}
              artistName={artistName}
              genre={genre}
              tracksCount={tracks.length}
              coverFile={coverFile}
              collaborators={collaborators}
              subgenres={subgenres}
              releaseDate={releaseDate}
              selectedPlatforms={selectedPlatforms}
              agreedToContract={agreedToContract}
              focusTrack={focusTrack}
              focusTrackPromo={focusTrackPromo}
              albumDescription={albumDescription}
              promoPhotos={promoPhotos}
              tracks={tracks}
              platforms={selectedPlatformsList}
              countries={selectedCountries}
              onBack={() => setCurrentStep('payment')}
              paymentReceiptUrl={paymentReceiptUrl}
            />
          )}
          </div>
        </section>
      </div>
    </div>
  );
}
