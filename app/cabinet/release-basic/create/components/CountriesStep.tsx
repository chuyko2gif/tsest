import React, { useState, useEffect } from 'react';

interface CountriesStepProps {
  selectedCountries: string[];
  setSelectedCountries: (countries: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function CountriesStep({ selectedCountries, setSelectedCountries, onNext, onBack }: CountriesStepProps) {
  const countryCodes: { [key: string]: string } = {
    'Россия': 'RU',
    'США': 'US',
    'Великобритания': 'GB',
    'Германия': 'DE',
    'Франция': 'FR',
    'Италия': 'IT',
    'Испания': 'ES',
    'Канада': 'CA',
    'Австралия': 'AU',
    'Япония': 'JP',
    'Южная Корея': 'KR',
    'Бразилия': 'BR',
    'Мексика': 'MX',
    'Аргентина': 'AR',
    'Польша': 'PL',
    'Турция': 'TR',
    'Нидерланды': 'NL',
    'Швеция': 'SE',
    'Норвегия': 'NO',
    'Финляндия': 'FI'
  };
  
  const allCountries = [
    'Россия', 'США', 'Великобритания', 'Германия', 'Франция', 
    'Италия', 'Испания', 'Канада', 'Австралия', 'Япония',
    'Южная Корея', 'Бразилия', 'Мексика', 'Аргентина', 'Польша',
    'Турция', 'Нидерланды', 'Швеция', 'Норвегия', 'Финляндия'
  ];
  
  // excludedCountries = страны которые НЕ выбраны (исключены из дистрибуции)
  const [excludedCountries, setExcludedCountries] = useState<string[]>(() => {
    // Вычисляем исключённые страны из переданных включённых
    if (!selectedCountries || selectedCountries.length === 0) return allCountries;
    return allCountries.filter(c => !selectedCountries.includes(c));
  });
  
  // Обновляем selectedCountries при изменении excludedCountries
  useEffect(() => {
    const included = allCountries.filter(c => !excludedCountries.includes(c));
    setSelectedCountries(included);
  }, [excludedCountries]);

  const toggleCountry = (country: string) => {
    if (excludedCountries.includes(country)) {
      setExcludedCountries(excludedCountries.filter(c => c !== country));
    } else {
      setExcludedCountries([...excludedCountries, country]);
    }
  };

  const selectAll = () => {
    setExcludedCountries([]);
  };

  const deselectAll = () => {
    setExcludedCountries(allCountries);
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-300">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Страны распространения</h2>
            <p className="text-sm text-zinc-500 mt-1">Выберите страны для распространения релиза</p>
          </div>
        </div>
      </div>
      
      <div className="relative p-6 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-600/10 border border-purple-500/20 rounded-2xl mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-purple-600/5 opacity-50 pointer-events-none"/>
        <div className="relative flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/30 to-purple-600/30 flex items-center justify-center flex-shrink-0 ring-1 ring-purple-400/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-purple-300" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-semibold mb-1.5">По умолчанию релиз будет доступен во всех странах</p>
            <p className="text-sm text-zinc-400 leading-relaxed">Вы можете выбрать страны, в которых релиз НЕ будет доступен</p>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={selectAll}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm font-medium transition"
            >
              Выбрать все
            </button>
            <button
              type="button"
              onClick={deselectAll}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-lg text-sm font-medium transition"
            >
              Снять все
            </button>
            <div className="ml-auto text-sm text-zinc-400 flex items-center">
              Исключенные страны: <span className="ml-1 font-bold text-white">{excludedCountries.length}/{allCountries.length}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {allCountries.map(country => {
              const isExcluded = excludedCountries.includes(country);
              return (
                <button
                  key={country}
                  onClick={() => toggleCountry(country)}
                  className={`relative px-4 py-3 rounded-xl text-sm font-semibold transition-all overflow-hidden group ${
                    isExcluded
                      ? 'bg-gradient-to-br from-white/[0.03] to-white/[0.01] border-2 border-white/10 text-zinc-500 hover:border-white/20'
                      : 'bg-gradient-to-br from-emerald-500/20 to-green-500/20 border-2 border-emerald-500/40 text-white hover:border-emerald-500/60 hover:shadow-xl hover:shadow-emerald-500/20'
                  }`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-green-500/10 opacity-0 transition-opacity ${
                    isExcluded ? '' : 'group-hover:opacity-100'
                  }`}/>
                  <div className="relative flex items-center gap-2.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black tracking-wider ${
                      isExcluded ? 'bg-white/5 text-zinc-600' : 'bg-white/10 text-white'
                    }`}>
                      {countryCodes[country]}
                    </span>
                    <span className={isExcluded ? 'line-through' : ''}>{country}</span>
                    {isExcluded && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-auto" strokeWidth="2.5">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
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
