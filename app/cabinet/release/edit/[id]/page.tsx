"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import { supabase } from '../../../lib/supabase';
import {
  ReleaseInfoStep,
  TracklistStep,
  CountriesStep,
  ContractStep,
  PlatformsStep,
  PromoStep,
} from '../../create/components';

// Компонент для редактирования Exclusive релиза
export default function EditExclusiveReleasePage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const releaseId = params.id as string;
  const fromPage = searchParams.get('from') || 'cabinet'; // По умолчанию cabinet
  const isDraftMode = searchParams.get('draft') === 'true'; // Режим редактирования черновика

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState('release');
  const [isAdmin, setIsAdmin] = useState(false);
  const [releaseStatus, setReleaseStatus] = useState('');
  
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
    version?: string;
    producers?: string[];
    featuring?: string[];
  }>>([]);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [trackTitle, setTrackTitle] = useState('');
  const [trackLink, setTrackLink] = useState('');
  const [trackHasDrugs, setTrackHasDrugs] = useState(false);
  const [trackLyrics, setTrackLyrics] = useState('');
  const [trackLanguage, setTrackLanguage] = useState('');
  const [trackVersion, setTrackVersion] = useState('');
  const [trackProducers, setTrackProducers] = useState<string[]>([]);
  const [trackFeaturing, setTrackFeaturing] = useState<string[]>([]);
  
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
  
  const [saving, setSaving] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    loadRelease();
  }, [releaseId]);

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
      
      console.log('=== EXCLUSIVE RELEASE EDIT DEBUG ===');
      console.log('User ID:', user.id);
      console.log('Profile:', profile);
      console.log('Role:', profile?.role);
      
      const userIsAdmin = profile?.role === 'admin' || profile?.role === 'super_admin' || profile?.role === 'owner';
      console.log('Is Admin:', userIsAdmin);
      setIsAdmin(userIsAdmin);

      // Загружаем релиз - админы могут загружать любые релизы
      console.log('Building query for release ID:', releaseId);
      let query = supabase
        .from('releases_exclusive')
        .select('*')
        .eq('id', releaseId);
      
      // Обычные пользователи могут загружать только свои релизы
      if (!userIsAdmin) {
        console.log('Not admin - filtering by user_id:', user.id);
        query = query.eq('user_id', user.id);
      } else {
        console.log('Admin access - loading any release');
      }
      
      const { data: release, error } = await query.single();
      
      console.log('Query result:', { release, error });
      console.log('Release user_id:', release?.user_id);
      console.log('Current user_id:', user.id);

      if (error || !release) {
        console.error('Ошибка загрузки релиза:', error);
        alert('Релиз не найден или у вас нет прав на его редактирование');
        router.push(userIsAdmin ? '/admin' : '/cabinet');
        return;
      }

      // Обычные пользователи могут редактировать только pending и draft релизы
      // Админы могут редактировать любые релизы
      if (!userIsAdmin && release.status !== 'pending' && release.status !== 'draft') {
        alert('Редактирование возможно только для релизов на модерации или черновиков');
        router.push('/cabinet');
        return;
      }

      // Заполняем форму данными релиза
      console.log('=== LOADING RELEASE DATA ===');
      console.log('Focus Track from DB:', release.focus_track);
      console.log('Album Description from DB:', release.album_description);
      console.log('Cover URL from DB:', release.cover_url);
      console.log('Full release object:', release);
      
      setReleaseTitle(release.title || '');
      setArtistName(release.artist_name || '');
      setExistingCoverUrl(release.cover_url || '');
      console.log('Existing Cover URL set to:', release.cover_url || 'EMPTY');
      setGenre(release.genre || '');
      setSubgenres(release.subgenres || []);
      setReleaseDate(release.release_date || null);
      setCollaborators(release.collaborators || []);
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
      
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки релиза:', error);
      alert('Ошибка загрузки релиза');
      router.push(isAdmin ? '/admin' : '/cabinet');
    }
  };

  const handleSave = async (submitToModeration = false) => {
    if (!supabase || !releaseId) return;
    
    console.log('=== НАЧАЛО СОХРАНЕНИЯ ЧЕРНОВИКА ===');
    console.log('Submit to moderation:', submitToModeration);
    console.log('Release Status:', releaseStatus);
    console.log('Release ID:', releaseId);
    console.log('Existing Cover URL:', existingCoverUrl);
    console.log('Cover File:', coverFile);
    
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Нет пользователя!');
        return;
      }
      console.log('User ID:', user.id);

      // Если загружена новая обложка, загружаем её
      let coverUrl = existingCoverUrl; // Сохраняем существующую обложку
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('release-covers')
          .upload(fileName, coverFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('release-covers')
          .getPublicUrl(fileName);
          
        coverUrl = publicUrl;
      }

      // Обновляем релиз
      const updateData: any = {
        title: releaseTitle,
        artist_name: artistName,
        genre: genre,
        subgenres: subgenres,
        release_date: releaseDate,
        collaborators: collaborators,
        tracks: tracks,
        countries: selectedCountries,
        contract_agreed: agreedToContract,
        contract_agreed_at: agreedToContract ? new Date().toISOString() : null,
        platforms: selectedPlatformsList,
        focus_track: focusTrack,
        focus_track_promo: focusTrackPromo,
        album_description: albumDescription,
        promo_photos: promoPhotos,
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
      
      // Отладка: проверяем данные треков и промо
      console.log('=== SAVING EXCLUSIVE RELEASE ===');
      console.log('Треки для обновления:', JSON.stringify(tracks, null, 2));
      console.log('Focus Track:', focusTrack);
      console.log('Focus Track Promo:', focusTrackPromo);
      console.log('Album Description:', albumDescription);
      console.log('Submit to moderation:', submitToModeration);
      console.log('Cover URL:', coverUrl);
      console.log('Full updateData:', JSON.stringify(updateData, null, 2));

      // ПРОВЕРКА: Можем ли мы найти релиз перед обновлением?
      const checkQuery = await supabase
        .from('releases_exclusive')
        .select('*')
        .eq('id', releaseId)
        .eq('user_id', user.id)
        .single();
      
      console.log('=== ПРОВЕРКА ДОСТУПА К РЕЛИЗУ ===');
      console.log('Check result:', checkQuery);
      
      if (checkQuery.error) {
        console.error('ОШИБКА ДОСТУПА:', checkQuery.error);
        alert('Не удается найти релиз для обновления. Ошибка: ' + checkQuery.error.message);
        throw checkQuery.error;
      }
      
      console.log('Релиз найден, можно обновлять:', checkQuery.data);

      // Обновляем релиз - админы могут обновлять любые релизы
      let updateQuery = supabase
        .from('releases_exclusive')
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
        console.error('Ошибка UPDATE:', error);
        console.error('Полная информация об ошибке:', JSON.stringify(error, null, 2));
        alert('Ошибка сохранения: ' + error.message);
        throw error;
      }
      
      console.log('=== УСПЕШНОЕ СОХРАНЕНИЕ ===');
      console.log('Updated data:', data);
      console.log('Количество обновленных строк:', data?.length || 0);
      
      if (!data || data.length === 0) {
        console.error('ПРЕДУПРЕЖДЕНИЕ: Ни одна строка не была обновлена!');
        console.error('Release ID:', releaseId);
        console.error('User ID:', user.id);
        console.error('Is Admin:', isAdmin);
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
      console.error('Ошибка сохранения:', error);
      alert('Ошибка при сохранении релиза: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
      setSaving(false);
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

  // Проверка заполненности каждого шага
  const isStepComplete = (stepId: string): boolean => {
    switch(stepId) {
      case 'release':
        return !!(releaseTitle.trim() && genre && (coverFile || existingCoverUrl));
      case 'tracklist':
        return tracks.length > 0;
      case 'countries':
        return true; // Опциональный шаг
      case 'contract':
        return agreedToContract;
      case 'platforms':
        return selectedPlatforms > 0;
      case 'promo':
        return true; // Опциональный шаг
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
  ];

  // Подсчёт заполненных обязательных шагов
  const completedSteps = steps.filter(step => isStepComplete(step.id)).length;
  const totalRequiredSteps = steps.length;
  const progress = (completedSteps / totalRequiredSteps) * 100;

  return (
    <div className="min-h-screen pt-20 text-white relative z-10">
      <AnimatedBackground />
      <div className="max-w-[1600px] mx-auto p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-stretch relative z-10">
        
        {/* Боковая панель с шагами */}
        <aside className="lg:w-64 w-full bg-[#0d0d0f] border border-white/5 rounded-3xl p-6 flex flex-col lg:self-start lg:sticky lg:top-24">
          <div className="mb-6">
            <h3 className="font-bold text-lg">Редактирование релиза</h3>
          </div>
          
          <div className="space-y-2">
            {steps.map((step) => {
              const isComplete = isStepComplete(step.id);
              const isCurrent = currentStep === step.id;
              
              return (
                <button 
                  key={step.id} 
                  onClick={() => setCurrentStep(step.id)}
                  className={`w-full text-left py-3 px-4 rounded-xl flex items-center gap-3 transition-all ${
                    isCurrent 
                      ? 'bg-[#6050ba] text-white shadow-lg shadow-[#6050ba]/20' 
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'
                  }`}>
                    {isComplete ? (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                      </svg>
                    ) : (
                      step.icon
                    )}
                  </span>
                  <span className="text-sm font-medium">{step.label}</span>
                  {isCurrent && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Прогресс */}
          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="text-xs text-zinc-500 mb-2">Прогресс заполнения</div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#6050ba] to-[#9d8df1] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-zinc-400 mt-2 text-center">
              {completedSteps} из {totalRequiredSteps} шагов
            </div>
          </div>

          {/* Кнопки сохранения */}
          {isDraftMode && releaseStatus === 'draft' ? (
            <div className="space-y-3 mt-4">
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className={`w-full py-3 rounded-xl font-bold transition ${
                  saving
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {saving ? 'Сохранение...' : '💾 Сохранить черновик'}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving || progress < 100}
                className={`w-full py-4 rounded-xl font-bold transition ${
                  saving || progress < 100
                    ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                }`}
              >
                {saving ? 'Отправка...' : '✓ Отправить на модерацию'}
              </button>
              {progress < 100 && (
                <p className="text-xs text-zinc-500 text-center">
                  Заполните все обязательные поля для отправки
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className={`w-full mt-4 py-4 rounded-xl font-bold transition ${
                saving
                  ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
              }`}
            >
              {saving ? 'Сохранение...' : '✓ Сохранить изменения'}
            </button>
          )}
        </aside>

        {/* Основной контент */}
        <section className="flex-1 bg-[#0d0d0f] border border-white/5 rounded-3xl p-10 min-h-[600px]">
          
          {/* Кнопка возврата */}
          <div className="mb-6 pb-4 border-b border-white/5">
            <button 
              onClick={() => router.push(fromPage === 'admin' ? '/admin' : '/cabinet')}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition flex items-center gap-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="15 18 9 12 15 6" strokeWidth="2"/>
              </svg>
              {fromPage === 'admin' ? 'Вернуться в админ панель' : 'Вернуться в кабинет'}
            </button>
          </div>

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
              existingCoverUrl={existingCoverUrl}
              onBack={() => router.push('/cabinet')}
              onNext={() => setCurrentStep('tracklist')}
            />
          )}

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
              onBack={() => setCurrentStep('platforms')}
              onNext={() => setCurrentStep('release')}
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
  );
}
