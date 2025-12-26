import React from 'react';

interface PlatformsStepProps {
  selectedPlatforms: number;
  setSelectedPlatforms: (count: number) => void;
  selectedPlatformsList: string[];
  setSelectedPlatformsList: (platforms: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function PlatformsStep({ 
  selectedPlatforms, 
  setSelectedPlatforms, 
  selectedPlatformsList,
  setSelectedPlatformsList,
  onNext, 
  onBack 
}: PlatformsStepProps) {
  const allPlatforms = [
    { name: 'Spotify', icon: '🎵' },
    { name: 'Apple Music', icon: '🎵' },
    { name: 'Яндекс Музыка', icon: '🎵' },
    { name: 'VK Музыка', icon: '🎵' },
    { name: 'YouTube Music', icon: '🎵' },
  ];

  const [localSelectedPlatforms, setLocalSelectedPlatforms] = React.useState<string[]>(
    selectedPlatformsList.length > 0 ? selectedPlatformsList : allPlatforms.map(p => p.name)
  );

  React.useEffect(() => {
    setSelectedPlatforms(localSelectedPlatforms.length);
    setSelectedPlatformsList(localSelectedPlatforms);
  }, [localSelectedPlatforms, setSelectedPlatforms, setSelectedPlatformsList]);

  const togglePlatform = (platformName: string) => {
    if (localSelectedPlatforms.includes(platformName)) {
      setLocalSelectedPlatforms(localSelectedPlatforms.filter(p => p !== platformName));
    } else {
      setLocalSelectedPlatforms([...localSelectedPlatforms, platformName]);
    }
  };

  const selectAll = () => {
    setLocalSelectedPlatforms(allPlatforms.map(p => p.name));
  };

  const deselectAll = () => {
    setLocalSelectedPlatforms([]);
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-300">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Площадки</h2>
            <p className="text-sm text-zinc-500 mt-1">Выберите площадки для размещения релиза</p>
          </div>
        </div>
      </div>
      
      <div className="relative p-6 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 border border-pink-500/20 rounded-2xl mb-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 via-transparent to-purple-500/5 opacity-50"/>
        <div className="relative flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0 ring-1 ring-pink-400/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-pink-300" strokeWidth="2">
              <path d="M9 18V5l12-2v13"/>
              <circle cx="6" cy="18" r="3"/>
              <circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold mb-1.5">По умолчанию релиз будет размещён на всех площадках</p>
            <p className="text-sm text-zinc-400 leading-relaxed">Вы можете выбрать только те площадки, на которых будет выпущен релиз</p>
          </div>
        </div>
        
        <div className="relative flex gap-2 mb-4">
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-gradient-to-br from-emerald-500/10 to-green-500/10 hover:from-emerald-500/20 hover:to-green-500/20 border-2 border-emerald-500/30 hover:border-emerald-500/50 text-emerald-300 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/10"
          >
            Выбрать все
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 bg-gradient-to-br from-red-500/10 to-orange-500/10 hover:from-red-500/20 hover:to-orange-500/20 border-2 border-red-500/30 hover:border-red-500/50 text-red-300 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-red-500/10"
          >
            Снять все
          </button>
          <div className="ml-auto text-sm text-zinc-400 flex items-center">
            Выбрано: <span className="ml-1 font-bold text-white">{localSelectedPlatforms.length}/{allPlatforms.length}</span>
          </div>
        </div>
        
        <div className="relative grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allPlatforms.map(platform => {
            const isSelected = localSelectedPlatforms.includes(platform.name);
            return (
              <button
                key={platform.name}
                onClick={() => togglePlatform(platform.name)}
                className={`relative p-5 rounded-2xl text-center transition-all border-2 group overflow-hidden ${
                  isSelected
                    ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-500/50 shadow-xl shadow-pink-500/20'
                    : 'bg-gradient-to-br from-white/[0.05] to-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                }`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br from-pink-500/10 via-transparent to-purple-500/10 opacity-0 transition-opacity ${
                  isSelected ? 'opacity-100' : 'group-hover:opacity-50'
                }`}/>
                <div className="relative">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center transition-all ${
                    isSelected ? 'bg-gradient-to-br from-pink-500/30 to-purple-500/30 ring-1 ring-pink-400/50' : 'bg-white/5 group-hover:bg-white/10'
                  }`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={isSelected ? 'text-pink-300' : 'text-zinc-400 group-hover:text-zinc-300'} strokeWidth="2">
                      <path d="M9 18V5l12-2v13"/>
                      <circle cx="6" cy="18" r="3"/>
                      <circle cx="18" cy="16" r="3"/>
                    </svg>
                  </div>
                  <div className={`text-sm font-semibold mb-2 ${isSelected ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-300'}`}>
                    {platform.name}
                  </div>
                  {isSelected && (
                    <div className="flex items-center justify-center">
                      <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center gap-1.5">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-300" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span className="text-[10px] font-bold text-emerald-300">Выбрано</span>
                      </div>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between">
        <button onClick={onBack} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <button 
          onClick={onNext}
          disabled={localSelectedPlatforms.length === 0}
          className="px-8 py-3 bg-[#6050ba] hover:bg-[#7060ca] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl font-bold transition flex items-center gap-2"
        >
          Далее
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="9 18 15 12 9 6" strokeWidth="2"/></svg>
        </button>
      </div>
    </div>
  );
}
