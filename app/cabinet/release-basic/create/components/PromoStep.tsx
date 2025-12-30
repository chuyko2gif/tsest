import React, { useState } from 'react';

export interface PromoPhotoFile {
  file: File;
  preview: string;
}

interface Track {
  title: string;
  link: string;
}

interface PromoPhotoFile {
  file: File;
  preview: string;
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
  promoPhotoFiles?: PromoPhotoFile[];
  setPromoPhotoFiles?: (value: PromoPhotoFile[]) => void;
  onNext: () => void;
  onBack: () => void;
}

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
  promoPhotoFiles,
  setPromoPhotoFiles,
  onNext, 
  onBack 
}: PromoStepProps) {
  const [localPromoPhotos, setLocalPromoPhotos] = useState<string[]>(externalPromoPhotos || []);
  const [photoInput, setPhotoInput] = useState('');
  const [errors, setErrors] = useState<{focusTrackPromo?: string; albumDescription?: string}>({});
  const [uploadError, setUploadError] = useState<string>('');

  // Используем внешние props если есть, иначе локальное состояние
  const promoPhotos = externalPromoPhotos ?? localPromoPhotos;
  const setPromoPhotos = setExternalPromoPhotos ?? setLocalPromoPhotos;
  
  const isSingleTrack = tracks.length === 1;
  const isAlbum = tracks.length > 1;
  
  // Обработчик загрузки фото
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !setPromoPhotoFiles) return;

    const currentCount = promoPhotoFiles?.length || 0;
    const availableSlots = 5 - currentCount;

    if (availableSlots === 0) {
      setUploadError('Максимум 5 фотографий');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, availableSlots);
    const newPhotos: PromoPhotoFile[] = [];

    filesToUpload.forEach(file => {
      // Проверка формата
      const isJpg = file.type === 'image/jpeg' || file.type === 'image/jpg';
      const isPng = file.type === 'image/png';
      
      if (!isJpg && !isPng) {
        setUploadError(`Файл ${file.name} имеет неподдерживаемый формат. Используйте JPG или PNG`);
        return;
      }

      // Проверка размера (макс 10 МБ)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError(`Файл ${file.name} слишком большой. Максимум 10 МБ`);
        return;
      }

      // Создание preview
      const preview = URL.createObjectURL(file);
      newPhotos.push({ file, preview });
    });

    if (newPhotos.length > 0) {
      setPromoPhotoFiles([...(promoPhotoFiles || []), ...newPhotos]);
      setUploadError('');
    }

    // Сброс input
    e.target.value = '';
  };

  // Удаление фото
  const removePhoto = (index: number) => {
    if (!promoPhotoFiles || !setPromoPhotoFiles) return;
    
    // Освобождаем URL preview
    URL.revokeObjectURL(promoPhotoFiles[index].preview);
    
    setPromoPhotoFiles(promoPhotoFiles.filter((_, i) => i !== index));
  };

  // Очистка preview при размонтировании
  React.useEffect(() => {
    return () => {
      promoPhotoFiles?.forEach(photo => {
        URL.revokeObjectURL(photo.preview);
      });
    };
  }, []);
  
  const validateAndNext = () => {
    const newErrors: {focusTrackPromo?: string; albumDescription?: string} = {};
    
    if (isSingleTrack && !focusTrackPromo.trim()) {
      newErrors.focusTrackPromo = 'Для сингла обязательно нужно заполнить промо-текст трека';
    }
    
    if (isAlbum && !albumDescription.trim()) {
      newErrors.albumDescription = 'Для альбома обязательно нужно заполнить общее описание релиза';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    onNext();
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500/20 to-yellow-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-orange-300">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Промо-материалы</h2>
            <p className="text-sm text-zinc-500 mt-1">Настройте промо-материалы для вашего релиза</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Выбор фокус-трека */}
        <div className="relative p-6 bg-gradient-to-br from-orange-500/10 via-transparent to-yellow-500/10 border border-orange-500/20 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-yellow-500/5 opacity-50"/>
          <div className="relative flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/30 to-yellow-500/30 flex items-center justify-center flex-shrink-0 ring-1 ring-orange-400/30">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-orange-300" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Фокус-трек</h3>
              <p className="text-sm text-zinc-400">Выберите основной трек для продвижения</p>
            </div>
          </div>
          
          {tracks.length > 0 ? (
            <div className="relative">
              <select
                value={focusTrack}
                onChange={(e) => setFocusTrack(e.target.value)}
                className="w-full px-4 py-3.5 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl border-2 border-white/10 hover:border-orange-500/40 focus:border-orange-500 outline-none appearance-none cursor-pointer transition-all font-medium"
              >
                <option value="" className="bg-[#1a1a1c]">Выберите фокус-трек</option>
                {tracks.map((track, idx) => (
                  <option key={idx} value={track.title} className="bg-[#1a1a1c]">
                    {track.title || `Трек ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="text-sm text-zinc-500 italic">Сначала добавьте треки во вкладке "Треклист"</div>
          )}
        </div>

        {/* Промо-текст для фокус-трека (только для синглов) */}
        {isSingleTrack && (
          <div className="relative p-6 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10 border border-blue-500/20 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-cyan-500/5 opacity-50"/>
            <div className="relative flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 flex items-center justify-center flex-shrink-0 ring-1 ring-blue-400/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-blue-300" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-1">
                  Промо-текст трека <span className="text-red-400">*</span>
                </h3>
                <p className="text-sm text-zinc-400">
                  Обязательное описание для сингла (1500-2000 символов)
                </p>
              </div>
              <div className="text-sm font-bold">
                <span className={focusTrackPromo.length > 2000 ? 'text-red-400' : 'text-zinc-500'}>
                  {focusTrackPromo.length}/2000
                </span>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={focusTrackPromo}
                onChange={(e) => {
                  setFocusTrackPromo(e.target.value);
                  if (errors.focusTrackPromo) setErrors({...errors, focusTrackPromo: undefined});
                }}
                placeholder="Расскажите об этом треке: история создания, настроение, особенности..."
                rows={6}
                maxLength={2000}
                className={`w-full px-4 py-3.5 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border-2 outline-none resize-none transition-all ${
                  errors.focusTrackPromo ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 hover:border-blue-500/40 focus:border-blue-500'
                }`}
              />
              {errors.focusTrackPromo && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  {errors.focusTrackPromo}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Описание альбома (только для альбомов) */}
        {isAlbum && (
          <div className="relative p-6 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 border border-purple-500/20 rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-50"/>
            <div className="relative flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center flex-shrink-0 ring-1 ring-purple-400/30">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-purple-300" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-white font-bold mb-1">
                  Общее описание альбома <span className="text-red-400">*</span>
                </h3>
                <p className="text-sm text-zinc-400">
                  Обязательное описание релиза целиком (до 2500 символов)
                </p>
              </div>
              <div className="text-sm">
                <span className={albumDescription.length > 2500 ? 'text-red-400' : 'text-zinc-500'}>
                  {albumDescription.length}/2500
                </span>
              </div>
            </div>
          <textarea
            value={albumDescription}
            onChange={(e) => {
              setAlbumDescription(e.target.value);
              if (errors.albumDescription) setErrors({...errors, albumDescription: undefined});
            }}
            placeholder="Расскажите о релизе: концепция, вдохновение, процесс создания..."
            rows={6}
            maxLength={2500}
            className={`w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border outline-none resize-none ${
              errors.albumDescription ? 'border-red-500/50' : 'border-white/10'
            }`}
          />
          {errors.albumDescription && (
            <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {errors.albumDescription}
            </div>
          )}
        </div>
        )}

        {/* Промо-фотографии */}
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <circle cx="8.5" cy="8.5" r="1.5" strokeWidth="2"/>
                <polyline points="21 15 16 10 5 21" strokeWidth="2"/>
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold mb-1">Промо-фотографии</h3>
              <p className="text-sm text-zinc-400">Загрузите до 5 фотографий (JPG/PNG, рекомендуемое разрешение 1920x1080px)</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Загрузчик файлов */}
            <label 
              className={`flex flex-col items-center justify-center gap-3 px-6 py-8 bg-gradient-to-br from-white/[0.07] to-white/[0.03] border-2 border-dashed rounded-xl cursor-pointer hover:border-purple-500/50 hover:bg-white/10 transition-all group ${
                (promoPhotoFiles?.length || 0) >= 5 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-zinc-400 group-hover:text-purple-400 transition" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <div className="text-center">
                <div className="text-sm font-medium text-white group-hover:text-purple-300 transition mb-1">
                  {(promoPhotoFiles?.length || 0) >= 5 ? 'Максимум 5 фотографий' : 'Нажмите для выбора фотографий'}
                </div>
                <div className="text-xs text-zinc-500">
                  или перетащите файлы сюда
                </div>
              </div>
              <input 
                type="file" 
                accept="image/jpeg,image/jpg,image/png"
                multiple
                onChange={handlePhotoUpload}
                disabled={(promoPhotoFiles?.length || 0) >= 5}
                className="hidden"
              />
            </label>

            {/* Ошибка валидации */}
            {uploadError && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400 flex-shrink-0 mt-0.5" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-sm text-red-400">{uploadError}</span>
              </div>
            )}

            {/* Превью загруженных фотографий */}
            {promoPhotoFiles && promoPhotoFiles.length > 0 && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Загружено фотографий: {promoPhotoFiles.length}/5
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {promoPhotoFiles.map((photo, idx) => (
                    <div key={idx} className="relative group">
                      <div className="aspect-video rounded-xl overflow-hidden bg-black/50 border border-white/10 group-hover:border-purple-500/50 transition-all">
                        <img 
                          src={photo.preview} 
                          alt={`Промо фото ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => removePhoto(idx)}
                          className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors shadow-lg"
                          title="Удалить фото"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-white">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                      <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/80 backdrop-blur-sm rounded-md text-xs font-bold text-white">
                        {idx + 1}
                      </div>
                      <div className="mt-2 text-xs text-zinc-500 truncate">
                        {photo.file.name}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Опциональное поле для ссылок (сохраняем для обратной совместимости) */}
            {(!promoPhotoFiles || promoPhotoFiles.length === 0) && (
              <div className="pt-3 border-t border-white/5">
                <p className="text-xs text-zinc-500 mb-3">Или добавьте ссылку на фото (Яндекс Диск / Google Drive)</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    placeholder="https://disk.yandex.ru/..."
                    disabled={promoPhotos.length >= 5}
                    className="flex-1 px-3 sm:px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none disabled:opacity-50 text-xs sm:text-sm break-all"
                  />
                  <button
                    onClick={() => {
                      if (photoInput.trim() && promoPhotos.length < 5) {
                        setPromoPhotos([...promoPhotos, photoInput.trim()]);
                        setPhotoInput('');
                      }
                    }}
                    disabled={promoPhotos.length >= 5 || !photoInput.trim()}
                    className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition text-sm"
                  >
                    Добавить
                  </button>
                </div>

                {promoPhotos.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {promoPhotos.map((photo, idx) => (
                      <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg overflow-x-hidden">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-[#6050ba]/20 flex items-center justify-center text-xs sm:text-sm font-bold text-[#9d8df1] flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1 text-xs sm:text-sm text-zinc-300 truncate min-w-0">{photo}</div>
                        <button
                          onClick={() => setPromoPhotos(promoPhotos.filter((_, i) => i !== idx))}
                          className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-xs sm:text-sm transition flex-shrink-0"
                        >
                          Удалить
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <button onClick={validateAndNext} className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition flex items-center gap-2">
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
}
