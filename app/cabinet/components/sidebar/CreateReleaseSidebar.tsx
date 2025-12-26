'use client';
import React from 'react';

type CreateTab = 'release' | 'tracklist' | 'countries' | 'contract' | 'platforms' | 'localization' | 'send' | 'events' | 'promo';

interface CreateReleaseSidebarProps {
  createTab: CreateTab;
  onCreateTabChange: (tab: CreateTab) => void;
  onBack: () => void;
}

const STEPS: { id: CreateTab; label: string }[] = [
  { id: 'release', label: 'Релиз' },
  { id: 'tracklist', label: 'Треклист' },
  { id: 'countries', label: 'Страны' },
  { id: 'contract', label: 'Договор' },
  { id: 'platforms', label: 'Площадки' },
  { id: 'localization', label: 'Локализация' },
  { id: 'send', label: 'Отправка' },
  { id: 'events', label: 'События' },
  { id: 'promo', label: 'Промо' },
];

export default function CreateReleaseSidebar({
  createTab,
  onCreateTabChange,
  onBack,
}: CreateReleaseSidebarProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="font-bold">Создание релиза</div>
        <button onClick={onBack} className="text-sm text-zinc-400 hover:text-white">← Назад</button>
      </div>
      <div className="space-y-2">
        {STEPS.map((it) => (
          <button 
            key={it.id} 
            onClick={() => onCreateTabChange(it.id)} 
            className={`w-full text-left py-3 px-4 rounded-xl ${createTab === it.id ? 'bg-[#6050ba] text-white' : 'text-zinc-400 hover:bg-white/5'}`}
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
