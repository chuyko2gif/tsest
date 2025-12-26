'use client';
import React, { useState } from 'react';
import { UserRole, ROLE_CONFIG } from '../../lib/types';
import { supabase } from '../../lib/supabase';

interface AvatarModalProps {
  show: boolean;
  user: any;
  nickname: string;
  role: UserRole;
  avatar: string;
  onClose: () => void;
  onAvatarChange: (newAvatar: string) => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
  showConfirm: (message: string, onConfirm: () => void) => void;
}

export default function AvatarModal({
  show,
  user,
  nickname,
  role,
  avatar,
  onClose,
  onAvatarChange,
  showNotification,
  showConfirm,
}: AvatarModalProps) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const config = ROLE_CONFIG[role];

  if (!show) return null;

  const handleClose = () => {
    onClose();
    setAvatarPreview(null);
    setAvatarFile(null);
  };

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
    
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleDelete = () => {
    showConfirm('Удалить текущий аватар?', async () => {
      if (!supabase || !user) return;
      try {
        if (avatar.includes('avatars/')) {
          const filePath = avatar.split('/avatars/')[1];
          await supabase.storage.from('avatars').remove([filePath]);
        }
        await supabase.from('profiles').update({ avatar: null }).eq('email', user.email);
        onAvatarChange('');
        handleClose();
        showNotification('Аватар удалён', 'success');
      } catch (error: any) {
        showNotification('Ошибка удаления: ' + error.message, 'error');
      }
    });
  };

  const handleSave = async () => {
    if (!avatarFile || !supabase || !user) return;
    
    setUploadingAvatar(true);
    try {
      if (avatar && avatar.includes('avatars/')) {
        const oldPath = avatar.split('/avatars/')[1];
        await supabase.storage.from('avatars').remove([oldPath]);
      }
      
      const fileExt = avatarFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, avatarFile);
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      await supabase.from('profiles').update({ avatar: publicUrl }).eq('email', user.email);
      
      onAvatarChange(publicUrl);
      handleClose();
      showNotification('Аватар обновлён', 'success');
    } catch (error: any) {
      showNotification('Ошибка загрузки: ' + error.message, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">Аватар профиля</h3>
          <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-lg transition">
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
          
          {/* Кнопки */}
          <div className="flex gap-3 pt-2">
            {avatar && !avatarPreview && (
              <button
                onClick={handleDelete}
                className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl font-bold text-sm transition"
              >
                Удалить
              </button>
            )}
            
            {avatarPreview && (
              <>
                <button
                  onClick={() => {
                    setAvatarPreview(null);
                    setAvatarFile(null);
                  }}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-sm transition"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSave}
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
