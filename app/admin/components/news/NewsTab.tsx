'use client';

import { useState, useEffect } from 'react';

export default function NewsTab({ supabase }: { supabase: any }) {
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('Новость');
  const [image, setImage] = useState('');
  const [scheduledFor, setScheduledFor] = useState('');
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // Состояния для crop редактора
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState('');
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);
  
  // Система уведомлений
  const [notification, setNotification] = useState<{show: boolean; message: string; type: 'success' | 'error'}>({show: false, message: '', type: 'success'});
  const [confirmDialog, setConfirmDialog] = useState<{show: boolean; message: string; onConfirm: () => void}>({show: false, message: '', onConfirm: () => {}});
  
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({show: true, message, type});
    setTimeout(() => setNotification(prev => ({...prev, show: false})), 3000);
  };
  
  const showConfirm = (message: string, onConfirm: () => void) => {
    setConfirmDialog({show: true, message, onConfirm});
  };

  // Автосохранение черновика (БЕЗ вопросов)
  useEffect(() => {
    if (title || content) {
      localStorage.setItem('news_draft', JSON.stringify({ title, content, category, image, scheduledFor }));
      setAutoSaved(true);
      const timer = setTimeout(() => setAutoSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [title, content, category, image, scheduledFor]);

  // Загрузка черновика
  const loadDraft = () => {
    const draft = localStorage.getItem('news_draft');
    if (draft) {
      const parsed = JSON.parse(draft);
      setTitle(parsed.title || '');
      setContent(parsed.content || '');
      setCategory(parsed.category || 'Новость');
      setImage(parsed.image || '');
      setScheduledFor(parsed.scheduledFor || '');
    }
  };

  // Удаление черновика
  const deleteDraft = () => {
    if (confirm('Удалить сохранённый черновик?')) {
      localStorage.removeItem('news_draft');
      setTitle('');
      setContent('');
      setCategory('Новость');
      setImage('');
      setScheduledFor('');
      alert('Черновик удалён');
    }
  };

  // Проверка наличия черновика
  const hasDraft = () => {
    const draft = localStorage.getItem('news_draft');
    return draft && JSON.parse(draft).title;
  };

  const loadNews = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      setNews(data || []);
    } catch (e) {
      console.warn('Ошибка загрузки новостей:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNews(); }, []);

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Введите заголовок');
      return;
    }
    setSaving(true);
    try {
      const payload = { 
        title: title.trim(), 
        content: content.trim() || '', 
        category: category || 'Новость', 
        image: image.trim() || null,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null
      };
      
      console.log('Сохранение новости:', payload);
      
      if (editingId) {
        const { data, error } = await supabase.from('news').update(payload).eq('id', editingId);
        if (error) {
          console.error('Ошибка обновления:', error);
          alert('Ошибка обновления: ' + error.message);
          return;
        }
        console.log('Новость обновлена:', data);
      } else {
        const { data, error } = await supabase.from('news').insert([payload]);
        if (error) {
          console.error('Ошибка создания:', error);
          alert('Ошибка создания: ' + error.message);
          return;
        }
        console.log('Новость создана:', data);
      }
      
      // Очищаем форму
      setTitle('');
      setContent('');
      setCategory('Новость');
      setImage('');
      setScheduledFor('');
      setEditingId(null);
      
      // Очищаем черновик
      localStorage.removeItem('news_draft');
      
      // Перезагружаем список
      await loadNews();
      alert(editingId ? 'Новость обновлена!' : 'Новость опубликована!');
    } catch (e: any) {
      console.error('Исключение при сохранении:', e);
      alert('Ошибка: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setTitle(item.title);
    setContent(item.content || '');
    setCategory(item.category || 'Новость');
    setImage(item.image || '');
    setScheduledFor(item.scheduled_for ? new Date(item.scheduled_for).toISOString().slice(0, 16) : '');
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Точно удалить эту новость?')) return;
    try {
      console.log('Удаление новости:', id);
      const { error } = await supabase.from('news').delete().eq('id', id);
      if (error) {
        console.error('Ошибка удаления:', error);
        alert('Ошибка удаления: ' + error.message);
        return;
      }
      console.log('Новость удалена');
      await loadNews();
      alert('Новость удалена!');
    } catch (e: any) {
      console.error('Исключение при удалении:', e);
      alert('Ошибка: ' + e.message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setTitle('');
    setContent('');
    setCategory('Новость');
    setImage('');
  };

  // Вставка форматирования
  const insertFormat = (prefix: string, suffix: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end);
    const newContent = before + prefix + selected + suffix + after;
    setContent(newContent);
    
    // Возвращаем фокус на textarea
    setTimeout(() => {
      textarea.focus();
      const newPos = start + prefix.length + selected.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  // Рендер предпросмотра
  const renderPreview = () => {
    return content.split('\n').map((line: string, i: number) => {
      if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-black uppercase tracking-tight text-[#9d8df1] mt-6 mb-3">{line.replace('## ', '')}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-2xl font-black uppercase tracking-tight text-white mt-8 mb-4">{line.replace('# ', '')}</h1>;
      if (line.startsWith('- ')) return <li key={i} className="text-zinc-300 ml-4 mb-1">• {line.replace('- ', '')}</li>;
      if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-[#6050ba] pl-4 italic text-zinc-400 my-3">{line.replace('> ', '')}</blockquote>;
      if (line.startsWith('---')) return <hr key={i} className="border-zinc-700 my-6" />;
      if (line.trim().startsWith('`') && line.trim().endsWith('`')) return <code key={i} className="bg-black/40 px-2 py-1 rounded text-[#9d8df1] text-sm font-mono">{line.trim().slice(1, -1)}</code>;
      if (line.trim()) {
        // Обработка жирного текста **текст**
        let processed = line.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
        // Обработка курсива *текст*
        processed = processed.replace(/\*(.+?)\*/g, '<em class="italic text-zinc-300">$1</em>');
        // Обработка ссылок [текст](url)
        processed = processed.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-[#9d8df1] underline hover:text-[#b8a8ff]">$1</a>');
        return <p key={i} className="text-zinc-400 mb-3" dangerouslySetInnerHTML={{ __html: processed }} />;
      }
      return null;
    });
  };

  // Вставка ссылки через диалог
  const handleInsertLink = () => {
    if (!linkText.trim() || !linkUrl.trim()) {
      alert('Заполни оба поля');
      return;
    }
    const linkMarkdown = `[${linkText}](${linkUrl})`;
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const before = content.substring(0, start);
      const after = content.substring(end);
      setContent(before + linkMarkdown + after);
      
      // Возвращаем фокус
      setTimeout(() => {
        textarea.focus();
        const newPos = start + linkMarkdown.length;
        textarea.setSelectionRange(newPos, newPos);
      }, 0);
    }
    
    // Закрываем диалог и очищаем поля
    setShowLinkDialog(false);
    setLinkText('');
    setLinkUrl('');
  };

  // Открытие диалога ссылки
  const openLinkDialog = () => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selected) setLinkText(selected);
    }
    setShowLinkDialog(true);
  };

  // Загрузка картинки в Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      showNotification('Можно загружать только изображения', 'error');
      return;
    }
    
    // Проверка размера (макс 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Файл слишком большой. Максимум 5MB', 'error');
      return;
    }
    
    // Создаём временный URL для предпросмотра и открываем crop редактор
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };
  
  // Обработка обрезанного изображения
  const handleCropComplete = async (blob: Blob) => {
    setShowCropModal(false);
    setUploading(true);
    
    try {
      // Создаём уникальное имя файла
      const fileName = `news_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      // Загружаем в Supabase Storage в bucket avatars (где есть публичный доступ)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg'
        });
      
      if (error) throw error;
      
      // Получаем публичный URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      setImage(publicUrl);
      showNotification('Картинка загружена', 'success');
      
      // Сбрасываем file input
      const fileInput = document.getElementById('news-image-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      console.error('Ошибка загрузки:', error);
      showNotification('Ошибка загрузки: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };
  
  // Редактирование существующего изображения
  const handleEditImage = async () => {
    if (!image) return;
    setImageToCrop(image);
    setShowCropModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Уведомление */}
      {notification.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-xl shadow-2xl border backdrop-blur-sm ${
            notification.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className="font-medium">{notification.message}</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Диалог подтверждения */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1a1f] border border-white/10 rounded-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold mb-4">Подтверждение</h3>
            <p className="text-zinc-400 mb-6">{confirmDialog.message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(prev => ({...prev, show: false}))}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition"
              >
                Нет
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(prev => ({...prev, show: false}));
                }}
                className="flex-1 py-3 bg-[#6050ba] hover:bg-[#7060ca] rounded-xl font-bold transition"
              >
                Да
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Шапка */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-black mb-1">Управление новостями</h2>
          <p className="text-zinc-500 text-sm">Создавай новости - они появятся у всех на странице /news</p>
        </div>
        <div className="flex gap-2">
          {hasDraft() && (
            <>
              <button 
                onClick={loadDraft}
                className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-bold transition"
                title="Загрузить сохранённый черновик"
              >
                Загрузить черновик
              </button>
              <button 
                onClick={deleteDraft}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-xs font-bold transition"
                title="Удалить черновик"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
          <a href="/news" target="_blank" className="px-4 py-2 bg-[#6050ba]/20 hover:bg-[#6050ba]/30 rounded-lg text-xs font-bold transition">
            Посмотреть новости
          </a>
        </div>
      </div>

      {/* Форма создания/редактирования */}
      <div className="p-6 bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl">
        <h3 className="font-black mb-2">{editingId ? 'Редактируешь новость' : 'Создать новость'}</h3>
        <p className="text-xs text-zinc-500 mb-6">Заполни форму ниже и нажми кнопку "Опубликовать"</p>
        
        <div className="space-y-5">
          {/* Заголовок и категория */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2">
                ЗАГОЛОВОК <span className="text-red-400">*</span>
              </label>
              <input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="Например: Новый релиз от thqlabel" 
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:bg-black/60 transition" 
              />
              <div className="flex justify-between items-center mt-1">
                <p className="text-[10px] text-zinc-600">Главный заголовок - обязательное поле</p>
                <p className="text-[10px] text-zinc-500">{title.length} символов</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2">
                КАТЕГОРИЯ
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:bg-black/60 transition cursor-pointer"
              >
                <option value="Новость">Новость - обычная новость лейбла</option>
                <option value="Обновление">Обновление - изменения на платформе</option>
              </select>
              <p className="text-[10px] text-zinc-600 mt-1">Тип новости - влияет на иконку</p>
            </div>

            {/* Планирование публикации */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2">
                ЗАПЛАНИРОВАТЬ ПУБЛИКАЦИЮ (необязательно)
              </label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => setScheduledFor(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#6050ba] focus:bg-black/60 transition [color-scheme:dark]"
              />
              <p className="text-[10px] text-zinc-600 mt-1">
                {scheduledFor ? `Новость будет опубликована ${new Date(scheduledFor).toLocaleString('ru-RU')}` : 'Оставьте пустым для немедленной публикации'}
              </p>
            </div>
          </div>
          
          {/* Картинка */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">
              КАРТИНКА (необязательно)
            </label>
            <input 
              value={image} 
              onChange={(e) => setImage(e.target.value)} 
              placeholder="URL картинки" 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#6050ba] transition" 
            />
          </div>
          
          {/* Текст новости */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-zinc-400">
                ТЕКСТ НОВОСТИ
              </label>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-[10px] px-3 py-1 bg-[#6050ba]/20 hover:bg-[#6050ba]/30 rounded-lg font-bold transition"
              >
                {showPreview ? 'Редактор' : 'Предпросмотр'}
              </button>
            </div>
            
            {!showPreview ? (
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                placeholder="Основной текст новости..." 
                rows={10}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none resize-none focus:border-[#6050ba] focus:bg-black/60 font-mono transition" 
              />
            ) : (
              <div className="bg-black/20 border border-white/10 rounded-xl p-6 min-h-[200px]">
                {content ? renderPreview() : <p className="text-zinc-600 text-center">Введите текст для предпросмотра</p>}
              </div>
            )}
          </div>
          
          {/* Кнопки действий */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#6050ba] to-[#7060ca] rounded-xl text-sm font-bold hover:from-[#7060ca] hover:to-[#8070da] transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#6050ba]/20"
            >
              {saving ? 'Сохранение...' : editingId ? 'Сохранить изменения' : 'Опубликовать новость'}
            </button>
            {editingId && (
              <button 
                onClick={handleCancel}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold transition"
              >
                ✕ Отмена
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Список всех новостей */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-lg">Опубликованные новости ({news.length})</h3>
          <p className="text-xs text-zinc-500">Нажмите на новость для редактирования или удаления</p>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="text-zinc-600 animate-pulse">Загрузка новостей...</div>
          </div>
        ) : news.length === 0 ? (
          <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-white/5 flex items-center justify-center"><svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg></div>
            <p className="text-zinc-500 font-bold">Новостей пока нет</p>
            <p className="text-xs text-zinc-600 mt-1">Создай первую новость используя форму выше</p>
          </div>
        ) : (
          news.map(item => (
            <div key={item.id} className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl p-5 hover:border-[#6050ba]/50 transition-all group">
              <div className="flex gap-4">
                {item.image && (
                  <img src={item.image} alt="" className="w-24 h-24 rounded-xl object-cover flex-shrink-0 border border-white/5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {item.category && (
                      <span className="text-[10px] px-2.5 py-1 bg-[#6050ba]/20 text-[#9d8df1] rounded-full font-bold">{item.category}</span>
                    )}
                    <span className="text-[9px] text-zinc-600">
                      ID: {item.id}
                    </span>
                  </div>
                  <h4 className="font-bold text-white mb-2 line-clamp-1 text-base">{item.title}</h4>
                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{item.content || 'Без текста'}</p>
                  <div className="flex items-center gap-3 mt-3">
                    <p className="text-[10px] text-zinc-600">
                      {new Date(item.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {item.updated_at !== item.created_at && (
                      <p className="text-[10px] text-zinc-600">
                        Изменено: {new Date(item.updated_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleEdit(item)}
                    className="px-4 py-2 bg-[#6050ba]/20 hover:bg-[#6050ba]/40 rounded-lg text-xs font-bold transition group-hover:scale-105"
                    title="Редактировать новость"
                  >
                    Изменить
                  </button>
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-bold transition group-hover:scale-105"
                    title="Удалить новость"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
