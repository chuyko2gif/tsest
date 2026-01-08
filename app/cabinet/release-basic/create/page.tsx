"use client";
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { supabase } from '../../lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';
import { showSuccessToast, showErrorToast } from '@/lib/utils/showToast';
import { getAllCountries } from '@/components/icons/CountryFlagsSVG';
import { getPaymentTotal } from '@/lib/utils/calculatePayment';
import DepositModal from '@/app/cabinet/components/finance/DepositModal';
import { TrackAuthor } from '@/components/ui/TrackAuthors';
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
  getAllPlatforms,
} from './components';

export type ReleaseType = 'single' | 'ep' | 'album';

// Fullscreen Loading Overlay для сохранения релиза
function FullscreenLoadingOverlay({ message = "Сохраняем релиз" }: { message?: string }) {
  return (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh' }}>
      {/* Мягкие фоновые круги */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/3 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative text-center max-w-md px-8">
        {/* Центральная анимация - виниловая пластинка */}
        <div className="relative mb-10">
          <div className="w-36 h-36 mx-auto relative">
            {/* Внешнее свечение */}
            <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/20 via-purple-500/20 to-indigo-500/20 rounded-full blur-xl animate-pulse" style={{ animationDuration: '3s' }}></div>
            
            {/* Пластинка */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-2xl animate-spin" style={{ animationDuration: '3s' }}>
              {/* Текстура винила */}
              <div className="absolute inset-2 rounded-full border border-zinc-700/50"></div>
              <div className="absolute inset-4 rounded-full border border-zinc-700/30"></div>
              <div className="absolute inset-6 rounded-full border border-zinc-700/20"></div>
              <div className="absolute inset-8 rounded-full border border-zinc-700/20"></div>
              <div className="absolute inset-10 rounded-full border border-zinc-700/30"></div>
              
              {/* Блик на пластинке */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
              
              {/* Центральный лейбл */}
              <div className="absolute inset-[40%] rounded-full bg-gradient-to-br from-violet-400/90 to-purple-600/90 flex items-center justify-center shadow-inner">
                <div className="w-2 h-2 bg-zinc-900 rounded-full"></div>
              </div>
            </div>
            
            {/* Плавающие ноты */}
            <div className="absolute -top-2 -right-2 text-violet-400/60 animate-bounce" style={{ animationDuration: '2s' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div className="absolute -bottom-1 -left-3 text-indigo-400/50 animate-bounce" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Текст */}
        <h3 className="text-2xl font-bold text-white mb-3">
          {message}
        </h3>
        <p className="text-zinc-500 mb-8 text-sm leading-relaxed">
          Загружаем файлы и сохраняем данные<br/>
          <span className="text-zinc-600">Пожалуйста, не закрывайте страницу</span>
        </p>
        
        {/* Прогресс бар - минималистичный */}
        <div className="relative h-1 bg-zinc-800 rounded-full overflow-hidden mb-6 mx-8">
          <div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
            style={{ 
              animation: 'loading-progress 2s ease-in-out infinite',
              width: '40%'
            }}
          ></div>
        </div>
        
        {/* Мягкие точки загрузки */}
        <div className="flex justify-center gap-2">
          <span className="w-1.5 h-1.5 bg-violet-400/70 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
          <span className="w-1.5 h-1.5 bg-purple-400/70 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
          <span className="w-1.5 h-1.5 bg-indigo-400/70 rounded-full animate-pulse" style={{ animationDelay: '600ms' }}></span>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes loading-progress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(150%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

// Компонент боковой панели шагов
function StepsSidebar({ 
  currentStep, 
  setCurrentStep,
  onBackToCabinet,
  releaseTitle,
  releaseType,
  selectedTracksCount,
  genre,
  coverFile,
  releaseDate,
  tracksCount,
  agreedToContract,
  selectedPlatforms,
  selectedCountries,
  focusTrack,
  focusTrackPromo,
  albumDescription,
  paymentTransactionId,
  promoStatus,
  isLight
}: { 
  currentStep: string; 
  setCurrentStep: (step: string) => void;
  onBackToCabinet: () => void;
  releaseTitle: string;
  releaseType: ReleaseType | null;
  selectedTracksCount: number | undefined;
  genre: string;
  coverFile: File | null;
  releaseDate: string;
  tracksCount: number;
  agreedToContract: boolean;
  selectedPlatforms: number;
  selectedCountries: string[];
  focusTrack: string;
  focusTrackPromo: string;
  albumDescription: string;
  paymentTransactionId: string | null;
  promoStatus: 'not-started' | 'skipped' | 'filled';
  isLight: boolean;
}) {
  // Минимальное количество треков в зависимости от типа релиза
  const getMinTracks = (type: ReleaseType | null): number => {
    if (type === 'ep') return 2;
    if (type === 'album') return 8;
    return 1; // single
  };

  // Проверка заполненности каждого шага
  const isStepComplete = (stepId: string): boolean => {
    switch(stepId) {
      case 'release':
        return !!(releaseTitle.trim() && genre && coverFile && releaseDate);
      case 'tracklist':
        return tracksCount >= getMinTracks(releaseType);
      case 'countries':
        return selectedCountries.length > 0;
      case 'contract':
        return agreedToContract;
      case 'platforms':
        return selectedPlatforms > 0;
      case 'promo':
        return promoStatus !== 'not-started'; // Завершён если skipped или filled
      case 'payment':
        return !!paymentTransactionId;
      case 'send':
        return false; // Финальный шаг
      default:
        return false;
    }
  };

  // Получить статус промо шага
  const getPromoStepStatus = (): 'complete' | 'skipped' | 'incomplete' => {
    if (promoStatus === 'filled') return 'complete';
    if (promoStatus === 'skipped') return 'skipped';
    return 'incomplete';
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

  // 6 основных шагов для прогресса (промо считается если заполнен ИЛИ пропущен)
  const mainStepIds = ['release', 'tracklist', 'countries', 'contract', 'platforms', 'promo'];
  const completedSteps = mainStepIds.filter(id => isStepComplete(id)).length;
  const totalRequiredSteps = 6;
  const progress = (completedSteps / totalRequiredSteps) * 100;

  // Плавный градиент от красного через оранжевый/желтый к зелёному
  const getProgressColor = () => {
    // От 0 до 6 шагов - плавный переход
    if (completedSteps === 0) return { from: '#ef4444', to: '#dc2626' }; // red
    if (completedSteps === 1) return { from: '#f97316', to: '#ea580c' }; // orange
    if (completedSteps === 2) return { from: '#fb923c', to: '#f97316' }; // orange-light
    if (completedSteps === 3) return { from: '#fbbf24', to: '#f59e0b' }; // amber
    if (completedSteps === 4) return { from: '#a3e635', to: '#84cc16' }; // lime
    if (completedSteps === 5) return { from: '#4ade80', to: '#22c55e' }; // green-light
    return { from: '#10b981', to: '#059669' }; // emerald (6/6)
  };

  const progressColor = getProgressColor();
  const [mobileStepsOpen, setMobileStepsOpen] = useState(false);

  return (
    <>
      {/* Десктоп версия - вертикальная боковая панель */}
      <aside className={`hidden lg:flex lg:w-64 w-full backdrop-blur-xl border rounded-3xl p-6 pb-8 flex-col lg:self-start lg:sticky lg:top-24 shadow-2xl relative overflow-hidden ${
        isLight
          ? 'bg-[rgba(255,255,255,0.45)] border-white/60 shadow-purple-500/10'
          : 'bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-white/10 shadow-black/20'
      }`}>
        {/* Декоративный градиент */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        
        {/* Заголовок с кнопкой назад */}
        <div className="mb-4 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <h3 className={`font-bold text-lg bg-gradient-to-r bg-clip-text text-transparent ${
              isLight ? 'from-[#2a2550] to-[#4a4570]' : 'from-white to-zinc-300'
            }`}>Создание релиза</h3>
            <button
              onClick={onBackToCabinet}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 flex items-center justify-center transition-all group/back"
              title="В кабинет"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-400 group-hover/back:text-white transition-colors">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
          <p className={`text-xs ${isLight ? 'text-[#5a5580]' : 'text-zinc-400'}`}>Basic Plan</p>
        </div>
      
      {/* Индикатор типа релиза */}
      {releaseType && (
        <div className="mb-3 p-3 backdrop-blur-lg bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-blue-500/20 border border-white/20 rounded-xl relative overflow-hidden group hover:border-white/30 transition-all">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Формат</span>
              {/* Кнопка изменения типа - скрыта если есть оплата */}
              {!paymentTransactionId && (
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
              {/* Индикатор блокировки если оплачено */}
              {paymentTransactionId && (
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
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
                  {releaseType === 'ep' && (selectedTracksCount ? `${selectedTracksCount} треков` : '2-7 треков')}
                  {releaseType === 'album' && (selectedTracksCount ? `${selectedTracksCount} треков` : '8-50 треков')}
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
                isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10'
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
              {isCurrent && (
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
            <span className="text-zinc-400 font-bold">6</span>
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
                width: `${(completedSteps / 6) * 100}%`
              }}
            />
          )}
          
          {/* Фоновые сегменты */}
          <div className="flex gap-1.5 relative">
            {[0, 1, 2, 3, 4, 5].map((i) => (
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
          {completedSteps === 6 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 shadow-lg shadow-emerald-500/20">
              <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span className="text-[11px] font-semibold text-emerald-400">Готово к отправке</span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-500">
              Осталось <span className="font-semibold" style={{ color: progressColor.from }}>{6 - completedSteps}</span> {6 - completedSteps === 1 ? 'шаг' : 'шагов'}
            </span>
          )}
        </div>
      </div>
    </aside>

      {/* Мобильная версия - компактная полоса прогресса с раскрывающимся списком */}
      <div className="lg:hidden w-full mb-3">
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
                      {steps.find(s => s.id === currentStep)?.label || 'Выбор типа'}
                    </div>
                    <div className={`text-[10px] ${isLight ? 'text-[#5a5580]' : 'text-zinc-500'}`}>
                      {releaseType ? (
                        releaseType === 'single' ? 'Сингл' : 
                        releaseType === 'ep' ? 'EP' : 
                        'Альбом'
                      ) : 'Шаг 0 из 7'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Стрелка раскрытия по центру */}
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
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div 
                      key={i} 
                      className={`w-4 h-1.5 rounded-full transition-all duration-300 ${
                        i < completedSteps 
                          ? '' 
                          : isLight ? 'bg-purple-200/50' : 'bg-white/10'
                      }`}
                      style={i < completedSteps ? { 
                        background: `linear-gradient(135deg, ${progressColor.from}, ${progressColor.to})`,
                        boxShadow: `0 0 4px ${progressColor.from}60`
                      } : undefined}
                    />
                  ))}
                </div>
                <span className="text-xs font-bold" style={{ color: progressColor.from }}>
                  {completedSteps}/6
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
                        isComplete ? (isLight ? 'bg-emerald-500/30 text-emerald-700' : 'bg-emerald-500/20 text-emerald-500') : 
                        isLight ? 'bg-purple-200/70 text-purple-800' : 'bg-white/10 text-zinc-400'
                      }`}>
                        {(isComplete || isPromoSkipped || isPromoFilled) && step.id !== 'send' ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                          </svg>
                        ) : step.id === 'send' ? (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M22 2L15 22L11 13L2 9L22 2Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
    </>
  );
}

export default function CreateReleaseBasicPage() {
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
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
  const [releaseArtists, setReleaseArtists] = useState<string[]>([]); // Новый массив артистов (объединяет artistName + collaborators)
  const [contributors, setContributors] = useState<Array<{role: 'composer' | 'lyricist' | 'producer' | 'arranger' | 'performer' | 'mixer' | 'mastering' | 'other'; fullName: string}>>([]);
  
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
    authors?: TrackAuthor[];
    hasDrugs: boolean;
    lyrics: string;
    language: string;
    version?: string;
    producers?: string[];
    featuring?: string[];
    isInstrumental?: boolean;
    originalFileName?: string;
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
  const [trackAuthors, setTrackAuthors] = useState<TrackAuthor[]>([]);
  const [trackHasDrugs, setTrackHasDrugs] = useState(false);
  const [trackLyrics, setTrackLyrics] = useState('');
  const [trackLanguage, setTrackLanguage] = useState('');
  const [trackVersion, setTrackVersion] = useState('');
  const [trackProducers, setTrackProducers] = useState<string[]>([]);
  const [trackFeaturing, setTrackFeaturing] = useState<string[]>([]);
  const [trackIsInstrumental, setTrackIsInstrumental] = useState(false);
  
  // Countries state - сразу выбраны все страны
  const [selectedCountries, setSelectedCountries] = useState<string[]>(() => getAllCountries());
  
  // Platforms state - сразу выбраны все площадки
  const [selectedPlatformsList, setSelectedPlatformsList] = useState<string[]>(() => getAllPlatforms());
  const [selectedPlatforms, setSelectedPlatforms] = useState(() => getAllPlatforms().length);
  
  // Contract state
  const [agreedToContract, setAgreedToContract] = useState(false);
  
  // Promo state
  const [focusTrack, setFocusTrack] = useState('');
  const [focusTrackPromo, setFocusTrackPromo] = useState('');
  const [albumDescription, setAlbumDescription] = useState('');
  const [promoPhotos, setPromoPhotos] = useState<string[]>([]);
  const [promoStatus, setPromoStatus] = useState<'not-started' | 'skipped' | 'filled'>('not-started');
  
  // Payment state - теперь через баланс
  const [paymentTransactionId, setPaymentTransactionId] = useState<string | null>(null);
  const [isPaid, setIsPaid] = useState(false); // Флаг оплаченности релиза
  const [showDepositModal, setShowDepositModal] = useState(false);
  
  // Draft state
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPayingLater, setIsPayingLater] = useState(false); // Отдельное состояние для "Оплатить позже"
  const [mounted, setMounted] = useState(false);
  
  // Состояние завершённости шагов для отслеживания появления галочек
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  
  // Mount effect для portal
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Предупреждение при попытке уйти со страницы с несохранёнными данными
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Если оплачено но релиз не в черновике - сохраняем в localStorage для возврата при следующем входе
      if (isPaid && paymentTransactionId && draftId) {
        // Сохраняем информацию о потенциально потерянном платеже
        const orphanedPayment = {
          releaseId: draftId,
          transactionId: paymentTransactionId,
          timestamp: Date.now(),
          releaseTitle: releaseTitle
        };
        localStorage.setItem('thq_orphaned_payment', JSON.stringify(orphanedPayment));
      }
      
      // Предупреждаем если есть несохранённая оплата или важные данные
      if (isPaid && !draftId) {
        e.preventDefault();
        e.returnValue = 'У вас есть оплаченный релиз, который ещё не сохранён. Вы уверены, что хотите уйти?';
        return e.returnValue;
      }
      // Предупреждаем если есть несохранённый черновик с данными
      if (releaseTitle && !draftId && currentStep !== 'type') {
        e.preventDefault();
        e.returnValue = 'У вас есть несохранённые изменения. Вы уверены, что хотите уйти?';
        return e.returnValue;
      }
    };
    
    // При успешной отправке - удаляем запись о потерянном платеже
    const clearOrphanedPayment = () => {
      localStorage.removeItem('thq_orphaned_payment');
    };
    
    // Слушаем событие видимости страницы для отслеживания возврата на сайт
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Проверяем есть ли потерянный платёж
        const orphanedPaymentStr = localStorage.getItem('thq_orphaned_payment');
        if (orphanedPaymentStr) {
          const orphanedPayment = JSON.parse(orphanedPaymentStr);
          // Если платёж старше 5 минут - автовозврат будет при входе в кабинет
          if (Date.now() - orphanedPayment.timestamp > 5 * 60 * 1000) {
            // Потерянный платёж будет обработан в кабинете
          }
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaid, draftId, releaseTitle, currentStep, paymentTransactionId]);
  
  // Минимальное количество треков в зависимости от типа релиза
  const getMinTracksForValidation = (type: typeof releaseType): number => {
    if (type === 'ep') return 2;
    if (type === 'album') return 8;
    return 1; // single
  };

  // Функция проверки завершённости шага
  const isStepComplete = (stepId: string): boolean => {
    switch(stepId) {
      case 'release':
        // Требуем хотя бы 1 артиста в releaseArtists
        return !!(releaseTitle.trim() && releaseArtists.length > 0 && genre && coverFile && releaseDate);
      case 'tracklist':
        return tracks.length >= getMinTracksForValidation(releaseType);
      case 'countries':
        return selectedCountries.length > 0;
      case 'contract':
        return agreedToContract;
      case 'platforms':
        return selectedPlatforms > 0;
      case 'promo':
        return promoStatus !== 'not-started'; // Завершён если skipped или filled
      case 'payment':
        return !!paymentTransactionId;
      default:
        return false;
    }
  };
  
  // Проверка обязательных шагов для "Оплатить позже"
  const canPayLater = !!(
    releaseTitle.trim() && 
    releaseArtists.length > 0 &&
    genre && 
    coverFile && 
    releaseDate &&
    tracks.length >= getMinTracksForValidation(releaseType) && 
    selectedCountries.length > 0 && 
    agreedToContract && 
    selectedPlatforms > 0
  );

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
      // Автозаполнение имени артиста из никнейма
      setArtistName(displayName);
      // Автозаполнение массива артистов никнеймом пользователя
      setReleaseArtists([displayName]);
      setLoading(false);
    };
    
    getUser();
  }, [router]);
  
  // Отслеживание завершённости шагов - сохраняем черновик когда появляется новая галочка
  useEffect(() => {
    if (!user || !supabase || !genre) return;
    
    const steps = ['release', 'tracklist', 'countries', 'contract', 'platforms', 'promo'];
    const newlyCompleted: string[] = [];
    
    steps.forEach(stepId => {
      const isComplete = isStepComplete(stepId);
      if (isComplete && !completedSteps.has(stepId)) {
        newlyCompleted.push(stepId);
      }
    });
    
    if (newlyCompleted.length > 0) {
      // Обновляем набор завершённых шагов
      setCompletedSteps(prev => {
        const newSet = new Set(prev);
        newlyCompleted.forEach(s => newSet.add(s));
        return newSet;
      });
      
      // Сохраняем черновик
      saveDraft().then(() => {
        showSuccessToast('Черновик сохранён');
      });
    }
  }, [releaseTitle, genre, coverFile, releaseDate, tracks.length, selectedCountries.length, 
      agreedToContract, selectedPlatforms, focusTrack, focusTrackPromo, albumDescription, promoStatus, user]);
  
  // ВАЖНО: Автоматическое создание черновика при переходе на шаг оплаты (для безопасности)
  // УДАЛЕНО: Это вызывало создание двух черновиков, т.к. onEnsureDraft в PaymentStep тоже создаёт черновик
  // Теперь черновик создаётся ТОЛЬКО через onEnsureDraft при нажатии кнопки оплаты
  // useEffect(() => {
  //   const ensureDraftBeforePayment = async () => {
  //     if (currentStep === 'payment' && !draftId && user && supabase && releaseTitle) {
  //       console.log('💰 Переход на оплату без черновика - создаём его...');
  //       const newDraftId = await saveDraft();
  //       if (newDraftId) {
  //         console.log('✅ Черновик создан перед оплатой:', newDraftId);
  //       } else {
  //         console.error('❌ Не удалось создать черновик перед оплатой!');
  //         showErrorToast('Ошибка: не удалось сохранить релиз перед оплатой');
  //         setCurrentStep('promo');
  //       }
  //     }
  //   };
  //   ensureDraftBeforePayment();
  // }, [currentStep, draftId, user, releaseTitle]);
  
  // Ref для отслеживания предыдущего количества треков и авторов
  const prevTracksCountRef = useRef<number | null>(null);
  const prevContributorsCountRef = useRef<number | null>(null);

  // Автосохранение при изменении треков
  useEffect(() => {
    if (!user || !supabase || !draftId) return;
    
    // Пропускаем первую загрузку
    if (prevTracksCountRef.current === null) {
      prevTracksCountRef.current = tracks.length;
      return;
    }
    
    // Если количество треков изменилось - сохраняем
    if (prevTracksCountRef.current !== tracks.length && tracks.length > 0) {
      saveDraft().then(() => {
        showSuccessToast('Треклист сохранён');
      });
      prevTracksCountRef.current = tracks.length;
    }
  }, [tracks.length, user, draftId]);

  // Автосохранение при изменении авторов
  useEffect(() => {
    if (!user || !supabase || !draftId) return;
    
    // Пропускаем первую загрузку
    if (prevContributorsCountRef.current === null) {
      prevContributorsCountRef.current = contributors.length;
      return;
    }
    
    // Если количество авторов изменилось - сохраняем
    if (prevContributorsCountRef.current !== contributors.length) {
      saveDraft().then(() => {
        showSuccessToast('Авторы сохранены');
      });
      prevContributorsCountRef.current = contributors.length;
    }
  }, [contributors.length, user, draftId]);
  
  // Функция автосохранения черновика
  const saveDraft = async () => {
    if (!user || !supabase || isSavingDraft) return null;
    
    setIsSavingDraft(true);
    try {
      let coverUrl = null;
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('releases')
          .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
        
        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('releases')
            .getPublicUrl(fileName);
          coverUrl = publicUrl;
        }
      }
      
      // Подготавливаем треки для сохранения
      // Загружаем аудио файлы в storage если есть
      const storage = supabase.storage;
      const tracksForSave = await Promise.all(tracks.map(async (track, index) => {
        let audioUrl = track.link || '';
        let originalFileName = track.originalFileName || '';
        
        // Если есть аудио файл - ВСЕГДА загружаем его
        if (track.audioFile) {
          try {
            const audioExt = track.audioFile.name.split('.').pop();
            const audioFileName = `${user.id}/draft-track-${Date.now()}-${index}.${audioExt}`;
            
            const { error: audioError } = await storage
              .from('release-audio')
              .upload(audioFileName, track.audioFile, { contentType: track.audioFile.type, upsert: true });
            
            if (!audioError) {
              const { data: { publicUrl } } = storage
                .from('release-audio')
                .getPublicUrl(audioFileName);
              audioUrl = publicUrl;
              originalFileName = track.audioFile.name;
              
              // Обновляем track.link в state чтобы не загружать повторно
              // Сохраняем originalFileName для отображения
              const updatedTracks = [...tracks];
              updatedTracks[index] = { 
                ...track, 
                link: publicUrl, 
                audioFile: null,
                originalFileName: track.audioFile?.name || track.originalFileName || ''
              };
              setTracks(updatedTracks);
            } else {
              originalFileName = track.audioFile?.name || originalFileName;
            }
          } catch {
            originalFileName = track.audioFile?.name || originalFileName;
          }
        }
        
        return {
          title: track.title,
          link: audioUrl,
          hasDrugs: track.hasDrugs,
          lyrics: track.lyrics,
          language: track.language,
          version: track.version,
          producers: track.producers,
          featuring: track.featuring,
          isInstrumental: track.isInstrumental,
          audioMetadata: track.audioMetadata,
          originalFileName: originalFileName,
        };
      }));
      
      const draftData = {
        user_id: user.id,
        title: releaseTitle || 'Без названия',
        artist_name: releaseArtists.length > 0 ? releaseArtists[0] : (artistName || nickname),
        cover_url: coverUrl,
        genre: genre,
        subgenres: subgenres.length > 0 ? subgenres : null,
        release_date: releaseDate,
        collaborators: releaseArtists.length > 1 ? releaseArtists.slice(1) : (collaborators.length > 0 ? collaborators : null),
        contributors: contributors.length > 0 ? contributors : null,
        release_artists: releaseArtists.length > 0 ? releaseArtists : null, // Новое поле
        tracks: tracksForSave.length > 0 ? tracksForSave : null,
        countries: selectedCountries.length > 0 ? selectedCountries : null,
        platforms: selectedPlatformsList.length > 0 ? selectedPlatformsList : null,
        contract_agreed: agreedToContract,
        contract_agreed_at: agreedToContract ? new Date().toISOString() : null,
        focus_track: focusTrack || null,
        focus_track_promo: focusTrackPromo || null,
        album_description: albumDescription || null,
        promo_photos: promoPhotos.length > 0 ? promoPhotos : null,
        is_promo_skipped: promoStatus === 'skipped',
        release_type: releaseType,
        selected_tracks_count: selectedTracksCount,
        status: 'draft',
        updated_at: new Date().toISOString()
      };
      
      if (draftId) {
        const { error } = await supabase
          .from('releases_basic')
          .update(draftData)
          .eq('id', draftId);
        
        if (error) {
          throw error;
        }
        return draftId;
      } else {
        const { data, error } = await supabase
          .from('releases_basic')
          .insert([draftData])
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        if (data) {
          setDraftId(data.id);
          return data.id;
        }
      }
    } catch {
      alert('Ошибка сохранения черновика. Проверьте консоль.');
    } finally {
      setIsSavingDraft(false);
    }
    return null;
  };
  
  // Обработчик перехода на следующий шаг
  const handleNextStep = async (nextStep: string) => {
    // Черновик уже сохраняется автоматически при завершении шага
    setCurrentStep(nextStep);
  };
  
  // Обработчик "Оплатить позже" - сохраняет релиз со статусом awaiting_payment
  const handlePayLater = async () => {
    if (!user || !supabase) {
      showErrorToast('Ошибка: пользователь не авторизован');
      return;
    }
    
    // Проверяем что все обязательные шаги заполнены
    if (!canPayLater) {
      showErrorToast('Заполните все обязательные шаги перед сохранением');
      return;
    }
    
    setIsPayingLater(true);
    
    try {
      if (!supabase) throw new Error('Supabase не инициализирован');
      
      // Загружаем обложку
      let coverUrl = null;
      if (coverFile) {
        const fileExt = coverFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase!.storage
          .from('releases')
          .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
        
        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase!.storage
            .from('releases')
            .getPublicUrl(fileName);
          coverUrl = publicUrl;
        }
      }
      
      // Загружаем аудиофайлы треков
      const tracksWithUrls = await Promise.all(tracks.map(async (track) => {
        if (track.audioFile) {
          const audioExt = track.audioFile.name.split('.').pop();
          const audioFileName = `${user.id}/tracks/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${audioExt}`;
          
          const { error: audioUploadError } = await supabase!.storage
            .from('audio')
            .upload(audioFileName, track.audioFile, { contentType: track.audioFile.type });
          
          if (!audioUploadError) {
            const { data: { publicUrl: audioPublicUrl } } = supabase!.storage
              .from('audio')
              .getPublicUrl(audioFileName);
            
            return {
              title: track.title,
              link: audioPublicUrl,
              hasDrugs: track.hasDrugs,
              lyrics: track.lyrics,
              language: track.language,
              version: track.version,
              producers: track.producers,
              featuring: track.featuring,
              audioMetadata: track.audioMetadata,
              originalFileName: track.audioFile?.name || track.originalFileName || '',
            };
          }
        }
        
        return {
          title: track.title,
          link: track.link || '',
          hasDrugs: track.hasDrugs,
          lyrics: track.lyrics,
          language: track.language,
          version: track.version,
          producers: track.producers,
          featuring: track.featuring,
          audioMetadata: track.audioMetadata,
          originalFileName: track.audioFile?.name || track.originalFileName || '',
        };
      }));
      
      // Сохраняем релиз со статусом awaiting_payment
      // Расчёт стоимости на основе типа релиза и количества треков
      const paymentAmount = getPaymentTotal(releaseType, tracks.length);
      
      const releaseData = {
        user_id: user.id,
        title: releaseTitle,
        artist_name: releaseArtists.length > 0 ? releaseArtists[0] : (artistName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Artist'),
        cover_url: coverUrl,
        genre: genre,
        subgenres: subgenres,
        release_date: releaseDate,
        collaborators: releaseArtists.length > 1 ? releaseArtists.slice(1) : collaborators,
        release_artists: releaseArtists.length > 0 ? releaseArtists : null,
        tracks: tracksWithUrls,
        countries: selectedCountries,
        contract_agreed: agreedToContract,
        contract_agreed_at: agreedToContract ? new Date().toISOString() : null,
        platforms: selectedPlatformsList,
        focus_track: focusTrack,
        focus_track_promo: focusTrackPromo,
        album_description: albumDescription,
        promo_photos: promoPhotos,
        release_type: releaseType,
        status: 'awaiting_payment',
        payment_status: 'pending',
        payment_amount: paymentAmount,
      };
      
      if (draftId) {
        const { error: updateError } = await supabase
          .from('releases_basic')
          .update({ ...releaseData, updated_at: new Date().toISOString() })
          .eq('id', draftId)
          .eq('user_id', user.id);
        
        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('releases_basic')
          .insert(releaseData);
        
        if (insertError) throw insertError;
      }
      
      // Удаляем черновики
      if (draftId) {
        await supabase
          .from('releases_basic')
          .delete()
          .eq('user_id', user.id)
          .eq('status', 'draft')
          .eq('title', releaseTitle);
      }
      
      showSuccessToast('Релиз сохранён! Оплатите его в личном кабинете');
      router.push('/cabinet');
      
    } catch (error: any) {
      showErrorToast(error.message || 'Ошибка сохранения релиза');
    } finally {
      setIsPayingLater(false);
    }
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

  // Шаг 0: Выбор типа релиза (заблокирован после оплаты)
  if (currentStep === 'type') {
    // Если уже есть оплата, нельзя менять тип
    if (paymentTransactionId) {
      setCurrentStep('release');
      return null;
    }
    return (
      <ReleaseTypeSelector 
        onSelectType={(type: 'single' | 'ep' | 'album') => {
          setReleaseType(type);
          setCurrentStep('release');
        }}
        onBack={() => router.push('/cabinet')}
      />
    );
  }

  return (
    <>
      {/* Full-screen loading overlay только для "Оплатить позже" */}
      {mounted && isPayingLater && createPortal(<FullscreenLoadingOverlay message="Сохраняем релиз" />, document.body)}
      
      {/* Модалка пополнения баланса */}
      {showDepositModal && user && (
        <DepositModal
          userId={user.id}
          onClose={() => setShowDepositModal(false)}
          showNotification={(message, type) => {
            if (type === 'success') {
              showSuccessToast(message);
            } else {
              showErrorToast(message);
            }
          }}
        />
      )}
      
      {/* Мобильная кнопка назад - рендерится через Portal в body */}
      {mounted && createPortal(
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            router.push('/cabinet');
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
            ? 'bg-purple-500/90 hover:bg-purple-500 border border-purple-300/50' 
            : 'bg-zinc-900/90 hover:bg-zinc-800/90 border border-white/20'
        }`}
        title="В кабинет"
        aria-label="Вернуться в кабинет"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`${isLight ? 'text-purple-600' : 'text-zinc-400'} pointer-events-none`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>,
      document.body
      )}
      
      <div className="min-h-screen pt-20 text-white relative z-10">
        <AnimatedBackground />
        
        <div className="max-w-[1600px] mx-auto p-6 lg:p-8 flex flex-col lg:flex-row gap-8 items-stretch relative z-20">
        
          {/* Боковая панель с шагами */}
          <StepsSidebar 
            currentStep={currentStep} 
            setCurrentStep={setCurrentStep}
            onBackToCabinet={() => router.push('/cabinet')}
            releaseTitle={releaseTitle}
            releaseType={releaseType}
            selectedTracksCount={selectedTracksCount}
            genre={genre}
            coverFile={coverFile}
            releaseDate={releaseDate || ''}
            tracksCount={tracks.length}
            agreedToContract={agreedToContract}
            selectedPlatforms={selectedPlatforms}
            selectedCountries={selectedCountries}
            focusTrack={focusTrack}
            focusTrackPromo={focusTrackPromo}
            albumDescription={albumDescription}
            paymentTransactionId={paymentTransactionId}
            promoStatus={promoStatus}
          isLight={isLight}
        />

        {/* Основной контент */}
        <section className={`flex-1 backdrop-blur-xl border rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-10 min-h-[500px] shadow-2xl relative overflow-hidden ${
          isLight
            ? 'bg-[rgba(255,255,255,0.45)] border-white/60 shadow-purple-500/10'
            : 'bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-white/10 shadow-black/20'
        }`}>
          {/* Декоративный градиент */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-blue-500/5 pointer-events-none" />
          
          <div className="relative z-10">
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
              contributors={contributors}
              setContributors={setContributors}
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
              trackAuthors={trackAuthors}
              setTrackAuthors={setTrackAuthors}
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
              trackIsInstrumental={trackIsInstrumental}
              setTrackIsInstrumental={setTrackIsInstrumental}
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
              onSkip={() => { setPromoStatus('skipped'); setCurrentStep('payment'); }}
              onFilled={() => { setPromoStatus('filled'); setCurrentStep('payment'); }}
              onResetSkip={() => setPromoStatus('not-started')}
              promoStatus={promoStatus}
            />
          )}

          {/* Шаг 7: Оплата */}
          {currentStep === 'payment' && (
            <PaymentStep
              userId={user?.id}
              releaseId={draftId} // Передаём ID черновика для привязки оплаты
              releaseType={releaseType}
              tracksCount={tracks.length}
              releaseTitle={releaseTitle}
              releaseArtist={releaseArtists[0] || artistName}
              isPaid={isPaid} // Передаём статус оплаты
              onPaymentComplete={async (transactionId, alreadyPaid) => {
                setPaymentTransactionId(transactionId);
                setIsPaid(true);
                
                // Обновляем черновик с информацией об оплате
                // Черновик уже должен быть создан через onEnsureDraft перед оплатой
                if (supabase && !alreadyPaid && draftId) {
                  try {
                    await supabase
                      .from('releases_basic')
                      .update({
                        is_paid: true,
                        payment_transaction_id: transactionId,
                        paid_at: new Date().toISOString()
                        // status остаётся 'draft' - НЕ меняем на awaiting_payment!
                      })
                      .eq('id', draftId);
                  } catch {
                    // Ошибка сохранения оплаты
                  }
                }
              }}
              onPayLater={handlePayLater}
              canPayLater={canPayLater}
              onNext={() => setCurrentStep('send')}
              onBack={() => setCurrentStep('promo')}
              onOpenDeposit={() => setShowDepositModal(true)}
              onEnsureDraft={async () => {
                // Функция для создания черновика перед оплатой
                if (draftId) return draftId;
                const newId = await saveDraft();
                return newId;
              }}
            />
          )}

          {/* Шаг 8: Отправка */}
          {currentStep === 'send' && (
            <SendStep
              releaseTitle={releaseTitle}
              artistName={artistName}
              genre={genre}
              releaseType={releaseType}
              tracksCount={tracks.length}
              coverFile={coverFile}
              collaborators={collaborators}
              releaseArtists={releaseArtists}
              subgenres={subgenres}
              releaseDate={releaseDate}
              selectedPlatforms={selectedPlatforms}
              agreedToContract={agreedToContract}
              focusTrack={focusTrack}
              focusTrackPromo={focusTrackPromo}
              albumDescription={albumDescription}
              promoPhotos={promoPhotos}
              promoStatus={promoStatus}
              contributors={contributors}
              tracks={tracks}
              platforms={selectedPlatformsList}
              countries={selectedCountries}
              onBack={() => setCurrentStep('payment')}
              draftId={draftId}
              paymentTransactionId={paymentTransactionId}
            />
          )}
          </div>
        </section>
        </div>
      </div>
    </>
  );
}
