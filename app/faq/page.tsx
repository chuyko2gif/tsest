"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import AnimatedBackground from '@/components/AnimatedBackground';

const FAQ_DATA = [
  {
    category: 'Дистрибуция',
    questions: [
      {
        q: 'Как загрузить релиз на платформы?',
        a: 'Войдите в личный кабинет, перейдите в раздел "Релизы" и нажмите "Загрузить демо". Заполните все поля, прикрепите аудиофайлы и обложку. После модерации ваш релиз будет опубликован на всех платформах.'
      },
      {
        q: 'Сколько времени занимает публикация?',
        a: 'Обычно релиз появляется на платформах в течение 2-5 рабочих дней после одобрения модерацией. Spotify и Apple Music могут требовать до 7 дней.'
      },
      {
        q: 'На какие платформы вы дистрибутируете?',
        a: 'Мы дистрибутируем на все основные платформы: Spotify, Apple Music, YouTube Music, Яндекс Музыка, VK Music, Deezer, Tidal, Amazon Music и более 150 других.'
      },
      {
        q: 'Могу ли я выбрать дату релиза?',
        a: 'Да! При загрузке демо укажите желаемую дату релиза. Рекомендуем указывать дату минимум за 2 недели до публикации.'
      },
    ]
  },
  {
    category: 'Финансы',
    questions: [
      {
        q: 'Как работают выплаты?',
        a: 'Выплаты производятся ежеквартально. Вы получаете 85% от всех доходов. Минимальная сумма для вывода — 1000 рублей.'
      },
      {
        q: 'Когда я получу отчёт?',
        a: 'Отчёты за квартал появляются в вашем кабинете в течение 30 дней после окончания квартала. Вы можете скачать их в разделе "Финансы".'
      },
      {
        q: 'Какие способы вывода доступны?',
        a: 'Вывод доступен на банковские карты РФ (Сбербанк, Тинькофф, Альфа и др.), а также на ЮMoney и QIWI.'
      },
    ]
  },
  {
    category: 'Аккаунт',
    questions: [
      {
        q: 'Как изменить никнейм артиста?',
        a: 'Перейдите в раздел "Настройки" в личном кабинете. Там вы можете изменить никнейм, аватар и другие данные профиля.'
      },
      {
        q: 'Забыл пароль, что делать?',
        a: 'На странице входа нажмите "Забыли пароль?" и введите email. Вам придёт ссылка для восстановления.'
      },
      {
        q: 'Как связаться с поддержкой?',
        a: 'В личном кабинете есть раздел "Поддержка", где вы можете создать тикет. Мы отвечаем в течение 24 часов.'
      },
    ]
  },
  {
    category: 'Сотрудничество',
    questions: [
      {
        q: 'Кто может присоединиться к thqlabel?',
        a: 'Мы работаем со всеми артистами независимо от уровня. Зарегистрируйтесь, загрузите демо — и мы рассмотрим вашу заявку.'
      },
      {
        q: 'Есть ли контракт?',
        a: 'Да, мы заключаем неэксклюзивный лицензионный договор. Вы сохраняете все права на музыку и можете выйти из сотрудничества в любой момент.'
      },
      {
        q: 'Что такое Exclusive статус?',
        a: 'Exclusive артисты получают приоритетную поддержку, продвижение в соцсетях лейбла и повышенный процент выплат (до 90%).'
      },
    ]
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

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
    <main className="min-h-screen pt-24 pb-16 px-6 relative">
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto relative z-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-4">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-[#9d8df1]">FAQ</span>
          </h1>
          <p className="text-zinc-400 text-lg">Часто задаваемые вопросы</p>
        </div>

        <div className="mb-10">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по вопросам..."
              className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-zinc-500 outline-none focus:border-[#6050ba]/50 transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500">🔍</span>
          </div>
        </div>

        <div className="space-y-8">
          {filteredData.map((category, catIndex) => (
            <div key={catIndex} className="space-y-4">
              <h2 className="text-xl font-bold text-[#9d8df1] flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#6050ba]"></span>
                {category.category}
              </h2>
              
              <div className="space-y-3">
                {category.questions.map((item, qIndex) => {
                  const key = `${catIndex}-${qIndex}`;
                  const isOpen = openIndex === key;
                  
                  return (
                    <div 
                      key={key}
                      className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isOpen 
                          ? 'bg-[#6050ba]/10 border-[#6050ba]/30' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <button
                        onClick={() => toggleQuestion(key)}
                        className="w-full px-6 py-5 flex items-center justify-between text-left"
                      >
                        <span className="font-bold text-white pr-4">{item.q}</span>
                        <span className={`text-2xl text-[#9d8df1] transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                          +
                        </span>
                      </button>
                      
                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
                        <div className="px-6 pb-5 text-zinc-400 leading-relaxed">
                          {item.a}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center p-8 bg-gradient-to-br from-[#6050ba]/10 to-transparent border border-[#6050ba]/20 rounded-3xl">
          <div className="text-4xl mb-4">💬</div>
          <h3 className="text-xl font-bold mb-2">Не нашли ответ?</h3>
          <p className="text-zinc-400 mb-6">Создайте тикет в поддержку — мы ответим в течение 24 часов</p>
          <Link 
            href="/cabinet"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition-all hover:scale-105"
          >
            Написать в поддержку
          </Link>
        </div>
      </div>
    </main>
  );
}
