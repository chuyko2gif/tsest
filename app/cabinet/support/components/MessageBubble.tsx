'use client';
import React, { useState } from 'react';
import { Message, Attachment } from '../types';
import TicketAvatar from '@/components/TicketAvatar';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onReaction?: (messageId: string, hasReaction: boolean) => void;
  currentUserId?: string;
}

export default function MessageBubble({ message, isOwn, onReaction, currentUserId }: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('ru-RU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Проверяем реакции
  const hasUserReaction = message.reactions?.some(r => r.user_id === currentUserId);
  const reactionsCount = message.reactions?.length || 0;

  const handleReaction = () => {
    if (onReaction) {
      onReaction(message.id, !!hasUserReaction);
    }
  };

  const renderAttachment = (attachment: Attachment) => {
    if (attachment.file_type.startsWith('image/')) {
      return (
        <a 
          href={attachment.file_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block mt-2"
        >
          <img 
            src={attachment.file_url} 
            alt={attachment.file_name}
            className="max-w-xs rounded-lg hover:opacity-90 transition"
          />
        </a>
      );
    }
    
    return (
      <a
        href={attachment.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 mt-2 p-2 bg-white/5 rounded-lg hover:bg-white/10 transition"
      >
        <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
        </svg>
        <span className="text-sm text-zinc-300 truncate">{attachment.file_name}</span>
        <span className="text-xs text-zinc-500">
          {(attachment.file_size / 1024).toFixed(1)} KB
        </span>
      </a>
    );
  };

  // Определяем имя отправителя
  const senderName = message.sender_nickname || message.user_nickname || message.sender_email || message.user_email || (message.is_admin ? 'Поддержка' : 'Пользователь');
  const senderEmail = message.sender_email || message.user_email;
  const senderAvatar = message.sender_avatar || message.user_avatar;

  return (
    <div 
      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`max-w-[70%] ${isOwn ? 'order-2' : 'order-1'} relative`}>
        {/* Avatar для чужих сообщений */}
        {!isOwn && (
          <div className="flex items-center gap-2 mb-1">
            <TicketAvatar
              src={senderAvatar}
              name={senderName}
              email={senderEmail}
              size="xs"
              isAdmin={message.is_admin}
            />
            <span className="text-xs text-zinc-500">
              {senderName}
            </span>
          </div>
        )}
        
        {/* Bubble */}
        <div 
          className={`rounded-2xl px-4 py-2.5 relative ${
            isOwn 
              ? 'bg-gradient-to-r from-[#6050ba] to-[#8b5cf6] text-white' 
              : 'bg-white/10 text-white'
          }`}
        >
          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
          
          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2">
              {message.attachments.map((attachment) => (
                <div key={attachment.id}>
                  {renderAttachment(attachment)}
                </div>
              ))}
            </div>
          )}
          
          {/* Кнопка реакции - ВСЕГДА видна */}
          {onReaction && (
            <button
              onClick={handleReaction}
              className={`absolute -bottom-3 ${isOwn ? 'left-2' : 'right-2'} px-2 py-1 rounded-full text-sm transition-all ${
                hasUserReaction 
                  ? 'bg-red-500 text-white' 
                  : 'bg-zinc-700 hover:bg-zinc-600 text-white'
              } shadow-lg z-10`}
            >
              {hasUserReaction ? '❤️' : '🤍'} {reactionsCount > 0 && reactionsCount}
            </button>
          )}
          
          {/* Убрал условие hover - кнопка всегда видна */}
        </div>
        
        {/* Time */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-zinc-600">{formatTime(message.created_at)}</span>
          {isOwn && message.is_read && (
            <svg className="w-3 h-3 text-[#6050ba]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
