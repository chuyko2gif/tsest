"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AnimatedBackground from '@/components/AnimatedBackground';
import { useSupportWidget } from '@/lib/useSupportWidget';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// SVG Icons as components
const Icons = {
  microphone: (
    <svg className="w-5 h-5 text-[#9d8df1] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5 text-[#9d8df1] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  search: (
    <svg className="w-5 h-5 text-[#9d8df1] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  edit: (
    <svg className="w-5 h-5 text-[#9d8df1] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  music: (
    <svg className="w-5 h-5 text-[#9d8df1] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  xCircle: (
    <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  trendingUp: (
    <svg className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  lightBulb: (
    <svg className="w-5 h-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  searchIcon: (
    <svg className="w-5 h-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
};

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
const RolesComponent = () => (
  <div className="space-y-4">
    <p className="text-zinc-400">Артисты и контрибуторы указывают роли, требуемые музыкальными площадками, особенно Spotify и Apple Music/iTunes.</p>
    
    <IconItem icon={Icons.microphone}>
      <span className="text-white font-medium">Основной артист</span>
      <span className="text-zinc-400"> — тот, чьё имя указывается как исполнителя, и чей профиль пополняется новыми релизами.</span>
    </IconItem>
    
    <IconItem icon={Icons.user}>
      <span className="text-white font-medium">Контрибутор</span>
      <span className="text-zinc-400"> — участник процесса создания, не отображаемый как исполнитель.</span>
    </IconItem>
    
    <IconItem icon={Icons.search}>
      <span className="text-zinc-400">Обязательно указывать реальные имена авторов текста, композиторов и аранжировщиков, остальные могут использовать псевдонимы.</span>
    </IconItem>
    
    <IconItem icon={Icons.edit}>
      <span className="text-zinc-400">Добавляются в соответствующем разделе при редактировании релиза кнопками "Добавить артиста" и "Добавить контрибутора".</span>
    </IconItem>
  </div>
);

const BeatsComponent = () => (
  <div className="space-y-4">
    <IconItem icon={Icons.music}>
      <span className="text-white font-medium">Бесплатные биты и биты в аренде рискованны</span>
    </IconItem>
    
    <IconItem icon={Icons.warning}>
      <span className="text-zinc-400">Они могут использоваться другими артистами, вызывая юридические споры и потерю дохода.</span>
    </IconItem>
    
    <div className="ml-0">
      <IconItem icon={Icons.xCircle} className="mb-2">
        <span className="text-white font-medium">Проблемы:</span>
      </IconItem>
      <ul className="ml-8 space-y-1 text-zinc-400">
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400/60"></span>
          Трек получает чужую обложку или название
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400/60"></span>
          Юридические конфликты из-за отсутствия прав
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400/60"></span>
          Потеря денег и времени на создание и продвижение трека
        </li>
      </ul>
    </div>
    
    <div className="ml-0">
      <IconItem icon={Icons.trendingUp} className="mb-2">
        <span className="text-white font-medium">Решения:</span>
      </IconItem>
      <ul className="ml-8 space-y-1 text-zinc-400">
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400/60"></span>
          Создавайте собственные биты
        </li>
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400/60"></span>
          Покупайте эксклюзивные биты с полной передачей прав
        </li>
      </ul>
    </div>
    
    <IconItem icon={Icons.lightBulb}>
      <span className="text-zinc-400">Используйте бесплатные или арендованные биты только для тестовых записей, но не выкладывайте их публично.</span>
    </IconItem>
  </div>
);

const ReportsComponent = () => (
  <div className="space-y-4">
    <p className="text-zinc-400">
      Отчеты публикуются в кабинеты каждый квартал в течение 30 дней после его окончания. 
      Выплаты производятся примерно через 10 дней после публикации отчетов.
    </p>
    
    <div>
      <p className="text-white font-medium mb-3">График получения отчетов:</p>
      <div className="grid gap-2">
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-[#9d8df1]"></span>
          <span className="text-white/80">Q1</span>
          <span className="text-zinc-500">(янв.-мар.)</span>
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span>конец апреля</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-[#9d8df1]"></span>
          <span className="text-white/80">Q2</span>
          <span className="text-zinc-500">(апр.-июнь)</span>
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span>конец июля</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-[#9d8df1]"></span>
          <span className="text-white/80">Q3</span>
          <span className="text-zinc-500">(июл.-сен.)</span>
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span>конец октября</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="w-2 h-2 rounded-full bg-[#9d8df1]"></span>
          <span className="text-white/80">Q4</span>
          <span className="text-zinc-500">(окт.-дек.)</span>
          <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
          <span>конец января</span>
        </div>
      </div>
    </div>
    
    <p className="text-zinc-500 text-sm italic">
      Запаздывание связано с необходимостью получать отчёты от магазинов, которые предоставляются с задержкой в 29-30 дней.
    </p>
  </div>
);

// Map of custom components
const customComponents: { [key: string]: React.FC } = {
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
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto relative z-20">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-3 sm:mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#9d8df1]">FAQ</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-zinc-400">Часто задаваемые вопросы</p>
        </div>

        <div className="mb-6 sm:mb-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по вопросам..."
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border border-white/10 rounded-2xl text-sm sm:text-base text-white placeholder-zinc-500 outline-none focus:border-[#6050ba]/50 transition-all"
            />
            <span className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
              {Icons.searchIcon}
            </span>
          </div>
        </div>

        <div className="space-y-6 sm:space-y-8">
          {filteredData.map((category, catIndex) => (
            <div key={catIndex} className="space-y-3 sm:space-y-4">
              <h2 className="text-lg sm:text-xl font-bold text-[#9d8df1] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6050ba]"></span>
                {category.category}
              </h2>
              
              <div className="space-y-2 sm:space-y-3">
                {category.questions.map((item, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === key;
                  
                  return (
                    <div 
                      key={key}
                      className={`rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isOpen 
                          ? 'bg-[#6050ba]/10 border-[#6050ba]/30' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <button
                        onClick={() => toggleQuestion(key)}
                        className="w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between text-left"
                      >
                        <span className="font-bold text-sm sm:text-base text-white pr-3 sm:pr-4">{item.q}</span>
                        <span className={`text-xl sm:text-2xl text-[#9d8df1] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-45' : ''}`}>
                          +
                        </span>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[800px]' : 'max-h-0'}`}>
                        <div className="px-4 sm:px-6 pb-4 sm:pb-5">
                          {item.component && customComponents[item.component] ? (
                            React.createElement(customComponents[item.component])
                          ) : (
                            <p className="text-xs sm:text-sm md:text-base text-zinc-400 leading-relaxed">
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

        <div className="mt-12 sm:mt-16 text-center p-6 sm:p-8 md:p-12 bg-gradient-to-br from-purple-600/20 via-purple-500/10 to-transparent border-2 border-purple-500/40 rounded-2xl sm:rounded-3xl backdrop-blur-sm">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-white">Не нашли ответ?</h3>
          <p className="text-sm sm:text-base md:text-lg text-white/80 mb-6 sm:mb-8">
            {isAuthenticated 
              ? 'Создайте тикет в поддержку — мы ответим в течение 24 часов'
              : 'Войдите в аккаунт, чтобы написать в поддержку'}
          </p>
          <button 
            onClick={handleSupportClick}
            className="inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 md:px-10 py-3 sm:py-4 md:py-5 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-500 hover:to-purple-700 rounded-xl sm:rounded-2xl font-bold text-white text-sm sm:text-base md:text-xl transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/60"
          >
            {isAuthenticated ? 'Написать в поддержку' : 'Войти в аккаунт'}
          </button>
        </div>
      </div>
    </main>
  );
}
