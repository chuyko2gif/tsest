'use client';
import React from 'react';
import { ROLE_CONFIG, UserRole } from '../../lib/types';

interface AvatarUploadModalProps {
  show: boolean;
  onClose: () => void;
  avatar: string;
  avatarPreview: string | null;
  nickname: string;
  role: UserRole;
  uploadingAvatar: boolean;
  onFileSelect: (file: File) => void;
  onSave: () => void;
  onDelete: () => void;
  onClearPreview: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
}

export default function AvatarUploadModal({
  show,
  onClose,
  avatar,
  avatarPreview,
  nickname,
  role,
  uploadingAvatar,
  onFileSelect,
  onSave,
  onDelete,
  onClearPreview,
  showNotification,
}: AvatarUploadModalProps) {
  if (!show) return null;
  
  const config = ROLE_CONFIG[role];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      showNotification('Можно загружать только изображения', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showNotification('Файл слишком большой. Максимум 2MB', 'error');
      return;
    }
    
    onFileSelect(file);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Аватар профиля</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Предпросмотр */}
        <div className="flex justify-center mb-6">
          <div 
            className={`w-32 h-32 rounded-2xl ${(avatarPreview || avatar) ? 'bg-cover bg-center' : `bg-gradient-to-br ${config.color}`} flex items-center justify-center text-5xl font-black border-2 ${config.borderColor} overflow-hidden`}
            style={{ 
              boxShadow: `0 0 30px ${config.glowColor}`,
              backgroundImage: (avatarPreview || avatar) ? `url(${avatarPreview || avatar})` : 'none'
            }}
          >
            {!(avatarPreview || avatar) && nickname.charAt(0).toUpperCase()}
          </div>
        </div>
        
        {/* Выбор файла */}
        <div className="space-y-4">
          <label className="block w-full py-4 bg-white/5 hover:bg-white/10 border border-dashed border-white/20 rounded-xl cursor-pointer transition text-center">
            <span className="text-sm text-zinc-400">Выбрать изображение</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          
          {avatarPreview && (
            <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm text-emerald-300">Изображение выбрано</span>
            </div>
          )}
          
          {/* Кнопки действий */}
          <div className="flex gap-3 pt-2">
            {avatar && !avatarPreview && (
              <button
                onClick={onDelete}
                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-bold text-sm transition"
              >
                Удалить
              </button>
            )}
            
            {avatarPreview && (
              <>
                <button
                  onClick={onClearPreview}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition"
                >
                  Отмена
                </button>
                <button
                  onClick={onSave}
                  disabled={uploadingAvatar}
                  className={`flex-1 py-3 ${uploadingAvatar ? 'bg-zinc-700 cursor-wait' : 'bg-[#6050ba] hover:bg-[#7060ca]'} rounded-xl font-bold text-sm transition`}
                >
                  {uploadingAvatar ? 'Загрузка...' : 'Сохранить'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
