'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from '@/contexts/ThemeContext';

// Ленивая загрузка тяжёлого компонента
const ImageCropModal = dynamic(() => import('../ui/ImageCropModal'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/50 flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>
});

// Импорты из компонентов
import { Notification, ConfirmDialog, LinkDialog, DraftsModal, NewsList, FormatToolbar, renderPreview } from './components';

// ============================================================================
// TYPES
// ============================================================================
interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error';
}

interface ConfirmDialogState {
  show: boolean;
  message: string;
  onConfirm: () => void;
}

// ============================================================================
// HEADER COMPONENT
// ============================================================================
interface HeaderProps {
  autoSaved: boolean;
  draftsCount: number;
  onShowDrafts: () => void;
}

const Header = memo(function Header({ autoSaved, draftsCount, onShowDrafts }: HeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-black mb-1">Управление новостями</h2>
        <p className="text-zinc-500 text-sm">Создавай новости - они появятся у всех на странице /news</p>
      </div>
      <div className="flex gap-2">
        {autoSaved && (
          <div className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Автосохранено
          </div>
        )}
        {draftsCount > 0 && (
          <button 
            onClick={onShowDrafts}
            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Черновики ({draftsCount})
          </button>
        )}
        <a href="/news" target="_blank" className="px-4 py-2 bg-[#6050ba]/20 hover:bg-[#6050ba]/30 rounded-lg text-xs font-bold transition">
          Посмотреть новости
        </a>
      </div>
    </div>
  );
});

