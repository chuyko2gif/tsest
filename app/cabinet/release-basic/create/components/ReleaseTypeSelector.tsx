"use client";
import React from 'react';

interface ReleaseTypeSelectorProps {
  onSelectType: (type: 'single' | 'ep' | 'album') => void;
  onBack: () => void;
}

export default function ReleaseTypeSelector({ onSelectType, onBack }: ReleaseTypeSelectorProps) {
  return (
    <div className="h-screen bg-gradient-to-br from-[#0a0a0b] via-[#12121a] to-[#0a0a0b] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(96,80,186,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(96,80,186,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#6050ba]/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#8a6fff]/5 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-6xl w-full relative z-10">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            Выберите тип релиза
          </h1>
          <p className="text-zinc-500 text-sm">
            Каждый формат создан для воплощения вашего звучания
          </p>
        </div>

        {/* Карточки выбора */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* Сингл */}
          <button
            onClick={() => onSelectType('single')}
            className="group relative rounded-2xl p-6 text-left overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 will-change-transform"
            style={{
              background: 'linear-gradient(135deg, rgba(96, 80, 186, 0.15) 0%, rgba(74, 58, 154, 0.1) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(96, 80, 186, 0.3)',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              backgroundColor: 'rgba(20, 20, 30, 0.5)'
            }}
          >
            {/* 3D Background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#6050ba]/30 via-[#4a3a9a]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ transform: 'translateZ(-10px)' }} />
            
            {/* Animated glow */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-[#6050ba] via-[#8a6fff] to-[#6050ba] rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-sm" style={{ transform: 'translateZ(-5px)' }} />
            
            {/* Shimmer wave */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
            
            {/* Popular badge */}
            <div className="absolute -top-2 -right-2 px-4 py-1.5 bg-gradient-to-r from-[#7d6fd9] via-[#8a6fff] to-[#9d7fff] rounded-full text-xs font-black text-white shadow-lg shadow-[#8a6fff]/70 animate-pulse border border-white/20">
              ⭐ ХИТ
            </div>
            
            <div className="relative" style={{ transform: 'translateZ(20px)' }}>
              {/* Icon with 3D effect */}
              <div className="w-14 h-14 bg-gradient-to-br from-[#6050ba] to-[#4a3a9a] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-lg shadow-[#6050ba]/50 group-hover:shadow-2xl group-hover:shadow-[#6050ba]/70" style={{ transform: 'translateZ(30px)' }}>
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
                </svg>
              </div>

              {/* Text */}
              <h3 className="text-2xl font-black mb-2 text-white group-hover:text-[#a78bfa] transition-colors duration-300">Сингл</h3>
              <p className="text-zinc-400 text-xs mb-4 group-hover:text-zinc-300 transition-colors">
                Один мощный трек
              </p>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-4 h-4 rounded-full bg-[#6050ba]/20 flex items-center justify-center group-hover:bg-[#6050ba]/40 transition-colors">
                    <svg className="w-2.5 h-2.5 text-[#6050ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white">1 трек</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-4 h-4 rounded-full bg-[#6050ba]/20 flex items-center justify-center group-hover:bg-[#6050ba]/40 transition-colors">
                    <svg className="w-2.5 h-2.5 text-[#6050ba]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-bold text-[#6050ba]">500 ₽</span>
                </div>
              </div>

              {/* Action button */}
              <div className="mt-5 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#6050ba]/20 to-transparent rounded-xl border border-[#6050ba]/30 group-hover:border-[#6050ba] group-hover:from-[#6050ba]/30 transition-all duration-300">
                <span className="text-xs font-bold text-[#6050ba] group-hover:text-white transition-colors">Выбрать</span>
                <svg className="w-4 h-4 text-[#6050ba] group-hover:text-white transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>

          {/* EP */}
          <button
            onClick={() => onSelectType('ep')}
            className="group relative rounded-2xl p-6 text-left overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 will-change-transform"
            style={{
              background: 'linear-gradient(135deg, rgba(125, 111, 217, 0.15) 0%, rgba(96, 80, 186, 0.1) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(125, 111, 217, 0.3)',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              backgroundColor: 'rgba(20, 20, 30, 0.5)'
            }}
          >
            {/* 3D Background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#7d6fd9]/30 via-[#6050ba]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ transform: 'translateZ(-10px)' }} />
            
            {/* Animated glow */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-[#7d6fd9] via-[#8a6fff] to-[#7d6fd9] rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-sm" style={{ transform: 'translateZ(-5px)' }} />
            
            {/* Shimmer wave */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
            
            <div className="relative" style={{ transform: 'translateZ(20px)' }}>
              {/* Icon with 3D effect */}
              <div className="w-14 h-14 bg-gradient-to-br from-[#7d6fd9] to-[#6050ba] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-lg shadow-[#7d6fd9]/50 group-hover:shadow-2xl group-hover:shadow-[#7d6fd9]/70" style={{ transform: 'translateZ(30px)' }}>
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18V5l12-2v13" />
                  <circle cx="6" cy="18" r="3" fill="currentColor" />
                  <circle cx="18" cy="16" r="3" fill="currentColor" />
                </svg>
              </div>

              {/* Text */}
              <h3 className="text-2xl font-black mb-2 text-white group-hover:text-[#a78bfa] transition-colors duration-300">EP</h3>
              <p className="text-zinc-400 text-xs mb-4 group-hover:text-zinc-300 transition-colors">
                Мини-альбом 2-7 треков
              </p>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-4 h-4 rounded-full bg-[#7d6fd9]/20 flex items-center justify-center group-hover:bg-[#7d6fd9]/40 transition-colors">
                    <svg className="w-2.5 h-2.5 text-[#7d6fd9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white">2-7 треков</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-4 h-4 rounded-full bg-[#7d6fd9]/20 flex items-center justify-center group-hover:bg-[#7d6fd9]/40 transition-colors">
                    <svg className="w-2.5 h-2.5 text-[#7d6fd9]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-bold text-[#7d6fd9]">300 ₽/трек</span>
                </div>
              </div>

              {/* Price hint */}
              <div className="mt-3 px-2 py-1.5 bg-[#7d6fd9]/10 rounded-lg border border-[#7d6fd9]/20">
                <div className="text-[10px] text-zinc-500">
                  💰 От 600₽ до 2100₽
                </div>
              </div>

              {/* Action button */}
              <div className="mt-4 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#7d6fd9]/20 to-transparent rounded-xl border border-[#7d6fd9]/30 group-hover:border-[#7d6fd9] group-hover:from-[#7d6fd9]/30 transition-all duration-300">
                <span className="text-xs font-bold text-[#7d6fd9] group-hover:text-white transition-colors">Выбрать</span>
                <svg className="w-4 h-4 text-[#7d6fd9] group-hover:text-white transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>

          {/* Альбом */}
          <button
            onClick={() => onSelectType('album')}
            className="group relative rounded-2xl p-6 text-left overflow-hidden transition-all duration-500 hover:scale-[1.05] hover:-translate-y-2 will-change-transform"
            style={{
              background: 'linear-gradient(135deg, rgba(138, 111, 255, 0.15) 0%, rgba(96, 80, 186, 0.1) 100%)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(138, 111, 255, 0.3)',
              transformStyle: 'preserve-3d',
              perspective: '1000px',
              backgroundColor: 'rgba(20, 20, 30, 0.5)'
            }}
          >
            {/* 3D Background layers */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#8a6fff]/30 via-[#6050ba]/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" style={{ transform: 'translateZ(-10px)' }} />
            
            {/* Animated glow */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-[#8a6fff] via-[#7d6fd9] to-[#8a6fff] rounded-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 blur-sm" style={{ transform: 'translateZ(-5px)' }} />
            
            {/* Shimmer wave */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
            
            <div className="relative" style={{ transform: 'translateZ(20px)' }}>
              {/* Icon with 3D effect */}
              <div className="w-14 h-14 bg-gradient-to-br from-[#8a6fff] to-[#6050ba] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-all duration-700 shadow-lg shadow-[#8a6fff]/50 group-hover:shadow-2xl group-hover:shadow-[#8a6fff]/70" style={{ transform: 'translateZ(30px)' }}>
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>

              {/* Text */}
              <h3 className="text-2xl font-black mb-2 text-white group-hover:text-[#a78bfa] transition-colors duration-300">Альбом</h3>
              <p className="text-zinc-400 text-xs mb-4 group-hover:text-zinc-300 transition-colors">
                Полноценный релиз 8-50 треков
              </p>

              {/* Features */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-4 h-4 rounded-full bg-[#8a6fff]/20 flex items-center justify-center group-hover:bg-[#8a6fff]/40 transition-colors">
                    <svg className="w-2.5 h-2.5 text-[#8a6fff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-semibold text-white">8-50 треков</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <div className="w-4 h-4 rounded-full bg-[#8a6fff]/20 flex items-center justify-center group-hover:bg-[#8a6fff]/40 transition-colors">
                    <svg className="w-2.5 h-2.5 text-[#8a6fff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="font-bold text-[#8a6fff]">300 ₽/трек</span>
                </div>
              </div>

              {/* Price hint */}
              <div className="mt-3 px-2 py-1.5 bg-[#8a6fff]/10 rounded-lg border border-[#8a6fff]/20">
                <div className="text-[10px] text-zinc-500">
                  🎵 От 2400₽ до 15000₽
                </div>
              </div>

              {/* Action button */}
              <div className="mt-4 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#8a6fff]/20 to-transparent rounded-xl border border-[#8a6fff]/30 group-hover:border-[#8a6fff] group-hover:from-[#8a6fff]/30 transition-all duration-300">
                <span className="text-xs font-bold text-[#8a6fff] group-hover:text-white transition-colors">Выбрать</span>
                <svg className="w-4 h-4 text-[#8a6fff] group-hover:text-white transform group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
            </div>
          </button>
        </div>

        {/* Подсказка внизу */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#6050ba] to-[#8a6fff] flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xs text-zinc-400">
              <strong className="text-white">Важно:</strong> EP от <span className="text-[#7d6fd9]">2 треков</span>, Альбом от <span className="text-[#8a6fff]">8 треков</span>
            </p>
          </div>
        </div>

        {/* Красивая кнопка Назад внизу */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onBack}
            className="group flex items-center gap-3 px-6 py-3.5 bg-gradient-to-r from-zinc-800/80 via-zinc-700/80 to-zinc-800/80 hover:from-zinc-700 hover:via-zinc-600 hover:to-zinc-700 backdrop-blur-xl border border-zinc-600/50 hover:border-zinc-500 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6050ba] to-[#8a6fff] flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-purple-500/30">
              <svg className="w-4 h-4 text-white group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </div>
            <span className="text-base font-bold text-white group-hover:text-zinc-100 transition-colors">Назад</span>
          </button>
        </div>
      </div>
    </div>
  );
}
