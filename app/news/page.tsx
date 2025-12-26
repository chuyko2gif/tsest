"use client";
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import AnimatedBackground from '@/components/AnimatedBackground';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// Тестовые новости (fallback если нет данных из БД)
const DEFAULT_NEWS = [
  {
    id: 1,
    title: 'Большое обновление thqlabel — Новые возможности для артистов!',
    content: `thqlabel готовит масштабное обновление для всех артистов!

Мы усердно работаем над новым функционалом, который сделает работу с лейблом ещё удобнее.

## Что нового:

- Полностью обновлённый личный кабинет артиста
- Система тикетов для быстрой связи с поддержкой
- Расширенная статистика прослушиваний
- Возможность редактирования релизов

## График работы:

После 19 декабря релизы не отгружаются до 5 января из-за новогодних праздников. Успейте закинуть всё на отгрузку до 19 числа!

## Важно:

По всем вопросам и задачам отписывайте в Telegram: @thqmgmt

Всех с наступающим! Желаем артистам отлично провести Новый год и начать 2026 с новых хитов!`,
    image: 'https://novayagazeta.ru/static/records/bec4ac4a0d544693a4f4414fe4d50a0d.jpeg',
    created_at: '2025-12-24T02:22:00Z',
    category: 'Обновление',
  },
];

// Компонент карточки новости
const NewsCard = ({ news, onClick, featured = false }: any) => {
  const excerpt = news.content?.substring(0, 150) + '...' || '';
  const date = new Date(news.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden rounded-3xl border border-white/5 hover:border-[#6050ba]/50 transition-all duration-500 ${featured ? 'h-[400px] md:h-[500px]' : 'h-[280px]'}`}>
        {news.image ? (
          <img src={news.image} alt={news.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#6050ba]/20 to-[#0a0a0c]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          {news.category && (
            <div className="mb-3">
              <span className="px-3 py-1 bg-[#6050ba] rounded-full text-[10px] font-bold uppercase tracking-widest">{news.category}</span>
            </div>
          )}
          <h3 className={`font-black uppercase tracking-tight mb-2 group-hover:text-[#9d8df1] transition-colors ${featured ? 'text-2xl md:text-3xl' : 'text-lg'}`}>{news.title}</h3>
          <p className={`text-zinc-400 mb-3 line-clamp-2 ${featured ? 'text-sm' : 'text-xs'}`}>{excerpt}</p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest">{date}</span>
            <span className="text-[10px] text-[#6050ba] font-bold uppercase tracking-widest group-hover:translate-x-2 transition-transform">Читать →</span>
          </div>
        </div>
        <div className="absolute inset-0 bg-[#6050ba]/0 group-hover:bg-[#6050ba]/10 transition-colors duration-500" />
      </div>
    </div>
  );
};

// Модальное окно новости  
const NewsModal = ({ news, onClose }: any) => {
  const date = new Date(news.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-[#0d0d0f] rounded-3xl border border-white/10" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-[250px] md:h-[350px]">
          {news.image ? (
            <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#6050ba]/30 to-[#0a0a0c]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-6 right-6 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-[#6050ba] transition-colors text-xl">✕</button>
          <div className="absolute bottom-6 left-6 flex items-center gap-4">
            {news.category && <span className="px-4 py-2 bg-[#6050ba] rounded-full text-[11px] font-bold uppercase tracking-widest">{news.category}</span>}
            <span className="text-[11px] text-zinc-400 uppercase tracking-widest">{date}</span>
          </div>
        </div>
        <div className="p-8 md:p-12">
          <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-8">{news.title}</h1>
          <div className="prose prose-invert prose-lg max-w-none">
            {news.content?.split('\n').map((paragraph: string, i: number) => {
              if (paragraph.startsWith('## ')) return <h2 key={i} className="text-xl font-black uppercase tracking-tight text-[#9d8df1] mt-8 mb-4">{paragraph.replace('## ', '')}</h2>;
              if (paragraph.startsWith('- ')) return <li key={i} className="text-zinc-300 ml-4">{paragraph.replace('- ', '')}</li>;
              if (paragraph.trim()) return <p key={i} className="text-zinc-400 mb-4">{paragraph}</p>;
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function NewsPage() {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [showCapybaraMsg, setShowCapybaraMsg] = useState(false);
  const [capybaraMsg, setCapybaraMsg] = useState('');

  const capybaraMessages = [
    'Читаешь новости? Молодец! 📰',
    'Капибара следит за тобой 👀',
    'Свежие новости, горячая капибара! 🔥',
    'Лайк этой новости! ❤️',
    'thqlabel топ! 🎵',
  ];

  useEffect(() => {
    const loadNews = async () => {
      if (!supabase) { 
        console.warn('Supabase не инициализирован');
        setNews(DEFAULT_NEWS); 
        setLoading(false); 
        return; 
      }
      try {
        const { data, error } = await supabase.from('news').select('*').order('created_at', { ascending: false });
        if (error) {
          console.error('Ошибка загрузки новостей:', error);
          setNews(DEFAULT_NEWS);
        } else {
          // Если есть новости в БД - показываем их, иначе дефолтные
          setNews(data && data.length > 0 ? data : DEFAULT_NEWS);
        }
      } catch (e) {
        console.error('Исключение при загрузке новостей:', e);
        setNews(DEFAULT_NEWS);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, []);

  return (
    <main className="min-h-screen pt-32 pb-20 px-6 md:px-8 relative">
      <AnimatedBackground />
      <div className="max-w-6xl mx-auto relative z-20">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter mb-4">
            <span className="text-white">Ново</span><span className="text-[#6050ba]">сти</span>
          </h1>
          <p className="text-zinc-500 text-sm uppercase tracking-widest">Последние обновления от thqlabel</p>
        </div>

        {loading ? (
          <div className="text-center py-20"><div className="text-zinc-600 animate-pulse">Загрузка новостей...</div></div>
        ) : news.length === 0 ? (
          <div className="text-center py-20"><div className="text-4xl mb-4">📰</div><p className="text-zinc-600">Новостей пока нет</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item, index) => (
              <NewsCard key={item.id} news={item} featured={index === 0} onClick={() => setSelectedNews(item)} />
            ))}
          </div>
        )}

        <div className="mt-16 p-8 bg-white/[0.02] border border-white/5 rounded-3xl text-center">
          <h3 className="text-2xl font-black uppercase tracking-tight mb-4">Будь в курсе</h3>
          <p className="text-zinc-500 text-sm mb-6">Подпишись на обновления лейбла</p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input type="email" placeholder="Твой email" className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-sm outline-none focus:border-[#6050ba] transition" />
            <button className="px-8 py-4 bg-[#6050ba] rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#7060ca] transition">OK</button>
          </div>
        </div>
      </div>
      {selectedNews && <NewsModal news={selectedNews} onClose={() => setSelectedNews(null)} />}
      
      {/* Капибара пасхалка */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => {
            setCapybaraMsg(capybaraMessages[Math.floor(Math.random() * capybaraMessages.length)]);
            setShowCapybaraMsg(true);
            setTimeout(() => setShowCapybaraMsg(false), 2000);
          }}
          className="group relative w-14 h-14 transition-transform hover:scale-110 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center hover:bg-white/20"
        >
          <span className="text-3xl">🦫</span>
          {showCapybaraMsg && (
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-[#6050ba] rounded-xl text-xs whitespace-nowrap animate-fade-up">
              {capybaraMsg}
            </div>
          )}
        </button>
      </div>
    </main>
  );
}
