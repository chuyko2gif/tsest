"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import { useSupportWidget } from '@/lib/hooks/useSupportWidget';
import { createClient } from '@supabase/supabase-js';
import { useTheme } from '@/contexts/ThemeContext';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// SVG Icons as components - используем функции для динамических классов
const getIcons = (isLight: boolean) => ({
  microphone: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  user: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  search: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  edit: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  music: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  warning: (
    <svg className={`w-5 h-5 ${isLight ? 'text-amber-600' : 'text-amber-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  xCircle: (
    <svg className={`w-5 h-5 ${isLight ? 'text-red-600' : 'text-red-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  trendingUp: (
    <svg className={`w-5 h-5 ${isLight ? 'text-green-600' : 'text-green-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  lightBulb: (
    <svg className={`w-5 h-5 ${isLight ? 'text-yellow-600' : 'text-yellow-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  searchIcon: (
    <svg className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  arrowRight: (isLight: boolean) => (
    <svg className={`w-4 h-4 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
    </svg>
  ),
});

// Custom component for rendering FAQ answers with icons
const FAQAnswer = ({ content }: { content: React.ReactNode }) => (
  <div className="text-xs sm:text-sm md:text-base text-zinc-400 leading-relaxed">
    {content}
  </div>
);

// Item with icon component
const IconItem = ({ icon, children, className = "" }: { icon: React.ReactNode; children: React.ReactNode; className?: string }) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <span className="mt-0.5">{icon}</span>
    <span>{children}</span>
  </div>
);

const FAQ_DATA = [
  {
    category: 'Дистрибуция',
    questions: [
      {
        q: 'Как загрузить релиз на платформы?',
        a: 'Войдите в личный кабинет, перейдите в раздел "Релизы" и нажмите "Загрузить демо". Заполните все поля, прикрепите аудиофайлы и обложку. После модерации ваш релиз будет опубликован на всех платформах.',
        component: null
      },
      {
        q: 'Сколько времени занимает публикация?',
        a: 'Обычно релиз появляется на платформах в течение 2-5 рабочих дней после одобрения модерацией. Spotify и Apple Music могут требовать до 7 дней.',
        component: null
      },
      {
        q: 'На какие платформы вы дистрибутируете?',
        a: 'Мы дистрибутируем на все основные платформы: Spotify, Apple Music, YouTube Music, Яндекс Музыка, VK Music, Deezer, Tidal, Amazon Music и более 150 других.',
        component: null
      },
      {
        q: 'Могу ли я выбрать дату релиза?',
        a: 'Да! При загрузке демо укажите желаемую дату релиза. Рекомендуем указывать дату минимум за 2 недели до публикации.',
        component: null
      },
    ]
  },
  {
    category: 'Финансы',
    questions: [
      {
        q: 'Как работают выплаты?',
        a: 'Выплаты производятся ежеквартально. Вы получаете 85% от всех доходов. Минимальная сумма для вывода — 1000 рублей.',
        component: null
      },
      {
        q: 'Когда я получу отчёты с продаж?',
        a: '',
        component: 'reports'
      },
      {
        q: 'Какие способы вывода доступны?',
        a: 'Вывод доступен на банковские карты РФ (Сбербанк, Тинькофф, Альфа и др.), а также на ЮMoney и QIWI.',
        component: null
      },
    ]
  },
  {
    category: 'Аккаунт',
    questions: [
      {
        q: 'Как изменить никнейм артиста?',
        a: 'Перейдите в раздел "Настройки" в личном кабинете. Там вы можете изменить никнейм, аватар и другие данные профиля.',
        component: null
      },
      {
        q: 'Забыл пароль, что делать?',
        a: 'На странице входа нажмите "Забыли пароль?" и введите email. Вам придёт ссылка для восстановления.',
        component: null
      },
      {
        q: 'Как связаться с поддержкой?',
        a: 'Нажмите на кнопку "Написать в поддержку" внизу страницы или используйте виджет поддержки в правом нижнем углу. Мы отвечаем в течение 24 часов.',
        component: null
      },
    ]
  },
  {
    category: 'Роли и Контрибуторы',
    questions: [
      {
        q: 'Роли артистов и контрибуторов',
        a: '',
        component: 'roles'
      },
    ]
  },
  {
    category: 'Биты и Права',
    questions: [
      {
        q: 'Почему не стоит использовать фришные биты с ютуба',
        a: '',
        component: 'beats'
      },
    ]
  },
  {
    category: 'Сотрудничество',
    questions: [
      {
        q: 'Кто может присоединиться к thqlabel?',
        a: 'Мы работаем со всеми артистами независимо от уровня. Зарегистрируйтесь, загрузите демо — и мы рассмотрим вашу заявку.',
        component: null
      },
      {
        q: 'Есть ли контракт?',
        a: 'Да, мы заключаем неэксклюзивный лицензионный договор. Вы сохраняете все права на музыку и можете выйти из сотрудничества в любой момент.',
        component: null
      },
      {
        q: 'Что такое Exclusive статус?',
        a: 'Exclusive артисты получают приоритетную поддержку, продвижение в соцсетях лейбла и повышенный процент выплат (до 90%).',
        component: null
      },
    ]
  },
];

// Custom rendered components for complex FAQ answers
const RolesComponent = ({ isLight }: { isLight: boolean }) => {
  const Icons = getIcons(isLight);
  return (
    <div className="space-y-4">
      <p className={isLight ? 'text-gray-700' : 'text-white/80'}>Артисты и контрибуторы указывают роли, требуемые музыкальными площадками, особенно Spotify и Apple Music/iTunes.</p>
      
      <IconItem icon={Icons.microphone}>
        <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Основной артист</span>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}> — тот, чьё имя указывается как исполнителя, и чей профиль пополняется новыми релизами.</span>
      </IconItem>
      
      <IconItem icon={Icons.user}>
        <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Контрибутор</span>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}> — участник процесса создания, не отображаемый как исполнитель.</span>
      </IconItem>
      
      <IconItem icon={Icons.search}>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}>Обязательно указывать реальные имена авторов текста, композиторов и аранжировщиков, остальные могут использовать псевдонимы.</span>
      </IconItem>
      
      <IconItem icon={Icons.edit}>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}>Добавляются в соответствующем разделе при редактировании релиза кнопками "Добавить артиста" и "Добавить контрибутора".</span>
      </IconItem>
    </div>
  );
};

const BeatsComponent = ({ isLight }: { isLight: boolean }) => {
  const Icons = getIcons(isLight);
  return (
    <div className="space-y-4">
      <IconItem icon={Icons.music}>
        <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Бесплатные биты и биты в аренде рискованны</span>
      </IconItem>
      
      <IconItem icon={Icons.warning}>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}>Они могут использоваться другими артистами, вызывая юридические споры и потерю дохода.</span>
      </IconItem>
      
      <div className="ml-0">
        <IconItem icon={Icons.xCircle} className="mb-2">
          <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Проблемы:</span>
        </IconItem>
        <ul className={`ml-8 space-y-1 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <li className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400/80'}`}></span>
            Трек получает чужую обложку или название
          </li>
          <li className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400/80'}`}></span>
            Юридические конфликты из-за отсутствия прав
          </li>
          <li className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-red-500' : 'bg-red-400/80'}`}></span>
            Потеря денег и времени на создание и продвижение трека
          </li>
        </ul>
      </div>
    
      <div className="ml-0">
        <IconItem icon={Icons.trendingUp} className="mb-2">
          <span className={`font-medium ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>Решения:</span>
        </IconItem>
        <ul className={`ml-8 space-y-1 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
          <li className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-green-500' : 'bg-green-400/80'}`}></span>
            Создавайте собственные биты
          </li>
          <li className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${isLight ? 'bg-green-500' : 'bg-green-400/80'}`}></span>
            Покупайте эксклюзивные биты с полной передачей прав
          </li>
        </ul>
      </div>
      
      <IconItem icon={Icons.lightBulb}>
        <span className={isLight ? 'text-gray-700' : 'text-white/80'}>Используйте бесплатные или арендованные биты только для тестовых записей, но не выкладывайте их публично.</span>
      </IconItem>
    </div>
  );
};

const ReportsComponent = ({ isLight }: { isLight: boolean }) => {
  const Icons = getIcons(isLight);
  return (
    <div className="space-y-4">
      <p className={isLight ? 'text-gray-700' : 'text-white/80'}>
        Отчеты публикуются в кабинеты каждый квартал в течение 30 дней после его окончания. 
        Выплаты производятся примерно через 10 дней после публикации отчетов.
      </p>
      
      <div>
        <p className={`font-medium mb-3 ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>График получения отчетов:</p>
        <div className="grid gap-2">
          <div className={`flex items-center gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-600' : 'bg-[#9d8df1]'}`}></span>
            <span className={isLight ? 'text-gray-800 font-medium' : 'text-[#c4b5fd]'}>Q1</span>
            <span className={isLight ? 'text-gray-500' : 'text-white/60'}>(янв.-мар.)</span>
            {Icons.arrowRight(isLight)}
            <span>конец апреля</span>
          </div>
          <div className={`flex items-center gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-600' : 'bg-[#9d8df1]'}`}></span>
            <span className={isLight ? 'text-gray-800 font-medium' : 'text-[#c4b5fd]'}>Q2</span>
            <span className={isLight ? 'text-gray-500' : 'text-white/60'}>(апр.-июнь)</span>
            {Icons.arrowRight(isLight)}
            <span>конец июля</span>
          </div>
          <div className={`flex items-center gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-600' : 'bg-[#9d8df1]'}`}></span>
            <span className={isLight ? 'text-gray-800 font-medium' : 'text-[#c4b5fd]'}>Q3</span>
            <span className={isLight ? 'text-gray-500' : 'text-white/60'}>(июл.-сен.)</span>
            {Icons.arrowRight(isLight)}
            <span>конец октября</span>
          </div>
          <div className={`flex items-center gap-3 ${isLight ? 'text-gray-700' : 'text-white/80'}`}>
            <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-600' : 'bg-[#9d8df1]'}`}></span>
            <span className={isLight ? 'text-gray-800 font-medium' : 'text-[#c4b5fd]'}>Q4</span>
            <span className={isLight ? 'text-gray-500' : 'text-white/60'}>(окт.-дек.)</span>
            {Icons.arrowRight(isLight)}
            <span>конец января</span>
          </div>
        </div>
      </div>
      
      <p className={`text-sm italic ${isLight ? 'text-gray-500' : 'text-white/60'}`}>
        Запаздывание связано с необходимостью получать отчёты от магазинов, которые предоставляются с задержкой в 29-30 дней.
      </p>
    </div>
  );
};

// Map of custom components - теперь принимают isLight
const customComponents: { [key: string]: React.FC<{ isLight: boolean }> } = {
  roles: RolesComponent,
  beats: BeatsComponent,
  reports: ReportsComponent,
};

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const supportWidget = useSupportWidget();
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) {
        setIsAuthenticated(false);
        return;
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };

    checkAuth();
  }, []);

  const handleSupportClick = () => {
    if (!isAuthenticated) {
      // Перенаправляем на страницу авторизации
      router.push('/auth');
    } else {
      // Открываем виджет поддержки для авторизованных пользователей
      supportWidget.open();
    }
  };

  const filteredData = FAQ_DATA.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  const toggleQuestion = (key: string) => {
    setOpenIndex(openIndex === key ? null : key);
  };

  return (
    <main className="min-h-screen pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 relative">
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
      
      <div className="max-w-4xl mx-auto relative z-20">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-wide mb-3 sm:mb-4">
            <span className={`inline-block ${
              isLight 
                ? 'text-gray-800' 
                : 'bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient bg-gradient-to-r from-[#6050ba] via-[#c4b5fd] to-[#6050ba]'
            }`}>FAQ</span>
          </h1>
          <p className={`text-sm sm:text-base md:text-lg ${isLight ? 'text-gray-600' : 'text-white/70'}`}>Часто задаваемые вопросы</p>
        </div>

        <div className="mb-6 sm:mb-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по вопросам..."
              className={`w-full px-4 sm:px-6 py-3 sm:py-4 border-2 rounded-2xl text-sm sm:text-base outline-none transition-all backdrop-blur-xl ${
                isLight 
                  ? 'bg-white/60 border-gray-300 text-gray-800 placeholder-gray-400 focus:border-gray-400'
                  : 'bg-[#0a0a0f]/80 border-[#6050ba]/30 text-white placeholder-white/40 focus:border-[#6050ba]/60'
              }`}
            />
            <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
              <svg className={`w-5 h-5 ${isLight ? 'text-gray-500' : 'text-[#9d8df1]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {filteredData.map((category, catIndex) => (
            <div key={catIndex} className="space-y-3 sm:space-y-4">
              <h2 className={`text-lg sm:text-xl font-bold flex items-center gap-2 ${isLight ? 'text-gray-800' : 'text-[#c4b5fd]'}`}>
                <span className={`w-2 h-2 rounded-full ${isLight ? 'bg-gray-600' : 'bg-[#6050ba]'}`}></span>
                {category.category}
              </h2>
              
              <div className="space-y-2 sm:space-y-3">
                {category.questions.map((item, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === key;
                  
                  return (
                    <div 
                      key={key}
                      className={`rounded-xl sm:rounded-2xl border-2 transition-all duration-300 overflow-hidden backdrop-blur-xl ${
                        isLight
                          ? (isOpen 
                              ? 'bg-white/70 border-gray-300 shadow-lg' 
                              : 'bg-white/50 border-gray-200 hover:border-gray-300 shadow-md')
                          : (isOpen 
                              ? 'bg-[#0a0a0f]/90 border-[#6050ba]/50' 
                              : 'bg-[#0a0a0f]/70 border-[#6050ba]/20 hover:border-[#6050ba]/40')
                      }`}
                    >
                      <button
                        onClick={() => toggleQuestion(key)}
                        className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left"
                      >
                        <span className={`font-bold text-sm sm:text-base pr-3 sm:pr-4 ${isLight ? 'text-gray-800' : 'text-white'}`}>{item.q}</span>
                        <span className={`text-xl sm:text-2xl transition-transform duration-300 flex-shrink-0 ${isLight ? 'text-gray-600' : 'text-[#9d8df1]'} ${isOpen ? 'rotate-45' : ''}`}>
                          +
                        </span>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px]' : 'max-h-0'}`}>
                        <div className="px-4 sm:px-6 pb-4 sm:pb-5">
                          {item.component && customComponents[item.component] ? (
                            React.createElement(customComponents[item.component], { isLight })
                          ) : (
                            <p className={`text-xs sm:text-sm md:text-base leading-relaxed ${isLight ? 'text-gray-600' : 'text-white/80'}`}>
                              {item.a}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-12 sm:mt-16 text-center p-6 sm:p-8 md:p-12 border-2 rounded-2xl sm:rounded-3xl backdrop-blur-xl ${
          isLight 
            ? 'bg-white/60 border-gray-200 shadow-xl'
            : 'bg-gradient-to-br from-[#0a0a0f]/90 via-[#6050ba]/10 to-[#0a0a0f]/90 border-[#6050ba]/40'
        }`}>
          <h3 className={`text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 ${isLight ? 'text-gray-800' : 'text-white'}`}>Не нашли ответ?</h3>
          <p className={`text-sm sm:text-base md:text-lg mb-6 sm:mb-8 ${isLight ? 'text-gray-600' : 'text-white/80'}`}>
            {isAuthenticated 
              ? 'Создайте тикет в поддержку — мы ответим в течение 24 часов'
              : 'Войдите в аккаунт, чтобы написать в поддержку'}
          </p>
          <button 
            onClick={handleSupportClick}
            className={`inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base md:text-xl transition-all hover:scale-105 hover:shadow-2xl ${
              isLight 
                ? 'bg-gray-800 text-white hover:bg-gray-700 hover:shadow-gray-400/40'
                : 'bg-gradient-to-r from-[#6050ba] to-[#8070da] text-white hover:shadow-[#6050ba]/40'
            }`}
          >
            {isAuthenticated ? 'Написать в поддержку' : 'Войти в аккаунт'}
          </button>
        </div>
      </div>
    </main>
  );
}
