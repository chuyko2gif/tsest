'use client';
import React from 'react';

interface NewTicketModalProps {
  show: boolean;
  subject: string;
  message: string;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
}

export default function NewTicketModal({
  show,
  subject,
  message,
  onSubjectChange,
  onMessageChange,
  onSubmit,
  onClose,
}: NewTicketModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Новый тикет</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              Тема обращения
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Кратко опишите проблему"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-zinc-500 focus:outline-none focus:border-[#6050ba] transition"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 uppercase tracking-wider mb-2 block">
              Сообщение
            </label>
            <textarea
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Опишите вашу проблему подробнее..."
              rows={5}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-zinc-500 focus:outline-none focus:border-[#6050ba] transition resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition"
            >
              Отмена
            </button>
            <button
              onClick={onSubmit}
              disabled={!subject.trim() || !message.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-[#6050ba] to-[#8b5cf6] hover:from-[#7060ca] hover:to-[#9d8df1] rounded-xl font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Создать
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
