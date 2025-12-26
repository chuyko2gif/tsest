'use client';
import React from 'react';
import Link from 'next/link';

export default function UnauthorizedScreen() {
  return (
    <div className="min-h-screen pt-24 pb-20 text-white flex items-center justify-center p-4 relative overflow-hidden">
      {/* Градиентный фон */}
      <div 
        className="fixed inset-0"
        style={{
          background: `
            radial-gradient(ellipse 100% 80% at 50% -20%, rgba(96, 80, 186, 0.4) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 100% 100%, rgba(157, 141, 241, 0.25) 0%, transparent 50%),
            radial-gradient(ellipse 80% 60% at 0% 100%, rgba(96, 80, 186, 0.2) 0%, transparent 50%),
            #0a0a0c
          `,
          zIndex: 0
        }}
      />

      {/* Контент */}
      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        {/* Большая иконка */}
        <div className="flex justify-center">
          <div 
            className="w-28 h-28 rounded-3xl bg-gradient-to-br from-[#6050ba] to-[#9d8df1] flex items-center justify-center border-2 border-[#6050ba] animate-pulse"
            style={{ boxShadow: '0 0 80px rgba(96, 80, 186, 0.5)' }}
          >
            <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Заголовок */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-black">
            <span className="text-white">Требуется</span>{' '}
            <span className="text-[#9d8df1]">авторизация</span>
          </h1>
          <p className="text-zinc-400 text-base md:text-lg max-w-xl mx-auto">
            Войдите в свой аккаунт или создайте новый, чтобы получить доступ к личному кабинету артиста thqlabel
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-6">
          <Link 
            href="/auth"
            className="px-10 py-5 bg-[#6050ba] hover:bg-[#7060ca] rounded-2xl text-sm font-black uppercase tracking-widest transition-all hover:scale-105 shadow-lg shadow-[#6050ba]/30"
          >
            Войти / Регистрация
          </Link>
          <Link 
            href="/feed"
            className="px-10 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all hover:scale-105"
          >
            На главную
          </Link>
        </div>

        {/* Дополнительная информация */}
        <div className="pt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon={
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            }
            title="Управление релизами"
            description="Загружайте треки и альбомы"
          />
          <FeatureCard 
            icon={
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Финансы"
            description="Отслеживайте доходы и выплаты"
          />
          <FeatureCard 
            icon={
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="Аналитика"
            description="Смотрите статистику прослушиваний"
          />
        </div>
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
      <div className="w-10 h-10 mx-auto mb-3 rounded-lg bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div className="font-bold mb-2">{title}</div>
      <div className="text-sm text-zinc-500">{description}</div>
    </div>
  );
}
