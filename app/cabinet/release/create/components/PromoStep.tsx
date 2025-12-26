import React, { useState } from 'react';

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
  onNext, 
  onBack 
}: PromoStepProps) {
  const [localPromoPhotos, setLocalPromoPhotos] = useState<string[]>(externalPromoPhotos || []);
  const [photoInput, setPhotoInput] = useState('');
  const [errors, setErrors] = useState<{focusTrackPromo?: string; albumDescription?: string}>({});

  // Используем внешние props если есть, иначе локальное состояние
  const promoPhotos = externalPromoPhotos ?? localPromoPhotos;
  const setPromoPhotos = setExternalPromoPhotos ?? setLocalPromoPhotos;
  
  const isSingleTrack = tracks.length === 1;
  const isAlbum = tracks.length > 1;
  
  const validateAndNext = () => {
    const newErrors: {focusTrackPromo?: string; albumDescription?: string} = {};
    
    // Если один трек - требуем промо трека
    if (isSingleTrack && !focusTrackPromo.trim()) {
      newErrors.focusTrackPromo = 'Для сингла обязательно нужно заполнить промо-текст трека';
    }
    
    // Если альбом (больше 1 трека) - требуем описание альбома
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

  const addPromoPhoto = () => {
    if (photoInput.trim() && promoPhotos.length < 5) {
      setPromoPhotos([...promoPhotos, photoInput.trim()]);
      setPhotoInput('');
    }
  };

  const removePromoPhoto = (index: number) => {
    setPromoPhotos(promoPhotos.filter((_, i) => i !== index));
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
        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold mb-1">Фокус-трек</h3>
              <p className="text-sm text-zinc-400">Выберите основной трек для продвижения</p>
            </div>
          </div>
          
          {tracks.length > 0 ? (
            <select
              value={focusTrack}
              onChange={(e) => setFocusTrack(e.target.value)}
              className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] rounded-xl border border-white/10 outline-none appearance-none cursor-pointer"
            >
              <option value="" className="bg-[#1a1a1c]">Выберите фокус-трек</option>
              {tracks.map((track, idx) => (
                <option key={idx} value={track.title} className="bg-[#1a1a1c]">
                  {track.title || `Трек ${idx + 1}`}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-sm text-zinc-500 italic">Сначала добавьте треки во вкладке "Треклист"</div>
          )}
        </div>

        {/* Промо-текст для фокус-трека (только для синглов) */}
        {isSingleTrack && (
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="2"/>
                  <polyline points="14 2 14 8 20 8" strokeWidth="2"/>
                  <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2"/>
                  <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2"/>
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
              <div className="text-sm">
                <span className={focusTrackPromo.length > 2000 ? 'text-red-400' : 'text-zinc-500'}>
                  {focusTrackPromo.length}/2000
                </span>
              </div>
            </div>
            <textarea
              value={focusTrackPromo}
              onChange={(e) => {
                setFocusTrackPromo(e.target.value);
                if (errors.focusTrackPromo) setErrors({...errors, focusTrackPromo: undefined});
              }}
              placeholder="Расскажите об этом треке: история создания, настроение, особенности..."
              rows={6}
              maxLength={2000}
              className={`w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border outline-none resize-none ${
                errors.focusTrackPromo ? 'border-red-500/50' : 'border-white/10'
              }`}
            />
            {errors.focusTrackPromo && (
              <div className="mt-2 text-sm text-red-400 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {errors.focusTrackPromo}
              </div>
            )}
          </div>
        )}

        {/* Описание альбома (только для альбомов) */}
        {isAlbum && (
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
                  <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                  <line x1="12" y1="16" x2="12" y2="12" strokeWidth="2"/>
                  <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="2"/>
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
            <div>
              <h3 className="text-white font-bold mb-1">Промо-фотографии</h3>
              <p className="text-sm text-zinc-400">Добавьте ссылки на промо-фото (до 5 штук, JPG/PNG, Яндекс Диск)</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              <input
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="https://disk.yandex.ru/..."
                disabled={promoPhotos.length >= 5}
                className="flex-1 px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none disabled:opacity-50"
              />
              <button
                onClick={addPromoPhoto}
                disabled={promoPhotos.length >= 5 || !photoInput.trim()}
                className="px-6 py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition"
              >
                Добавить
              </button>
            </div>

            {promoPhotos.length > 0 && (
              <div className="space-y-2">
                {promoPhotos.map((photo, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 rounded-md bg-[#6050ba]/20 flex items-center justify-center text-sm font-bold text-[#9d8df1]">
                      {idx + 1}
                    </div>
                    <div className="flex-1 text-sm text-zinc-300 truncate">{photo}</div>
                    <button
                      onClick={() => removePromoPhoto(idx)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-sm transition"
                    >
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-zinc-500">
              Добавлено фотографий: {promoPhotos.length}/5
            </div>
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
