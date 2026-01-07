'use client';
import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface RoyaltyData {
  totals: {
    totalStreams: number;
    totalRevenue: number;
    totalTracks: number;
    matchedTracks: number;
  };
  tracks: Array<{
    id: string;
    track_title: string;
    release_title: string;
    artist_name: string;
    streams: number;
    net_revenue: string;
    quarter: string;
    year: number;
  }>;
  countries: Array<{
    name: string;
    streams: number;
    revenue: number;
  }>;
  platforms: Array<{
    name: string;
    streams: number;
    revenue: number;
  }>;
  periods: Array<{
    period: string;
    streams: number;
    revenue: number;
  }>;
}

// Цвета для диаграмм
const CHART_COLORS = [
  '#e879f9', // fuchsia
  '#a78bfa', // violet
  '#60a5fa', // blue
  '#34d399', // emerald
  '#fbbf24', // amber
  '#f472b6', // pink
  '#818cf8', // indigo
  '#2dd4bf', // teal
  '#fb923c', // orange
  '#a3e635', // lime
];

// Компонент круговой диаграммы
function PieChart({ 
  data, 
  size = 180,
  valueKey = 'revenue',
  labelKey = 'name',
  showLegend = true,
  title,
  onSliceClick
}: { 
  data: any[];
  size?: number;
  valueKey?: string;
  labelKey?: string;
  showLegend?: boolean;
  title?: string;
  onSliceClick?: (item: any) => void;
}) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const total = data.reduce((sum, item) => sum + (item[valueKey] || 0), 0);
  
  if (total === 0 || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-4">
        <div 
          className="rounded-full flex items-center justify-center"
          style={{ 
            width: size, 
            height: size,
            background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'
          }}
        >
          <span className={`text-sm ${isLight ? 'text-gray-400' : 'text-zinc-600'}`}>
            Нет данных
          </span>
        </div>
      </div>
    );
  }

  // Рассчитываем сегменты
  const segments = data.slice(0, 8).reduce<Array<any>>((acc, item, index) => {
    const value = item[valueKey] || 0;
    const percentage = (value / total) * 100;
    const angle = (value / total) * 360;
    const prevAngle = acc.length > 0 ? acc[acc.length - 1].endAngle : -90;
    
    acc.push({
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
      percentage,
      startAngle: prevAngle,
      endAngle: prevAngle + angle,
      value
    });
    return acc;
  }, []);

  // SVG paths для сегментов
  const createArcPath = (startAngle: number, endAngle: number, radius: number, innerRadius: number = 0) => {
    const start = polarToCartesian(radius, startAngle);
    const end = polarToCartesian(radius, endAngle);
    const innerStart = polarToCartesian(innerRadius, startAngle);
    const innerEnd = polarToCartesian(innerRadius, endAngle);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    if (innerRadius === 0) {
      return `M ${size/2} ${size/2} L ${start.x + size/2} ${start.y + size/2} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x + size/2} ${end.y + size/2} Z`;
    }
    
    return `M ${innerStart.x + size/2} ${innerStart.y + size/2} 
            L ${start.x + size/2} ${start.y + size/2} 
            A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x + size/2} ${end.y + size/2} 
            L ${innerEnd.x + size/2} ${innerEnd.y + size/2}
            A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerStart.x + size/2} ${innerStart.y + size/2} Z`;
  };

  const polarToCartesian = (radius: number, angle: number) => {
    const rad = (angle * Math.PI) / 180;
    return {
      x: radius * Math.cos(rad),
      y: radius * Math.sin(rad)
    };
  };

  const radius = size / 2 - 10;
  const innerRadius = radius * 0.55; // Donut chart

  return (
    <div className="flex flex-col items-center gap-3">
      {title && (
        <h4 className={`text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
          {title}
        </h4>
      )}
      
      <div className="relative">
        <svg width={size} height={size} className="transform -rotate-0">
          {segments.map((seg, i) => (
            <path
              key={i}
              d={createArcPath(seg.startAngle, seg.endAngle - 0.5, radius, innerRadius)}
              fill={seg.color}
              className="cursor-pointer transition-all hover:opacity-80"
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
              onClick={() => onSliceClick?.(seg)}
            >
              <title>{seg[labelKey]}: {seg.percentage.toFixed(1)}%</title>
            </path>
          ))}
        </svg>
        
        {/* Центр с общей суммой */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        >
          <span className={`text-lg font-black ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
            {total >= 1000 ? `${(total/1000).toFixed(1)}K` : total.toFixed(0)}
          </span>
          <span className={`text-[10px] ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
            {valueKey === 'revenue' ? '₽' : 'стримов'}
          </span>
        </div>
      </div>

      {/* Легенда */}
      {showLegend && (
        <div className="flex flex-wrap justify-center gap-2 max-w-[200px]">
          {segments.slice(0, 5).map((seg, i) => (
            <div 
              key={i} 
              className="flex items-center gap-1 cursor-pointer hover:opacity-80"
              onClick={() => onSliceClick?.(seg)}
            >
              <div 
                className="w-2 h-2 rounded-full flex-shrink-0" 
                style={{ backgroundColor: seg.color }}
              />
              <span className={`text-[10px] truncate max-w-[60px] ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
                {seg[labelKey]}
              </span>
            </div>
          ))}
          {segments.length > 5 && (
            <span className={`text-[10px] ${isLight ? 'text-[#7a7596]' : 'text-zinc-500'}`}>
              +{segments.length - 5}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

// Модальное окно с детальной информацией
function DetailModal({ 
  isOpen, 
  onClose, 
  title, 
  data,
  type 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  title: string;
  data: any;
  type: 'country' | 'platform' | 'track' | 'period';
}) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      <div 
        className="relative w-full max-w-md rounded-2xl p-6 animate-fade-up"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,243,255,0.95) 100%)'
            : 'linear-gradient(135deg, rgba(30,27,45,0.98) 0%, rgba(20,18,35,0.98) 100%)',
          border: isLight ? '1px solid rgba(138,99,210,0.2)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: isLight 
                  ? 'linear-gradient(135deg, rgba(232,121,249,0.15) 0%, rgba(192,132,252,0.1) 100%)'
                  : 'linear-gradient(135deg, rgba(232,121,249,0.2) 0%, rgba(192,132,252,0.15) 100%)'
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
              </svg>
            </div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
              {title}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-black/5' : 'hover:bg-white/5'}`}
          >
            <svg className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-zinc-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div 
              className="p-3 rounded-xl"
              style={{
                background: isLight ? 'rgba(232,121,249,0.08)' : 'rgba(232,121,249,0.1)'
              }}
            >
              <div className={`text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Доход</div>
              <div className="text-xl font-black" style={{ color: '#e879f9' }}>
                {(data.revenue || data.net_revenue || 0).toFixed(2)} ₽
              </div>
            </div>
            <div 
              className="p-3 rounded-xl"
              style={{
                background: isLight ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.1)'
              }}
            >
              <div className={`text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>Прослушивания</div>
              <div className="text-xl font-black text-blue-400">
                {(data.streams || 0).toLocaleString('ru-RU')}
              </div>
            </div>
          </div>

          {/* Additional Info */}
          {type === 'country' && (
            <div className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🌍</span>
                <span className="font-semibold">{data.name}</span>
              </div>
              <p>Ваша музыка слушается в этой стране! Продолжайте в том же духе.</p>
            </div>
          )}

          {type === 'platform' && (
            <div className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🎵</span>
                <span className="font-semibold">{data.name}</span>
              </div>
              <p>Статистика с платформы {data.name}.</p>
            </div>
          )}

          {type === 'track' && (
            <div className={`text-sm ${isLight ? 'text-[#5c5580]' : 'text-zinc-400'}`}>
              <div className="mb-2">
                <div className={`font-semibold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                  {data.track_title}
                </div>
                <div className="text-xs">{data.artist_name}</div>
              </div>
              {data.release_title && (
                <div className="text-xs opacity-70">Альбом: {data.release_title}</div>
              )}
            </div>
          )}

          {/* Percentage */}
          {data.percentage !== undefined && (
            <div className="flex items-center gap-2">
              <div 
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ background: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)' }}
              >
                <div 
                  className="h-full rounded-full transition-all"
                  style={{ 
                    width: `${Math.min(data.percentage, 100)}%`,
                    background: 'linear-gradient(90deg, #e879f9 0%, #c084fc 100%)'
                  }}
                />
              </div>
              <span className={`text-sm font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                {data.percentage.toFixed(1)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Основной компонент
export default function RoyaltyStats() {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  const [data, setData] = useState<RoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'countries' | 'platforms'>('countries');
  const [modalData, setModalData] = useState<{ isOpen: boolean; title: string; data: any; type: 'country' | 'platform' | 'track' | 'period' }>({
    isOpen: false,
    title: '',
    data: null,
    type: 'country'
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/royalty-stats');
      
      if (!response.ok) {
        throw new Error('Failed to load stats');
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error loading royalty stats:', err);
      setError('Не удалось загрузить статистику');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (item: any, type: 'country' | 'platform' | 'track' | 'period') => {
    const titles = {
      country: `🌍 ${item.name}`,
      platform: `🎵 ${item.name}`,
      track: `🎧 ${item.track_title}`,
      period: `📅 ${item.period}`
    };
    
    setModalData({
      isOpen: true,
      title: titles[type],
      data: item,
      type
    });
  };

  if (loading) {
    return (
      <div 
        className="rounded-2xl p-6"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(245,243,255,0.6) 100%)'
            : 'linear-gradient(135deg, rgba(30,27,45,0.6) 0%, rgba(20,18,35,0.4) 100%)',
          border: isLight ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-fuchsia-500 border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div 
        className="rounded-2xl p-6"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(245,243,255,0.6) 100%)'
            : 'linear-gradient(135deg, rgba(30,27,45,0.6) 0%, rgba(20,18,35,0.4) 100%)',
          border: isLight ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <p className={isLight ? 'text-[#5c5580]' : 'text-zinc-500'}>
            {error || 'Статистика роялти пока недоступна'}
          </p>
          <p className={`text-xs mt-1 ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}>
            Данные появятся после обработки отчётов дистрибьютора
          </p>
        </div>
      </div>
    );
  }

  const hasData = data.totals.totalRevenue > 0 || data.totals.totalStreams > 0;

  if (!hasData) {
    return (
      <div 
        className="rounded-2xl p-6"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(245,243,255,0.6) 100%)'
            : 'linear-gradient(135deg, rgba(30,27,45,0.6) 0%, rgba(20,18,35,0.4) 100%)',
          border: isLight ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.05)'
        }}
      >
        <div className="text-center py-8">
          <div 
            className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
            style={{
              background: isLight 
                ? 'linear-gradient(135deg, rgba(232,121,249,0.15) 0%, rgba(192,132,252,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(232,121,249,0.2) 0%, rgba(192,132,252,0.15) 100%)'
            }}
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="#e879f9" strokeWidth="2">
              <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
            </svg>
          </div>
          <p className={`font-semibold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
            Статистика роялти
          </p>
          <p className={`text-sm mt-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
            Пока нет данных о прослушиваниях
          </p>
          <p className={`text-xs mt-2 ${isLight ? 'text-[#7a7596]' : 'text-zinc-600'}`}>
            Статистика появится после обработки отчётов от дистрибьютора
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="rounded-2xl p-4 sm:p-6 space-y-6"
        style={{
          background: isLight 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(245,243,255,0.6) 100%)'
            : 'linear-gradient(135deg, rgba(30,27,45,0.6) 0%, rgba(20,18,35,0.4) 100%)',
          border: isLight ? '1px solid rgba(255,255,255,0.8)' : '1px solid rgba(255,255,255,0.05)'
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: isLight 
                ? 'linear-gradient(135deg, rgba(232,121,249,0.15) 0%, rgba(192,132,252,0.1) 100%)'
                : 'linear-gradient(135deg, rgba(232,121,249,0.2) 0%, rgba(192,132,252,0.15) 100%)'
            }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#e879f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 18a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm0 -12a2 2 0 0 1 2 2a2 2 0 0 1 2 -2a2 2 0 0 1 -2 -2a2 2 0 0 1 -2 2zm-7 12a6 6 0 0 1 6 -6a6 6 0 0 1 -6 -6a6 6 0 0 1 -6 6a6 6 0 0 1 6 6z" />
            </svg>
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
              Статистика роялти
            </h3>
            <p className={`text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
              Прослушивания и доходы с платформ
            </p>
          </div>
        </div>

        {/* Totals Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div 
            className="p-3 rounded-xl text-center"
            style={{
              background: isLight ? 'rgba(232,121,249,0.08)' : 'rgba(232,121,249,0.1)'
            }}
          >
            <div className={`text-[10px] uppercase tracking-wide mb-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
              Заработано
            </div>
            <div className="text-xl sm:text-2xl font-black" style={{ color: '#e879f9' }}>
              {data.totals.totalRevenue.toFixed(0)}
              <span className="text-sm font-normal ml-1">₽</span>
            </div>
          </div>
          
          <div 
            className="p-3 rounded-xl text-center"
            style={{
              background: isLight ? 'rgba(96,165,250,0.08)' : 'rgba(96,165,250,0.1)'
            }}
          >
            <div className={`text-[10px] uppercase tracking-wide mb-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
              Прослушивания
            </div>
            <div className="text-xl sm:text-2xl font-black text-blue-400">
              {data.totals.totalStreams >= 1000 
                ? `${(data.totals.totalStreams / 1000).toFixed(1)}K`
                : data.totals.totalStreams}
            </div>
          </div>
          
          <div 
            className="p-3 rounded-xl text-center"
            style={{
              background: isLight ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.1)'
            }}
          >
            <div className={`text-[10px] uppercase tracking-wide mb-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
              Треков
            </div>
            <div className="text-xl sm:text-2xl font-black text-violet-400">
              {data.totals.totalTracks}
            </div>
          </div>
          
          <div 
            className="p-3 rounded-xl text-center"
            style={{
              background: isLight ? 'rgba(52,211,153,0.08)' : 'rgba(52,211,153,0.1)'
            }}
          >
            <div className={`text-[10px] uppercase tracking-wide mb-1 ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
              Периодов
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400">
              {data.periods.length}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('countries')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'countries'
                ? 'bg-fuchsia-500/20 text-fuchsia-400'
                : isLight 
                  ? 'bg-black/5 text-[#5c5580] hover:bg-black/10'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            🌍 По странам
          </button>
          <button
            onClick={() => setActiveTab('platforms')}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'platforms'
                ? 'bg-fuchsia-500/20 text-fuchsia-400'
                : isLight 
                  ? 'bg-black/5 text-[#5c5580] hover:bg-black/10'
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10'
            }`}
          >
            🎵 По платформам
          </button>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <div className="flex flex-col items-center">
            <PieChart
              data={activeTab === 'countries' ? data.countries : data.platforms}
              valueKey="revenue"
              labelKey="name"
              title="Доход по источникам"
              onSliceClick={(item) => openModal(item, activeTab === 'countries' ? 'country' : 'platform')}
            />
          </div>

          {/* Streams Chart */}
          <div className="flex flex-col items-center">
            <PieChart
              data={activeTab === 'countries' ? data.countries : data.platforms}
              valueKey="streams"
              labelKey="name"
              title="Прослушивания"
              onSliceClick={(item) => openModal(item, activeTab === 'countries' ? 'country' : 'platform')}
            />
          </div>
        </div>

        {/* Top Tracks */}
        {data.tracks.length > 0 && (
          <div>
            <h4 className={`text-sm font-bold mb-3 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
              🎧 Топ треков
            </h4>
            <div className="space-y-2">
              {data.tracks.slice(0, 5).map((track, i) => (
                <div 
                  key={track.id}
                  className="flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: isLight ? 'rgba(0,0,0,0.03)' : 'rgba(255,255,255,0.03)'
                  }}
                  onClick={() => openModal(track, 'track')}
                >
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
                    style={{
                      background: `linear-gradient(135deg, ${CHART_COLORS[i]} 0%, ${CHART_COLORS[i]}80 100%)`,
                      color: 'white'
                    }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
                      {track.track_title}
                    </div>
                    <div className={`text-xs truncate ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                      {track.artist_name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: '#e879f9' }}>
                      {parseFloat(track.net_revenue).toFixed(2)} ₽
                    </div>
                    <div className={`text-xs ${isLight ? 'text-[#5c5580]' : 'text-zinc-500'}`}>
                      {track.streams?.toLocaleString('ru-RU')} стримов
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Periods */}
        {data.periods.length > 0 && (
          <div>
            <h4 className={`text-sm font-bold mb-3 ${isLight ? 'text-[#1a1535]' : 'text-white'}`}>
              📅 По периодам
            </h4>
            <div className="flex flex-wrap gap-2">
              {data.periods.map((period) => (
                <div 
                  key={period.period}
                  className="px-3 py-2 rounded-xl cursor-pointer transition-all hover:scale-105"
                  style={{
                    background: isLight ? 'rgba(192,132,252,0.1)' : 'rgba(192,132,252,0.15)'
                  }}
                  onClick={() => openModal(period, 'period')}
                >
                  <div className={`text-xs font-medium ${isLight ? 'text-[#a855f7]' : 'text-purple-300'}`}>
                    {period.period}
                  </div>
                  <div className="text-sm font-bold" style={{ color: '#e879f9' }}>
                    {period.revenue.toFixed(0)} ₽
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <DetailModal 
        isOpen={modalData.isOpen}
        onClose={() => setModalData({ ...modalData, isOpen: false })}
        title={modalData.title}
        data={modalData.data}
        type={modalData.type}
      />
    </>
  );
}
