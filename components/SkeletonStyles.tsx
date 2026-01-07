"use client";

import { useEffect, memo } from 'react';

/**
 * SKELETON STYLES INJECTOR 💀
 * 
 * Автоматически добавляет красивые skeleton-лоадеры:
 * 1. Пульсация для loading состояний
 * 2. Shimmer эффект для контента
 * 3. Плавное появление при загрузке
 */

const SkeletonStyles = memo(() => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const existing = document.getElementById('skeleton-styles');
    if (existing) return;
    
    const style = document.createElement('style');
    style.id = 'skeleton-styles';
    style.textContent = `
      /* Базовый skeleton */
      .skeleton {
        background: linear-gradient(90deg, 
          rgba(255, 255, 255, 0.05) 25%, 
          rgba(255, 255, 255, 0.1) 50%, 
          rgba(255, 255, 255, 0.05) 75%
        );
        background-size: 200% 100%;
        animation: skeleton-shimmer 1.5s ease-in-out infinite;
        border-radius: 8px;
      }
      
      /* Light theme skeleton */
      [data-theme="light"] .skeleton,
      .light .skeleton {
        background: linear-gradient(90deg, 
          rgba(0, 0, 0, 0.05) 25%, 
          rgba(0, 0, 0, 0.1) 50%, 
          rgba(0, 0, 0, 0.05) 75%
        );
        background-size: 200% 100%;
      }
      
      @keyframes skeleton-shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
      
      /* Для слабых устройств - без анимации */
      html.perf-ultra-low .skeleton {
        animation: none;
        background: rgba(255, 255, 255, 0.08);
      }
      
      /* Skeleton варианты */
      .skeleton-text {
        height: 1em;
        margin-bottom: 0.5em;
      }
      
      .skeleton-title {
        height: 1.5em;
        width: 70%;
        margin-bottom: 0.75em;
      }
      
      .skeleton-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }
      
      .skeleton-card {
        height: 200px;
        width: 100%;
      }
      
      .skeleton-cover {
        aspect-ratio: 1;
        width: 100%;
      }
      
      /* Fade-in при загрузке контента */
      .fade-in-content {
        animation: fade-in 0.3s ease forwards;
      }
      
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      html.perf-ultra-low .fade-in-content {
        animation: none;
        opacity: 1;
      }
      
      /* Loading overlay */
      .loading-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(8, 8, 10, 0.8);
        backdrop-filter: blur(4px);
        z-index: 50;
      }
      
      /* Spinner простой */
      .simple-spinner {
        width: 24px;
        height: 24px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        border-top-color: var(--color-brand-main, #6050ba);
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      
      html.perf-ultra-low .simple-spinner {
        animation-duration: 1s;
      }
      
      /* Page transition fade */
      .page-transition-enter {
        opacity: 0;
      }
      
      .page-transition-enter-active {
        opacity: 1;
        transition: opacity 0.15s ease;
      }
      
      .page-transition-exit {
        opacity: 1;
      }
      
      .page-transition-exit-active {
        opacity: 0;
        transition: opacity 0.1s ease;
      }
      
      /* Instant loading placeholder */
      .instant-placeholder {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* Content visibility для секций */
      section, article, .content-section {
        content-visibility: auto;
        contain-intrinsic-size: auto 300px;
      }
      
      /* Оптимизация первой отрисовки */
      .above-fold {
        content-visibility: visible;
        contain-intrinsic-size: none;
      }
      
      .below-fold {
        content-visibility: auto;
        contain-intrinsic-size: auto 500px;
      }
    `;
    
    document.head.appendChild(style);
    
    return () => {
      const el = document.getElementById('skeleton-styles');
      if (el) el.remove();
    };
  }, []);

  return null;
});

SkeletonStyles.displayName = 'SkeletonStyles';

export default SkeletonStyles;
