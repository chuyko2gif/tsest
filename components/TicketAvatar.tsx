'use client';

import React, { useState, useMemo, memo, useCallback, useEffect } from 'react';

interface TicketAvatarProps {
  src?: string | null;
  name?: string;
  email?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isAdmin?: boolean;
  role?: string;
  className?: string;
  showRing?: boolean;
}

// Генерируем стабильный цвет на основе имени/email
const getGradientColor = (name: string): string => {
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-purple-500 to-pink-600',
    'from-green-500 to-emerald-600',
    'from-orange-500 to-red-600',
    'from-cyan-500 to-blue-600',
    'from-pink-500 to-rose-600',
    'from-amber-500 to-orange-600',
    'from-teal-500 to-cyan-600',
    'from-violet-500 to-purple-600',
    'from-lime-500 to-green-600',
  ];
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  
  return colors[Math.abs(hash) % colors.length];
};

// Размеры аватарок
const sizeClasses = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

// Размеры иконки админа
const adminIconSizes = {
  xs: 'w-2.5 h-2.5',
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

// Компонент аватарки
const TicketAvatar = memo(function TicketAvatar({
  src,
  name = '',
  email = '',
  size = 'md',
  isAdmin = false,
  role,
  className = '',
  showRing = false,
}: TicketAvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Сбрасываем ошибку при изменении src
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Получаем инициал
  const initial = useMemo(() => {
    const displayName = name || email || 'U';
    return displayName.charAt(0).toUpperCase();
  }, [name, email]);

  // Получаем стабильный цвет градиента
  const gradientColor = useMemo(() => {
    const colorKey = name || email || 'default';
    return getGradientColor(colorKey);
  }, [name, email]);

  // Определяем кольцо роли
  const ringClass = useMemo(() => {
    if (!showRing || !role) return '';
    switch (role) {
      case 'owner':
        return 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[#0d0d0f]';
      case 'admin':
        return 'ring-2 ring-red-500 ring-offset-2 ring-offset-[#0d0d0f]';
      case 'exclusive':
        return 'ring-2 ring-amber-500 ring-offset-2 ring-offset-[#0d0d0f]';
      default:
        return '';
    }
  }, [showRing, role]);

  // Обработчик ошибки загрузки
  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    console.error('Avatar load error:', src, e);
    setHasError(true);
  }, [src]);

  // Базовые классы
  const baseClasses = `
    ${sizeClasses[size]}
    rounded-full
    flex-shrink-0
    flex items-center justify-center
    font-bold
    overflow-hidden
    ${ringClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  // Проверяем, есть ли валидный src (должен быть URL)
  const isValidUrl = src && typeof src === 'string' && src.trim() !== '' && 
    (src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:') || src.startsWith('/'));
  const hasValidSrc = isValidUrl && !hasError;

  // Обёртка с индикатором админа
  const wrapWithAdminBadge = (content: React.ReactNode) => {
    if (!isAdmin) return content;
    
    return (
      <div className="relative" title={name || email || 'Администратор'}>
        {content}
        {/* Маленький щит-бейдж для админа */}
        <div className={`absolute -bottom-0.5 -right-0.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center border border-zinc-800 ${
          size === 'xs' ? 'w-2.5 h-2.5' : size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'
        }`}>
          <svg 
            className={`text-white ${size === 'xs' ? 'w-1.5 h-1.5' : size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5'}`} 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
      </div>
    );
  };

  // Показываем изображение, если есть src и нет ошибки
  if (hasValidSrc) {
    return wrapWithAdminBadge(
      <div 
        className={`${baseClasses} border ${isAdmin ? 'border-green-500/50' : 'border-zinc-700'}`}
        title={name || email}
      >
        <img
          key={src} // Принудительно перемонтируем при смене src
          src={src}
          alt={name || email || 'Avatar'}
          className="w-full h-full object-cover"
          onError={handleError}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Fallback - инициал с градиентом (для админов используем зелёный градиент)
  const fallbackGradient = isAdmin ? 'from-green-500 to-emerald-600' : gradientColor;
  
  return wrapWithAdminBadge(
    <div 
      className={`${baseClasses} bg-gradient-to-br ${fallbackGradient}`}
      title={name || email}
    >
      <span className="text-white font-bold">{initial}</span>
    </div>
  );
});

export default TicketAvatar;

// Пустые функции для совместимости
export const preloadAvatars = (_urls: string[]) => {};
export const clearAvatarCache = () => {};
