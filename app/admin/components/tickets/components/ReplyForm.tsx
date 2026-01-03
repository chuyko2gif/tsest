'use client';

import React from 'react';
import { fetchWithAuth } from '@/app/cabinet/lib/fetchWithAuth';

interface ReplyFormProps {
  ticketId: string;
  replyMessage: string;
  setReplyMessage: (message: string) => void;
  replyImages: string[];
  setReplyImages: (images: string[]) => void;
  uploading: boolean;
  sending: boolean;
  error: string;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSendReply: (e: React.FormEvent) => Promise<void>;
}

export default function ReplyForm({
  ticketId,
  replyMessage,
  setReplyMessage,
  replyImages,
  setReplyImages,
  uploading,
  sending,
  error,
  onImageUpload,
  onSendReply,
}: ReplyFormProps) {
  return (
    <div className="p-4 border-t border-zinc-800">
      <form onSubmit={onSendReply} className="space-y-3">
        {/* Превью изображений */}
        {replyImages.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {replyImages.map((url, index) => (
              <div key={index} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-20 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setReplyImages(replyImages.filter((_, i) => i !== index))}
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={onImageUpload}
            className="hidden"
            id="admin-image-upload"
            disabled={uploading}
          />
          <label
            htmlFor="admin-image-upload"
            className={`p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer transition-colors flex-shrink-0 ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Прикрепить фото"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            ) : (
              <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </label>

          <textarea
            value={replyMessage}
            onChange={(e) => {
              setReplyMessage(e.target.value);
              if (e.target.value.trim()) {
                fetchWithAuth(`/api/support/tickets/${ticketId}/typing`, {
                  method: 'POST',
                  body: JSON.stringify({ isTyping: true, isAdmin: true })
                }).catch(err => console.error('Error sending typing status:', err));
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sending && (replyMessage.trim() || replyImages.length > 0)) {
                  const form = e.currentTarget.closest('form');
                  if (form) {
                    form.requestSubmit();
                  }
                }
              }
            }}
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
            placeholder="Отправить сообщение"
            rows={1}
            disabled={sending}
          />

          <button
            type="submit"
            disabled={sending || (!replyMessage.trim() && replyImages.length === 0)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Отправить'
            )}
          </button>
        </div>

        {error && (
          <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
