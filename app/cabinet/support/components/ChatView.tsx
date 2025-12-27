'use client';
import React from 'react';
import { Ticket, Message, SupportUser } from '../types';
import { getStatusColor, getStatusLabel } from '../utils';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

interface ChatViewProps {
  ticket: Ticket;
  messages: Message[];
  user: SupportUser;
  newMessage: string;
  sending: boolean;
  uploadingFile: boolean;
  isTyping: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onMessageChange: (value: string) => void;
  onSendMessage: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCloseTicket: (id: string) => void;
  onBack: () => void;
}

export default function ChatView({
  ticket,
  messages,
  user,
  newMessage,
  sending,
  uploadingFile,
  isTyping,
  messagesEndRef,
  fileInputRef,
  onMessageChange,
  onSendMessage,
  onFileUpload,
  onCloseTicket,
  onBack,
}: ChatViewProps) {
  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h2 className="font-semibold text-sm">{ticket.subject}</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(ticket.status)}`}>
                {getStatusLabel(ticket.status)}
              </span>
              <span className="text-[10px] text-zinc-600">
                ID: {ticket.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {ticket.status !== 'closed' && (
            <button
              onClick={() => onCloseTicket(ticket.id)}
              className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg transition"
            >
              Закрыть
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-zinc-500">Нет сообщений</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.user_id === user.id && !message.is_admin}
            />
          ))
        )}
        
        {isTyping && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {ticket.status !== 'closed' ? (
        <MessageInput
          value={newMessage}
          onChange={onMessageChange}
          onSend={onSendMessage}
          onFileUpload={onFileUpload}
          sending={sending}
          uploadingFile={uploadingFile}
          fileInputRef={fileInputRef}
        />
      ) : (
        <div className="p-4 border-t border-white/10 text-center">
          <p className="text-sm text-zinc-500">Тикет закрыт. Создайте новый для продолжения общения.</p>
        </div>
      )}
    </div>
  );
}
