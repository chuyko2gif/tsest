'use client';

import React, { useRef, useState } from 'react';
import { TicketMessage } from './types';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';

interface TicketMessagesProps {
  messages: TicketMessage[];
  userTyping: boolean;
  userTypingName: string;
  onSendMessage: (message: string, images: string[]) => void;
  sending: boolean;
}

export default function TicketMessages({
  messages,
  userTyping,
  userTypingName,
  onSendMessage,
  sending
}: TicketMessagesProps) {
  const [replyMessage, setReplyMessage] = useState('');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setError('');
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith('image/')) {
          setError(`Файл "${file.name}" не является изображением.`);
          continue;
        }

        if (file.size > MAX_FILE_SIZE) {
          setError(`Файл "${file.name}" слишком большой. Максимум 10 МБ.`);
          continue;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetchWithAuth('/api/support/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          uploadedUrls.push(data.url);
        } else {
          setError(data.error || 'Ошибка загрузки');
        }
      }

      setReplyImages([...replyImages, ...uploadedUrls]);
    } catch (err) {
      setError('Ошибка загрузки изображений');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    onSendMessage(replyMessage, replyImages);
    setReplyMessage('');
    setReplyImages([]);
  };

  return (
    <>
      {/* Область сообщений */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-900"
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        
        {/* Индикатор печати */}
        {userTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xs">
                {userTypingName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="bg-zinc-800/80 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[70%]">
              <p className="text-xs text-blue-400 font-medium mb-1">{userTypingName}</p>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Форма ответа */}
      <div className="p-4 border-t border-zinc-800">
        {error && (
          <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* Превью загруженных изображений */}
        {replyImages.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {replyImages.map((url, idx) => (
              <div key={idx} className="relative group">
                <img src={url} alt="" className="w-16 h-16 object-cover rounded-lg border border-zinc-700" />
                <button
                  type="button"
                  onClick={() => setReplyImages(replyImages.filter((_, i) => i !== idx))}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder="Введите ответ..."
              className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
            
            {/* Кнопка загрузки изображений */}
            <label className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer hover:bg-zinc-700 transition-colors flex items-center">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
              {uploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              )}
            </label>
          </div>
          
          <button
            type="submit"
            disabled={sending || !replyMessage.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed rounded-lg text-sm font-medium text-white transition-colors"
          >
            {sending ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      </div>
    </>
  );
}

// Компонент сообщения
function MessageBubble({ message }: { message: TicketMessage }) {
  const isAdmin = message.is_admin;

  return (
    <div className={`flex items-start gap-3 ${isAdmin ? 'flex-row-reverse' : ''}`}>
      {/* Аватар */}
      {message.sender_avatar ? (
        <div 
          className="w-8 h-8 rounded-full bg-cover bg-center flex-shrink-0 border border-zinc-700"
          style={{ backgroundImage: `url(${message.sender_avatar})` }}
        />
      ) : (
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isAdmin 
            ? 'bg-gradient-to-br from-blue-600 to-blue-700'
            : 'bg-gradient-to-br from-blue-500 to-indigo-600'
        }`}>
          <span className="text-white font-bold text-xs">
            {(message.sender_nickname || message.sender_username || message.sender_email || (isAdmin ? 'A' : 'U')).charAt(0).toUpperCase()}
          </span>
        </div>
      )}

      {/* Сообщение */}
      <div className={`max-w-[70%] ${isAdmin ? 'items-end' : 'items-start'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isAdmin 
            ? 'bg-blue-600/20 rounded-tr-sm border border-blue-500/30'
            : 'bg-zinc-800/80 rounded-tl-sm'
        }`}>
          <p className={`text-xs font-medium mb-1 ${isAdmin ? 'text-blue-400' : 'text-zinc-400'}`}>
            {message.sender_nickname || message.sender_username || message.sender_email || (isAdmin ? 'Поддержка' : 'Пользователь')}
            {isAdmin && <span className="ml-1 text-[10px] bg-blue-500/30 px-1.5 py-0.5 rounded">Админ</span>}
          </p>
          <p className="text-sm text-white whitespace-pre-wrap break-words">{message.message}</p>
          
          {/* Изображения */}
          {message.images && message.images.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {message.images.map((img, idx) => (
                <a key={idx} href={img} target="_blank" rel="noopener noreferrer">
                  <img 
                    src={img} 
                    alt="" 
                    className="max-w-[200px] max-h-[200px] rounded-lg object-cover hover:opacity-80 transition-opacity"
                  />
                </a>
              ))}
            </div>
          )}
        </div>
        <p className={`text-[10px] text-zinc-500 mt-1 ${isAdmin ? 'text-right' : ''}`}>
          {new Date(message.created_at).toLocaleString('ru-RU')}
        </p>
      </div>
    </div>
  );
}
