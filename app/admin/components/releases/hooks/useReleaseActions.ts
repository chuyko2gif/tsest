import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Release } from '../types';
import { showSuccessToast, showErrorToast } from '@/lib/utils/showToast';

interface UseReleaseActionsReturn {
  handleApprove: (release: Release, onSuccess: () => void) => Promise<void>;
  handleReject: (release: Release, reason: string, onSuccess: () => void) => Promise<void>;
  handleDeleteRelease: (release: Release, onSuccess: () => void) => Promise<void>;
  handleVerifyPayment: (release: Release, isVerified: boolean, reason: string, onSuccess: () => void) => Promise<void>;
  handleBulkPublish: (releaseIds: string[], releases: Release[], onSuccess: () => void) => Promise<void>;
  handleBulkDelete: (releaseIds: string[], releases: Release[], onSuccess: () => void) => Promise<void>;
}

export function useReleaseActions(supabase: SupabaseClient | null): UseReleaseActionsReturn {
  
  const handleApprove = useCallback(async (release: Release, onSuccess: () => void) => {
    if (!supabase || !release) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .update({ 
          status: 'distributed',
          approved_at: new Date().toISOString(),
          approved_by: user.id
        })
        .eq('id', release.id);
      
      if (error) throw error;
      
      showSuccessToast('Релиз успешно утверждён!');
      onSuccess();
    } catch (error: any) {
      console.error('Ошибка утверждения:', error);
      showErrorToast(`Ошибка при утверждении релиза: ${error.message || 'Неизвестная ошибка'}`);
    }
  }, [supabase]);

  const handleReject = useCallback(async (release: Release, reason: string, onSuccess: () => void) => {
    if (!supabase || !release || !reason.trim()) {
      alert('Укажите причину отклонения');
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const functionName = release.release_type === 'basic' 
        ? 'reject_basic_release' 
        : 'reject_exclusive_release';

      const { error } = await supabase.rpc(functionName, {
        release_id: release.id,
        admin_id: user.id,
        reason: reason
      });
      
      if (error) throw error;
      
      showSuccessToast('Релиз отклонён');
      onSuccess();
    } catch (error) {
      console.error('Ошибка отклонения:', error);
      showErrorToast('Ошибка при отклонении релиза');
    }
  }, [supabase]);

  const handleDeleteRelease = useCallback(async (release: Release, onSuccess: () => void) => {
    if (!supabase || !release) return;
    
    try {
      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', release.id);
      
      if (error) throw error;
      
      showSuccessToast('Релиз успешно удалён');
      onSuccess();
    } catch (error) {
      console.error('Ошибка удаления релиза:', error);
      showErrorToast('Ошибка при удалении релиза');
    }
  }, [supabase]);

  const handleVerifyPayment = useCallback(async (release: Release, isVerified: boolean, reason: string, onSuccess: () => void) => {
    if (!supabase || !release) return;
    if (release.release_type !== 'basic') return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const functionName = isVerified ? 'verify_basic_payment' : 'reject_basic_payment';
      const params: any = {
        release_id: release.id,
        admin_id: user.id
      };
      
      if (!isVerified) {
        params.reason = reason || '';
      }

      const { error } = await supabase.rpc(functionName, params);
      
      if (error) throw error;
      
      showSuccessToast(isVerified ? 'Платеж подтвержден' : 'Платеж отклонен');
      onSuccess();
    } catch (error) {
      console.error('Ошибка проверки платежа:', error);
      showErrorToast('Ошибка при проверке платежа');
    }
  }, [supabase]);
  
  const handleBulkPublish = useCallback(async (releaseIds: string[], releases: Release[], onSuccess: () => void) => {
    if (!supabase || releaseIds.length === 0) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Необходима авторизация');
        return;
      }

      const updatePromises = releaseIds.map(async releaseId => {
        const release = releases.find(r => r.id === releaseId);
        if (!release) return;
        
        const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
        
        const { error } = await supabase
          .from(tableName)
          .update({ status: 'published' })
          .eq('id', releaseId);
        
        if (error) throw error;
      });
      
      await Promise.all(updatePromises);
      
      showSuccessToast(`Успешно опубликовано: ${releaseIds.length} релизов!`);
      onSuccess();
    } catch (error) {
      console.error('Ошибка публикации:', error);
      showErrorToast('Ошибка при публикации релизов');
    }
  }, [supabase]);
  
  const handleBulkDelete = useCallback(async (releaseIds: string[], releases: Release[], onSuccess: () => void) => {
    if (!supabase || releaseIds.length === 0) return;
    
    try {
      const deletePromises = releaseIds.map(async releaseId => {
        const release = releases.find(r => r.id === releaseId);
        if (!release) return;
        
        const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
        
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', releaseId);
        
        if (error) throw error;
      });
      
      await Promise.all(deletePromises);
      
      showSuccessToast(`Успешно удалено: ${releaseIds.length} релизов`);
      onSuccess();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      showErrorToast('Ошибка при удалении релизов');
    }
  }, [supabase]);

  return {
    handleApprove,
    handleReject,
    handleDeleteRelease,
    handleVerifyPayment,
    handleBulkPublish,
    handleBulkDelete
  };
}
