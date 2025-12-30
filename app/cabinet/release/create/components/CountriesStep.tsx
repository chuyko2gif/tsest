import React, { useState, useEffect } from 'react';

interface CountriesStepProps {
  selectedCountries?: string[];
  setSelectedCountries?: (countries: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

// Флаги стран (emoji)
const countryFlags: { [key: string]: string } = {
  'Россия': '🇷🇺', 'Беларусь': '🇧🇾', 'Казахстан': '🇰🇿', 'Украина': '🇺🇦',
  'Узбекистан': '🇺🇿', 'Азербайджан': '🇦🇿', 'Армения': '🇦🇲', 'Грузия': '🇬🇪',
  'Молдова': '🇲🇩', 'Кыргызстан': '🇰🇬', 'Таджикистан': '🇹🇯', 'Туркменистан': '🇹🇲',
  'США': '🇺🇸', 'Великобритания': '🇬🇧', 'Германия': '🇩🇪', 'Франция': '🇫🇷',
  'Италия': '🇮🇹', 'Испания': '🇪🇸', 'Канада': '🇨🇦', 'Австралия': '🇦🇺',
  'Япония': '🇯🇵', 'Южная Корея': '🇰🇷', 'Бразилия': '🇧🇷', 'Мексика': '🇲🇽',
  'Аргентина': '🇦🇷', 'Польша': '🇵🇱', 'Турция': '🇹🇷', 'Нидерланды': '🇳🇱',
  'Швеция': '🇸🇪', 'Норвегия': '🇳🇴', 'Финляндия': '🇫🇮', 'Чехия': '🇨🇿',
  'Австрия': '🇦🇹', 'Бельгия': '🇧🇪', 'Швейцария': '🇨🇭', 'Дания': '🇩🇰',
  'Португалия': '🇵🇹', 'Греция': '🇬🇷', 'Ирландия': '🇮🇪', 'Китай': '🇨🇳',
  'Индия': '🇮🇳', 'Индонезия': '🇮🇩', 'Таиланд': '🇹🇭', 'Вьетнам': '🇻🇳',
  'Малайзия': '🇲🇾', 'Сингапур': '🇸🇬', 'Филиппины': '🇵🇭', 'ОАЭ': '🇦🇪',
  'Саудовская Аравия': '🇸🇦', 'Израиль': '🇮🇱', 'Египет': '🇪🇬', 'ЮАР': '🇿🇦',
  'Нигерия': '🇳🇬', 'Чили': '🇨🇱', 'Колумбия': '🇨🇴', 'Перу': '🇵🇪', 'Венесуэла': '🇻🇪'
};

export default function CountriesStep({ selectedCountries, setSelectedCountries, onNext, onBack }: CountriesStepProps) {
  const countryCodes: { [key: string]: string } = {
    'Россия': 'RU',
    'Беларусь': 'BY',
    'Казахстан': 'KZ',
    'Украина': 'UA',
    'Узбекистан': 'UZ',
    'Азербайджан': 'AZ',
    'Армения': 'AM',
    'Грузия': 'GE',
    'Молдова': 'MD',
    'Кыргызстан': 'KG',
    'Таджикистан': 'TJ',
    'Туркменистан': 'TM',
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
    'Финляндия': 'FI',
    'Чехия': 'CZ',
    'Австрия': 'AT',
    'Бельгия': 'BE',
    'Швейцария': 'CH',
    'Дания': 'DK',
    'Португалия': 'PT',
    'Греция': 'GR',
    'Ирландия': 'IE',
    'Китай': 'CN',
    'Индия': 'IN',
    'Индонезия': 'ID',
    'Таиланд': 'TH',
    'Вьетнам': 'VN',
    'Малайзия': 'MY',
    'Сингапур': 'SG',
    'Филиппины': 'PH',
    'ОАЭ': 'AE',
    'Саудовская Аравия': 'SA',
    'Израиль': 'IL',
    'Египет': 'EG',
    'ЮАР': 'ZA',
    'Нигерия': 'NG',
    'Чили': 'CL',
    'Колумбия': 'CO',
    'Перу': 'PE',
    'Венесуэла': 'VE'
  };

  // Регионы стран
  const regions: { [key: string]: string[] } = {
    'СНГ': ['Россия', 'Беларусь', 'Казахстан', 'Украина', 'Узбекистан', 'Азербайджан', 'Армения', 'Грузия', 'Молдова', 'Кыргызстан', 'Таджикистан', 'Туркменистан'],
    'Европа': ['Великобритания', 'Германия', 'Франция', 'Италия', 'Испания', 'Польша', 'Нидерланды', 'Швеция', 'Норвегия', 'Финляндия', 'Чехия', 'Австрия', 'Бельгия', 'Швейцария', 'Дания', 'Португалия', 'Греция', 'Ирландия'],
    'Северная Америка': ['США', 'Канада', 'Мексика'],
    'Южная Америка': ['Бразилия', 'Аргентина', 'Чили', 'Колумбия', 'Перу', 'Венесуэла'],
    'Азия': ['Япония', 'Южная Корея', 'Китай', 'Индия', 'Индонезия', 'Таиланд', 'Вьетнам', 'Малайзия', 'Сингапур', 'Филиппины'],
    'Ближний Восток': ['Турция', 'ОАЭ', 'Саудовская Аравия', 'Израиль'],
    'Океания': ['Австралия'],
    'Африка': ['Египет', 'ЮАР', 'Нигерия']
  };
  
  const allCountries = Object.keys(countryCodes);
  
  // excludedCountries = страны которые НЕ выбраны (исключены из дистрибуции)
  const [excludedCountries, setExcludedCountries] = useState<string[]>(() => {
    // Вычисляем исключённые страны из переданных включённых
    if (!selectedCountries || selectedCountries.length === 0) return allCountries;
    return allCountries.filter(c => !selectedCountries.includes(c));
  });
  
  // Состояние аккордеонов (раскрытые регионы)
  const [expandedRegions, setExpandedRegions] = useState<string[]>(['СНГ']);
  
  // Обновляем selectedCountries при изменении excludedCountries
  useEffect(() => {
    if (setSelectedCountries) {
      const included = allCountries.filter(c => !excludedCountries.includes(c));
      setSelectedCountries(included);
    }
  }, [excludedCountries]);

  const toggleRegion = (regionName: string) => {
    setExpandedRegions(prev => 
      prev.includes(regionName) 
        ? prev.filter(r => r !== regionName)
        : [...prev, regionName]
    );
  };

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
          <div className="flex flex-wrap gap-2 mb-4">
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
              Выбрано стран: <span className="ml-1 font-bold text-white">{selectedCountries?.length || 0}/{allCountries.length}</span>
            </div>
          </div>
          
          {/* Кнопки регионов */}
          <div className="mb-4">
            <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2 font-semibold">Быстрый выбор по регионам:</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(regions).map(([regionName, regionCountries]) => {
                const selectedInRegion = regionCountries.filter(c => selectedCountries?.includes(c)).length;
                const allInRegion = regionCountries.length;
                const isFullySelected = selectedInRegion === allInRegion;
                const isPartiallySelected = selectedInRegion > 0 && selectedInRegion < allInRegion;
                
                return (
                  <button
                    key={regionName}
                    type="button"
                    onClick={() => {
                      if (isFullySelected) {
                        // Убираем все страны региона
                        setExcludedCountries([...excludedCountries, ...regionCountries.filter(c => !excludedCountries.includes(c))]);
                      } else {
                        // Добавляем все страны региона
                        setExcludedCountries(excludedCountries.filter(c => !regionCountries.includes(c)));
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      isFullySelected 
                        ? 'bg-gradient-to-r from-emerald-500/30 to-green-500/30 border border-emerald-500/50 text-emerald-300' 
                        : isPartiallySelected
                          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-amber-500/40 text-amber-300'
                          : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                    title={`${regionName}: ${selectedInRegion}/${allInRegion} стран выбрано`}
                  >
                    {regionName}
                    <span className="ml-1.5 opacity-60">({selectedInRegion}/{allInRegion})</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Аккордеоны регионов с флагами */}
          <div className="space-y-3">
            {Object.entries(regions).map(([regionName, regionCountries]) => {
              const selectedInRegion = regionCountries.filter(c => selectedCountries?.includes(c)).length;
              const allInRegion = regionCountries.length;
              const isFullySelected = selectedInRegion === allInRegion;
              const isPartiallySelected = selectedInRegion > 0 && selectedInRegion < allInRegion;
              const isExpanded = expandedRegions.includes(regionName);
              
              return (
                <div key={regionName} className="rounded-xl overflow-hidden border border-white/10">
                  {/* Заголовок аккордеона */}
                  <button
                    onClick={() => toggleRegion(regionName)}
                    className={`w-full px-4 py-3 flex items-center justify-between transition-all ${
                      isFullySelected 
                        ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/10' 
                        : isPartiallySelected
                          ? 'bg-gradient-to-r from-amber-500/10 to-yellow-500/5'
                          : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Чекбокс региона */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isFullySelected) {
                            setExcludedCountries([...excludedCountries, ...regionCountries.filter(c => !excludedCountries.includes(c))]);
                          } else {
                            setExcludedCountries(excludedCountries.filter(c => !regionCountries.includes(c)));
                          }
                        }}
                        className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                          isFullySelected 
                            ? 'bg-emerald-500 text-black' 
                            : isPartiallySelected
                              ? 'bg-amber-500/50 text-white'
                              : 'bg-white/10 hover:bg-white/20'
                        }`}
                      >
                        {isFullySelected && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        {isPartiallySelected && <div className="w-2 h-2 bg-white rounded-sm"/>}
                      </button>
                      
                      <span className="font-bold text-white">{regionName}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        isFullySelected 
                          ? 'bg-emerald-500/30 text-emerald-300' 
                          : isPartiallySelected
                            ? 'bg-amber-500/30 text-amber-300'
                            : 'bg-white/10 text-zinc-400'
                      }`}>
                        {selectedInRegion}/{allInRegion}
                      </span>
                    </div>
                    
                    <svg 
                      width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                      className={`text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  
                  {/* Содержимое аккордеона */}
                  {isExpanded && (
                    <div className="p-3 bg-black/20 border-t border-white/5">
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {regionCountries.map(country => {
                          const isExcluded = excludedCountries.includes(country);
                          return (
                            <button
                              key={country}
                              onClick={() => toggleCountry(country)}
                              className={`relative px-3 py-2.5 rounded-lg text-sm font-medium transition-all overflow-hidden group ${
                                isExcluded
                                  ? 'bg-white/5 border border-white/10 text-zinc-500 hover:border-white/20'
                                  : 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 text-white hover:border-emerald-500/50'
                              }`}
                            >
                              <div className="relative flex items-center gap-2">
                                <span className="text-lg">{countryFlags[country] || '🌍'}</span>
                                <span className={isExcluded ? 'line-through opacity-50' : ''}>{country}</span>
                                {!isExcluded && (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="ml-auto text-emerald-400" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12"/>
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
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
