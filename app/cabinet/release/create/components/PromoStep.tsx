import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { showErrorToast, showSuccessToast } from '@/lib/utils/showToast';
import { useTheme } from '@/contexts/ThemeContext';

interface Track {
  title: string;
  link: string;
}

interface PromoStepProps {
  tracks: Track[];
  focusTrack: string;
  setFocusTrack: (value: string) => void;
  focusTrackPromo: string;
  setFocusTrackPromo: (value: string) => void;
  albumDescription: string;
  setAlbumDescription: (value: string) => void;
  promoPhotos?: string[];
  setPromoPhotos?: (value: string[]) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip?: () => void;  // Пропустить промо
  onFilled?: () => void; // Промо заполнено
  onResetSkip?: () => void; // Сбросить статус "пропущено"
  promoStatus?: 'not-started' | 'skipped' | 'filled'; // Текущий статус промо
}

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024; // 10 МБ в байтах

export default function PromoStep({ 
  tracks, 
  focusTrack,
  setFocusTrack,
  focusTrackPromo,
  setFocusTrackPromo,
  albumDescription,
  setAlbumDescription,
  promoPhotos: externalPromoPhotos,
  setPromoPhotos: setExternalPromoPhotos,
  onNext, 
  onBack,
  onSkip,
  onFilled,
  onResetSkip,
  promoStatus
}: PromoStepProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localPromoPhotos, setLocalPromoPhotos] = useState<string[]>(externalPromoPhotos || []);
  const [showSkipModal, setShowSkipModal] = useState(false);
  const [showFocusTrackDropdown, setShowFocusTrackDropdown] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Получаем userId при монтировании
  useEffect(() => {
    const getUser = async () => {
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();
  }, []);

  // Используем внешние props если есть, иначе локальное состояние
  const promoPhotos = externalPromoPhotos ?? localPromoPhotos;
  const setPromoPhotos = setExternalPromoPhotos ?? setLocalPromoPhotos;
  
  const isSingleTrack = tracks.length === 1;
  const isAlbum = tracks.length > 1;
  
  // Проверка валидности для перехода далее
  const isFormValid = focusTrack !== '' && promoPhotos.length > 0;
  
  // Сбрасываем статус "пропущено" при любом изменении данных
  const handleDataChange = () => {
    if (promoStatus === 'skipped') {
      onResetSkip?.();
    }
  };
  
  // Обработчики с автосбросом статуса
  const handleFocusTrackChange = (value: string) => {
    handleDataChange();
    setValidationError('');
    setFocusTrack(value);
    setShowFocusTrackDropdown(false);
  };
  
  const handleFocusTrackPromoChange = (value: string) => {
    handleDataChange();
    setFocusTrackPromo(value);
  };
  
  const handleAlbumDescriptionChange = (value: string) => {
    handleDataChange();
    setAlbumDescription(value);
  };
  
  // Промо - проверяем обязательные поля
  const handleNext = () => {
    // Проверяем наличие фокус-трека
    if (!focusTrack) {
      setValidationError('Выберите фокус-трек для продвижения');
      return;
    }
    // Проверяем наличие хотя бы одного промо-фото
    if (promoPhotos.length === 0) {
      setValidationError('Загрузите хотя бы одну промо-фотографию');
      return;
    }
    setValidationError('');
    // onFilled уже включает переход на следующий шаг
    onFilled?.();
  };
  
  const handleSkip = () => {
    setShowSkipModal(true);
  };

  const confirmSkip = () => {
    setShowSkipModal(false);
    onSkip?.(); // Устанавливаем статус "пропущено" и переходим на следующий шаг
    // Примечание: переход на следующий шаг теперь происходит внутри onSkip
  };

  const handleCancelSkip = () => {
    setShowSkipModal(false);
    onResetSkip?.(); // Сбрасываем статус "пропущено"
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - promoPhotos.length;
    if (remainingSlots <= 0) {
      showErrorToast('Максимум 5 фотографий');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    
    for (const file of filesToUpload) {
      // Проверка формата
      if (!file.type.match(/^image\/(jpeg|jpg|png|webp)$/)) {
        showErrorToast(`${file.name}: только JPG, PNG или WEBP`);
        continue;
      }

      // Проверка размера
      if (file.size > MAX_FILE_SIZE) {
        showErrorToast(`Файл "${file.name}" слишком большой (${(file.size / 1024 / 1024).toFixed(1)} МБ). Максимум: ${MAX_FILE_SIZE_MB} МБ`);
        continue;
      }

      setUploadingPhoto(true);
      try {
        if (!userId) {
          showErrorToast('Ошибка авторизации. Перезагрузите страницу.');
          continue;
        }
        
        if (!supabase) {
          showErrorToast('Ошибка подключения к базе данных.');
          continue;
        }
        
        const sb = supabase; // local alias for TypeScript
        
        // Генерируем уникальное имя файла с путём user_id для RLS
        const fileExt = file.name.split('.').pop();
        const fileName = `promo_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        // Загружаем в Supabase Storage (bucket: release-promo)
        const { error: uploadError } = await sb.storage
          .from('release-promo')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Проверяем тип ошибки
          if (uploadError.message?.includes('Payload too large') || uploadError.message?.includes('413')) {
            showErrorToast(`Файл "${file.name}" слишком большой. Максимум: ${MAX_FILE_SIZE_MB} МБ`);
          } else if (uploadError.message?.includes('not allowed') || uploadError.message?.includes('mime')) {
            showErrorToast(`Формат файла "${file.name}" не поддерживается. Используйте JPG, PNG или WEBP`);
          } else if (uploadError.message?.includes('Bucket not found')) {
            showErrorToast(`Хранилище не найдено. Обратитесь в поддержку.`);
          } else {
            showErrorToast(`Ошибка загрузки "${file.name}": ${uploadError.message || 'Неизвестная ошибка'}`);
          }
          continue;
        }

        // Получаем публичный URL
        const { data: urlData } = sb.storage
          .from('release-promo')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          handleDataChange();
          setValidationError('');
          setPromoPhotos([...promoPhotos, urlData.publicUrl]);
          showSuccessToast('Фото загружено');
        }
      } catch (err) {
        console.error('Upload error:', err);
        showErrorToast(`Ошибка загрузки: ${file.name}`);
      } finally {
        setUploadingPhoto(false);
      }
    }

    // Сбрасываем input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removePromoPhoto = (index: number) => {
    handleDataChange();
    setPromoPhotos(promoPhotos.filter((_, i) => i !== index));
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-5 sm:mb-8">
        <div className="flex items-center gap-2.5 sm:gap-3 mb-3">
          <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center ${isLight ? 'ring-1 ring-orange-300' : 'ring-1 ring-white/10'}`}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-300 sm:w-7 sm:h-7">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div>
            <h2 className={`text-xl sm:text-3xl font-black bg-gradient-to-r ${isLight ? 'from-gray-900 to-gray-600' : 'from-white to-zinc-400'} bg-clip-text text-transparent`}>Промо-материалы</h2>
            <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'} mt-0.5 sm:mt-1`}>Настройте промо-материалы для вашего релиза</p>
          </div>
        </div>
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Выбор фокус-трека - красивая версия */}
        <div className={`p-4 sm:p-6 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.02] border-white/5'} border rounded-xl sm:rounded-2xl`}>
          <div className="flex items-start gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-[#6050ba]/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 ${isLight ? 'ring-1 ring-purple-300' : 'ring-1 ring-purple-500/20'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-purple-400 sm:w-5 sm:h-5">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm sm:text-base mb-0.5 sm:mb-1`}>Фокус-трек</h3>
              <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Выберите основной трек для продвижения</p>
            </div>
          </div>
          
          {tracks.length > 0 ? (
            <div className={`relative ${showFocusTrackDropdown ? 'z-[9998]' : ''}`}>
              {/* Кнопка открытия выпадающего списка */}
              <button
                type="button"
                onClick={() => setShowFocusTrackDropdown(!showFocusTrackDropdown)}
                className={`w-full px-3 sm:px-4 py-3 sm:py-3.5 rounded-lg sm:rounded-xl border text-left transition-all duration-200 flex items-center justify-between group touch-manipulation ${
                  focusTrack 
                    ? `${isLight ? 'bg-purple-50 border-purple-300 hover:border-purple-400' : 'bg-gradient-to-br from-purple-500/10 to-violet-500/10 border-purple-500/30 hover:border-purple-500/50'}` 
                    : `${isLight ? 'bg-white border-gray-300 hover:border-gray-400' : 'bg-gradient-to-br from-white/[0.05] to-white/[0.02] border-white/10 hover:border-white/20'}`
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {focusTrack ? (
                    <>
                      <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br from-purple-500/30 to-violet-500/30 flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-purple-300 sm:w-3.5 sm:h-3.5" strokeWidth="2">
                          <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                        </svg>
                      </div>
                      <span className={`${isLight ? 'text-gray-900' : 'text-white'} font-medium text-sm sm:text-base truncate`}>{focusTrack}</span>
                    </>
                  ) : (
                    <>
                      <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg ${isLight ? 'bg-gray-100' : 'bg-white/5'} flex items-center justify-center`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`${isLight ? 'text-gray-400' : 'text-zinc-500'} sm:w-3.5 sm:h-3.5`} strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="12" y1="8" x2="12" y2="16"/>
                          <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                      </div>
                      <span className={`${isLight ? 'text-gray-500' : 'text-zinc-400'} text-sm sm:text-base`}>Выберите фокус-трек</span>
                    </>
                  )}
                </div>
                <svg 
                  width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                  className={`${isLight ? 'text-gray-400' : 'text-zinc-400'} transition-transform duration-200 ${showFocusTrackDropdown ? 'rotate-180' : ''}`}
                  strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              
              {/* Выпадающий список треков */}
              {showFocusTrackDropdown && (
                <div className={`absolute top-full left-0 right-0 mt-2 z-[9999] ${isLight ? 'bg-white border-gray-200' : 'bg-[#1a1a1c]/98 border-white/10'} backdrop-blur-xl border rounded-xl shadow-2xl shadow-black/50 overflow-hidden animate-fade-in`}>
                  <div className="p-2 max-h-[300px] overflow-y-auto [&::-webkit-scrollbar]:hidden">
                    {tracks.map((track, idx) => {
                      const isSelected = focusTrack === track.title;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleFocusTrackChange(track.title)}
                          className={`w-full px-3 py-3 rounded-lg text-left transition-all duration-150 flex items-center gap-3 group ${
                            isSelected 
                              ? `${isLight ? 'bg-purple-50 border border-purple-300' : 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30'}` 
                              : `${isLight ? 'hover:bg-gray-50 border border-transparent' : 'hover:bg-white/5 border border-transparent'}`
                          }`}
                        >
                          {/* Номер трека */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                            isSelected 
                              ? 'bg-gradient-to-br from-purple-500 to-violet-500 text-white shadow-lg shadow-purple-500/30' 
                              : `${isLight ? 'bg-gray-100 text-gray-500 group-hover:bg-gray-200' : 'bg-white/5 text-zinc-400 group-hover:bg-white/10'}`
                          }`}>
                            {idx + 1}
                          </div>
                          
                          {/* Название трека */}
                          <div className="flex-1 min-w-0">
                            <span className={`block truncate font-medium ${isSelected ? (isLight ? 'text-gray-900' : 'text-white') : (isLight ? 'text-gray-700' : 'text-zinc-300')}`}>
                              {track.title || `Трек ${idx + 1}`}
                            </span>
                          </div>
                          
                          {/* Индикатор выбора */}
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Оверлей для закрытия */}
              {showFocusTrackDropdown && (
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowFocusTrackDropdown(false)}
                />
              )}
            </div>
          ) : (
            <div className={`text-sm ${isLight ? 'text-gray-500' : 'text-zinc-500'} italic p-4 ${isLight ? 'bg-gray-50 border-gray-300' : 'bg-white/[0.02] border-white/10'} rounded-xl border border-dashed`}>
              <div className="flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={`${isLight ? 'text-gray-400' : 'text-zinc-600'}`} strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Сначала добавьте треки во вкладке "Треклист"
              </div>
            </div>
          )}
        </div>

        {/* Промо-текст для фокус-трека (только для синглов) */}
        {isSingleTrack && (
          <div className={`p-4 sm:p-6 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.02] border-white/5'} border rounded-xl sm:rounded-2xl`}>
            <div className="flex items-start gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1] sm:w-5 sm:h-5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
                  <polyline points="14 2 14 8 20 8" strokeWidth="2"/>
                  <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2"/>
                  <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm sm:text-base mb-0.5 sm:mb-1`}>
                  Промо-текст трека <span className={`${isLight ? 'text-gray-400' : 'text-zinc-500'} text-[10px] sm:text-xs font-normal`}>(необязательно)</span>
                </h3>
                <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                  Описание для сингла (рекомендуется 1500-2000 символов)
                </p>
              </div>
              <div className="text-xs sm:text-sm">
                <span className={focusTrackPromo.length > 2000 ? 'text-red-400' : (isLight ? 'text-gray-500' : 'text-zinc-500')}>
                  {focusTrackPromo.length}/2000
                </span>
              </div>
            </div>
            <textarea
              value={focusTrackPromo}
              onChange={(e) => handleFocusTrackPromoChange(e.target.value)}
              placeholder="Расскажите об этом треке: история создания, настроение, особенности..."
              rows={5}
              maxLength={2000}
              className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base ${isLight ? 'text-gray-900 bg-white border-gray-300 placeholder:text-gray-400 hover:border-purple-400 focus:border-purple-500' : 'text-white bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10 hover:border-purple-500/40 focus:border-purple-500'} rounded-lg sm:rounded-xl border outline-none resize-none`}
            />
          </div>
        )}

        {/* Описание альбома (только для альбомов/EP) */}
        {isAlbum && (
          <div className={`p-4 sm:p-6 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.02] border-white/5'} border rounded-xl sm:rounded-2xl`}>
            <div className="flex items-start gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1] sm:w-5 sm:h-5">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm sm:text-base mb-0.5 sm:mb-1`}>
                  Общее описание релиза <span className={`${isLight ? 'text-gray-400' : 'text-zinc-500'} text-[10px] sm:text-xs font-normal`}>(необязательно)</span>
                </h3>
                <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                  Описание релиза целиком (рекомендуется до 2500 символов)
                </p>
              </div>
              <div className="text-xs sm:text-sm">
                <span className={albumDescription.length > 2500 ? 'text-red-400' : (isLight ? 'text-gray-500' : 'text-zinc-500')}>
                  {albumDescription.length}/2500
                </span>
              </div>
            </div>
          <textarea
            value={albumDescription}
            onChange={(e) => handleAlbumDescriptionChange(e.target.value)}
            placeholder="Расскажите о релизе: концепция, вдохновение, процесс создания..."
            rows={5}
            maxLength={2500}
            className={`relative w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base ${isLight ? 'text-gray-900 bg-white border-gray-300 placeholder:text-gray-400 hover:border-purple-400 focus:border-purple-500' : 'text-white bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 border-white/10 hover:border-purple-500/40 focus:border-purple-500'} rounded-lg sm:rounded-xl border outline-none resize-none`}
          />
        </div>
        )}

        {/* Промо-фотографии */}
        <div className={`p-4 sm:p-6 ${isLight ? 'bg-gray-50 border-gray-200' : 'bg-white/[0.02] border-white/5'} border rounded-xl sm:rounded-2xl`}>
          <div className="flex items-start gap-2.5 sm:gap-3 mb-3 sm:mb-4">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1] sm:w-5 sm:h-5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
                <polyline points="21 15 16 10 5 21" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <h3 className={`${isLight ? 'text-gray-900' : 'text-white'} font-bold text-sm sm:text-base mb-0.5 sm:mb-1`}>Промо-фотографии</h3>
              <p className={`text-xs sm:text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>Загрузите фото артиста (до 5 штук, JPG/PNG/WEBP, макс. {MAX_FILE_SIZE_MB} МБ)</p>
            </div>
          </div>

          <div className="space-y-2.5 sm:space-y-3">
            {/* Кнопка загрузки */}
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                multiple
                onChange={handlePhotoUpload}
                disabled={promoPhotos.length >= 5 || uploadingPhoto}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={promoPhotos.length >= 5 || uploadingPhoto}
                className={`w-full py-3 sm:py-4 px-4 sm:px-6 border-2 border-dashed rounded-lg sm:rounded-xl transition-all flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 touch-manipulation ${
                  promoPhotos.length >= 5
                    ? `${isLight ? 'border-gray-300 bg-gray-100 text-gray-400' : 'border-zinc-700 bg-zinc-800/50 text-zinc-500'} cursor-not-allowed`
                    : isLight 
                      ? 'border-purple-400 hover:border-purple-500 bg-purple-50 hover:bg-purple-100 text-purple-700' 
                      : 'border-[#6050ba]/30 hover:border-[#6050ba]/60 bg-[#6050ba]/5 hover:bg-[#6050ba]/10 text-[#9d8df1]'
                }`}
              >
                {uploadingPhoto ? (
                  <>
                    <div className="w-5 h-5 border-2 border-[#9d8df1]/30 border-t-[#9d8df1] rounded-full animate-spin" />
                    <span className="font-medium text-sm sm:text-base">Загрузка...</span>
                  </>
                ) : (
                  <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isLight ? '#7c3aed' : 'currentColor'} strokeWidth="2" className="w-5 h-5 sm:w-6 sm:h-6">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    <span className={`font-medium text-sm sm:text-base ${isLight ? 'text-purple-700' : ''}`}>
                      {promoPhotos.length >= 5 ? 'Максимум фотографий' : 'Выбрать фотографии'}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Превью загруженных фото */}
            {promoPhotos.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
                {promoPhotos.map((photo, idx) => (
                  <div key={idx} className={`relative group aspect-square rounded-lg sm:rounded-xl overflow-hidden border ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
                    <img 
                      src={photo} 
                      alt={`Промо ${idx + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removePromoPhoto(idx)}
                        className="p-1.5 sm:p-2 bg-red-500/80 hover:bg-red-500 rounded-md sm:rounded-lg transition-colors touch-manipulation"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                    <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-black/70 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white">
                      {idx + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
              Загружено фотографий: {promoPhotos.length}/5
            </div>
          </div>
        </div>
      </div>

      {/* Ошибка валидации */}
      {validationError && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-red-400 flex-shrink-0">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 8v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="12" cy="16" r="1" fill="currentColor"/>
          </svg>
          <span className="text-red-400 text-sm">{validationError}</span>
        </div>
      )}

      <div className={`mt-6 sm:mt-8 pt-4 sm:pt-6 border-t ${isLight ? 'border-gray-200' : 'border-white/10'} flex flex-col sm:flex-row gap-2.5 sm:gap-3 sm:justify-between`}>
        <button onClick={onBack} className={`px-4 sm:px-6 py-2.5 sm:py-3 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl font-bold transition flex items-center justify-center gap-2 order-2 sm:order-1 text-sm sm:text-base touch-manipulation`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 order-1 sm:order-2">
          <button onClick={handleSkip} className={`px-4 sm:px-6 py-2.5 sm:py-3 ${isLight ? 'bg-yellow-100 hover:bg-yellow-200 text-yellow-700 border-yellow-300' : 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border-yellow-500/30'} rounded-xl font-bold transition flex items-center justify-center gap-2 border text-sm sm:text-base touch-manipulation`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <polyline points="13 17 18 12 13 7"/>
              <polyline points="6 17 11 12 6 7"/>
            </svg>
            Пропустить
          </button>
          <button 
            onClick={handleNext} 
            className={`px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm sm:text-base touch-manipulation ${
              isFormValid 
                ? 'bg-[#6050ba] hover:bg-[#7060ca]' 
                : `${isLight ? 'bg-[#6050ba]/30' : 'bg-[#6050ba]/50'} cursor-not-allowed`
            }`}
            style={{ color: 'white' }}
          >
            Далее
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" className="w-4 h-4"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
          </button>
        </div>
      </div>

      {/* Уведомление о пропуске промо */}
      {showSkipModal && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4 animate-slide-up">
          <div className={`relative overflow-hidden rounded-2xl ${isLight ? 'bg-white/95 border-gray-200' : 'bg-[#1a1625]/95 border-white/10'} backdrop-blur-xl border shadow-xl shadow-black/30`}>
            {/* Gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />
            
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-amber-400">
                    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className={`text-base font-semibold ${isLight ? 'text-gray-900' : 'text-white'} mb-1`}>
                    Пропустить промо?
                  </h4>
                  <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-zinc-400'} leading-relaxed`}>
                    Промо-материалы помогут вашему релизу получить больше внимания на платформах
                  </p>
                </div>
                
                {/* Close */}
                <button 
                  onClick={() => setShowSkipModal(false)}
                  className={`flex-shrink-0 w-7 h-7 rounded-full ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700' : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white'} flex items-center justify-center transition`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
              
              {/* Actions */}
              <div className={`flex items-center gap-3 mt-4 pt-4 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
                <button 
                  onClick={handleCancelSkip}
                  className={`flex-1 px-4 py-2.5 ${isLight ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' : 'bg-white/5 hover:bg-white/10 text-white'} rounded-xl text-sm font-medium transition-colors`}
                >
                  Заполнить
                </button>
                <button 
                  onClick={confirmSkip}
                  className={`flex-1 px-4 py-2.5 ${isLight ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 hover:border-amber-300 text-amber-600' : 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-500/20 hover:border-amber-500/30 text-amber-400'} border rounded-xl text-sm font-medium transition-all`}
                >
                  Да, пропустить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
