'use client';

import { useState, useEffect, useCallback } from 'react';

interface Draft {
  id: number;
  user_id: string;
  title: string;
  content: string;
  category: string;
  image: string | null;
  scheduled_for: string | null;
  updated_at: string;
}

interface UseDraftsReturn {
  drafts: Draft[];
  currentDraftId: number | null;
  setCurrentDraftId: (id: number | null) => void;
  autoSaved: boolean;
  loadDrafts: () => Promise<void>;
  handleLoadDraft: (draft: Draft) => void;
  handleDeleteDraft: (draftId: number) => Promise<void>;
}

interface DraftsState {
  title: string;
  content: string;
  category: string;
  image: string;
  scheduledFor: string;
}

export function useDrafts(
  supabase: any, 
  state: DraftsState, 
  setState: {
    setTitle: (t: string) => void;
    setContent: (c: string) => void;
    setCategory: (c: string) => void;
    setImage: (i: string) => void;
    setScheduledFor: (s: string) => void;
  },
  showNotification: (message: string, type: 'success' | 'error') => void,
  showConfirm: (message: string, onConfirm: () => void) => void
): UseDraftsReturn {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<number | null>(null);
  const [autoSaved, setAutoSaved] = useState(false);

  // Загрузка черновиков
  const loadDrafts = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data, error } = await supabase
        .from('news_drafts')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      setDrafts(data || []);
    } catch (e) {
      console.error('Ошибка загрузки черновиков:', e);
    }
  }, [supabase]);

  // Автосохранение
  useEffect(() => {
    const { title, content, category, image, scheduledFor } = state;
    if (!title && !content) return;
    
    const timer = setTimeout(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const payload = { 
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
          category,
          image: image.trim() || null,
          scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null
        };
        
        if (currentDraftId) {
          await supabase
            .from('news_drafts')
            .update(payload)
            .eq('id', currentDraftId);
        } else {
          const { data } = await supabase
            .from('news_drafts')
            .insert([payload])
            .select()
            .single();
          
          if (data) setCurrentDraftId(data.id);
        }
        
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
        await loadDrafts();
      } catch (e) {
        console.error('Ошибка автосохранения:', e);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [state.title, state.content, state.category, state.image, state.scheduledFor, currentDraftId, supabase, loadDrafts]);

  // Загрузка черновика в форму
  const handleLoadDraft = (draft: Draft) => {
    setState.setTitle(draft.title || '');
    setState.setContent(draft.content || '');
    setState.setCategory(draft.category || 'Новость');
    setState.setImage(draft.image || '');
    setState.setScheduledFor(draft.scheduled_for ? new Date(draft.scheduled_for).toISOString().slice(0, 16) : '');
    setCurrentDraftId(draft.id);
    showNotification('Черновик загружен', 'success');
  };

  // Удаление черновика
  const handleDeleteDraft = async (draftId: number) => {
    showConfirm('Удалить этот черновик?', async () => {
      try {
        const { error } = await supabase
          .from('news_drafts')
          .delete()
          .eq('id', draftId);
        
        if (error) throw error;
        
        if (currentDraftId === draftId) {
          setState.setTitle('');
          setState.setContent('');
          setState.setCategory('Новость');
          setState.setImage('');
          setState.setScheduledFor('');
          setCurrentDraftId(null);
        }
        
        await loadDrafts();
        showNotification('Черновик удалён', 'success');
      } catch (e: any) {
        showNotification('Ошибка удаления: ' + e.message, 'error');
      }
    });
  };

  return {
    drafts,
    currentDraftId,
    setCurrentDraftId,
    autoSaved,
    loadDrafts,
    handleLoadDraft,
    handleDeleteDraft,
  };
}
