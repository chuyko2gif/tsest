"use client";
import React from 'react';

// Тост уведомление
interface ToastProps {
  show: boolean;
  message?: string;
}

export function Toast({ show, message = 'Скопировано' }: ToastProps) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-[#1a1a1f] border border-emerald-500/50 rounded-2xl px-6 py-3 shadow-2xl animate-fade-up pointer-events-auto"
           style={{ boxShadow: '0 0 40px rgba(16, 185, 129, 0.2)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="font-bold text-white text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}

// Уведомление сверху
interface NotificationBannerProps {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

export function NotificationBanner({ show, message, type }: NotificationBannerProps) {
  if (!show) return null;
  
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className={`px-6 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
        type === 'success' 
          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
          : 'bg-red-500/10 border-red-500/30 text-red-300'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <span className="font-medium">{message}</span>
        </div>
      </div>
    </div>
  );
}

// Диалог подтверждения
interface ConfirmDialogProps {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ show, message, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
        <h3 className="text-lg font-bold mb-4">Подтверждение</h3>
        <p className="text-zinc-400 mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition"
          >
            Нет
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition"
          >
            Да
          </button>
        </div>
      </div>
    </div>
  );
}

// Модалка выплаты
interface PayoutModalProps {
  show: boolean;
  payout: any;
  onClose: () => void;
  onMarkRead: (payoutId: string) => void;
}

export function PayoutModal({ show, payout, onClose, onMarkRead }: PayoutModalProps) {
  if (!show || !payout) return null;
  
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-[#1a1a1f] to-[#0d0d0f] border border-emerald-500/30 rounded-3xl p-8 max-w-md w-full animate-in fade-in zoom-in-95 duration-300"
           style={{ boxShadow: '0 0 60px rgba(16, 185, 129, 0.2)' }}>
        {/* Иконка */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/10 flex items-center justify-center text-4xl border border-emerald-500/30 animate-pulse">
            💰
          </div>
        </div>
        
        {/* Заголовок */}
        <h2 className="text-2xl font-black text-center mb-2">Новая выплата!</h2>
        <p className="text-zinc-400 text-center text-sm mb-6">Вам начислена выплата за {payout.year} Q{payout.quarter}</p>
        
        {/* Сумма */}
        <div className="text-center mb-6">
          <div className="text-5xl font-black text-emerald-400 mb-2">
            {Number(payout.amount).toFixed(2)} ₽
          </div>
          {payout.note && (
            <p className="text-xs text-zinc-500">Примечание: {payout.note}</p>
          )}
        </div>
        
        {/* Кнопки */}
        <div className="space-y-3">
          <button
            onClick={() => onMarkRead(payout.id)}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl transition-all hover:scale-105"
          >
            Отлично!
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-zinc-400 transition"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

// Загрузочный экран
export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="text-zinc-600 animate-pulse relative z-10">Загрузка...</div>
    </div>
  );
}
