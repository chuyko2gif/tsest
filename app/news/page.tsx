"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useTheme } from '@/contexts/ThemeContext';

// Тестовые новости (fallback если нет данных из БД)
const DEFAULT_NEWS: any[] = [];

// Компонент карточки новости
const NewsCard = ({ news, onClick, featured = false, isLight = false }: any) => {
  const date = new Date(news.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return (
    <div 
      onClick={onClick}
      className={`group cursor-pointer news-card ${featured ? 'md:col-span-2 md:row-span-2' : ''}`}
    >
      <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border-2 transition-all duration-700 transform hover:scale-[1.02] hover:shadow-2xl ${
        isLight 
          ? 'border-black/20 hover:border-black/40 bg-[rgba(25,25,30,0.7)] backdrop-blur-xl hover:shadow-black/20' 
          : 'border-[#6050ba]/30 hover:border-[#6050ba]/60 hover:shadow-[#6050ba]/30'
      } ${featured ? 'h-[300px] sm:h-[400px] md:h-[550px]' : 'h-[280px] sm:h-[320px]'}`}>
        {news.image ? (
          <img src={news.image} alt={news.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 group-hover:rotate-1" />
        ) : (
          <div className={`absolute inset-0 ${isLight ? 'bg-gradient-to-br from-[#8070da]/40 via-[#a090ea]/30 to-[#1a1a1f]' : 'bg-gradient-to-br from-[#6050ba]/30 via-[#9d8df1]/20 to-[#0a0a0c]'}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 p-5 sm:p-7 flex flex-col justify-end">
          {news.category && (
            <div className="mb-3 sm:mb-4 animate-fadeIn">
              <span className={`px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-[11px] font-black uppercase tracking-widest shadow-lg ${
                isLight 
                  ? 'bg-gradient-to-r from-[#8070da] to-[#a090ea]' 
                  : 'bg-gradient-to-r from-[#6050ba] to-[#8b7dd8]'
              }`}>{news.category}</span>
            </div>
          )}
          <h3 className={`font-black uppercase tracking-tight mb-4 sm:mb-5 transition-all duration-500 leading-tight ${
            isLight ? 'group-hover:text-[#d4c5fd]' : 'group-hover:text-[#c4b5fd]'
          } ${featured ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-lg sm:text-xl'}`} style={{ color: '#ffffff' }}>
            {news.title}
          </h3>
          <div className="flex items-center gap-4 sm:gap-5">
            <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-semibold" style={{ color: '#ffffff' }}>{date}</span>
            <div className={`flex items-center gap-2 text-[10px] sm:text-[11px] font-black uppercase tracking-widest group-hover:gap-3 transition-all ${
              isLight ? 'text-[#c4b5fd]' : 'text-purple-400'
            }`}>
              <span>Читать</span>
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
        <div className={`absolute inset-0 transition-all duration-700 ${
          isLight 
            ? 'bg-gradient-to-br from-black/0 via-black/0 to-black/10 group-hover:from-black/10 group-hover:via-black/5 group-hover:to-black/20'
            : 'bg-gradient-to-br from-[#6050ba]/0 via-[#6050ba]/0 to-[#6050ba]/20 group-hover:from-[#6050ba]/20 group-hover:via-[#6050ba]/10 group-hover:to-[#6050ba]/30'
        }`} />
      </div>
    </div>
  );
};

// Модальное окно новости  
const NewsModal = ({ news, onClose, isLight = false }: any) => {
  const date = new Date(news.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 pt-16 sm:pt-20 pb-4 sm:pb-6 animate-fadeIn news-modal" onClick={onClose}>
      <div className={`absolute inset-0 backdrop-blur-2xl ${isLight ? 'bg-black/50' : 'bg-black/85'}`} />
      <div className={`relative w-full max-w-4xl h-full overflow-y-auto rounded-2xl sm:rounded-3xl border shadow-2xl [&::-webkit-scrollbar]:hidden ${isLight ? 'bg-gradient-to-b from-white to-gray-50 border-[#6050ba]/30' : 'bg-gradient-to-b from-[#1a1a1f] to-[#0d0d0f] border-white/20'}`} onClick={(e) => e.stopPropagation()}>
        <div className="relative h-[220px] sm:h-[280px] md:h-[400px]">
          {news.image ? (
            <img src={news.image} alt={news.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#6050ba]/40 via-[#9d8df1]/30 to-[#0a0a0c]" />
          )}
          <div className={`absolute inset-0 bg-gradient-to-t ${isLight ? 'from-white via-transparent to-transparent' : 'from-[#0d0d0f] via-transparent to-transparent'}`} />
          <button onClick={onClose} className="absolute top-4 sm:top-5 md:top-6 right-4 sm:right-5 md:right-6 w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-[#6050ba] to-[#8b7dd8] backdrop-blur-md rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-200 text-white group shadow-lg">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-4 sm:bottom-5 md:bottom-6 left-4 sm:left-5 md:left-6 flex items-center gap-3 sm:gap-4 flex-wrap">
            {news.category && <span className="px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 bg-gradient-to-r from-[#6050ba] to-[#8b7dd8] rounded-full text-[10px] sm:text-[11px] md:text-xs font-black uppercase tracking-widest shadow-lg" style={{ color: '#ffffff' }}>{news.category}</span>}
            <span className="text-[10px] sm:text-[11px] md:text-xs uppercase tracking-widest font-semibold backdrop-blur-sm bg-black/50 px-3 py-1.5 rounded-full shadow-lg" style={{ color: '#ffffff' }}>{date}</span>
          </div>
        </div>
        <div className="p-5 sm:p-7 md:p-10 lg:p-14">
          <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight mb-8 sm:mb-10 leading-tight bg-gradient-to-r bg-clip-text text-transparent ${isLight ? 'from-[#1a1535] via-[#6050ba] to-[#1a1535]' : 'from-white via-[#c4b5fd] to-white'}`}>{news.title}</h1>
          <div className={`prose prose-sm sm:prose-base lg:prose-lg max-w-none ${isLight ? '' : 'prose-invert'}`}>
            {news.content?.split('\n').map((paragraph: string, i: number) => {
              // Функция для обработки inline-разметки (ссылки, жирный, курсив, код)
              const processInlineMarkdown = (text: string): string => {
                let processed = text;
                // Жирный текст
                processed = processed.replace(/\*\*(.+?)\*\*/g, `<strong class="font-bold ${isLight ? 'text-[#1a1535]' : 'text-white'}">$1</strong>`);
                // Курсив
                processed = processed.replace(/\*(.+?)\*/g, `<em class="italic ${isLight ? 'text-[#5c5580]' : 'text-zinc-300'}">$1</em>`);
                // Код
                processed = processed.replace(/`(.+?)`/g, `<code class="${isLight ? 'bg-[#6050ba]/10' : 'bg-black/50'} px-2 py-1 rounded text-[#6050ba] text-xs sm:text-sm font-mono">$1</code>`);
                // Ссылки [текст](url) - с поддержкой любого регистра
                processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, linkText, url) => {
                  const lowerUrl = url.toLowerCase();
                  const href = lowerUrl.startsWith('http://') || lowerUrl.startsWith('https://') ? url : `https://${url}`;
                  return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-[#6050ba] underline underline-offset-2 hover:text-[#8070da] transition-colors normal-case">${linkText}</a>`;
                });
                // Обычные URL (без Markdown разметки) - автоматическое определение ссылок
                // Ищем URL, которые НЕ находятся внутри href="" или уже обработанных тегов <a>
                processed = processed.replace(
                  /(?<!href="|">)(https?:\/\/[^\s<>"']+)/gi,
                  '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-[#6050ba] underline underline-offset-2 hover:text-[#8070da] transition-colors normal-case break-all">$1</a>'
                );
                return processed;
              };

              if (paragraph.trim() === '---') return <hr key={i} className="border-t-2 border-[#6050ba]/30 my-8 sm:my-10" />;
              if (paragraph.startsWith('# ')) {
                const content = processInlineMarkdown(paragraph.replace('# ', ''));
                return <h1 key={i} className={`text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight mt-10 sm:mt-12 mb-5 sm:mb-6 ${isLight ? 'text-[#1a1535]' : 'text-white'}`} dangerouslySetInnerHTML={{ __html: content }} />;
              }
              if (paragraph.startsWith('## ')) {
                const content = processInlineMarkdown(paragraph.replace('## ', ''));
                return <h2 key={i} className={`text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight mt-8 sm:mt-10 mb-4 sm:mb-5 ${isLight ? 'text-[#6050ba]' : 'text-[#c4b5fd]'}`} dangerouslySetInnerHTML={{ __html: content }} />;
              }
              if (paragraph.startsWith('> ')) {
                const content = processInlineMarkdown(paragraph.replace('> ', ''));
                return <blockquote key={i} className={`border-l-4 border-[#6050ba] pl-4 sm:pl-5 py-3 my-5 sm:my-6 italic bg-[#6050ba]/10 rounded-r-xl text-sm sm:text-base ${isLight ? 'text-[#3d3660]' : 'text-white/80'}`} dangerouslySetInnerHTML={{ __html: content }} />;
              }
              if (paragraph.startsWith('- ')) {
                const content = processInlineMarkdown(paragraph.replace('- ', ''));
                return <li key={i} className={`ml-4 sm:ml-5 text-sm sm:text-base leading-relaxed ${isLight ? 'text-[#3d3660]' : 'text-white/90'}`} dangerouslySetInnerHTML={{ __html: content }} />;
              }
              if (paragraph.trim()) {
                const processed = processInlineMarkdown(paragraph);
                return <p key={i} className={`mb-4 sm:mb-5 text-sm sm:text-base leading-relaxed ${isLight ? 'text-[#3d3660]' : 'text-white/85'}`} dangerouslySetInnerHTML={{ __html: processed }} />;
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

function NewsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const newsId = searchParams.get('id');
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNews, setSelectedNews] = useState<any>(null);

  // Функция для открытия новости с обновлением URL
  const openNews = (newsItem: any) => {
    setSelectedNews(newsItem);
    router.push(`/news?id=${newsItem.id}`, { scroll: false });
  };

  // Функция для закрытия новости с очисткой URL
  const closeNews = () => {
    setSelectedNews(null);
    router.push('/news', { scroll: false });
  };

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
          const loadedNews = data && data.length > 0 ? data : DEFAULT_NEWS;
          setNews(loadedNews);
          
          // Автоматически открываем новость по ID из URL
          if (newsId && loadedNews.length > 0) {
            const newsItem = loadedNews.find((item: any) => item.id.toString() === newsId);
            if (newsItem) {
              setSelectedNews(newsItem);
            }
          }
        }
      } catch (e) {
        console.error('Исключение при загрузке новостей:', e);
        setNews(DEFAULT_NEWS);
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, [newsId]);

  return (
    <main className="min-h-screen pt-16 sm:pt-20 md:pt-24 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8 relative overflow-hidden">
      {/* Тёмная тема - AnimatedBackground */}
      {!isLight && <AnimatedBackground />}
      
      {/* Голографический фон для светлой темы как на фиде */}
      {isLight && (
        <div className="fixed inset-0 pointer-events-none z-0" style={{ transform: 'translateZ(0)' }}>
          {/* Основной мягкий градиент */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(135deg, 
                  rgba(255,200,210,0.3) 0%, 
                  rgba(255,230,200,0.25) 20%, 
                  rgba(230,255,230,0.25) 40%, 
                  rgba(200,230,255,0.3) 60%, 
                  rgba(230,200,240,0.3) 80%, 
                  rgba(255,200,210,0.3) 100%
                )
              `,
              animation: 'holographic-bg-shift 20s ease-in-out infinite',
            }}
          />
          {/* Мягкие радужные переливы */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                radial-gradient(ellipse at 15% 25%, rgba(255,180,210,0.35) 0%, transparent 50%),
                radial-gradient(ellipse at 85% 75%, rgba(180,210,255,0.35) 0%, transparent 50%),
                radial-gradient(ellipse at 50% 50%, rgba(210,180,240,0.3) 0%, transparent 60%)
              `,
              animation: 'holographic-bg-glow 15s ease-in-out infinite',
            }}
          />
          {/* Лёгкие блики */}
          <div 
            className="absolute inset-0"
            style={{
              background: `
                linear-gradient(45deg, 
                  transparent 0%, 
                  rgba(255,255,255,0.2) 30%, 
                  transparent 50%, 
                  rgba(255,255,255,0.15) 70%, 
                  transparent 100%
                )
              `,
              backgroundSize: '300% 300%',
              animation: 'shimmer-bg 12s linear infinite',
            }}
          />
          {/* Плавающие мягкие пятна */}
          <div 
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{
              top: '-10%',
              left: '-10%',
              background: 'radial-gradient(circle, rgba(255,150,180,0.3) 0%, rgba(255,200,150,0.15) 50%, transparent 70%)',
              filter: 'blur(80px)',
              animation: 'float-bg-blob 25s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute w-[450px] h-[450px] rounded-full"
            style={{
              bottom: '-5%',
              right: '-10%',
              background: 'radial-gradient(circle, rgba(150,200,255,0.3) 0%, rgba(200,150,240,0.15) 50%, transparent 70%)',
              filter: 'blur(70px)',
              animation: 'float-bg-blob 30s ease-in-out infinite reverse',
            }}
          />
          {/* Звёздочки/блёстки */}
          {Array.from({ length: 40 }, (_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${(i % 3) + 2}px`,
                height: `${(i % 3) + 2}px`,
                left: `${(i * 37) % 100}%`,
                top: `${(i * 23) % 100}%`,
                background: 'linear-gradient(135deg, rgba(180,140,220,0.8) 0%, rgba(140,180,220,0.8) 50%, rgba(200,160,200,0.8) 100%)',
                boxShadow: '0 0 6px rgba(180,140,220,0.5)',
                animation: `twinkle-light ${2 + (i % 3)}s ease-in-out infinite ${(i % 10) * 0.2}s`,
              }}
            />
          ))}
          <style jsx>{`
            @keyframes holographic-bg-shift {
              0%, 100% { filter: hue-rotate(0deg) brightness(1); }
              50% { filter: hue-rotate(10deg) brightness(1.02); }
            }
            @keyframes holographic-bg-glow {
              0%, 100% { opacity: 0.6; }
              50% { opacity: 0.9; }
            }
            @keyframes shimmer-bg {
              0% { background-position: 300% 300%; }
              100% { background-position: -300% -300%; }
            }
            @keyframes float-bg-blob {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(15px, -10px) scale(1.02); }
              66% { transform: translate(-10px, 10px) scale(0.98); }
            }
            @keyframes twinkle-light {
              0%, 100% { opacity: 0.4; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.3); }
            }
          `}</style>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto relative z-20">
        <div className={`mb-6 sm:mb-8 md:mb-10 text-center py-4 sm:py-6 px-4 sm:px-6 ${
          isLight 
            ? 'rounded-3xl bg-white/40 backdrop-blur-xl border border-white/50 shadow-xl' 
            : ''
        }`}>
          <div className="inline-block mb-2">
            <span className={`px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-widest lowercase ${
              isLight 
                ? 'bg-white/60 border border-purple-300/50 text-gray-700' 
                : 'bg-[#6050ba] text-white'
            }`}>
              thqlabel updates
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-wide mb-2 leading-none">
            <span className={`inline-block ${
              isLight 
                ? 'text-gray-800' 
                : 'bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient bg-gradient-to-r from-[#6050ba] via-[#c4b5fd] to-[#6050ba]'
            }`}>
              Новости
            </span>
          </h1>
          <p className={`text-sm sm:text-base tracking-wide max-w-2xl mx-auto ${
            isLight ? 'text-gray-600' : 'text-zinc-400'
          }`}>
            Последние обновления, анонсы релизов и важные события от лейбла
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 sm:py-28">
            <div className="inline-block">
              <div className={`w-12 h-12 border-4 rounded-full animate-spin ${
                isLight ? 'border-[#8070da]/30 border-t-[#8070da]' : 'border-[#6050ba]/30 border-t-[#6050ba]'
              }`}></div>
              <div className={`text-sm sm:text-base mt-4 font-semibold ${isLight ? 'text-gray-600' : 'text-zinc-500'}`}>Загрузка новостей...</div>
            </div>
          </div>
        ) : news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-28 sm:py-36 px-4">
            <div className="relative mb-6 sm:mb-8">
              <div className={`absolute inset-0 blur-3xl rounded-full animate-pulse ${
                isLight ? 'bg-[#8070da]/25' : 'bg-[#6050ba]/20'
              }`}></div>
              <div className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 flex items-center justify-center shadow-2xl ${
                isLight 
                  ? 'bg-gradient-to-br from-[#8070da]/50 to-[#a090ea]/30 border-[#8070da]/50' 
                  : 'bg-gradient-to-br from-[#6050ba]/40 to-[#9d8df1]/20 border-[#6050ba]/40'
              }`}>
                <svg className={`w-12 h-12 sm:w-14 sm:h-14 ${isLight ? 'text-[#d4c5fd]' : 'text-[#c4b5fd]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
              </div>
            </div>
            <h3 className={`text-2xl sm:text-3xl font-black uppercase tracking-tight mb-3 text-center ${isLight ? 'text-gray-900' : 'text-white'}`}>Новостей пока нет</h3>
            <p className={`text-sm sm:text-base text-center max-w-md leading-relaxed ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
              Следите за обновлениями — скоро здесь появятся важные анонсы и события от лейбла
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-7 lg:gap-8">
            {news.map((item, index) => (
              <NewsCard key={item.id} news={item} featured={index === 0} onClick={() => openNews(item)} isLight={isLight} />
            ))}
          </div>
        )}
      </div>
      {selectedNews && <NewsModal news={selectedNews} onClose={closeNews} isLight={isLight} />}
    </main>
  );
}

export default function NewsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div></div>}>
      <NewsPageContent />
    </Suspense>
  );
}
