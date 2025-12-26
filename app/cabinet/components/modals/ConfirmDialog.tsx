'use client';
import React, { useEffect, useState } from 'react';

interface ConfirmDialogProps {
  show: boolean;
  message: string;
  description?: string;
  type?: 'standard' | 'danger';
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ 
  show, 
  message, 
  description,
  type = 'standard',
  confirmText = 'Подтвердить',
  cancelText = 'Отмена',
  onConfirm, 
  onCancel 
}: ConfirmDialogProps) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (show) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [show]);
  
  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        onCancel();
      }
    };
    
    if (show) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [show, onCancel]);
  
  if (!show) return null;
  
  const isDanger = type === 'danger';
  
  return (
    <div 
      className={`
        fixed inset-0 z-[9999] flex items-center justify-center p-4
        bg-black/60 backdrop-blur-md
        transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={onCancel}
    >
      <div 
        className={`
          relative bg-[#18181b]/95 backdrop-blur-xl
          border border-white/10
          rounded-3xl shadow-2xl
          p-8 max-w-md w-full
          transition-all duration-300
          ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect */}
        <div className={`
          absolute inset-0 rounded-3xl blur-2xl -z-10 opacity-20
          ${isDanger ? 'bg-red-500' : 'bg-purple-500'}
        `} />
        
        {/* Icon */}
        <div className={`
          w-14 h-14 rounded-2xl mb-5
          flex items-center justify-center
          ${isDanger 
            ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30' 
            : 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30'
          }
        `}>
          {isDanger ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red-400">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-purple-400">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
        
        {/* Content */}
        <h3 className="text-xl font-bold text-white mb-2">
          {message}
        </h3>
        
        {description && (
          <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
            {description}
          </p>
        )}
        
        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="
              flex-1 px-4 py-3 rounded-xl font-semibold
              bg-white/5 hover:bg-white/10
              border border-white/10
              text-zinc-300 hover:text-white
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-white/20
            "
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`
              flex-1 px-4 py-3 rounded-xl font-semibold
              transition-all duration-200
              focus:outline-none focus:ring-2
              ${isDanger
                ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white focus:ring-red-500/50 shadow-lg shadow-red-500/25'
                : 'bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white focus:ring-purple-500/50 shadow-lg shadow-purple-500/25'
              }
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
