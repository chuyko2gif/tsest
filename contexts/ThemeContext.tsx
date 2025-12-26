'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

export type ThemeName = 'dark' | 'light';

export interface Theme {
  name: ThemeName;
  label: string;
  icon: () => React.JSX.Element;
  colors: {
    bg: string;
    bgSecondary: string;
    bgTertiary: string;
    text: string;
    textSecondary: string;
    textTertiary: string;
    primary: string;
    primaryHover: string;
    border: string;
    borderHover: string;
    accent: string;
    success: string;
    error: string;
    warning: string;
    glow: string;
  };
}

export const themes: Record<ThemeName, Theme> = {
  dark: {
    name: 'dark',
    label: '🌙 Темная',
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
      </svg>
    ),
    colors: {
      bg: 'bg-black',
      bgSecondary: 'bg-zinc-900/50',
      bgTertiary: 'bg-zinc-800/30',
      text: 'text-white',
      textSecondary: 'text-zinc-400',
      textTertiary: 'text-zinc-500',
      primary: 'bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600',
      primaryHover: 'hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500',
      border: 'border-zinc-700',
      borderHover: 'hover:border-zinc-600',
      accent: 'text-purple-400',
      success: 'text-emerald-400',
      error: 'text-red-400',
      warning: 'text-yellow-400',
      glow: 'shadow-[0_0_30px_rgba(147,51,234,0.3)]',
    },
  },
  light: {
    name: 'light',
    label: '☀️ Светлая',
    icon: () => (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="5" fill="currentColor" />
        <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m17.66-5.66l-4.24 4.24m-6.84 0l-4.24-4.24m0 13.32l4.24-4.24m6.84 0l4.24 4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    colors: {
      bg: 'bg-white',
      bgSecondary: 'bg-gray-50',
      bgTertiary: 'bg-gray-100',
      text: 'text-gray-900',
      textSecondary: 'text-gray-600',
      textTertiary: 'text-gray-500',
      primary: 'bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-500',
      primaryHover: 'hover:from-blue-400 hover:via-purple-400 hover:to-indigo-400',
      border: 'border-gray-300',
      borderHover: 'hover:border-gray-400',
      accent: 'text-purple-600',
      success: 'text-emerald-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
      glow: 'shadow-[0_0_30px_rgba(147,51,234,0.15)]',
    },
  },
};

interface ThemeContextType {
  theme: Theme;
  themeName: ThemeName;
  setTheme: (theme: ThemeName) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeName, setThemeName] = useState<ThemeName>('dark');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      // Пробуем загрузить из БД
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('theme')
            .eq('id', user.id)
            .single();
          
          if (profile?.theme && (profile.theme === 'dark' || profile.theme === 'light')) {
            setThemeName(profile.theme);
            setLoading(false);
            return;
          }
        }
      }

      // Если не удалось - берем из localStorage
      const savedTheme = localStorage.getItem('theme') as ThemeName | null;
      if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
        setThemeName(savedTheme);
      }
    } catch (error) {
      console.error('Ошибка загрузки темы:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetTheme = async (newTheme: ThemeName) => {
    setThemeName(newTheme);
    localStorage.setItem('theme', newTheme);

    // Сохраняем в БД
    if (supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({ theme: newTheme })
            .eq('id', user.id);
        }
      } catch (error) {
        console.error('Ошибка сохранения темы:', error);
      }
    }
  };

  const theme = themes[themeName];

  return (
    <ThemeContext.Provider value={{ theme, themeName, setTheme: handleSetTheme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}

export function ThemeSelector() {
  const { themeName, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      {Object.values(themes).map((theme) => (
        <button
          key={theme.name}
          onClick={() => setTheme(theme.name)}
          className={`
            flex-1 p-3 rounded-xl border transition-all duration-200
            ${themeName === theme.name
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10'
            }
          `}
        >
          <div className="flex items-center gap-2 justify-center">
            {theme.icon()}
            <span className="text-sm font-medium">{theme.label}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
