'use client';

import { Message, Ticket } from './types';

interface ChatMessagesProps {
  messages: Message[];
  isTyping: boolean;
  typingInfo?: {
    nickname?: string | null;
    isAdmin?: boolean;
  };
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function ChatMessages({ messages, isTyping, typingInfo, messagesEndRef }: ChatMessagesProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map(message => (
        <div
          key={message.id}
          className={`flex ${message.is_admin ? 'justify-end' : 'justify-start'}`}
        >
          <div className={`max-w-[70%] ${message.is_admin ? 'bg-[#6050ba]/20 border-[#6050ba]/30' : 'bg-white/10 border-white/20'} border rounded-2xl p-3`}>
            {!message.is_admin && message.user && (
              <div className="flex items-center gap-2 mb-2">
                {message.user.avatar && (
                  <div 
                    className="w-6 h-6 rounded-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${message.user.avatar})` }}
                  />
                )}
                <span className="text-xs font-bold text-zinc-400">
                  {message.user.nickname}
                </span>
              </div>
            )}
            
            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
            
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.attachments.map(att => (
                  <a
                    key={att.id}
                    href={att.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    {att.file_name}
                  </a>
                ))}
              </div>
            )}
            
            <div className="text-[10px] text-zinc-600 mt-1">
              {new Date(message.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      ))}
      
      {isTyping && (
        <div className={`flex ${typingInfo?.isAdmin ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-[70%] ${
            typingInfo?.isAdmin 
              ? 'bg-[#6050ba]/20 border-[#6050ba]/30' 
              : 'bg-white/10 border-white/20'
          } border rounded-2xl p-3`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-zinc-400">
                {typingInfo?.nickname || (typingInfo?.isAdmin ? 'Администратор' : 'Пользователь')}
              </span>
            </div>
            <div className="flex gap-1 items-center">
              <span className={`w-2 h-2 ${typingInfo?.isAdmin ? 'bg-[#6050ba]' : 'bg-zinc-400'} rounded-full animate-bounce`} style={{ animationDelay: '0ms' }}></span>
              <span className={`w-2 h-2 ${typingInfo?.isAdmin ? 'bg-[#6050ba]' : 'bg-zinc-400'} rounded-full animate-bounce`} style={{ animationDelay: '150ms' }}></span>
              <span className={`w-2 h-2 ${typingInfo?.isAdmin ? 'bg-[#6050ba]' : 'bg-zinc-400'} rounded-full animate-bounce`} style={{ animationDelay: '300ms' }}></span>
              <span className="text-xs text-zinc-500 ml-2">печатает...</span>
            </div>
          </div>
        </div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
}
