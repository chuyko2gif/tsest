'use client';

import { useState, useEffect, useCallback } from 'react';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  category: string;
  image: string | null;
  scheduled_for: string | null;
  created_at: string;
  updated_at: string;
}

interface UseNewsReturn {
  news: NewsItem[];
  loading: boolean;
  editingId: number | null;
  loadNews: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleEdit: (item: NewsItem) => void;
  handleDelete: (id: number) => Promise<void>;
  handleCancel: () => void;
}

interface NewsFormState {
  title: string;
  content: string;
  category: string;
  image: string;
  scheduledFor: string;
}

export function useNews(
  supabase: any,
  formState: NewsFormState,
  setFormState: {
    setTitle: (t: string) => void;
    setContent: (c: string) => void;
    setCategory: (c: string) => void;
    setImage: (i: string) => void;
    setScheduledFor: (s: string) => void;
    setEditingId: (id: number | null) => void;
    editingId: number | null;
  },
  showNotification: (message: string, type: 'success' | 'error') => void,
  showConfirm: (message: string, onConfirm: () => void) => void,
  currentDraftId: number | null,
  setCurrentDraftId: (id: number | null) => void,
  loadDrafts: () => Promise<void>
): UseNewsReturn {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const editingId = setFormState.editingId;

  // Загрузка новостей
  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('news').select('*').order('created_at', { ascending: false });
      setNews(data || []);
    } catch (e) {
      console.warn('Ошибка загрузки новостей:', e);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  // Очистка формы
  const clearForm = () => {
    setFormState.setTitle('');
    setFormState.setContent('');
    setFormState.setCategory('Новость');
    setFormState.setImage('');
    setFormState.setScheduledFor('');
    setFormState.setEditingId(null);
    setCurrentDraftId(null);
  };

  // Сохранение
  const handleSave = async () => {
    if (!formState.title.trim()) {
      showNotification('Введите заголовок', 'error');
      return;
    }
    setSaving(true);
    try {
      const payload = { 
        title: formState.title.trim(), 
        content: formState.content.trim() || '', 
        category: formState.category || 'Новость', 
        image: formState.image.trim() || null,
        scheduled_for: formState.scheduledFor ? new Date(formState.scheduledFor).toISOString() : null
      };
      
      if (editingId) {
        const { error } = await supabase.from('news').update(payload).eq('id', editingId);
        if (error) {
          showNotification('Ошибка обновления: ' + error.message, 'error');
          return;
        }
        showNotification('Новость обновлена!', 'success');
      } else {
        const { error } = await supabase.from('news').insert([payload]);
        if (error) {
          showNotification('Ошибка создания: ' + error.message, 'error');
          return;
        }
        showNotification('Новость опубликована!', 'success');
      }
      
      // Удаляем черновик если он был
      if (currentDraftId) {
        await supabase.from('news_drafts').delete().eq('id', currentDraftId);
        await loadDrafts();
      }
      
      clearForm();
      await loadNews();
    } catch (e: any) {
      showNotification('Ошибка: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Редактирование
  const handleEdit = (item: NewsItem) => {
    setFormState.setEditingId(item.id);
    setFormState.setTitle(item.title);
    setFormState.setContent(item.content || '');
    setFormState.setCategory(item.category || 'Новость');
    setFormState.setImage(item.image || '');
    setFormState.setScheduledFor(item.scheduled_for ? new Date(item.scheduled_for).toISOString().slice(0, 16) : '');
  };

  // Удаление
  const handleDelete = async (id: number) => {
    showConfirm('Точно удалить эту новость?', async () => {
      try {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) {
          showNotification('Ошибка удаления: ' + error.message, 'error');
          return;
        }
        await loadNews();
        showNotification('Новость удалена!', 'success');
      } catch (e: any) {
        showNotification('Ошибка: ' + e.message, 'error');
      }
    });
  };

  const handleCancel = () => {
    clearForm();
  };

  return {
    news,
    loading,
    editingId,
    loadNews,
    handleSave,
    handleEdit,
    handleDelete,
    handleCancel,
  };
}
