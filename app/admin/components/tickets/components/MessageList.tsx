'use client';

import React from 'react';
import TicketAvatar from '@/components/icons/TicketAvatar';
import { TicketMessage as TicketMessageType, MessageReaction } from '../types';

interface MessageListProps {
  messages: TicketMessageType[];
  currentUserId: string | null;
  releaseInfo?: {
    id: string;
    title: string;
    artist: string;
    artwork_url?: string;
    status: string;
  } | null;
  releaseId?: string;
  userTyping: boolean;
  userTypingName: string;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  onToggleReaction: (messageId: string, hasReaction: boolean) => void;
}

export default function MessageList({
  messages,
  currentUserId,
  releaseInfo,
  releaseId,
  userTyping,
  userTypingName,
  messagesEndRef,
  messagesContainerRef,
  onToggleReaction,
}: MessageListProps) {
  return (
    <div 
      ref={messagesContainerRef} 
      className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900 hover:scrollbar-thumb-zinc-600"
    >
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg.id}
          message={msg}
          currentUserId={currentUserId}
          isFirstUserMessage={idx === 0 && !msg.is_admin && !!releaseId && !!releaseInfo}
          releaseInfo={releaseInfo}
          onToggleReaction={onToggleReaction}
        />
      ))}

      {/* Индикатор печати */}
      {userTyping && (
        <div className="flex justify-start px-4 py-1 animate-fade-in">
          <div className="bg-zinc-800/50 rounded-lg px-3 py-1.5 border border-zinc-700/50">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-300">{userTypingName}</span>
              <span className="text-[10px] text-zinc-500">печатает</span>
              <div className="flex gap-0.5">
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1 h-1 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

interface MessageBubbleProps {
  message: TicketMessageType;
  currentUserId: string | null;
  isFirstUserMessage: boolean;
  releaseInfo?: {
    id: string;
    title: string;
    artist: string;
    artwork_url?: string;
    status: string;
  } | null;
  onToggleReaction: (messageId: string, hasReaction: boolean) => void;
}

function MessageBubble({ message, currentUserId, isFirstUserMessage, releaseInfo, onToggleReaction }: MessageBubbleProps) {
  const isSystemMessage = message.sender_id === '00000000-0000-0000-0000-000000000000';
  const displayName = isSystemMessage 
    ? 'THQ Support' 
    : (message.sender_nickname || message.sender_username || message.sender_email?.split('@')[0] || (message.is_admin ? 'Администратор' : 'Пользователь'));
  
  const hasUserReaction = message.reactions?.some(r => r.user_id === currentUserId);
  const reactionsCount = message.reactions?.length || 0;

  return (
    <div className={`flex ${message.is_admin ? 'justify-start' : 'justify-end'} group`}>
      <div className={`max-w-[80%] ${message.is_admin ? '' : 'flex flex-col items-end'}`}>
        {/* Метка отправителя */}
        <div className={`flex items-center gap-2 mb-1 ${message.is_admin ? '' : 'flex-row-reverse'}`}>
          <TicketAvatar
            src={message.sender_avatar}
            name={displayName}
            email={message.sender_email}
            size="sm"
            isAdmin={message.is_admin}
          />
          <div className={`flex flex-col ${message.is_admin ? 'items-start' : 'items-end'}`}>
            <span className={`text-xs font-medium ${
              message.is_admin 
                ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-transparent bg-clip-text' 
                : 'text-blue-300'
            }`}>
              {displayName}
            </span>
            {!message.is_admin && message.sender_email && (
              <span className="text-[10px] text-zinc-500">{message.sender_email}</span>
            )}
            {message.is_admin && !isSystemMessage && message.sender_email && (
              <span className="text-[10px] text-zinc-500">{message.sender_email}</span>
            )}
          </div>
        </div>

        <div 
          className={`rounded-lg p-4 relative ${
            message.is_admin
              ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30'
              : 'bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30'
          }`}
          onDoubleClick={() => onToggleReaction(message.id, !!hasUserReaction)}
        >
          <p className="text-white whitespace-pre-wrap break-words">{message.message}</p>
          
          {/* Изображения */}
          {message.images && message.images.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {message.images.map((url, index) => (
                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block">
                  <img
                    src={url}
                    alt={`Attachment ${index + 1}`}
                    className="w-full h-32 object-cover rounded hover:opacity-80 transition-opacity cursor-pointer"
                  />
                </a>
              ))}
            </div>
          )}

          {/* Информация о релизе для первого сообщения */}
          {isFirstUserMessage && releaseInfo && (
            <ReleaseInfoInMessage release={releaseInfo} />
          )}

          <div className="text-xs text-zinc-500 mt-2">
            {new Date(message.created_at).toLocaleString('ru-RU')}
          </div>
        </div>
        
        {/* Кнопка реакции */}
        <ReactionButton
          hasUserReaction={!!hasUserReaction}
          reactionsCount={reactionsCount}
          reactions={message.reactions}
          isAdmin={message.is_admin}
          onToggle={() => onToggleReaction(message.id, !!hasUserReaction)}
        />
      </div>
    </div>
  );
}

function ReleaseInfoInMessage({ release }: { release: { title: string; artist: string; artwork_url?: string; status: string } }) {
  const statusLabels: Record<string, string> = {
    pending: '⏳ На модерации',
    distributed: '🚀 На дистрибьюции',
    rejected: '❌ Отклонён',
    published: '🎵 Опубликован',
  };

  return (
    <div className="mt-2 pt-2 border-t border-purple-500/30">
      <div className="flex items-center gap-1.5 mb-1.5">
        <svg className="w-3 h-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        <span className="text-[10px] text-purple-300 font-medium">Обращение по релизу:</span>
      </div>
      <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1.5">
        {release.artwork_url ? (
          <img src={release.artwork_url} alt={release.title} className="w-10 h-10 rounded object-cover flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-500/30 to-blue-500/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium text-white truncate">{release.title}</div>
          <div className="text-[10px] text-zinc-400 truncate">{release.artist}</div>
          {release.status && statusLabels[release.status] && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-300">
                {statusLabels[release.status]}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ReactionButtonProps {
  hasUserReaction: boolean;
  reactionsCount: number;
  reactions?: MessageReaction[];
  isAdmin: boolean;
  onToggle: () => void;
}

function ReactionButton({ hasUserReaction, reactionsCount, reactions, isAdmin, onToggle }: ReactionButtonProps) {
  return (
    <div className={`flex items-center gap-1 mt-1 ${isAdmin ? 'justify-start' : 'justify-end'}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`h-5 px-1.5 rounded-full flex items-center gap-1 transition-all text-[10px] ${
          hasUserReaction || reactionsCount > 0
            ? 'bg-pink-500/30 border border-pink-400/40' 
            : 'bg-zinc-800/60 border border-zinc-600/40 opacity-0 group-hover:opacity-100 hover:bg-pink-500/20 hover:border-pink-400/40'
        }`}
        title={reactions?.map(r => r.user?.nickname || 'Пользователь').join(', ') || 'Поставить лайк'}
      >
        <span>{hasUserReaction || reactionsCount > 0 ? '❤️' : '🤍'}</span>
        {reactionsCount > 0 && (
          <span className="text-pink-300 font-medium">{reactionsCount}</span>
        )}
      </button>
    </div>
  );
}
