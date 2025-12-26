'use client';
import React from 'react';

interface ConfirmDialogProps {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({ show, message, onConfirm, onCancel }: ConfirmDialogProps) {
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
