'use client';
import React from 'react';
import AnimatedBackground from '@/components/ui/AnimatedBackground';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <AnimatedBackground />
      <div className="text-zinc-600 animate-pulse relative z-10">Загрузка...</div>
    </div>
  );
}
