'use client';
import React, { useState, useCallback, useRef } from 'react';
import Cropper from 'react-easy-crop';
import { ROLE_CONFIG, UserRole } from '../../lib/types';

type Area = {
  width: number;
  height: number;
  x: number;
  y: number;
};

interface AvatarCropModalProps {
  show: boolean;
  onClose: () => void;
  avatar: string;
  nickname: string;
  role: UserRole;
  uploadingAvatar: boolean;
  deletingAvatar?: boolean;
  onSaveImage: (croppedImageBlob: Blob) => void;
  onDelete: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

/**
 * Создает canvas из области кадрирования
 */
const createCroppedImage = async (
  imageSrc: string,
  pixelCrop: Area,
  outputSize: number = 400
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No 2d context');
  }

  // Выходной размер всегда квадратный
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Рисуем с масштабированием до нужного размера
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Canvas is empty'));
      }
    }, 'image/jpeg', 0.92);
  });
};

const createImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.crossOrigin = 'anonymous';
    image.src = url;
  });
};

export default function AvatarCropModal({
  show,
  onClose,
  avatar,
  nickname,
  role,
  uploadingAvatar,
  deletingAvatar = false,
  onSaveImage,
  onDelete,
  showNotification,
}: AvatarCropModalProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = ROLE_CONFIG[role];

  // Сброс при открытии/закрытии и блокировка скролла
  React.useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setZoom(1);
      setImageSrc(null);
      setIsCropping(false);
      setIsProcessing(false);
      setCrop({ x: 0, y: 0 });
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Можно загружать только изображения', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Файл слишком большой. Максимум 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string);
      setIsCropping(true);
      setZoom(1);
      setCrop({ x: 0, y: 0 });
    });
    reader.readAsDataURL(file);
    
    // Сбрасываем input для возможности повторного выбора того же файла
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSaveCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsProcessing(true);
    try {
      const croppedImageBlob = await createCroppedImage(imageSrc, croppedAreaPixels, 400);
      onSaveImage(croppedImageBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
      showNotification('Ошибка при обработке изображения', 'error');
      setIsProcessing(false);
    }
  };

  const handleCancelCrop = () => {
    setImageSrc(null);
    setIsCropping(false);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleClose = () => {
    setImageSrc(null);
    setIsCropping(false);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
    onClose();
  };

  if (!show) return null;

  const isLoading = uploadingAvatar || deletingAvatar || isProcessing;

  return (
    <>
      {/* Полноэкранный оверлей загрузки */}
      {isLoading && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[250] flex items-center justify-center animate-in fade-in duration-200">
          <div className="text-center">
            {/* Анимированный спиннер */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#6050ba] animate-spin"></div>
              <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#9d8df1] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }}></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-8 h-8 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-white text-lg font-bold mb-2">
              {deletingAvatar ? 'Удаление аватара...' : isProcessing ? 'Обработка...' : 'Загрузка аватара...'}
            </p>
            <p className="text-zinc-400 text-sm">Пожалуйста, подождите</p>
          </div>
        </div>
      )}
      
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] animate-in fade-in duration-200"
        onClick={!isLoading ? handleClose : undefined}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-[#18181b] border border-white/10 rounded-2xl w-full max-w-[380px] pointer-events-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex justify-between items-center px-5 py-4 border-b border-white/5">
            <h3 className="text-lg font-bold text-white">
              {isCropping ? 'Настройка фото' : 'Аватар профиля'}
            </h3>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="p-2 hover:bg-white/10 rounded-xl transition-all duration-200 group disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-5">
            {isCropping && imageSrc ? (
              <>
                {/* Cropper Area */}
                <div 
                  className="relative w-full aspect-square bg-black/50 rounded-2xl overflow-hidden mb-5"
                  onWheel={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const delta = e.deltaY * -0.002;
                    const newZoom = Math.min(Math.max(zoom + delta, 1), 3);
                    setZoom(newZoom);
                  }}
                >
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    cropShape="rect"
                    showGrid={false}
                    zoomWithScroll={false}
                    style={{
                      containerStyle: {
                        borderRadius: '1rem',
                      },
                      cropAreaStyle: {
                        borderRadius: '1rem',
                        border: '3px solid rgba(255, 255, 255, 0.6)',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
                      },
                    }}
                  />
                </div>

                {/* Zoom Control */}
                <div className="mb-5">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        value={zoom}
                        min={1}
                        max={3}
                        step={0.01}
                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #6050ba 0%, #6050ba ${(zoom - 1) * 50}%, rgba(255,255,255,0.1) ${(zoom - 1) * 50}%, rgba(255,255,255,0.1) 100%)`,
                        }}
                      />
                    </div>
                    <button 
                      onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                    <span className="text-xs text-zinc-400 w-12 text-right font-mono">{Math.round(zoom * 100)}%</span>
                  </div>
                </div>

                {/* Info */}
                <div className="mb-5 p-3 bg-[#6050ba]/10 border border-[#6050ba]/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#9d8df1] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-[#9d8df1]">
                      Перемещайте и масштабируйте изображение
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleCancelCrop}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={handleSaveCroppedImage}
                    disabled={isLoading}
                    className="flex-1 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-semibold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Сохранить
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Avatar Preview */}
                <div className="flex justify-center mb-6">
                  <div className="relative group">
                    <div
                      className={`w-36 h-36 rounded-2xl ${
                        avatar ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.color}`
                      } flex items-center justify-center text-5xl font-black border-2 ${
                        config.borderColor
                      } overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]`}
                      style={{
                        boxShadow: `0 0 40px ${config.glowColor}, 0 8px 32px rgba(0,0,0,0.4)`,
                        backgroundImage: avatar ? `url(${avatar})` : 'none',
                      }}
                    >
                      {!avatar && (
                        <span className="text-white/90">{nickname.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    {/* Декоративное свечение */}
                    <div 
                      className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 blur-xl"
                      style={{ background: config.glowColor }}
                    />
                  </div>
                </div>

                {/* Upload Button */}
                <label className="block w-full mb-4 cursor-pointer group">
                  <div className="py-5 bg-white/5 hover:bg-white/10 border-2 border-dashed border-white/20 hover:border-[#6050ba]/50 rounded-2xl transition-all duration-200">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#6050ba]/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                        <svg className="w-6 h-6 text-[#9d8df1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-white font-medium mb-1">Выбрать фото</p>
                        <p className="text-xs text-zinc-500">PNG, JPG • до 5 MB</p>
                      </div>
                    </div>
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileChange} 
                  />
                </label>

                {/* Delete Button */}
                {avatar && (
                  <button
                    onClick={onDelete}
                    disabled={isLoading}
                    className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 text-red-400 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Удалить аватар
                  </button>
                )}

                {/* Recommendations */}
                <div className="mt-4 p-3 bg-zinc-900/50 rounded-xl">
                  <p className="text-[11px] text-zinc-500 text-center">
                    Рекомендуемый размер: 400×400 пикселей
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 0 0 2px rgba(96, 80, 186, 0.3);
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3), 0 0 0 2px rgba(96, 80, 186, 0.3);
        }
      `}</style>
    </>
  );
}
