'use client';
import React from 'react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sending: boolean;
  uploadingFile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}

export default function MessageInput({
  value,
  onChange,
  onSend,
  onFileUpload,
  sending,
  uploadingFile,
  fileInputRef,
  disabled = false,
}: MessageInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-white/10">
      <div className="flex items-end gap-3">
        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          onChange={onFileUpload}
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf,.doc,.docx"
          className="hidden"
          disabled={disabled || uploadingFile}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploadingFile}
          className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
          title="Прикрепить файл"
        >
          {uploadingFile ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>

        {/* Input */}
        <div className="flex-1 relative">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Напишите сообщение..."
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm placeholder-zinc-500 focus:outline-none focus:border-[#6050ba] transition resize-none disabled:opacity-50"
            style={{ maxHeight: '120px', minHeight: '48px' }}
          />
        </div>

        {/* Send */}
        <button
          onClick={onSend}
          disabled={!value.trim() || sending || disabled}
          className="p-3 bg-gradient-to-r from-[#6050ba] to-[#8b5cf6] hover:from-[#7060ca] hover:to-[#9d8df1] rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>
      
      <p className="text-[10px] text-zinc-600 mt-2">
        Нажмите Enter для отправки или Shift+Enter для новой строки
      </p>
    </div>
  );
}
