'use client';

interface ChatInputProps {
  newMessage: string;
  setNewMessage: (value: string) => void;
  sending: boolean;
  uploadingFile: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSendMessage: () => void;
  onFileUpload: (file: File) => void;
  onTyping: (value: string) => void;
}

export function ChatInput({
  newMessage,
  setNewMessage,
  sending,
  uploadingFile,
  fileInputRef,
  onSendMessage,
  onFileUpload,
  onTyping,
}: ChatInputProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  };

  return (
    <div className="p-4 bg-white/[0.05] border-t border-white/10">
      <div className="flex gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
        />
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingFile}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition disabled:opacity-50"
          title="Прикрепить файл"
        >
          {uploadingFile ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>
        
        <input
          value={newMessage}
          onChange={(e) => onTyping(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && onSendMessage()}
          placeholder="Введите ответ..."
          className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#6050ba]/50"
          disabled={sending}
        />
        
        <button
          onClick={onSendMessage}
          disabled={sending || !newMessage.trim()}
          className="px-6 py-3 bg-gradient-to-r from-[#6050ba] to-[#8b5cf6] hover:from-[#7c4dff] hover:to-[#9d8df1] rounded-xl font-bold transition disabled:opacity-50"
        >
          {sending ? '...' : 'Отправить'}
        </button>
      </div>
    </div>
  );
}
