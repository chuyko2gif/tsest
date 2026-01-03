"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { supabase } from '../../lib/supabase';
import {
  ReleaseInfoStep,
  TracklistStep,
  CountriesStep,
  ContractStep,
  PlatformsStep,
  PromoStep,
  SendStep,
  LocalizationStep,
} from './components';

// Компонент боковой панели шагов
function StepsSidebar({ 
  currentStep, 
  setCurrentStep,
  onBack 
}: { 
  currentStep: string; 
  setCurrentStep: (step: string) => void;
  onBack: () => void;
}) {
  const steps = [
    { id: 'release', label: 'Релиз', icon: '1' },
    { id: 'tracklist', label: 'Треклист', icon: '2' },
    { id: 'countries', label: 'Страны', icon: '3' },
    { id: 'contract', label: 'Договор', icon: '4' },
    { id: 'platforms', label: 'Площадки', icon: '5' },
    { id: 'localization', label: 'Локализация', icon: '6' },
    { id: 'send', label: 'Отправка', icon: '7' },
  ];

  return (
    <aside className="lg:w-64 w-full bg-[#0d0d0f] border border-white/5 rounded-3xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-lg">Создание релиза</h3>
        <button 
          onClick={onBack}
          className="text-sm text-zinc-400 hover:text-white transition"
        >
          ← Назад
        </button>
      </div>
      
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <button 
            key={step.id} 
            onClick={() => setCurrentStep(step.id)}
            className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 transition-all ${
              currentStep === step.id 
                ? 'bg-[#6050ba] text-white shadow-lg shadow-[#6050ba]/20' 
                : 'text-zinc-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">{step.icon}</span>
            <span className="text-sm font-medium">{step.label}</span>
            {currentStep === step.id && (
              <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* Прогресс */}
      <div className="mt-auto pt-6 border-t border-white/5">
        <div className="text-xs text-zinc-500 mb-2">Прогресс заполнения</div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#6050ba] to-[#9d8df1] transition-all duration-500"
            style={{ width: `${((steps.findIndex(s => s.id === currentStep) + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </aside>
  );
}

export default function CreateReleasePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('release');
  
  // Release info state
  const [releaseTitle, setReleaseTitle] = useState('');
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
    hasDrugs: boolean;
    lyrics: string;
    language: string;
  }>>([]);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackLink, setTrackLink] = useState('');
  const [trackHasDrugs, setTrackHasDrugs] = useState(false);
  const [trackLyrics, setTrackLyrics] = useState('');
  const [trackLanguage, setTrackLanguage] = useState('');

  // Countries state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  // Contract state
  const [agreedToContract, setAgreedToContract] = useState(false);

  // Platforms state
  const [selectedPlatforms, setSelectedPlatforms] = useState(5);
  const [selectedPlatformsList, setSelectedPlatformsList] = useState<string[]>([]);

  // Promo state
  const [focusTrack, setFocusTrack] = useState('');
  const [focusTrackPromo, setFocusTrackPromo] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [promoPhotos, setPromoPhotos] = useState<string[]>([]);

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

  return (
    <div className="min-h-screen pt-20 text-white relative z-10">
      <AnimatedBackground />
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-stretch relative z-10">
        
        {/* Боковая панель с шагами */}
        <StepsSidebar 
          currentStep={currentStep} 
          setCurrentStep={setCurrentStep}
          onBack={() => router.push('/cabinet')}
        />

        {/* Основной контент */}
        <section className="flex-1 bg-[#0d0d0f] border border-white/5 rounded-3xl p-10 min-h-[600px]">
          
          {/* Кнопка возврата */}
          <div className="mb-6 pb-4 border-b border-white/5">
            <button 
              onClick={() => router.push('/cabinet')}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15 18 9 12 15 6" strokeWidth="2"/>
              </svg>
              Вернуться в кабинет
            </button>
          </div>

          {/* Шаг 1: Информация о релизе */}
          {currentStep === 'release' && (
            <ReleaseInfoStep
              releaseTitle={releaseTitle}
              setReleaseTitle={setReleaseTitle}
              artistName={nickname}
              setArtistName={setNickname}
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
              onNext={() => setCurrentStep('tracklist')}
            />
          )}

          {/* Шаг 2: Треклист */}
          {currentStep === 'tracklist' && (
            <TracklistStep
              releaseTitle={releaseTitle}
              tracks={tracks}
              setTracks={setTracks}
              currentTrack={currentTrack}
              setCurrentTrack={setCurrentTrack}
              trackTitle={trackTitle}
              setTrackTitle={setTrackTitle}
              trackLink={trackLink}
              setTrackLink={setTrackLink}
              trackHasDrugs={trackHasDrugs}
              setTrackHasDrugs={setTrackHasDrugs}
              trackLyrics={trackLyrics}
              setTrackLyrics={setTrackLyrics}
              trackLanguage={trackLanguage}
              setTrackLanguage={setTrackLanguage}
              onNext={() => setCurrentStep('countries')}
              onBack={() => setCurrentStep('release')}
            />
          )}

          {/* Шаг 3: Страны */}
          {currentStep === 'countries' && (
            <CountriesStep
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
              onNext={() => setCurrentStep('localization')}
              onBack={() => setCurrentStep('contract')}
            />
          )}

          {/* Шаг 6: Локализация */}
          {currentStep === 'localization' && (
            <LocalizationStep
              onNext={() => setCurrentStep('send')}
              onBack={() => setCurrentStep('platforms')}
            />
          )}

          {/* Шаг 7: Отправка */}
          {currentStep === 'send' && (
            <SendStep
              releaseTitle={releaseTitle}
              artistName={nickname}
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
              onBack={() => setCurrentStep('localization')}
            />
          )}
        </section>
      </div>
    </div>
  );
}
