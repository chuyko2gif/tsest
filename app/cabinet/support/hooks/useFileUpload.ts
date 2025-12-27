import { useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { Ticket, SupportUser } from '../types';

interface UseFileUploadProps {
  user: SupportUser | null;
  selectedTicket: Ticket | null;
  setUploadingFile: (uploading: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const ALLOWED_TYPES = [
  'image/jpeg', 
  'image/png', 
  'image/gif', 
  'image/webp', 
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useFileUpload({
  user,
  selectedTicket,
  setUploadingFile,
  fileInputRef,
}: UseFileUploadProps) {
  
  const uploadFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedTicket || !supabase || !user) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('Файл слишком большой (макс. 10MB)');
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('Разрешены: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX');
      return;
    }

    setUploadingFile(true);
    try {
      const fileName = `${user.id}/${selectedTicket.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('ticket-attachments')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('ticket-attachments')
        .getPublicUrl(fileName);

      const { data: messageData, error: messageError } = await supabase
        .from('ticket_messages')
        .insert({
          ticket_id: selectedTicket.id,
          user_id: user.id,
          message: file.type.startsWith('image/') ? '🖼️ Изображение' : `📎 ${file.name}`,
          is_admin: false,
        })
        .select()
        .single();

      if (messageError) throw messageError;

      await supabase.from('ticket_attachments').insert({
        message_id: messageData.id,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
      });

    } catch (e: any) {
      console.error('Ошибка загрузки:', e);
      alert('Ошибка загрузки файла: ' + e.message);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [user, selectedTicket, setUploadingFile, fileInputRef]);

  return {
    uploadFile,
    allowedTypes: ALLOWED_TYPES,
    maxFileSize: MAX_FILE_SIZE,
  };
}
