import React from 'react';

interface PlatformsStepProps {
  selectedPlatforms: number;
  setSelectedPlatforms: (count: number) => void;
  selectedPlatformsList?: string[];
  setSelectedPlatformsList?: (platforms: string[]) => void;
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
    selectedPlatformsList && selectedPlatformsList.length > 0 
      ? selectedPlatformsList 
      : allPlatforms.map(p => p.name)
  );

  React.useEffect(() => {
    setSelectedPlatforms(localSelectedPlatforms.length);
    if (setSelectedPlatformsList) {
      setSelectedPlatformsList(localSelectedPlatforms);
    }
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
      
      <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl mb-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-[#6050ba]/10 flex items-center justify-center flex-shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
              <path d="M9 18V5l12-2v13" strokeWidth="2"/>
              <circle cx="6" cy="18" r="3" strokeWidth="2"/>
              <circle cx="18" cy="16" r="3" strokeWidth="2"/>
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-white font-medium mb-1">По умолчанию релиз будет размещён на всех площадках</p>
            <p className="text-sm text-zinc-400">Вы можете выбрать только те площадки, на которых будет выпущен релиз</p>
          </div>
        </div>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-sm font-medium transition"
          >
            Выбрать все
          </button>
          <button
            onClick={deselectAll}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 rounded-lg text-sm font-medium transition"
          >
            Снять все
          </button>
          <div className="ml-auto text-sm text-zinc-400 flex items-center">
            Выбрано: <span className="ml-1 font-bold text-white">{localSelectedPlatforms.length}/{allPlatforms.length}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {allPlatforms.map(platform => {
            const isSelected = localSelectedPlatforms.includes(platform.name);
            return (
              <button
                key={platform.name}
                onClick={() => togglePlatform(platform.name)}
                className={`p-4 rounded-xl text-center transition-all border ${
                  isSelected
                    ? 'bg-[#6050ba]/20 border-[#6050ba]/50 shadow-lg shadow-[#6050ba]/10'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/5'
                }`}
              >
                <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-white/5 flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className={isSelected ? 'text-[#9d8df1]' : 'text-zinc-400'}>
                    <path d="M9 18V5l12-2v13" strokeWidth="2"/>
                    <circle cx="6" cy="18" r="3" strokeWidth="2"/>
                    <circle cx="18" cy="16" r="3" strokeWidth="2"/>
                  </svg>
                </div>
                <div className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                  {platform.name}
                </div>
                {isSelected && (
                  <div className="mt-2 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400">
                        <polyline points="20 6 9 17 4 12" strokeWidth="3"/>
                      </svg>
                    </div>
                  </div>
                )}
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
