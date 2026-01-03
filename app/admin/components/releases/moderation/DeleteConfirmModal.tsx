'use client';

import React from 'react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  type: 'single' | 'bulk';
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  count,
  type
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/20 rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Подтвердите удаление</h3>
            <p className="text-sm text-zinc-400">
              {type === 'single' 
                ? 'Это действие нельзя отменить' 
                : `Будет удалено ${count} релизов`
              }
            </p>
          </div>
        </div>
        
        <p className="text-zinc-300 mb-6">
          {type === 'single' 
            ? 'Вы уверены, что хотите удалить этот релиз? Все связанные данные будут потеряны.'
            : `Вы уверены, что хотите удалить ${count} выбранных релизов? Все связанные данные будут потеряны.`
          }
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-semibold transition"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