// ============================================================================
// IMAGE UPLOAD COMPONENT
// ============================================================================
interface ImageUploadProps {
  image: string;
  uploading: boolean;
  onImageChange: (url: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditImage: () => void;
  onDeleteImage: () => void;
}

const ImageUpload = memo(function ImageUpload({ image, uploading, onImageChange, onImageUpload, onEditImage, onDeleteImage }: ImageUploadProps) {
  return (
    <div>
      <label className="block text-xs font-bold text-zinc-400 mb-2">ИЗОБРАЖЕНИЕ</label>
      
      {image ? (
        <div className="mb-3 relative group">
          <div className="relative overflow-hidden rounded-xl border border-white/10">
            <img src={image} alt="Превью новости" className="w-full h-64 object-cover" />
            <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button type="button" onClick={onEditImage}
                className="flex items-center gap-2 px-3 py-2 bg-[#6050ba] hover:bg-[#7060ca] rounded-lg text-xs font-bold transition shadow-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Редактировать
              </button>
              <button type="button" onClick={onDeleteImage}
                className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-bold transition shadow-lg">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Удалить
              </button>
            </div>
          </div>
          <p className="text-[10px] text-zinc-600 mt-2">Наведите на изображение для редактирования или удаления</p>
        </div>
      ) : (
        <div className="mb-3">
          <div className="mb-3">
            <input 
              value={image} 
              onChange={(e) => onImageChange(e.target.value)} 
              placeholder="Вставьте URL изображения..." 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] transition" 
            />
            <p className="text-[10px] text-zinc-600 mt-1.5">Или загрузите файл с компьютера</p>
          </div>
          
          <label className="block cursor-pointer">
            <input id="news-image-input" type="file" accept="image/jpeg,image/jpg,image/png,image/webp" onChange={onImageUpload} className="hidden" />
            <div className="relative overflow-hidden rounded-xl border-2 border-dashed border-white/10 hover:border-[#6050ba]/50 transition-all">
              <div className="bg-gradient-to-br from-[#6050ba]/5 to-[#7060ca]/5 hover:from-[#6050ba]/10 hover:to-[#7060ca]/10 transition-all">
                {uploading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg className="w-10 h-10 text-[#6050ba] animate-spin mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <p className="text-sm font-bold text-zinc-400">Загрузка изображения...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6050ba] to-[#7060ca] flex items-center justify-center mb-4 shadow-lg shadow-[#6050ba]/20">
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Загрузить изображение</p>
                    <p className="text-xs text-zinc-500">Нажмите для выбора файла</p>
                    <div className="flex items-center gap-2 mt-4 px-4 py-2 bg-black/20 rounded-lg">
                      <span className="text-[10px] text-zinc-600">JPG, PNG, WEBP до 5MB</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  );
});

// ============================================================================
// NEWS PREVIEW COMPONENT
// ============================================================================
interface NewsPreviewProps {
  title: string;
  content: string;
  category: string;
  image: string;
  scheduledFor: string;
}

const NewsPreview = memo(function NewsPreview({ title, content, category, image, scheduledFor }: NewsPreviewProps) {
  return (
    <div className="bg-[#0d0d0f] rounded-3xl border border-white/10 overflow-hidden">
      <div className="relative h-[250px] md:h-[350px]">
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#6050ba]/30 to-[#0a0a0c]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0f] via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
          {category && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#6050ba] flex items-center justify-center">
                {category === 'Обновление' ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                )}
              </div>
              <span className="px-4 py-2 bg-[#6050ba] rounded-full text-[11px] font-bold uppercase tracking-widest">{category}</span>
            </div>
          )}
          <span className="text-[11px] text-zinc-400 uppercase tracking-widest">
            {scheduledFor 
              ? new Date(scheduledFor).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
              : new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
            }
          </span>
        </div>
      </div>
      <div className="p-8 md:p-12">
        <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-8 text-white">
          {title || 'Заголовок не указан'}
        </h1>
        <div className="prose prose-invert prose-lg max-w-none">
          {content ? renderPreview(content) : <p className="text-zinc-600 text-center py-8">Введите текст для предпросмотра</p>}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// NEWS FORM COMPONENT
// ============================================================================
interface NewsFormProps {
  title: string;
  setTitle: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  image: string;
  setImage: (v: string) => void;
  scheduledFor: string;
  setScheduledFor: (v: string) => void;
  editingId: number | null;
  saving: boolean;
  uploading: boolean;
  showPreview: boolean;
  setShowPreview: (v: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onEditImage: () => void;
  onDeleteImage: () => void;
  onOpenLinkDialog: () => void;
}

const NewsForm = memo(function NewsForm({
  title, setTitle, content, setContent, category, setCategory,
  image, setImage, scheduledFor, setScheduledFor,
  editingId, saving, uploading, showPreview, setShowPreview,
  onSave, onCancel, onImageUpload, onEditImage, onDeleteImage, onOpenLinkDialog
}: NewsFormProps) {
  return (
    <div className="p-6 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl">
      <h3 className="font-black mb-2">{editingId ? 'Редактируешь новость' : 'Создать новость'}</h3>
      <p className="text-xs text-zinc-500 mb-6">Заполни форму ниже и нажми кнопку "Опубликовать"</p>
      
      <div className="space-y-5">
        {/* Заголовок и категория */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">ЗАГОЛОВОК <span className="text-red-400">*</span></label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Новый релиз от thqlabel" 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:bg-black/60 transition" />
            <div className="flex justify-between items-center mt-1">
              <p className="text-[10px] text-zinc-600">Главный заголовок - обязательное поле</p>
              <p className="text-[10px] text-zinc-500">{title.length} символов</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">КАТЕГОРИЯ</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:bg-black/60 transition cursor-pointer">
              <option value="Новость">Новость - обычная новость лейбла</option>
              <option value="Обновление">Обновление - изменения на платформе</option>
            </select>
          </div>
          
          {/* Планирование */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              ЗАПЛАНИРОВАТЬ ПУБЛИКАЦИЮ
            </label>
            <div className="relative">
              <input type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full bg-gradient-to-r from-black/40 to-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] transition [color-scheme:dark]" />
              {scheduledFor && (
                <button type="button" onClick={() => setScheduledFor('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-red-500/20 hover:bg-red-500/30 rounded-lg flex items-center justify-center transition">
                  <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-[10px] text-zinc-600 mt-1.5">
              {scheduledFor ? (
                <span className="text-emerald-500">Запланировано на {new Date(scheduledFor).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
              ) : 'Оставьте пустым для немедленной публикации'}
            </p>
          </div>
        </div>
        
        {/* Картинка */}
        <ImageUpload 
          image={image} uploading={uploading} onImageChange={setImage}
          onImageUpload={onImageUpload} onEditImage={onEditImage} onDeleteImage={onDeleteImage}
        />
        
        {/* Текст новости */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-bold text-zinc-400">ТЕКСТ НОВОСТИ</label>
            <button type="button" onClick={() => setShowPreview(!showPreview)}
              className="text-[10px] px-3 py-1 bg-[#6050ba]/20 hover:bg-[#6050ba]/30 rounded-lg font-bold transition">
              {showPreview ? 'Редактор' : 'Предпросмотр'}
            </button>
          </div>
          
          {!showPreview ? (
            <>
              <FormatToolbar content={content} setContent={setContent} onOpenLinkDialog={onOpenLinkDialog} />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} 
                placeholder="Основной текст новости..." rows={10}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-[#6050ba] focus:bg-black/60 font-mono transition" />
              <p className="text-[10px] text-zinc-600 mt-1">{content.length} символов</p>
            </>
          ) : (
            <NewsPreview title={title} content={content} category={category} image={image} scheduledFor={scheduledFor} />
          )}
        </div>
        
        {/* Кнопки */}
        <div className="flex gap-3 pt-4 border-t border-white/5">
          <button onClick={onSave} disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-[#6050ba] to-[#7060ca] rounded-xl text-sm font-bold hover:from-[#7060ca] hover:to-[#8070da] transition disabled:opacity-50 shadow-lg shadow-[#6050ba]/20">
            {saving ? 'Сохранение...' : editingId ? 'Сохранить изменения' : 'Опубликовать новость'}
          </button>
          {editingId && (
            <button onClick={onCancel} className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition">
              Отмена
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export default function NewsTab({ supabase }: { supabase: any }) {
  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Новость');
  const [image, setImage] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // UI state
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  
  // News state
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Drafts state
  const [drafts, setDrafts] = useState<any[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);
  
  // Crop state
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState('');
  const [isEditingExistingImage, setIsEditingExistingImage] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<NotificationState>({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({ show: false, message: '', onConfirm: () => {} });

  // ============================================================================
  // HELPERS
  // ============================================================================
  const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 3000);
  }, []);
  
  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    setConfirmDialog({ show: true, message, onConfirm });
  }, []);

  const clearForm = useCallback(() => {
    setTitle(''); setContent(''); setCategory('Новость'); setImage(''); setScheduledFor('');
    setEditingId(null); setCurrentDraftId(null);
  }, []);

  // ============================================================================
  // DATA LOADING
  // ============================================================================
  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      setNews(data || []);
    } catch (e) { console.warn('Ошибка загрузки новостей:', e); }
    finally { setLoading(false); }
  }, [supabase]);

  const loadDrafts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('news_drafts').select('*').eq('user_id', user.id).order('updated_at', { ascending: false });
      setDrafts(data || []);
    } catch (e) { console.error('Ошибка загрузки черновиков:', e); }
  }, [supabase]);

  useEffect(() => { loadNews(); loadDrafts(); }, [loadNews, loadDrafts]);

  // ============================================================================
  // AUTOSAVE
  // ============================================================================
  useEffect(() => {
    if (!title && !content) return;
    const timer = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const payload = { user_id: user.id, title: title.trim(), content: content.trim(), category, image: image.trim() || null, scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null };
        if (currentDraftId) {
          await supabase.from('news_drafts').update(payload).eq('id', currentDraftId);
        } else {
          const { data } = await supabase.from('news_drafts').insert([payload]).select().single();
          if (data) setCurrentDraftId(data.id);
        }
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
        await loadDrafts();
      } catch (e) { console.error('Ошибка автосохранения:', e); }
    }, 2000);
    return () => clearTimeout(timer);
  }, [title, content, category, image, scheduledFor, currentDraftId, supabase, loadDrafts]);

  // ============================================================================
  // HANDLERS
  // ============================================================================
  const handleSave = async () => {
    if (!title.trim()) { showNotification('Введите заголовок', 'error'); return; }
    setSaving(true);
    try {
      const payload = { title: title.trim(), content: content.trim() || '', category: category || 'Новость', image: image.trim() || null, scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null };
      if (editingId) {
        const { error } = await supabase.from('news').update(payload).eq('id', editingId);
        if (error) { showNotification('Ошибка обновления: ' + error.message, 'error'); return; }
        showNotification('Новость обновлена!', 'success');
      } else {
        const { error } = await supabase.from('news').insert([payload]);
        if (error) { showNotification('Ошибка создания: ' + error.message, 'error'); return; }
        showNotification('Новость опубликована!', 'success');
      }
      if (currentDraftId) { await supabase.from('news_drafts').delete().eq('id', currentDraftId); await loadDrafts(); }
      clearForm(); await loadNews();
    } catch (e: any) { showNotification('Ошибка: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleEdit = useCallback((item: any) => {
    setEditingId(item.id); setTitle(item.title); setContent(item.content || '');
    setCategory(item.category || 'Новость'); setImage(item.image || '');
    setScheduledFor(item.scheduled_for ? new Date(item.scheduled_for).toISOString().slice(0, 16) : '');
  }, []);

  const handleDelete = useCallback((id: number) => {
    showConfirm('Точно удалить эту новость?', async () => {
      try {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) { showNotification('Ошибка удаления: ' + error.message, 'error'); return; }
        await loadNews(); showNotification('Новость удалена!', 'success');
      } catch (e: any) { showNotification('Ошибка: ' + e.message, 'error'); }
    });
  }, [supabase, showConfirm, showNotification, loadNews]);

  const handleLoadDraft = useCallback((draft: any) => {
    setTitle(draft.title || ''); setContent(draft.content || '');
    setCategory(draft.category || 'Новость'); setImage(draft.image || '');
    setScheduledFor(draft.scheduled_for ? new Date(draft.scheduled_for).toISOString().slice(0, 16) : '');
    setCurrentDraftId(draft.id); setShowDraftsModal(false);
    showNotification('Черновик загружен', 'success');
  }, [showNotification]);

  const handleDeleteDraft = useCallback((draftId: number) => {
    showConfirm('Удалить этот черновик?', async () => {
      try {
        await supabase.from('news_drafts').delete().eq('id', draftId);
        if (currentDraftId === draftId) clearForm();
        await loadDrafts(); showNotification('Черновик удалён', 'success');
      } catch (e: any) { showNotification('Ошибка удаления: ' + e.message, 'error'); }
    });
  }, [supabase, currentDraftId, showConfirm, showNotification, clearForm, loadDrafts]);

  // ============================================================================
  // IMAGE HANDLERS
  // ============================================================================
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { showNotification('Неподдерживаемый формат', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showNotification('Файл слишком большой (макс 5MB)', 'error'); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setImageToCrop(reader.result as string); setIsEditingExistingImage(false); setShowCropModal(true); };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (blob: Blob) => {
    setShowCropModal(false); setUploading(true);
    try {
      const fileName = `news_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const { error } = await supabase.storage.from('avatars').upload(fileName, blob, { cacheControl: '3600', upsert: false, contentType: 'image/jpeg' });
      if (error) throw new Error(error.message);
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setImage(publicUrl); showNotification('Картинка загружена', 'success');
    } catch (error: any) { showNotification('Ошибка загрузки: ' + error.message, 'error'); }
    finally { setUploading(false); }
  };

  const handleEditImage = () => { if (image) { setImageToCrop(image); setIsEditingExistingImage(true); setShowCropModal(true); } };
  const handleDeleteImage = () => { showConfirm('Удалить изображение?', () => { setImage(''); showNotification('Изображение удалено', 'success'); }); };

  // ============================================================================
  // LINK HANDLERS
  // ============================================================================
  const openLinkDialog = () => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) { const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd); if (selected) setLinkText(selected); }
    setShowLinkDialog(true);
  };

  const handleInsertLink = () => {
    if (!linkText.trim() || !linkUrl.trim()) { showNotification('Заполни оба поля', 'error'); return; }
    const linkMarkdown = `[${linkText}](${linkUrl})`;
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      setContent(content.substring(0, start) + linkMarkdown + content.substring(textarea.selectionEnd));
    }
    setShowLinkDialog(false); setLinkText(''); setLinkUrl('');
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* Dialogs */}
      <Notification show={notification.show} message={notification.message} type={notification.type} />
      <ConfirmDialog show={confirmDialog.show} message={confirmDialog.message} 
        onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(prev => ({ ...prev, show: false })); }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, show: false }))} />
      <LinkDialog show={showLinkDialog} linkText={linkText} setLinkText={setLinkText} linkUrl={linkUrl} setLinkUrl={setLinkUrl}
        onInsert={handleInsertLink} onCancel={() => { setShowLinkDialog(false); setLinkText(''); setLinkUrl(''); }} />
      <DraftsModal show={showDraftsModal} drafts={drafts} onClose={() => setShowDraftsModal(false)}
        onLoadDraft={handleLoadDraft} onDeleteDraft={handleDeleteDraft} />
      {showCropModal && <ImageCropModal imageSrc={imageToCrop} onCropComplete={handleCropComplete} onCancel={() => { setShowCropModal(false); setImageToCrop(''); }} />}
      
      {/* Header */}
      <Header autoSaved={autoSaved} draftsCount={drafts.length} onShowDrafts={() => setShowDraftsModal(true)} />
      
      {/* Form */}
      <NewsForm 
        title={title} setTitle={setTitle} content={content} setContent={setContent}
        category={category} setCategory={setCategory} image={image} setImage={setImage}
        scheduledFor={scheduledFor} setScheduledFor={setScheduledFor}
        editingId={editingId} saving={saving} uploading={uploading}
        showPreview={showPreview} setShowPreview={setShowPreview}
        onSave={handleSave} onCancel={clearForm}
        onImageUpload={handleImageUpload} onEditImage={handleEditImage} onDeleteImage={handleDeleteImage}
        onOpenLinkDialog={openLinkDialog}
      />
      
      {/* News List */}
      <NewsList news={news} loading={loading} onEdit={handleEdit} onDelete={handleDelete} />
    </div>
  );
}
