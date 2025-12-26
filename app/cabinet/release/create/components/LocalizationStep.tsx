import React from 'react';

interface LocalizationStepProps {
  onNext: () => void;
  onBack: () => void;
}

export default function LocalizationStep({ onNext, onBack }: LocalizationStepProps) {
  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h2 className="text-3xl font-black uppercase tracking-tight">Локализация</h2>
        <p className="text-sm text-zinc-500 mt-1">Настройки локализации релиза</p>
      </div>
      <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#6050ba]/10 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
            <circle cx="12" cy="12" r="10" strokeWidth="2"/>
            <line x1="12" y1="2" x2="12" y2="22" strokeWidth="2"/>
            <path d="M2 12h20" strokeWidth="2"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeWidth="2"/>
          </svg>
        </div>
        <p className="text-zinc-400">Локализация будет добавлена автоматически</p>
      </div>
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <button onClick={onNext} className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition flex items-center gap-2">
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
}
