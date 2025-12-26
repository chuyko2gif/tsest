'use client';

import { FilterType } from './types';

interface TicketFiltersProps {
  filter: FilterType;
  setFilter: (filter: FilterType) => void;
  onFilterChange: () => void;
}

export function TicketFilters({ filter, setFilter, onFilterChange }: TicketFiltersProps) {
  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'Все' },
    { key: 'open', label: 'Открытые' },
    { key: 'answered', label: 'Отвеченные' },
    { key: 'closed', label: 'Закрытые' },
  ];

  return (
    <div className="flex gap-2">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => { 
            setFilter(f.key); 
            onFilterChange(); 
          }}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
            filter === f.key
              ? 'bg-[#6050ba] text-white'
              : 'bg-white/5 hover:bg-white/10'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
