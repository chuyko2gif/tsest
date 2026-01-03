'use client'

import { useState } from 'react'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import { useTheme } from '@/contexts/ThemeContext'

export default function ContactsPage() {
  const [copiedEmail, setCopiedEmail] = useState(false)
  const { themeName } = useTheme()
  const isLight = themeName === 'light'

  const copyEmail = () => {
    navigator.clipboard.writeText('contact@thqlabel.com')
    setCopiedEmail(true)
    setTimeout(() => setCopiedEmail(false), 2000)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
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
      
      <div className="relative z-10 container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className={`text-5xl md:text-6xl font-bold mb-4 ${isLight ? 'text-gray-800' : 'text-white'}`}>
            Контакты
          </h1>
          <p className={`text-xl max-w-2xl mx-auto ${isLight ? 'text-gray-600' : 'text-white/70'}`}>
            Свяжитесь с нами удобным для вас способом
          </p>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <a
            href="https://t.me/thqlabel"
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
              isLight 
                ? 'bg-white/70 backdrop-blur-xl shadow-lg ring-1 ring-[#0088cc]/30 border-transparent bg-gradient-to-br from-white/80 via-[#0088cc]/5 to-white/60 hover:ring-[#0088cc]/60 hover:shadow-[#0088cc]/25' 
                : 'bg-gradient-to-br from-[#0a0a0f]/90 via-[#0088cc]/10 to-[#0a0a0f]/80 border-[#0088cc]/40 hover:border-[#0088cc]/70 hover:shadow-[#0088cc]/30 backdrop-blur-xl'
            }`}
          >
            <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isLight ? 'bg-gradient-to-br from-[#0088cc]/5 to-transparent' : 'bg-gradient-to-br from-[#0088cc]/20 to-transparent'
            }`} />
            
            <div className="relative flex items-center gap-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0088cc] to-[#0088cc]/70 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.349-.374-1.297-.789.027-.216.324-.437.892-.663 3.498-1.524 5.831-2.529 6.998-3.015 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.121.099.154.232.17.326.016.093.036.305.02.47z"/>
                </svg>
              </div>

              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>Telegram</h3>
                <p className="text-[#0088cc] font-medium group-hover:underline">@thqlabel</p>
                <p className={`text-sm mt-2 ${isLight ? 'text-gray-600' : 'text-white'}`}>Самый быстрый способ связи</p>
              </div>

              <svg className={`w-6 h-6 group-hover:text-[#0088cc] group-hover:translate-x-1 transition-all duration-300 ${isLight ? 'text-gray-400' : 'text-white/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <a
            href="https://vk.com/thqlabel"
            target="_blank"
            rel="noopener noreferrer"
            className={`group relative rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
              isLight 
                ? 'bg-white/70 backdrop-blur-xl shadow-lg ring-1 ring-[#0077FF]/30 border-transparent bg-gradient-to-br from-white/80 via-[#0077FF]/5 to-white/60 hover:ring-[#0077FF]/60 hover:shadow-[#0077FF]/25' 
                : 'bg-gradient-to-br from-[#0a0a0f]/90 via-[#0077FF]/10 to-[#0a0a0f]/80 border-[#0077FF]/40 hover:border-[#0077FF]/70 hover:shadow-[#0077FF]/30 backdrop-blur-xl'
            }`}
          >
            <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
              isLight ? 'bg-gradient-to-br from-[#0077FF]/5 to-transparent' : 'bg-gradient-to-br from-[#0077FF]/20 to-transparent'
            }`} />
            
            <div className="relative flex items-center gap-6">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0077FF] to-[#0077FF]/70 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.567-1.497c.579-.189 1.323 1.26 2.11 1.818.597.422 1.05.329 1.05.329l2.108-.03s1.103-.07.58-.968c-.043-.074-.305-.664-1.57-1.878-1.323-1.27-1.145-1.064.448-3.26.97-1.338 1.357-2.153 1.236-2.501-.115-.332-.827-.244-.827-.244l-2.374.015s-.176-.025-.307.056c-.128.079-.21.263-.21.263s-.375 1.036-.875 1.917c-1.054 1.856-1.476 1.954-1.648 1.838-.4-.267-.3-1.074-.3-1.647 0-1.791.262-2.536-.51-2.729-.257-.064-.446-.107-1.103-.114-.843-.009-1.556.003-1.96.207-.268.136-.475.439-.349.457.156.022.509.099.696.363.241.341.233 1.107.233 1.107s.139 2.109-.324 2.371c-.318.18-.754-.187-1.69-1.865-.479-.857-.841-1.805-.841-1.805s-.07-.177-.194-.272c-.151-.115-.362-.152-.362-.152l-2.256.015s-.339.01-.464.162c-.111.135-.009.414-.009.414s1.763 4.27 3.758 6.422c1.832 1.975 3.913 1.845 3.913 1.845h.943z"/>
                </svg>
              </div>

              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>ВКонтакте</h3>
                <p className="text-[#0077FF] font-medium group-hover:underline">vk.com/thqlabel</p>
                <p className={`text-sm mt-2 ${isLight ? 'text-gray-600' : 'text-white'}`}>Новости и обновления</p>
              </div>

              <svg className={`w-6 h-6 group-hover:text-[#0077FF] group-hover:translate-x-1 transition-all duration-300 ${isLight ? 'text-gray-400' : 'text-white/30'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>

          <div className="md:col-span-2">
            <div
              onClick={copyEmail}
              className={`group relative rounded-3xl p-8 border-2 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl cursor-pointer ${
                isLight 
                  ? 'bg-white/70 backdrop-blur-xl shadow-lg ring-1 ring-purple-400/30 border-transparent bg-gradient-to-br from-white/80 via-purple-400/5 to-white/60 hover:ring-purple-400/60 hover:shadow-purple-400/25' 
                  : 'bg-gradient-to-br from-[#0a0a0f]/90 via-purple-500/10 to-[#0a0a0f]/80 border-purple-500/40 hover:border-purple-500/70 hover:shadow-purple-500/30 backdrop-blur-xl'
              }`}
            >
              <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                isLight ? 'bg-gradient-to-br from-purple-400/5 to-transparent' : 'bg-gradient-to-br from-purple-500/20 to-transparent'
              }`} />
              
              <div className="relative flex items-center gap-6">
                <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${isLight ? 'text-gray-800' : 'text-white'}`}>Email</h3>
                  <p className="text-purple-500 font-medium group-hover:underline">contact@thqlabel.com</p>
                  <p className={`text-sm mt-2 ${isLight ? 'text-gray-600' : 'text-white'}`}>
                    {copiedEmail ? '✓ Скопировано!' : 'Нажмите, чтобы скопировать'}
                  </p>
                </div>

                <svg className={`w-6 h-6 group-hover:text-purple-500 transition-all duration-300 ${isLight ? 'text-gray-400' : 'text-white/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className={`inline-block rounded-2xl px-8 py-6 border backdrop-blur-xl ${
            isLight 
              ? 'bg-white/60 border-gray-200' 
              : 'bg-white/5 border-white/10'
          }`}>
            <p className={`mb-2 ${isLight ? 'text-gray-500' : 'text-white/70'}`}>Рабочие часы</p>
            <p className={`font-medium text-lg ${isLight ? 'text-gray-800' : 'text-white'}`}>Пн - Пт: 10:00 - 19:00 МСК</p>
            <p className={`text-sm mt-2 ${isLight ? 'text-gray-500' : 'text-white/50'}`}>Обычно отвечаем в течение 24 часов</p>
          </div>
        </div>
      </div>
    </div>
  )
}
