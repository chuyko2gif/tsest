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
  onSkip?: () => void;  // Пропустить промо
  onFilled?: () => void; // Промо заполнено
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
  onBack,
  onSkip,
  onFilled
}: PromoStepProps) {
  const [localPromoPhotos, setLocalPromoPhotos] = useState<string[]>(externalPromoPhotos || []);
  const [photoInput, setPhotoInput] = useState('');
  const [showSkipModal, setShowSkipModal] = useState(false);

  // Используем внешние props если есть, иначе локальное состояние
  const promoPhotos = externalPromoPhotos ?? localPromoPhotos;
  const setPromoPhotos = setExternalPromoPhotos ?? setLocalPromoPhotos;
  
  const isSingleTrack = tracks.length === 1;
  const isAlbum = tracks.length > 1;
  
  // Промо теперь необязательно - просто переходим дальше
  const handleNext = () => {
    onFilled?.(); // Устанавливаем статус "заполнено"
    onNext();
  };
  
  const handleSkip = () => {
    setShowSkipModal(true);
  };

  const confirmSkip = () => {
    setShowSkipModal(false);
    onSkip?.(); // Устанавливаем статус "пропущено"
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
                  Промо-текст трека <span className="text-zinc-500 text-xs font-normal">(необязательно)</span>
                </h3>
                <p className="text-sm text-zinc-400">
                  Описание для сингла (рекомендуется 1500-2000 символов)
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
                onChange={(e) => setFocusTrackPromo(e.target.value)}
                placeholder="Расскажите об этом треке: история создания, настроение, особенности..."
                rows={6}
                maxLength={2000}
                className="w-full px-4 py-3.5 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border-2 outline-none resize-none transition-all border-white/10 hover:border-blue-500/40 focus:border-blue-500"
              />
            </div>
          </div>
        )}

        {/* Описание альбома (только для альбомов/EP) */}
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
                  Общее описание релиза <span className="text-zinc-500 text-xs font-normal">(необязательно)</span>
                </h3>
                <p className="text-sm text-zinc-400">
                  Описание релиза целиком (рекомендуется до 2500 символов)
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
            onChange={(e) => setAlbumDescription(e.target.value)}
            placeholder="Расскажите о релизе: концепция, вдохновение, процесс создания..."
            rows={6}
            maxLength={2500}
            className="w-full px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border outline-none resize-none border-white/10 hover:border-purple-500/40 focus:border-purple-500"
          />
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
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="https://disk.yandex.ru/..."
                disabled={promoPhotos.length >= 5}
                className="flex-1 px-3 sm:px-4 py-3 bg-gradient-to-br from-white/[0.07] to-white/[0.03] placeholder:text-zinc-600 rounded-xl border border-white/10 outline-none disabled:opacity-50 text-xs sm:text-sm break-all"
              />
              <button
                onClick={addPromoPhoto}
                disabled={promoPhotos.length >= 5 || !photoInput.trim()}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-medium transition text-sm"
              >
                Добавить
              </button>
            </div>

            {promoPhotos.length > 0 && (
              <div className="space-y-2">
                {promoPhotos.map((photo, idx) => (
                  <div key={idx} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-white/5 rounded-lg overflow-x-hidden">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-md bg-[#6050ba]/20 flex items-center justify-center text-xs sm:text-sm font-bold text-[#9d8df1] flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div className="flex-1 text-xs sm:text-sm text-zinc-300 truncate min-w-0">{photo}</div>
                    <button
                      onClick={() => removePromoPhoto(idx)}
                      className="px-2 sm:px-3 py-1 sm:py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-md text-xs sm:text-sm transition flex-shrink-0"
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

      <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 sm:justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center justify-center gap-2 order-2 sm:order-1">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
          <button onClick={handleSkip} className="px-6 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-xl font-bold transition flex items-center justify-center gap-2 border border-yellow-500/30">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="13 17 18 12 13 7"/>
              <polyline points="6 17 11 12 6 7"/>
            </svg>
            Пропустить
          </button>
          <button onClick={handleNext} className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition flex items-center justify-center gap-2">
            Далее
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
          </button>
        </div>
      </div>

      {/* Модальное окно подтверждения пропуска */}
      {showSkipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowSkipModal(false)}
          />
          
          {/* Modal */}
          <div className="relative w-full max-w-md backdrop-blur-xl bg-gradient-to-br from-white/[0.12] to-white/[0.04] border border-white/20 rounded-2xl p-6 shadow-2xl shadow-black/50 animate-fade-up">
            {/* Close button */}
            <button 
              onClick={() => setShowSkipModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
            
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center ring-1 ring-yellow-500/30">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-yellow-400">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            
            {/* Title & Description */}
            <h3 className="text-xl font-bold text-center text-white mb-2">
              Пропустить промо-материалы?
            </h3>
            <p className="text-sm text-center text-zinc-400 mb-6 leading-relaxed">
              Без промо-материалов вашему релизу будет сложнее продвигаться на платформах. 
              Рекомендуем заполнить хотя бы основные поля для лучшего результата.
            </p>
            
            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={() => setShowSkipModal(false)}
                className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition text-white"
              >
                Заполнить
              </button>
              <button 
                onClick={confirmSkip}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 hover:from-yellow-500/30 hover:to-orange-500/30 border border-yellow-500/30 rounded-xl font-bold transition text-yellow-400"
              >
                Да, пропустить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
