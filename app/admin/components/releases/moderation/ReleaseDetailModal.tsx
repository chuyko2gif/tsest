'use client';

import React, { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { useTheme } from '@/contexts/ThemeContext';
import { Release } from '../types';
import { showSuccessToast, showErrorToast } from '@/lib/utils/showToast';
import { TRACK_AUTHOR_ROLES, TrackAuthor } from '@/components/ui/TrackAuthors';

// Хелпер для форматирования авторов трека
const formatTrackAuthors = (authors: string | string[] | TrackAuthor[] | undefined): string => {
  if (!authors) return '';
  
  // Если это массив объектов TrackAuthor
  if (Array.isArray(authors) && authors.length > 0 && typeof authors[0] === 'object' && 'role' in authors[0]) {
    return (authors as TrackAuthor[]).map(a => {
      const roleLabel = TRACK_AUTHOR_ROLES.find(r => r.value === a.role)?.label || a.role;
      return `${a.fullName} (${roleLabel})`;
    }).join(', ');
  }
  
  // Если это массив строк
  if (Array.isArray(authors)) {
    return (authors as string[]).filter(a => a?.trim()).join(', ');
  }
  
  return authors as string;
};

// ============================================================================
// SVG ICONS
// ============================================================================
const Icons = {
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  download: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  downloadZip: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
      <rect x="14" y="2" width="4" height="5" rx="1" fill="currentColor" opacity="0.3"/>
    </svg>
  ),
  edit: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  excel: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <path d="M8 8l8 8M16 8l-8 8"/>
    </svg>
  ),
  trash: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <line x1="10" y1="11" x2="10" y2="17"/>
      <line x1="14" y1="11" x2="14" y2="17"/>
    </svg>
  ),
  check: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  checkCircle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  music: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/>
      <circle cx="6" cy="18" r="3"/>
      <circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  disc: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  tag: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  barcode: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5v14"/>
      <path d="M8 5v14"/>
      <path d="M12 5v14"/>
      <path d="M17 5v14"/>
      <path d="M21 5v14"/>
    </svg>
  ),
  warning: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  zap: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  chevron: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  plus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
};

interface ReleaseDetailModalProps {
  release: Release;
  supabase: SupabaseClient;
  onClose: () => void;
  onApprove: () => void;
  onReject: () => void;
  onDelete: () => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  onRefresh: () => void;
}

// Глобальный event для остановки всех треков в админке
const ADMIN_STOP_ALL_AUDIO_EVENT = 'thq-admin-stop-all-audio';
const stopAllAdminAudio = () => window.dispatchEvent(new CustomEvent(ADMIN_STOP_ALL_AUDIO_EVENT));

export default function ReleaseDetailModal({
  release,
  supabase,
  onClose,
  onApprove,
  onReject,
  onDelete,
  rejectionReason,
  setRejectionReason,
  onRefresh
}: ReleaseDetailModalProps) {
  const router = useRouter();
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  
  // Состояния для редактирования
  const [editingTrackISRC, setEditingTrackISRC] = useState<{trackIndex: number, isrc: string} | null>(null);
  const [savingISRC, setSavingISRC] = useState(false);
  const [editingReleaseUPC, setEditingReleaseUPC] = useState(false);
  const [releaseUPCInput, setReleaseUPCInput] = useState('');
  const [savingReleaseUPC, setSavingReleaseUPC] = useState(false);
  const [downloadingZip, setDownloadingZip] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);

  // Остановка всех аудио при закрытии модалки
  const handleClose = useCallback(() => {
    stopAllAdminAudio();
    onClose();
  }, [onClose]);

  // Сохранение ISRC кода трека
  const handleSaveTrackISRC = useCallback(async (trackIndex: number, isrc: string) => {
    if (!supabase || !release) return;
    
    setSavingISRC(true);
    try {
      const updatedTracks = [...(release.tracks || [])];
      updatedTracks[trackIndex] = { ...updatedTracks[trackIndex], isrc };
      
      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .update({ tracks: updatedTracks })
        .eq('id', release.id);
      
      if (error) throw error;
      
      showSuccessToast('ISRC код сохранен');
      setEditingTrackISRC(null);
      onRefresh(); // Обновляем список
    } catch (error) {
      console.error('Ошибка сохранения ISRC:', error);
      showErrorToast('Ошибка при сохранении ISRC кода');
    } finally {
      setSavingISRC(false);
    }
  }, [supabase, release, onRefresh]);

  // Сохранение UPC кода релиза
  const handleSaveReleaseUPC = useCallback(async () => {
    if (!supabase || !release || !releaseUPCInput.trim()) return;
    
    setSavingReleaseUPC(true);
    try {
      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .update({ upc: releaseUPCInput.trim() })
        .eq('id', release.id);
      
      if (error) throw error;
      
      showSuccessToast('UPC код сохранен');
      setEditingReleaseUPC(false);
      onRefresh(); // Обновляем список
    } catch (error) {
      console.error('Ошибка сохранения UPC:', error);
      showErrorToast('Ошибка при сохранении UPC кода');
    } finally {
      setSavingReleaseUPC(false);
    }
  }, [supabase, release, releaseUPCInput, onRefresh]);

  // Скачивание файла
  const handleDownloadFile = useCallback(async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Ошибка загрузки');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      showSuccessToast('Файл скачан');
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      showErrorToast('Ошибка при скачивании');
    }
  }, []);

  // Скачивание трека
  const handleDownloadTrack = useCallback(async (trackIndex: number, trackTitle: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      const url = `/api/stream-audio?releaseId=${release.id}&releaseType=${release.release_type}&trackIndex=${trackIndex}`;
      
      const headers: HeadersInit = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error('Ошибка загрузки');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const safeTitle = (trackTitle || `track_${trackIndex + 1}`).replace(/[\\/:*?"<>|]+/g, '_');
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${safeTitle}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(downloadUrl);
      showSuccessToast('Трек скачан');
    } catch (error) {
      console.error('Ошибка скачивания:', error);
      showErrorToast('Ошибка при скачивании трека');
    }
  }, [supabase, release]);

  // Проверка платежа
  const handleVerifyPayment = useCallback(async (isVerified: boolean) => {
    if (!supabase || release.release_type !== 'basic') return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const functionName = isVerified ? 'verify_basic_payment' : 'reject_basic_payment';
      const params: any = { release_id: release.id, admin_id: user.id };
      if (!isVerified) params.reason = rejectionReason || '';

      const { error } = await supabase.rpc(functionName, params);
      if (error) throw error;
      
      showSuccessToast(isVerified ? 'Платеж подтвержден' : 'Платеж отклонен');
      onRefresh();
    } catch (error) {
      console.error('Ошибка проверки платежа:', error);
      showErrorToast('Ошибка при проверке платежа');
    }
  }, [supabase, release, rejectionReason, onRefresh]);

  // Скачивание релиза в ZIP (обложка + треки + промо-фото)
  const handleDownloadAllTracks = useCallback(async () => {
    if (!release.tracks || release.tracks.length === 0) return;
    
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      // 1. Скачиваем обложку (ОРИГИНАЛ если есть, иначе сжатую)
      const coverUrlToDownload = release.cover_url_original || release.cover_url;
      if (coverUrlToDownload) {
        try {
          const coverResponse = await fetch(coverUrlToDownload);
          if (coverResponse.ok) {
            const coverBlob = await coverResponse.blob();
            const coverExt = coverUrlToDownload.split('.').pop()?.split('?')[0] || 'jpg';
            zip.file(`cover.${coverExt}`, coverBlob);
          }
        } catch (e) {
          console.warn('Не удалось добавить обложку в архив');
        }
      }
      
      // 2. Скачиваем все треки
      for (let i = 0; i < release.tracks.length; i++) {
        const track = release.tracks[i];
        const url = `/api/stream-audio?releaseId=${release.id}&releaseType=${release.release_type}&trackIndex=${i}`;
        
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        
        const response = await fetch(url, { headers });
        if (response.ok) {
          const blob = await response.blob();
          const safeTitle = (track.title || `track_${i + 1}`).replace(/[\\/:*?"<>|]+/g, '_');
          // Определяем расширение по типу файла
          const ext = blob.type.includes('wav') ? 'wav' : blob.type.includes('flac') ? 'flac' : 'wav';
          zip.file(`${String(i + 1).padStart(2, '0')} - ${safeTitle}.${ext}`, blob);
        }
      }
      
      // 3. Скачиваем промо-фото
      const promoPhotos = (release as any).promo_photos as string[] | undefined;
      if (promoPhotos && promoPhotos.length > 0) {
        for (let i = 0; i < promoPhotos.length; i++) {
          try {
            const photoResponse = await fetch(promoPhotos[i]);
            if (photoResponse.ok) {
              const photoBlob = await photoResponse.blob();
              const photoExt = promoPhotos[i].split('.').pop()?.split('?')[0] || 'jpg';
              zip.file(`Promo_${i + 1}.${photoExt}`, photoBlob);
            }
          } catch (e) {
            console.warn(`Не удалось добавить промо-фото ${i + 1} в архив`);
          }
        }
      }
      
      // Генерируем архив
      const content = await zip.generateAsync({ type: 'blob' });
      const safeArtist = release.artist_name.replace(/[\\/:*?"<>|]+/g, '_');
      const safeTitle = release.title.replace(/[\\/:*?"<>|]+/g, '_');
      const downloadUrl = window.URL.createObjectURL(content);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${safeArtist} - ${safeTitle}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      showSuccessToast('Архив скачан');
    } catch (error) {
      console.error('Ошибка создания архива:', error);
      showErrorToast('Ошибка при создании архива');
    } finally {
      setDownloadingZip(false);
    }
  }, [supabase, release]);

  // Скачивание метаданных в Excel (красивый формат)
  const handleDownloadMetadata = useCallback(async () => {
    try {
      const ExcelJS = (await import('exceljs')).default;
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'thqlabel';
      workbook.created = new Date();
      
      const sheet = workbook.addWorksheet('Metadata', {
        properties: { tabColor: { argb: '8B5CF6' } }
      });
      
      // Установка ширины колонок
      sheet.columns = [
        { width: 20 },
        { width: 40 },
        { width: 25 },
        { width: 18 },
        { width: 15 },
        { width: 20 },
        { width: 25 }
      ];
      
      // Стили
      const headerStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: 'FFFFFF' }, size: 11 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B5CF6' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: { bottom: { style: 'thin', color: { argb: '6D28D9' } } }
      };
      
      const labelStyle: Partial<ExcelJS.Style> = {
        font: { bold: true, color: { argb: '71717A' }, size: 10 },
        alignment: { horizontal: 'left', vertical: 'middle' }
      };
      
      const valueStyle: Partial<ExcelJS.Style> = {
        font: { color: { argb: '18181B' }, size: 11 },
        alignment: { horizontal: 'left', vertical: 'middle' }
      };
      
      // === ЗАГОЛОВОК ===
      sheet.mergeCells('A1:G1');
      const titleCell = sheet.getCell('A1');
      titleCell.value = 'thqlabel — Release Metadata';
      titleCell.font = { bold: true, size: 16, color: { argb: '8B5CF6' } };
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
      sheet.getRow(1).height = 30;
      
      // === ИНФОРМАЦИЯ О РЕЛИЗЕ ===
      sheet.mergeCells('A3:G3');
      const sectionCell = sheet.getCell('A3');
      sectionCell.value = 'RELEASE INFO';
      Object.assign(sectionCell, headerStyle);
      sheet.getRow(3).height = 25;
      
      const releaseInfo = [
        ['Title', release.title],
        ['Artist', release.artist_name],
        ['Genre', release.genre || '—'],
        ['Subgenres', (release.subgenres || []).join(', ') || '—'],
        ['Release Date', release.release_date ? new Date(release.release_date).toLocaleDateString('ru-RU') : '—'],
        ['UPC', release.upc || '—'],
        ['Release Code', release.custom_id || '—'],
        ['Type', release.release_type === 'basic' ? 'Basic' : 'Exclusive'],
        ['Status', release.status],
        ['Platforms', (release.platforms || []).slice(0, 5).join(', ') + ((release.platforms || []).length > 5 ? '...' : '')],
      ];
      
      releaseInfo.forEach((row, idx) => {
        const rowNum = 4 + idx;
        const labelCell = sheet.getCell(`A${rowNum}`);
        labelCell.value = row[0];
        Object.assign(labelCell, labelStyle);
        
        sheet.mergeCells(`B${rowNum}:G${rowNum}`);
        const valCell = sheet.getCell(`B${rowNum}`);
        valCell.value = row[1];
        Object.assign(valCell, valueStyle);
      });
      
      // === ТРЕКЛИСТ ===
      const trackStartRow = 4 + releaseInfo.length + 2;
      sheet.mergeCells(`A${trackStartRow}:G${trackStartRow}`);
      const trackHeaderCell = sheet.getCell(`A${trackStartRow}`);
      trackHeaderCell.value = 'TRACKLIST';
      Object.assign(trackHeaderCell, headerStyle);
      sheet.getRow(trackStartRow).height = 25;
      
      // Заголовки колонок треков
      const trackColHeaders = ['#', 'Title', 'Version', 'ISRC', 'Language', 'Authors', 'Featuring', 'Producers'];
      const colHeaderRow = trackStartRow + 1;
      trackColHeaders.forEach((h, i) => {
        const cell = sheet.getCell(colHeaderRow, i + 1);
        cell.value = h;
        cell.font = { bold: true, size: 10, color: { argb: '52525B' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F4F4F5' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { bottom: { style: 'thin', color: { argb: 'E4E4E7' } } };
      });
      sheet.getRow(colHeaderRow).height = 22;
      
      // Данные треков
      const tracks = release.tracks || [];
      tracks.forEach((track: any, idx: number) => {
        const rowNum = colHeaderRow + 1 + idx;
        const rowData = [
          idx + 1,
          track.title || '—',
          track.version || '—',
          track.isrc || '—',
          track.language || '—',
          formatTrackAuthors(track.authors) || '—',
          Array.isArray(track.featuring) ? track.featuring.join(', ') : (track.featuring || '—'),
          Array.isArray(track.producers) ? track.producers.join(', ') : (track.producers || '—'),
        ];
        
        rowData.forEach((val, colIdx) => {
          const cell = sheet.getCell(rowNum, colIdx + 1);
          cell.value = val;
          cell.font = { size: 10, color: { argb: '3F3F46' } };
          cell.alignment = { horizontal: colIdx === 0 ? 'center' : 'left', vertical: 'middle' };
          if (idx % 2 === 1) {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FAFAFA' } };
          }
        });
        sheet.getRow(rowNum).height = 20;
      });
      
      // === FOOTER ===
      const footerRow = colHeaderRow + 2 + tracks.length;
      sheet.mergeCells(`A${footerRow}:H${footerRow}`);
      const footerCell = sheet.getCell(`A${footerRow}`);
      footerCell.value = `Generated by thqlabel • ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
      footerCell.font = { italic: true, size: 9, color: { argb: 'A1A1AA' } };
      footerCell.alignment = { horizontal: 'center' };
      
      // Генерируем файл
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const safeArtist = release.artist_name.replace(/[\\/:*?"<>|]+/g, '_');
      const safeTitle = release.title.replace(/[\\/:*?"<>|]+/g, '_');
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeArtist} - ${safeTitle} - metadata.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showSuccessToast('Метаданные скачаны');
    } catch (error) {
      console.error('Ошибка скачивания метаданных:', error);
      showErrorToast('Ошибка');
    }
  }, [release]);

  // Переключение статуса публикации
  const handleTogglePublished = useCallback(async (confirmed = false) => {
    // Блокируем публикацию для релизов, ожидающих оплаты
    if (release.status === 'awaiting_payment') {
      showErrorToast('Невозможно выложить релиз без оплаты!');
      return;
    }
    
    // Если релиз опубликован и подтверждение не получено - показать модалку
    if (release.status === 'published' && !confirmed) {
      setShowUnpublishConfirm(true);
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showErrorToast('Не авторизован');
        return;
      }

      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      // Переключаем между published и approved
      const newStatus = release.status === 'published' ? 'approved' : 'published';
      
      const { data, error } = await supabase
        .from(tableName)
        .update({ status: newStatus })
        .eq('id', release.id)
        .select();
      
      if (error) {
        throw new Error(error.message || 'Ошибка базы данных');
      }
      
      if (!data || data.length === 0) {
        throw new Error('Нет прав для изменения статуса. Проверьте роль пользователя.');
      }
      
      setShowUnpublishConfirm(false);
      showSuccessToast(newStatus === 'published' ? 'Релиз выложен' : 'Релиз снят с публикации');
      onRefresh();
    } catch (error: any) {
      console.error('Ошибка изменения статуса:', error);
      showErrorToast(error.message || 'Ошибка при изменении статуса');
    }
  }, [supabase, release, onRefresh]);

  // Удаление релиза
  const handleDeleteRelease = useCallback(async () => {
    setIsDeleting(true);
    try {
      const tableName = release.release_type === 'basic' ? 'releases_basic' : 'releases_exclusive';
      
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', release.id);
      
      if (error) throw error;
      
      showSuccessToast('Релиз удалён');
      setShowDeleteConfirm(false);
      handleClose();
      onRefresh();
    } catch (error) {
      console.error('Ошибка удаления:', error);
      showErrorToast('Ошибка при удалении');
    } finally {
      setIsDeleting(false);
    }
  }, [supabase, release, handleClose, onRefresh]);

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-2xl p-2 sm:p-4 md:p-6 ${
        isLight ? 'bg-black/60' : 'bg-black/95'
      }`} 
    >
      {/* Модалка подтверждения удаления */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 z-[10001] flex items-start justify-center pt-[15vh] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
        >
          <div 
            className="bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border-2 border-red-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20 animate-in zoom-in-95 slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase text-white">Удалить релиз?</h3>
                <p className="text-sm text-red-300">Это действие нельзя отменить</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-sm text-zinc-400">Релиз:</div>
              <div className="text-white font-semibold truncate">
                {release.release_artists && release.release_artists.length > 0 
                  ? release.release_artists.join(' & ')
                  : release.artist_name}
                {' — '}{release.title}
              </div>
            </div>
            
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Вы уверены, что хотите удалить этот релиз? Все связанные данные (треки, обложка) будут потеряны безвозвратно.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/20 rounded-xl font-bold text-white transition-all"
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteRelease}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 disabled:from-zinc-600 disabled:to-zinc-700 text-white rounded-xl font-black transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Удаление...
                  </>
                ) : (
                  'Удалить'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модалка подтверждения снятия с публикации */}
      {showUnpublishConfirm && (
        <div 
          className="fixed inset-0 z-[10001] flex items-start justify-center pt-[15vh] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => { e.stopPropagation(); setShowUnpublishConfirm(false); }}
        >
          <div 
            className="bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border-2 border-amber-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-amber-500/20 animate-in zoom-in-95 slide-in-from-top-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase text-white">Снять с публикации?</h3>
                <p className="text-sm text-amber-300">Релиз станет недоступен</p>
              </div>
            </div>
            
            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <div className="text-sm text-zinc-400">Релиз:</div>
              <div className="text-white font-semibold truncate">
                {release.release_artists && release.release_artists.length > 0 
                  ? release.release_artists.join(' & ')
                  : release.artist_name}
                {' — '}{release.title}
              </div>
            </div>
            
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              Вы уверены, что хотите снять релиз с публикации? Он будет переведён в статус &quot;Одобрен&quot; и станет недоступен для публичного просмотра.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowUnpublishConfirm(false)}
                className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/20 rounded-xl font-bold text-white transition-all"
              >
                Отмена
              </button>
              <button
                onClick={() => handleTogglePublished(true)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl font-black transition-all shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
              >
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Контейнер для модалки и крестика */}
      <div className="relative w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-[85vw] lg:max-w-[1000px] xl:max-w-[1100px]">
        {/* Кнопка закрытия - сбоку на десктопе, внутри на мобилке */}
        <button 
          onClick={handleClose} 
          className={`hidden sm:flex absolute -right-14 top-4 z-50 w-10 h-10 rounded-full backdrop-blur-md border items-center justify-center transition-all duration-300 group shadow-xl ${
            isLight 
              ? 'bg-white/80 hover:bg-red-100 border-gray-200 hover:border-red-300' 
              : 'bg-white/10 hover:bg-red-500/30 border-white/20 hover:border-red-500/50'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={`group-hover:rotate-90 transition-all duration-300 ${isLight ? 'text-gray-600 group-hover:text-red-600' : 'text-white/80 group-hover:text-white'}`}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Единое окно */}
        <div 
          className={`relative w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden rounded-2xl sm:rounded-3xl border ${
            isLight 
              ? 'bg-white border-purple-200/50 shadow-[0_0_60px_rgba(139,92,246,0.12)]' 
              : 'bg-[#0a0a0c] border-white/5 shadow-[0_0_100px_rgba(139,92,246,0.15)]'
          }`} 
          onClick={(e) => e.stopPropagation()}
        >
        {/* Кнопка закрытия - внутри на мобилке */}
        <button 
          onClick={handleClose} 
          className={`sm:hidden absolute top-3 right-3 z-50 w-9 h-9 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${
            isLight 
              ? 'bg-white/90 hover:bg-red-100 border-gray-200' 
              : 'bg-white/10 hover:bg-red-500/30 border-white/20'
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={isLight ? 'text-gray-600' : 'text-white/80'}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Фоновые блюры */}
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${isLight ? 'bg-purple-300/20' : 'bg-purple-600/10'}`} />
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-[100px] pointer-events-none ${isLight ? 'bg-violet-300/20' : 'bg-violet-600/10'}`} />
        
        {/* Overlay загрузки */}
        {(savingISRC || savingReleaseUPC) && (
          <div className={`absolute inset-0 z-[60] backdrop-blur-sm flex items-center justify-center rounded-3xl ${isLight ? 'bg-white/60' : 'bg-black/60'}`}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span className={`text-sm ${isLight ? 'text-gray-600' : 'text-white/80'}`}>Сохранение...</span>
            </div>
          </div>
        )}

        {/* Контент со скроллом */}
        <div className="overflow-y-auto max-h-[95vh] sm:max-h-[90vh] scrollbar-hide">
          {/* Sticky шапка внутри скролла */}
          <div className="sticky top-0 left-0 right-0 z-30 h-1 bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500" />
          
          {/* Шапка с обложкой */}
          <div className="relative p-4 sm:p-6 pb-0">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
              {/* Обложка */}
              {release.cover_url && (
                <div className="relative group flex-shrink-0 mx-auto sm:mx-0">
                  <div className={`w-[140px] h-[140px] sm:w-[180px] sm:h-[180px] rounded-2xl overflow-hidden shadow-2xl ${isLight ? 'ring-2 ring-purple-200/50' : 'ring-2 ring-white/10 shadow-black/50'}`}>
                    <img 
                      src={release.cover_url} 
                      alt={release.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    />
                  </div>
                  {/* Кнопки скачивания обложки */}
                  <div className="absolute bottom-2 right-2 flex gap-1">
                    {/* Скачать оригинал (если есть) */}
                    {release.cover_url_original && (
                      <button
                        onClick={() => handleDownloadFile(release.cover_url_original!, `${release.title}_cover_ORIGINAL.jpg`)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 group/dl ${
                          isLight 
                            ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300' 
                            : 'bg-emerald-900/70 hover:bg-emerald-800/90 border-emerald-500/30 hover:border-emerald-400/50'
                        }`}
                        title="Скачать ОРИГИНАЛ (без сжатия)"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={`transition-colors ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`}>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                      </button>
                    )}
                    {/* Скачать сжатую */}
                    <button
                      onClick={() => handleDownloadFile(release.cover_url, `${release.title}_cover.jpg`)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 group/dl ${
                        isLight 
                          ? 'bg-white/90 hover:bg-white border-gray-200 hover:border-purple-300' 
                          : 'bg-black/70 hover:bg-black/90 border-white/10 hover:border-white/30'
                      }`}
                      title={release.cover_url_original ? "Скачать сжатую версию" : "Скачать обложку"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`transition-colors ${isLight ? 'text-gray-500 group-hover/dl:text-purple-600' : 'text-white/60 group-hover/dl:text-white'}`}>
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    </button>
                  </div>
                  {/* Бейдж "Оригинал доступен" */}
                  {release.cover_url_original && (
                    <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      isLight 
                        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                        : 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      HQ
                    </div>
                  )}
                </div>
              )}

              {/* Информация */}
              <div className="flex-1 min-w-0 pt-1 text-center sm:text-left">
                <h1 className={`text-xl sm:text-2xl md:text-3xl font-black truncate mb-1 ${isLight ? 'text-gray-800' : 'text-white'}`}>{release.title}</h1>
                <div className={`text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-1 justify-center sm:justify-start flex-wrap ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                  {/* Артисты релиза */}
                  {release.release_artists && Array.isArray(release.release_artists) && release.release_artists.length > 0 ? (
                    release.release_artists.map((artist: string, idx: number) => (
                      <span key={idx} className="flex items-center gap-1">
                        {idx > 0 && <span className={isLight ? 'text-gray-400' : 'text-zinc-500'}>&</span>}
                        <span>{artist}</span>
                      </span>
                    ))
                  ) : (
                    <span>{release.artist_name}</span>
                  )}
                </div>
                
                {/* Бейджи */}
                <div className="flex flex-wrap gap-2 mb-3 sm:mb-4 justify-center sm:justify-start">
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    release.user_role === 'basic' 
                      ? 'bg-sky-500/20 text-sky-400 ring-1 ring-sky-500/30' 
                      : 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30'
                  }`}>
                    {release.user_role === 'basic' ? 'BASIC' : 'EXCLUSIVE'}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                    release.status === 'published' ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30' :
                    release.status === 'approved' ? 'bg-violet-500/20 text-violet-400 ring-1 ring-violet-500/30' :
                    release.status === 'pending' ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30' :
                    release.status === 'rejected' ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30' :
                    release.status === 'awaiting_payment' ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/30' :
                    release.status === 'draft' ? 'bg-zinc-500/20 text-zinc-400 ring-1 ring-zinc-500/30' :
                    'bg-zinc-500/20 text-zinc-400 ring-1 ring-zinc-500/30'
                  }`}>
                    {release.status === 'published' ? 'ВЫЛОЖЕН' :
                     release.status === 'approved' ? 'ОДОБРЕН' :
                     release.status === 'pending' ? 'НА МОДЕРАЦИИ' :
                     release.status === 'rejected' ? 'ОТКЛОНЁН' :
                     release.status === 'awaiting_payment' ? 'ОЖИДАЕТ ОПЛАТЫ' :
                     release.status === 'draft' ? 'ЧЕРНОВИК' : release.status?.toUpperCase()}
                  </span>
                </div>

                {/* Мета инфо */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div className={`rounded-xl px-3 py-2 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                    <div className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Код</div>
                    <div className={`text-sm font-semibold truncate ${release.custom_id ? 'text-violet-500 font-mono' : (isLight ? 'text-gray-400' : 'text-zinc-500')}`}>
                      {release.custom_id || '—'}
                    </div>
                  </div>
                  <div className={`rounded-xl px-3 py-2 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                    <div className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Жанр</div>
                    <div className={`text-sm font-semibold truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>{release.genre}</div>
                  </div>
                  <div className={`rounded-xl px-3 py-2 ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                    <div className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Дата</div>
                    <div className={`text-sm font-semibold ${isLight ? 'text-gray-800' : 'text-white'}`}>{release.release_date ? new Date(release.release_date).toLocaleDateString('ru-RU') : '—'}</div>
                  </div>
                  <div className={`rounded-xl px-3 py-2 relative ${isLight ? 'bg-gray-100' : 'bg-white/5'}`}>
                    <div className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>UPC</div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold truncate ${release.upc ? 'text-emerald-500 font-mono' : (isLight ? 'text-gray-400' : 'text-zinc-500')}`}>
                        {release.upc || 'Не указан'}
                      </span>
                      {(release.status === 'approved' || release.status === 'published') && (
                        <button 
                          onClick={() => { setEditingReleaseUPC(true); setReleaseUPCInput(release.upc || ''); }}
                          className={`ml-auto px-2 py-1 border rounded-lg transition-all flex items-center gap-1.5 ${
                            isLight 
                              ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-violet-400 text-gray-500 hover:text-violet-600'
                              : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-violet-500/50 text-zinc-400 hover:text-violet-400'
                          }`}
                          title="Редактировать UPC"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                          <span className="text-xs font-bold hidden sm:inline">Изменить</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
                      {(release as any).spotify_link && (
                        <a href={(release as any).spotify_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 text-xs transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                          Spotify
                        </a>
                      )}
                      {(release as any).apple_music_link && (
                        <a href={(release as any).apple_music_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-pink-500/20 hover:bg-pink-500/30 rounded-lg text-pink-400 text-xs transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23.994 6.124a9.23 9.23 0 00-.24-2.19c-.317-1.31-1.062-2.31-2.18-3.043a5.022 5.022 0 00-1.877-.726 10.496 10.496 0 00-1.564-.15c-.04-.003-.083-.01-.124-.013H5.986c-.152.01-.303.017-.455.026-.747.043-1.49.123-2.193.4-1.336.53-2.3 1.452-2.865 2.78-.192.448-.292.925-.363 1.408-.056.392-.088.785-.1 1.18 0 .032-.007.062-.01.093v12.223c.01.14.017.283.027.424.05.815.154 1.624.497 2.373.65 1.42 1.738 2.353 3.234 2.801.42.127.856.187 1.293.228.555.053 1.11.06 1.667.06h11.03c.525 0 1.048-.034 1.57-.1.823-.106 1.597-.35 2.296-.81.84-.553 1.472-1.287 1.88-2.208.186-.42.293-.865.37-1.324.113-.675.138-1.358.137-2.04-.002-3.8 0-7.595-.003-11.393zm-6.423 3.99v5.712c0 .417-.058.827-.244 1.206-.29.59-.76.962-1.388 1.14-.35.1-.706.157-1.07.173-.95.042-1.8-.56-2.1-1.49-.3-.94.15-1.96 1.08-2.4.37-.18.79-.26 1.2-.33.73-.11 1.46-.21 2.18-.35.11-.02.21-.1.28-.18.05-.06.07-.16.07-.24V8.24c0-.15-.04-.19-.18-.17l-4.56.93c-.12.03-.18.08-.18.21v7.05c0 .45-.04.88-.23 1.29-.3.65-.82 1.05-1.52 1.22-.37.08-.74.13-1.12.14-.94.04-1.78-.54-2.08-1.44-.3-.9.1-1.89.98-2.32.39-.2.82-.3 1.26-.38.67-.12 1.34-.2 2-.33.21-.04.42-.13.55-.31.09-.13.12-.31.12-.47V7.82c0-.19.05-.32.23-.37l5.97-1.58c.08-.02.17-.03.25-.03.15 0 .22.08.22.25v4.03z"/></svg>
                          Apple Music
                        </a>
                      )}
                      {(release as any).youtube_link && (
                        <a href={(release as any).youtube_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 text-xs transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                          YouTube
                        </a>
                      )}
                      {(release as any).soundcloud_link && (
                        <a href={(release as any).soundcloud_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/20 hover:bg-orange-500/30 rounded-lg text-orange-400 text-xs transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M1.175 12.225c-.051 0-.094.046-.101.1l-.233 2.154.233 2.105c.007.058.05.098.101.098.05 0 .09-.04.099-.098l.255-2.105-.27-2.154c-.009-.06-.052-.1-.084-.1zm-.899 1.125c-.051 0-.1.039-.108.098l-.141 1.029.141 1.074c.008.059.057.098.108.098.049 0 .096-.039.105-.098l.159-1.074-.159-1.029c-.009-.059-.056-.098-.105-.098zm1.79-.581c-.058 0-.102.042-.11.103l-.194 1.685.194 1.72c.008.058.052.102.11.102.05 0 .092-.044.103-.103l.229-1.72-.229-1.685c-.011-.061-.053-.103-.103-.103zm.9-.369c-.063 0-.107.049-.118.111l-.167 2.054.167 2.04c.011.059.055.108.118.108.057 0 .103-.049.116-.108l.193-2.04-.193-2.054c-.013-.062-.059-.111-.116-.111zm.901-.163c-.063 0-.112.05-.121.116l-.15 2.217.15 2.188c.009.063.058.116.121.116.063 0 .108-.053.12-.116l.173-2.188-.173-2.217c-.012-.066-.057-.116-.12-.116zm.9-.163c-.063 0-.113.055-.123.12l-.125 2.38.125 2.333c.01.068.06.123.123.123.063 0 .112-.055.123-.123l.147-2.333-.147-2.38c-.011-.065-.06-.12-.123-.12zm.901-.122c-.066 0-.118.056-.127.128l-.102 2.502.102 2.479c.009.068.061.127.127.127.065 0 .118-.059.126-.127l.117-2.479-.117-2.502c-.008-.072-.061-.128-.126-.128zm2.884-.105c-.072 0-.125.063-.136.136l-.078 2.608.078 2.548c.011.073.064.136.136.136.072 0 .123-.063.134-.136l.09-2.548-.09-2.608c-.011-.073-.062-.136-.134-.136zm-.902.024c-.069 0-.12.06-.131.131l-.094 2.584.094 2.564c.011.072.062.131.131.131.071 0 .121-.059.132-.131l.107-2.564-.107-2.584c-.011-.071-.061-.131-.132-.131zm1.803-.011c-.073 0-.127.065-.137.14l-.063 2.595.063 2.574c.01.075.064.14.137.14.073 0 .125-.065.136-.14l.073-2.574-.073-2.595c-.011-.075-.063-.14-.136-.14zm.901-.021c-.074 0-.129.066-.139.143l-.051 2.616.051 2.591c.01.076.065.143.139.143.073 0 .126-.067.138-.143l.058-2.591-.058-2.616c-.012-.077-.065-.143-.138-.143zm1.897.115c-.078 0-.134.069-.144.15l-.036 2.501.036 2.466c.01.081.066.15.144.15.078 0 .133-.069.144-.15l.042-2.466-.042-2.501c-.011-.081-.066-.15-.144-.15zm-.9-.145c-.076 0-.132.068-.142.147l-.048 2.646.048 2.611c.01.079.066.147.142.147.076 0 .131-.068.142-.147l.055-2.611-.055-2.646c-.011-.079-.066-.147-.142-.147zm1.8.27c-.08 0-.137.071-.146.153l-.027 2.376.027 2.336c.009.082.066.153.146.153.079 0 .136-.071.146-.153l.031-2.336-.031-2.376c-.01-.082-.067-.153-.146-.153zm.9-.288c-.08 0-.138.072-.148.156l-.02 2.664.02 2.621c.01.084.068.156.148.156.08 0 .137-.072.147-.156l.023-2.621-.023-2.664c-.01-.084-.067-.156-.147-.156zm1.808.227c-.082 0-.141.074-.151.159l-.01 2.437.01 2.395c.01.085.069.159.151.159.082 0 .139-.074.15-.159l.012-2.395-.012-2.437c-.011-.085-.068-.159-.15-.159zm.9-.306c-.082 0-.142.076-.152.162l-.005 2.743.005 2.685c.01.086.07.162.152.162.081 0 .14-.076.151-.162l.006-2.685-.006-2.743c-.011-.086-.07-.162-.151-.162zm2.643.372c-.107-.473-.398-.91-.792-1.187-.367-.26-.79-.39-1.279-.39h-6.348c-.093 0-.17.076-.18.17v9.531c.01.098.087.17.18.17h6.348c1.54 0 2.788-1.248 2.788-2.788 0-1.129-.673-2.099-1.64-2.542.193-.384.296-.827.296-1.269 0-.577-.126-1.13-.373-1.695z"/></svg>
                          SoundCloud
                        </a>
                      )}
                      {(release as any).vk_link && (
                        <a href={(release as any).vk_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-xs transition-colors">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M15.073 2H8.937C3.333 2 2 3.333 2 8.927v6.136C2 20.667 3.333 22 8.927 22h6.136C20.667 22 22 20.667 22 15.073V8.937C22 3.333 20.667 2 15.073 2zm3.073 14.27h-1.459c-.552 0-.718-.439-1.704-1.439-.866-.828-1.229-.927-1.448-.927-.301 0-.386.086-.386.5v1.313c0 .356-.114.553-1.053.553-1.553 0-3.273-.949-4.491-2.692-1.818-2.553-2.321-4.466-2.321-4.855 0-.22.086-.428.5-.428h1.459c.373 0 .515.167.658.553.729 2.104 1.947 3.948 2.449 3.948.189 0 .271-.086.271-.561V9.26c-.057-1-.588-1.083-.588-1.439 0-.167.143-.345.372-.345h2.292c.314 0 .428.173.428.532v2.868c0 .314.143.428.229.428.188 0 .343-.114.686-.457 1.058-1.182 1.815-3.002 1.815-3.002.1-.22.272-.428.658-.428h1.459c.438 0 .531.22.438.532-.172.772-1.839 3.147-1.839 3.147-.147.239-.2.344 0 .611.143.2.615.611 .929.979.577.677 1.017 1.247 1.133 1.637.129.389-.086.588-.486.588z"/></svg>
                          VK
                        </a>
                      )}
          </div>

          {/* UPC Editor Modal */}
          {editingReleaseUPC && (
            <div className={`mx-4 sm:mx-6 mt-4 p-4 rounded-2xl backdrop-blur-sm ${
              isLight 
                ? 'bg-gradient-to-br from-violet-100 to-purple-100 border border-violet-200' 
                : 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 5h18M3 5v14a2 2 0 002 2h14a2 2 0 002-2V5M3 5l3-3h12l3 3M7 8v8M12 8v8M17 8v8"/>
                  </svg>
                </div>
                <div>
                  <h4 className={`font-bold ${isLight ? 'text-gray-800' : 'text-white'}`}>Редактировать UPC</h4>
                  <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-zinc-400'}`}>Введите 13-значный код</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={releaseUPCInput}
                  onChange={(e) => setReleaseUPCInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="0000000000000"
                  maxLength={13}
                  className={`flex-1 px-4 py-3 border-2 rounded-xl font-mono text-lg tracking-wider focus:outline-none focus:border-violet-500 transition-colors text-center sm:text-left ${
                    isLight 
                      ? 'bg-white border-gray-200 text-gray-800' 
                      : 'bg-black/50 border-white/10 text-white'
                  }`}
                  disabled={savingReleaseUPC}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button 
                    onClick={handleSaveReleaseUPC} 
                    disabled={savingReleaseUPC || !releaseUPCInput.trim()}
                    className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:from-zinc-700 disabled:to-zinc-700 text-black font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/30 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {savingReleaseUPC ? (
                      <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span>Сохранить</span>
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setEditingReleaseUPC(false)}
                    className={`px-4 py-3 rounded-xl transition-colors font-medium ${
                      isLight 
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                        : 'bg-white/10 hover:bg-white/20 text-white'
                    }`}
                  >
                    Отмена
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Авторы (Contributors) */}
          {release.contributors && release.contributors.length > 0 && (
            <div className="px-4 sm:px-6 pb-3">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
                  <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3 className={`font-bold text-sm sm:text-base ${isLight ? 'text-gray-800' : 'text-white'}`}>Авторы</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {release.contributors.map((contributor, idx) => {
                  const roleLabels: Record<string, string> = {
                    composer: 'Композитор',
                    lyricist: 'Автор слов',
                    producer: 'Продюсер',
                    arranger: 'Аранжир.',
                    performer: 'Исполнитель',
                    mixer: 'Микс',
                    mastering: 'Мастеринг',
                    other: 'Другое'
                  };
                  return (
                    <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg border ${
                      isLight 
                        ? 'bg-gray-50 border-gray-200' 
                        : 'bg-white/[0.03] border-white/5'
                    }`}>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium min-w-[80px] text-center border ${
                        isLight 
                          ? 'bg-rose-100 text-rose-600 border-rose-200' 
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/20'
                      }`}>
                        {roleLabels[contributor.role] || contributor.role}
                      </span>
                      <span className={`text-sm truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>{contributor.fullName}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Кнопки действий */}
          <div className="p-4 sm:p-6 pt-2 sm:pt-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {/* Скачать ZIP (обложка + треки) */}
              {release.tracks && release.tracks.length > 0 && (
                <button
                  onClick={handleDownloadAllTracks}
                  disabled={downloadingZip}
                  className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all hover:scale-[1.02] disabled:opacity-50 ${
                    isLight 
                      ? 'bg-violet-50 hover:bg-violet-100 border-violet-200 hover:border-violet-300 text-violet-600' 
                      : 'bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20 hover:border-violet-500/40 text-violet-400'
                  }`}
                >
                  <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  <span className="text-[10px] sm:text-xs font-bold">{downloadingZip ? 'Загрузка...' : 'Скачать ZIP'}</span>
                </button>
              )}

              {/* Редактировать */}
              <button
                onClick={() => {
                  const path = release.release_type === 'basic'
                    ? `/cabinet/release-basic/edit/${release.id}?from=admin`
                    : `/cabinet/release/edit/${release.id}?from=admin`;
                  router.push(path);
                }}
                className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all hover:scale-[1.02] ${
                  isLight 
                    ? 'bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-violet-300 text-gray-700' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-violet-500/30 text-white'
                }`}
              >
                <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                <span className="text-[10px] sm:text-xs font-bold">Редактировать</span>
              </button>

              {/* Метаданные */}
              <button
                onClick={handleDownloadMetadata}
                className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all hover:scale-[1.02] ${
                  isLight 
                    ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 hover:border-emerald-300 text-emerald-600' 
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400'
                }`}
              >
                <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M9 3v18M3 9h18M3 15h18"/>
                </svg>
                <span className="text-[10px] sm:text-xs font-bold">Метаданные</span>
              </button>

              {/* Удалить */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className={`flex flex-col items-center gap-1.5 sm:gap-2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all hover:scale-[1.02] ${
                  isLight 
                    ? 'bg-red-50 hover:bg-red-100 border-red-200 hover:border-red-300 text-red-600' 
                    : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/20 hover:border-red-500/40 text-red-400'
                }`}
              >
                <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
                <span className="text-[10px] sm:text-xs font-bold">Удалить</span>
              </button>
            </div>

            {/* Дополнительные кнопки по статусу */}
            {release.status === 'pending' && (
              <div className="mt-3 sm:mt-4 flex flex-col gap-2 sm:gap-3">
                {/* Предупреждение о неверифицированной оплате */}
                {release.user_role === 'basic' && (release as any).payment_status !== 'verified' && (
                  <div className={`flex items-center gap-2 p-3 border rounded-xl text-sm ${
                    isLight 
                      ? 'bg-amber-50 border-amber-200 text-amber-700' 
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  }`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span>Оплата не верифицирована. Утвердите оплату перед одобрением релиза.</span>
                  </div>
                )}
                <button
                  onClick={onApprove}
                  disabled={release.user_role === 'basic' && (release as any).payment_status !== 'verified'}
                  className="flex-1 flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 disabled:from-zinc-700 disabled:to-zinc-600 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold transition-all shadow-lg shadow-emerald-600/25 disabled:shadow-none"
                  title={release.user_role === 'basic' && (release as any).payment_status !== 'verified' ? 'Сначала верифицируйте оплату' : 'Утвердить релиз'}
                >
                  <svg width="20" height="20" className="sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  УТВЕРДИТЬ
                </button>
              </div>
            )}

            {release.status === 'pending' && (
              <div className={`mt-2 sm:mt-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
                isLight 
                  ? 'bg-gray-50 border-gray-200' 
                  : 'bg-white/5 border-white/5'
              }`}>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Причина отклонения..."
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border rounded-lg sm:rounded-xl text-sm sm:text-base focus:outline-none focus:border-red-500/50 resize-none ${
                    isLight 
                      ? 'bg-white border-gray-200 text-gray-800 placeholder:text-gray-400' 
                      : 'bg-black/50 border-white/10 text-white placeholder:text-zinc-600'
                  }`}
                  rows={2}
                />
                <button
                  onClick={onReject}
                  disabled={!rejectionReason.trim()}
                  className={`mt-2 w-full flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl disabled:opacity-30 text-sm sm:text-base font-bold transition-all border ${
                    isLight 
                      ? 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600' 
                      : 'bg-red-500/20 hover:bg-red-500/30 border-red-500/20 text-red-400'
                  }`}
                >
                  <svg width="16" height="16" className="sm:w-[18px] sm:h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  ОТКЛОНИТЬ
                </button>
              </div>
            )}

            {/* Переключатель публикации - НЕ показываем для awaiting_payment */}
            {(release.status === 'approved' || release.status === 'published' || release.status === 'distributed') && (
              <div className="mt-3 sm:mt-4">
                <button
                  onClick={() => handleTogglePublished()}
                  className={`w-full flex items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl text-sm sm:text-base font-bold transition-all ${
                    release.status === 'published'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white border-0 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  {release.status === 'published' ? (
                    <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  )}
                  {release.status === 'published' ? 'СНЯТЬ С ПУБЛИКАЦИИ' : 'ВЫЛОЖИТЬ'}
                </button>
              </div>
            )}

            {/* Статус оплаты (новая система) */}
            {release.user_role === 'basic' && (
              <div className={`mt-3 sm:mt-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border ${
                (release as any).is_paid 
                  ? 'bg-gradient-to-br from-emerald-500/10 to-green-500/5 border-emerald-500/20'
                  : 'bg-gradient-to-br from-amber-500/10 to-orange-500/5 border-amber-500/20'
              }`}>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ${
                    (release as any).is_paid 
                      ? 'bg-gradient-to-br from-emerald-500/30 to-green-500/20 text-emerald-400 shadow-emerald-500/20'
                      : 'bg-gradient-to-br from-amber-500/30 to-orange-500/20 text-amber-400 shadow-amber-500/20'
                  }`}>
                    {(release as any).is_paid ? (
                      <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" className="sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className={`font-bold text-sm sm:text-base ${(release as any).is_paid ? 'text-emerald-300' : 'text-amber-300'}`}>
                      {(release as any).is_paid ? 'Оплачено' : 'Ожидает оплаты'}
                    </div>
                    {(release as any).is_paid && (release as any).payment_amount && (
                      <div className="text-xs sm:text-sm text-emerald-400/80 font-medium">
                        Сумма: {(release as any).payment_amount} ₽
                      </div>
                    )}
                    {(release as any).is_paid && (release as any).payment_transaction_id && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText((release as any).payment_transaction_id);
                          const btn = document.activeElement as HTMLButtonElement;
                          if (btn) {
                            const originalText = btn.innerHTML;
                            btn.innerHTML = '<span class="text-emerald-400">✓ Скопировано!</span>';
                            setTimeout(() => { btn.innerHTML = originalText; }, 1500);
                          }
                        }}
                        className="text-[10px] sm:text-xs text-zinc-500 font-mono mt-0.5 flex items-center gap-1 hover:text-emerald-400 transition-colors cursor-pointer"
                        title="Нажмите для копирования полного ID"
                      >
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"/>
                          <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"/>
                        </svg>
                        ID: {(release as any).payment_transaction_id.slice(0, 8)}...
                      </button>
                    )}
                    {(release as any).is_paid && (release as any).paid_at && (
                      <div className="text-[10px] sm:text-xs text-zinc-500 mt-0.5">
                        {new Date((release as any).paid_at).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Фокус-трек и промо-материалы */}
          {((release as any).focus_track || (release as any).album_description || ((release as any).promo_photos && (release as any).promo_photos.length > 0)) && (
            <div className="px-4 sm:px-6 pb-3">
              <div className="flex items-center gap-2 sm:gap-3 mb-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-orange-400">
                  <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </div>
                <h3 className={`font-bold text-sm sm:text-base ${isLight ? 'text-gray-800' : 'text-white'}`}>Промо-материалы</h3>
              </div>
              
              <div className="space-y-2">
                {/* Фокус-трек */}
                {(release as any).focus_track && (() => {
                  const releaseTracks = release.tracks || [];
                  const focusTrackIndex = releaseTracks.findIndex((t: any) => t.title === (release as any).focus_track);
                  const focusTrackData = focusTrackIndex !== -1 ? releaseTracks[focusTrackIndex] : null;
                  const trackNumber = focusTrackIndex !== -1 ? focusTrackIndex + 1 : null;
                  return (
                    <div className={`rounded-xl px-3 py-2 border ${
                      isLight 
                        ? 'bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200' 
                        : 'bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/20'
                    }`}>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className={isLight ? 'text-violet-500' : 'text-violet-400'}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          <span className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-violet-600' : 'text-violet-400'}`}>Фокус</span>
                        </div>
                        {trackNumber && (
                          <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                            isLight 
                              ? 'bg-violet-100 text-violet-600' 
                              : 'bg-violet-500/30 text-violet-300'
                          }`}>
                            {trackNumber}
                          </span>
                        )}
                        <span className={`text-sm font-bold truncate flex-1 ${isLight ? 'text-gray-800' : 'text-white'}`}>{(release as any).focus_track}</span>
                      </div>
                      {(release as any).focus_track_promo && (
                        <div className={`text-xs mt-1 line-clamp-2 pl-5 ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{(release as any).focus_track_promo}</div>
                      )}
                      {/* Текст фокус-трека */}
                      {focusTrackData?.lyrics && (
                        <details className={`mt-2 pt-2 border-t ${isLight ? 'border-violet-200' : 'border-violet-500/20'}`}>
                          <summary className={`cursor-pointer text-[10px] flex items-center gap-1.5 ${
                            isLight ? 'text-violet-600 hover:text-violet-700' : 'text-violet-400 hover:text-violet-300'
                          }`}>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                            Текст песни
                          </summary>
                          <div className="mt-2">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(focusTrackData.lyrics || '');
                                const btn = document.activeElement as HTMLButtonElement;
                                if (btn) {
                                  const originalText = btn.innerHTML;
                                  btn.innerHTML = '✓ Скопировано';
                                  setTimeout(() => { btn.innerHTML = originalText; }, 1500);
                                }
                              }}
                              className={`mb-2 flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-all ${
                                isLight 
                                  ? 'text-violet-600 hover:text-violet-800 bg-violet-100 hover:bg-violet-200' 
                                  : 'text-violet-400 hover:text-white bg-violet-500/10 hover:bg-violet-500/20'
                              }`}
                            >
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                              </svg>
                              Копировать текст
                            </button>
                            <pre className={`text-[11px] whitespace-pre-wrap font-sans max-h-[150px] overflow-y-auto ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                              {focusTrackData.lyrics}
                            </pre>
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })()}
                
                {/* Описание альбома */}
                {(release as any).album_description && (
                  <div className={`rounded-xl px-3 py-2 border ${
                    isLight 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className={`text-[10px] uppercase tracking-wider mb-1 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Описание</div>
                    <div className={`text-xs line-clamp-3 ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>{(release as any).album_description}</div>
                  </div>
                )}
                
                {/* Промо-фото */}
                {(release as any).promo_photos && (release as any).promo_photos.length > 0 && (
                  <div className={`rounded-xl px-3 py-2 border ${
                    isLight 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-white/5 border-white/10'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>Промо-фото ({(release as any).promo_photos.length})</div>
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          // Скачиваем все промо-фото через открытие ссылок
                          const photos = (release as any).promo_photos as string[];
                          const safeTitle = release.title.replace(/[\\/:*?"<>|]+/g, '_');
                          
                          let successCount = 0;
                          for (let i = 0; i < photos.length; i++) {
                            try {
                              // Используем fetch через no-cors или напрямую для Supabase URLs
                              const response = await fetch(photos[i], { mode: 'cors' });
                              if (!response.ok) {
                                // Fallback: открываем ссылку напрямую
                                window.open(photos[i], '_blank');
                                successCount++;
                                continue;
                              }
                              const blob = await response.blob();
                              const ext = photos[i].split('.').pop()?.split('?')[0] || 'jpg';
                              const downloadUrl = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = downloadUrl;
                              link.download = `${safeTitle}_Promo_${i + 1}.${ext}`;
                              link.style.display = 'none';
                              document.body.appendChild(link);
                              // Используем setTimeout для обхода блокировки браузера
                              await new Promise<void>((resolve) => {
                                setTimeout(() => {
                                  link.click();
                                  resolve();
                                }, 100);
                              });
                              document.body.removeChild(link);
                              setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
                              successCount++;
                              // Задержка между скачиваниями для браузера
                              if (i < photos.length - 1) {
                                await new Promise(r => setTimeout(r, 1000));
                              }
                            } catch (err) {
                              console.error(`Ошибка скачивания промо ${i + 1}:`, err);
                              // Fallback: открываем ссылку напрямую
                              window.open(photos[i], '_blank');
                              successCount++;
                            }
                          }
                          if (successCount > 0) {
                            showSuccessToast(`Скачано ${successCount} промо-фото`);
                          }
                        }}
                        className={`text-[10px] flex items-center gap-1 transition-colors ${
                          isLight ? 'text-violet-600 hover:text-violet-700' : 'text-violet-400 hover:text-violet-300'
                        }`}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="7 10 12 15 17 10"/>
                          <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                        Скачать все
                      </button>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {(release as any).promo_photos.map((photo: string, idx: number) => (
                        <div key={idx} className="flex-shrink-0 relative group">
                          <a href={photo} target="_blank" rel="noopener noreferrer">
                            <img src={photo} alt={`Промо ${idx + 1}`} className={`w-16 h-16 object-cover rounded-lg border transition-colors ${
                              isLight ? 'border-gray-200 hover:border-violet-400' : 'border-white/10 hover:border-violet-500/50'
                            }`} />
                          </a>
                          <a
                            href={photo}
                            download={`${release.title.replace(/[\\/:*?"<>|]+/g, '_')}_Promo_${idx + 1}.jpg`}
                            onClick={(e) => {
                              e.stopPropagation();
                              // Показываем уведомление
                              showSuccessToast('Промо-фото открыто');
                            }}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`absolute bottom-1 right-1 w-5 h-5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                              isLight ? 'bg-white/90 hover:bg-white' : 'bg-black/70 hover:bg-black/90'
                            }`}
                            title="Скачать"
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isLight ? '#6d28d9' : 'white'} strokeWidth="2">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                              <polyline points="7 10 12 15 17 10"/>
                              <line x1="12" y1="15" x2="12" y2="3"/>
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Треклист */}
          {release.tracks && release.tracks.length > 0 && (
            <div className="px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-violet-500/20 flex items-center justify-center text-violet-400">
                  <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18V5l12-2v13"/>
                    <circle cx="6" cy="18" r="3"/>
                    <circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
                <h3 className={`font-bold text-sm sm:text-base ${isLight ? 'text-gray-800' : 'text-white'}`}>Треклист ({release.tracks.length})</h3>
              </div>
              
              <div className="space-y-2">
                {release.tracks.map((track: any, idx: number) => (
                  <TrackItem
                    key={idx}
                    track={track}
                    index={idx}
                    releaseId={release.id}
                    releaseType={release.release_type}
                    releaseStatus={release.status}
                    coverUrl={release.cover_url}
                    supabase={supabase}
                    editingISRC={editingTrackISRC}
                    setEditingISRC={setEditingTrackISRC}
                    savingISRC={savingISRC}
                    onSaveISRC={handleSaveTrackISRC}
                    onDownload={() => handleDownloadTrack(idx, track.title)}
                    isLight={isLight}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Страны и Платформы - сворачиваемые секции */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 space-y-2 sm:space-y-3">
            {/* Платформы */}
            {release.platforms && release.platforms.length > 0 && (
              <details className="group/platforms">
                <summary className={`flex items-center gap-2 sm:gap-3 cursor-pointer list-none p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-colors ${
                  isLight 
                    ? 'bg-gray-50 hover:bg-gray-100 border-gray-200' 
                    : 'bg-white/5 hover:bg-white/[0.07] border-white/5'
                }`}>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
                      <line x1="12" y1="17" x2="12" y2="21"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium text-xs sm:text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>Платформы</span>
                    <span className={`ml-1.5 sm:ml-2 text-[10px] sm:text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>({release.platforms.length})</span>
                  </div>
                  <svg width="14" height="14" className={`sm:w-4 sm:h-4 group-open/platforms:rotate-180 transition-transform ${isLight ? 'text-gray-400' : 'text-zinc-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </summary>
                <div className={`mt-1.5 sm:mt-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border ${
                  isLight 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-black/30 border-white/5'
                }`}>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {release.platforms.map((platform: string, idx: number) => (
                      <span key={idx} className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] sm:text-xs text-emerald-400">
                        {platform}
                      </span>
                    ))}
                  </div>
                </div>
              </details>
            )}

            {/* Страны */}
            {release.countries && release.countries.length > 0 && (
              <details className="group/countries">
                <summary className={`flex items-center gap-2 sm:gap-3 cursor-pointer list-none p-2.5 sm:p-3 rounded-lg sm:rounded-xl border transition-colors ${
                  isLight 
                    ? 'bg-gray-50 hover:bg-gray-100 border-gray-200' 
                    : 'bg-white/5 hover:bg-white/[0.07] border-white/5'
                }`}>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
                    <svg width="14" height="14" className="sm:w-4 sm:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <span className={`font-medium text-xs sm:text-sm ${isLight ? 'text-gray-800' : 'text-white'}`}>Страны</span>
                    <span className={`ml-1.5 sm:ml-2 text-[10px] sm:text-xs ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>({release.countries.length})</span>
                  </div>
                  <svg width="14" height="14" className={`sm:w-4 sm:h-4 group-open/countries:rotate-180 transition-transform ${isLight ? 'text-gray-400' : 'text-zinc-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </summary>
                <div className={`mt-1.5 sm:mt-2 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border ${
                  isLight 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-black/30 border-white/5'
                }`}>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 max-h-[150px] sm:max-h-[200px] overflow-y-auto scrollbar-hide">
                    {release.countries.map((country: string, idx: number) => (
                      <span key={idx} className={`px-2 sm:px-2.5 py-0.5 sm:py-1 border rounded text-[10px] sm:text-xs ${
                        isLight 
                          ? 'bg-sky-50 border-sky-200 text-sky-600' 
                          : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                      }`}>
                        {country}
                      </span>
                    ))}
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// ============================================================================
// КОМПАКТНЫЙ ПЛЕЕР ТРЕКА
// ============================================================================
function TrackItem({ track, index, releaseId, releaseType, releaseStatus, coverUrl, supabase, editingISRC, setEditingISRC, savingISRC, onSaveISRC, onDownload, isLight }: any) {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [volume, setVolume] = React.useState(0.15);
  const [isMuted, setIsMuted] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false); // Новое состояние для раскрытия
  const [copiedId, setCopiedId] = React.useState<string | null>(null); // Для эффекта копирования
  const maxVolume = 0.5; // Ограничение максимальной громкости
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const progressRef = React.useRef<HTMLDivElement | null>(null);
  const animationRef = React.useRef<number | null>(null);

  // Функция копирования с эффектом
  const copyWithFeedback = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const formatTime = (sec: number) => {
    if (!sec || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Плавное обновление прогресса через requestAnimationFrame
  const updateProgress = React.useCallback(() => {
    if (audioRef.current && isPlaying) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  }, [isPlaying]);

  React.useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(updateProgress);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, updateProgress]);

  // Volume handlers
  const handleVolumeChange = (newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    // Применяем масштабирование для комфортной громкости
    if (audioRef.current) audioRef.current.volume = clampedVolume * maxVolume;
    if (clampedVolume > 0 && isMuted) setIsMuted(false);
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume * maxVolume;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const loadAudio = async () => {
    if (audioRef.current && audioUrl) return audioRef.current;
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${index}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка загрузки');
      const blob = await res.blob();
      if (!blob.size) throw new Error('Пустой файл');
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      const audio = new Audio(url);
      audio.volume = isMuted ? 0 : volume * maxVolume;
      audioRef.current = audio;
      audio.onloadedmetadata = () => setDuration(audio.duration);
      audio.onended = () => { setIsPlaying(false); setCurrentTime(0); };
      audio.onerror = () => setError('Ошибка');
      audio.addEventListener('pause', () => setIsPlaying(false));
      audio.addEventListener('play', () => setIsPlaying(true));
      await new Promise<void>((resolve) => {
        audio.oncanplaythrough = () => resolve();
        setTimeout(resolve, 2000);
      });
      return audio;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Слушаем глобальный event для остановки всех треков (НЕ сбрасываем позицию)
  React.useEffect(() => {
    const handleStopAll = () => {
      if (audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };
    window.addEventListener(ADMIN_STOP_ALL_AUDIO_EVENT, handleStopAll);
    return () => window.removeEventListener(ADMIN_STOP_ALL_AUDIO_EVENT, handleStopAll);
  }, []);

  // Остановка аудио при переключении вкладки браузера
  React.useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && audioRef.current && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const handlePlayPause = async () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }
    
    // Сначала останавливаем СВОЙ трек если есть
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
    }
    
    // Останавливаем ВСЕ треки через глобальный event
    stopAllAdminAudio();
    await new Promise(r => setTimeout(r, 100));
    
    let audio = audioRef.current || await loadAudio();
    if (!audio) return;
    
    // Еще раз останавливаем всех перед воспроизведением
    stopAllAdminAudio();
    await new Promise(r => setTimeout(r, 50));
    
    try {
      await audio.play();
      setIsPlaying(true);
    } catch (e: any) {
      if (e.name !== 'AbortError') setError('Ошибка');
    }
  };

  // Seek by position
  const seekToPosition = (clientX: number) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const newTime = pct * duration;
    setCurrentTime(newTime);
    if (audioRef.current) audioRef.current.currentTime = newTime;
  };

  // Click to seek
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    seekToPosition(e.clientX);
  };

  // Drag start
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    seekToPosition(e.clientX);
  };

  // Drag handlers
  React.useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      seekToPosition(e.clientX);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`/api/stream-audio?releaseId=${releaseId}&releaseType=${releaseType}&trackIndex=${index}`, {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
      });
      if (!res.ok) throw new Error('Ошибка');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const name = (track.title || `track_${index + 1}`).replace(/[\\/:*?"<>|]+/g, '_');
      const ext = blob.type.includes('wav') ? 'wav' : blob.type.includes('flac') ? 'flac' : 'audio';
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { setError('Ошибка скачивания'); }
    finally { setDownloading(false); }
  };

  React.useEffect(() => () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  }, [audioUrl]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Клик по карточке раскрывает инфо (но не по кнопкам и плееру)
  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    // Не раскрываем если клик по кнопкам, инпутам или элементам плеера
    if (tagName === 'button' || tagName === 'input' || tagName === 'svg' || tagName === 'path' || tagName === 'polygon' || tagName === 'line') return;
    if (target.closest('button') || target.closest('input') || target.closest('[data-player-control]')) return;
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`group rounded-xl p-2 sm:p-3 transition-all ring-1 cursor-pointer ${
        isLight 
          ? 'bg-gray-50 hover:bg-gray-100 ring-gray-200 hover:ring-gray-300' 
          : 'bg-white/[0.02] hover:bg-white/[0.04] ring-white/5 hover:ring-white/10'
      }`}
      onClick={handleCardClick}
    >
      {/* ===== МОБИЛЬНАЯ ВЕРСИЯ ===== */}
      <div className="sm:hidden">
        {/* Строка 1: Номер + Обложка + Название */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium tabular-nums w-4 text-right flex-shrink-0 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
            {index + 1}
          </span>
          
          {/* Обложка с Play */}
          <button
            onClick={handlePlayPause}
            disabled={loading}
            className={`relative flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden transition-all ${
              isPlaying 
                ? 'ring-2 ring-violet-500 shadow-lg shadow-violet-500/30' 
                : isLight ? 'ring-1 ring-gray-200' : 'ring-1 ring-white/10'
            }`}
          >
            {coverUrl ? (
              <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-700" />
            )}
            <div className={`absolute inset-0 flex items-center justify-center ${
              loading ? 'bg-black/70' : error ? 'bg-red-500/30' : isPlaying ? 'bg-black/50' : 'bg-black/40'
            }`}>
              {loading ? (
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : error ? (
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" className="text-red-400">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              ) : isPlaying ? (
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" className="text-white">
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                </svg>
              ) : (
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 24 24" className="text-white ml-0.5">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </div>
          </button>

          {/* Название и инфо */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className={`text-sm font-medium truncate ${isLight ? 'text-gray-800' : 'text-white'}`}>{track.title}</h4>
              {!track.isInstrumental && track.hasDrugs && (
                <span className="inline-flex items-center justify-center w-4 h-4 bg-red-500/20 text-red-400 text-[8px] font-bold rounded border border-red-500/40 flex-shrink-0">
                  E
                </span>
              )}
            </div>
            {/* Продюсеры и фиты в одну строку */}
            <div className="flex items-center gap-1.5 mt-0.5 text-[10px]">
              {track.producers && Array.isArray(track.producers) && track.producers.filter((p: string) => p?.trim()).length > 0 && (
                <span className={`truncate max-w-[80px] ${isLight ? 'text-blue-600/70' : 'text-blue-400/70'}`}>
                  prod. {track.producers.filter((p: string) => p?.trim()).slice(0, 2).join(', ')}
                </span>
              )}
              {track.featuring && Array.isArray(track.featuring) && track.featuring.filter((f: string) => f?.trim()).length > 0 && (
                <span className={`truncate max-w-[80px] ${isLight ? 'text-pink-600/70' : 'text-pink-400/70'}`}>
                  ft. {track.featuring.filter((f: string) => f?.trim()).slice(0, 2).join(', ')}
                </span>
              )}
            </div>
          </div>

          {/* Кнопки справа */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/5 text-zinc-400'
              }`}
            >
              {downloading ? (
                <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
              ) : (
                <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                isExpanded 
                  ? 'bg-violet-500/20 text-violet-400' 
                  : isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/5 text-zinc-400'
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              >
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Строка 2: Volume + Progress */}
        <div className="flex items-center gap-2 mt-2 pl-6">
          {/* Mute button */}
          <button onClick={toggleMute} className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
            isLight ? 'bg-gray-100 text-gray-500' : 'bg-white/5 text-zinc-400'
          }`}>
            {isMuted || volume === 0 ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <line x1="23" y1="9" x2="17" y2="15"/>
                <line x1="17" y1="9" x2="23" y2="15"/>
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            )}
          </button>
          
          {/* Volume slider */}
          <div className={`relative w-12 h-1 rounded-full flex-shrink-0 ${isLight ? 'bg-gray-200' : 'bg-white/10'}`}>
            <div className="absolute inset-y-0 left-0 bg-violet-500 rounded-full" style={{ width: `${(isMuted ? 0 : volume) * 100}%` }} />
            <input type="range" min="0" max="1" step="0.01" value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Progress bar */}
          <div 
            ref={progressRef}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            className={`flex-1 h-1 rounded-full cursor-pointer relative ${isLight ? 'bg-gray-200' : 'bg-white/10'}`}
          >
            <div className="absolute inset-y-0 left-0 bg-violet-500 rounded-full" style={{ width: `${progress}%` }} />
          </div>
          
          <span className={`text-[9px] font-mono flex-shrink-0 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* ===== ДЕСКТОП ВЕРСИЯ ===== */}
      <div className="hidden sm:block">
        <div className="flex items-center gap-3">
          {/* Номер трека */}
          <span className={`text-sm font-medium tabular-nums w-5 text-right flex-shrink-0 transition-colors ${
            isLight ? 'text-gray-500 group-hover:text-gray-600' : 'text-zinc-500 group-hover:text-zinc-400'
          }`}>
            {index + 1}
          </span>
          
          {/* Обложка с кнопкой Play/Pause */}
          <button
            onClick={handlePlayPause}
            disabled={loading}
            className={`relative flex-shrink-0 w-11 h-11 rounded-lg overflow-hidden transition-all ${
              isPlaying 
                ? 'ring-2 ring-violet-500 shadow-lg shadow-violet-500/30' 
                : isLight 
                  ? 'ring-1 ring-gray-200 hover:ring-violet-400' 
                  : 'ring-1 ring-white/10 hover:ring-violet-500/50'
            }`}
          >
            {coverUrl ? (
              <img src={coverUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-600 to-purple-700" />
            )}
            {/* Overlay */}
            <div className={`absolute inset-0 flex items-center justify-center transition-all ${
              loading ? 'bg-black/70' : error ? 'bg-red-500/30' : isPlaying ? 'bg-black/50' : 'bg-black/40 hover:bg-black/60'
            }`}>
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : error ? (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-red-400">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                </svg>
              ) : isPlaying ? (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-white">
                  <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
                </svg>
              ) : (
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="text-white ml-0.5">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </div>
          </button>

          {/* Инфо и прогресс */}
          <div className="flex-1 min-w-0">
            {/* Строка 1: Название + prod. + feat. + E */}
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className={`text-sm font-medium truncate max-w-[280px] ${isLight ? 'text-gray-800' : 'text-white'}`}>{track.title}</h4>
              {/* Продюсеры после названия - только если есть */}
              {track.producers && Array.isArray(track.producers) && track.producers.filter((p: string) => p?.trim()).length > 0 && (
                <span className={`text-xs truncate max-w-[150px] ${isLight ? 'text-blue-600/70' : 'text-blue-400/70'}`}>
                  prod. {track.producers.filter((p: string) => p?.trim()).join(', ')}
                </span>
              )}
              {/* Фиты после продюсеров - только если есть */}
              {track.featuring && Array.isArray(track.featuring) && track.featuring.filter((f: string) => f?.trim()).length > 0 && (
                <span className={`text-xs truncate max-w-[150px] ${isLight ? 'text-pink-600/70' : 'text-pink-400/70'}`}>
                  feat. {track.featuring.filter((f: string) => f?.trim()).join(', ')}
                </span>
              )}
              {/* Explicit - в конце строки */}
              {!track.isInstrumental && track.hasDrugs && (
                <span className="inline-flex items-center justify-center w-[16px] h-[16px] bg-red-500/20 text-red-400 text-[9px] font-bold rounded border border-red-500/40 leading-none flex-shrink-0">
                  E
                </span>
              )}
            </div>
            
            {/* Прогресс бар */}
            <div className="flex items-center gap-2">
              <div 
                ref={progressRef}
                onClick={handleClick}
                onMouseDown={handleMouseDown}
                data-player-control="true"
                className={`flex-1 h-1 rounded-full cursor-pointer relative group/bar select-none ${
                  isDragging ? 'cursor-grabbing' : ''
                } ${isLight ? 'bg-gray-200' : 'bg-white/10'}`}
              >
                <div 
                  className="absolute inset-y-0 left-0 bg-violet-500 rounded-full"
                  style={{ width: `${progress}%`, transition: isDragging || isPlaying ? 'none' : 'width 0.1s' }}
                />
                <div 
                  className={`absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md shadow-black/50 transition-opacity pointer-events-none ${isDragging ? 'opacity-100 scale-110' : 'opacity-0 group-hover/bar:opacity-100'}`}
                  style={{ left: `calc(${progress}% - 5px)` }}
                />
              </div>
              <span className={`text-[10px] font-mono w-[70px] text-right select-none flex-shrink-0 ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume Control - inline horizontal */}
          <div className="flex items-center gap-1.5 flex-shrink-0 group/volume" data-player-control="true">
            <button
              onClick={toggleMute}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                isLight 
                  ? 'bg-gray-100 hover:bg-violet-100 text-gray-500 hover:text-violet-600' 
                  : 'bg-white/5 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400'
              }`}
              title={isMuted ? 'Включить звук' : 'Выключить звук'}
            >
              {isMuted || volume === 0 ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <line x1="23" y1="9" x2="17" y2="15"/>
                  <line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              ) : volume < 0.5 ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                </svg>
              )}
            </button>
            {/* Horizontal volume slider */}
            <div className={`relative w-14 h-1.5 rounded-full cursor-pointer ${isLight ? 'bg-gray-200 group-hover/volume:bg-gray-300' : 'bg-white/10 group-hover/volume:bg-white/15'}`}>
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md opacity-0 group-hover/volume:opacity-100 pointer-events-none"
                style={{ left: `calc(${(isMuted ? 0 : volume) * 100}% - 5px)` }}
              />
            </div>
          </div>

          {/* Скачать */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              isLight 
                ? 'bg-gray-100 hover:bg-emerald-100 text-gray-500 hover:text-emerald-600' 
                : 'bg-white/5 hover:bg-emerald-500/20 text-zinc-400 hover:text-emerald-400'
            }`}
            title="Скачать оригинал"
          >
            {downloading ? (
              <div className="w-3 h-3 border border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
            ) : (
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
              </svg>
            )}
          </button>

          {/* Кнопка "Подробнее" */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex-shrink-0 w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
              isExpanded 
                ? 'bg-violet-500/20 text-violet-400' 
                : isLight 
                  ? 'bg-gray-100 hover:bg-violet-100 text-gray-500 hover:text-violet-600'
                  : 'bg-white/5 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400'
            }`}
            title={isExpanded ? 'Свернуть' : 'Подробнее'}
          >
            <svg 
              width="14" height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Раскрывающаяся панель с полной информацией */}
      {isExpanded && (
        <div className={`mt-3 pt-3 border-t space-y-3 animate-fade-in ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
          {/* ISRC с красивой обводкой */}
          {track.isrc && (
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-lg border text-xs font-mono tracking-wider ${
                isLight 
                  ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 text-emerald-600' 
                  : 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400/90'
              }`}>
                ISRC: {track.isrc}
              </span>
            </div>
          )}

          {/* Продюсеры и фиты - с красивыми лейблами */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Продюсеры */}
            {track.producers && Array.isArray(track.producers) && track.producers.filter((p: string) => p?.trim()).length > 0 && (
              <button
                onClick={() => copyWithFeedback(track.producers.filter((p: string) => p?.trim()).join(', '), `prod-${index}`)}
                className={`group/prod flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  copiedId === `prod-${index}` 
                    ? isLight ? 'bg-emerald-100 border-emerald-300 scale-105' : 'bg-emerald-500/20 border-emerald-500/40 scale-105' 
                    : isLight ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300' : 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/40'
                }`}
                title="Нажмите чтобы скопировать"
              >
                <span className={`text-[10px] font-semibold uppercase ${
                  copiedId === `prod-${index}` 
                    ? isLight ? 'text-emerald-600' : 'text-emerald-400' 
                    : isLight ? 'text-blue-600' : 'text-blue-400'
                }`}>
                  {copiedId === `prod-${index}` ? '✓' : 'Prod.'}
                </span>
                <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                  {track.producers.filter((p: string) => p?.trim()).join(', ')}
                </span>
                <svg className={`w-3 h-3 flex-shrink-0 ${copiedId === `prod-${index}` ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-gray-400 hidden group-hover/prod:block' : 'text-zinc-500 hidden group-hover/prod:block')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {copiedId === `prod-${index}` ? (
                    <polyline points="20 6 9 17 4 12"/>
                  ) : (
                    <>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </>
                  )}
                </svg>
              </button>
            )}
            {/* Фиты */}
            {track.featuring && Array.isArray(track.featuring) && track.featuring.filter((f: string) => f?.trim()).length > 0 && (
              <button
                onClick={() => copyWithFeedback(track.featuring.filter((f: string) => f?.trim()).join(', '), `feat-${index}`)}
                className={`group/feat flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  copiedId === `feat-${index}` 
                    ? isLight ? 'bg-emerald-100 border-emerald-300 scale-105' : 'bg-emerald-500/20 border-emerald-500/40 scale-105' 
                    : isLight ? 'bg-pink-50 border-pink-200 hover:bg-pink-100 hover:border-pink-300' : 'bg-pink-500/10 border-pink-500/20 hover:bg-pink-500/20 hover:border-pink-500/40'
                }`}
                title="Нажмите чтобы скопировать"
              >
                <span className={`text-[10px] font-semibold uppercase ${
                  copiedId === `feat-${index}` 
                    ? isLight ? 'text-emerald-600' : 'text-emerald-400' 
                    : isLight ? 'text-pink-600' : 'text-pink-400'
                }`}>
                  {copiedId === `feat-${index}` ? '✓' : 'Feat.'}
                </span>
                <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>
                  {track.featuring.filter((f: string) => f?.trim()).join(', ')}
                </span>
                <svg className={`w-3 h-3 flex-shrink-0 ${copiedId === `feat-${index}` ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-gray-400 hidden group-hover/feat:block' : 'text-zinc-500 hidden group-hover/feat:block')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {copiedId === `feat-${index}` ? (
                    <polyline points="20 6 9 17 4 12"/>
                  ) : (
                    <>
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                    </>
                  )}
                </svg>
              </button>
            )}
            {/* Авторы - каждый отдельно с иконкой и копированием */}
            {track.authors && Array.isArray(track.authors) && track.authors.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {(track.authors as TrackAuthor[]).map((author, idx) => {
                  const roleInfo = TRACK_AUTHOR_ROLES.find(r => r.value === author.role);
                  const roleLabel = roleInfo?.label || author.role;
                  const roleLabelRu = roleInfo?.labelRu || author.role;
                  const authorCopyId = `author-${index}-${idx}`;
                  const isCopied = copiedId === authorCopyId;
                  return (
                    <button
                      key={idx}
                      onClick={() => copyWithFeedback(author.fullName, authorCopyId)}
                      className={`group/author flex items-center gap-1.5 px-2 py-1 rounded-lg border transition-all cursor-pointer ${
                        isCopied 
                          ? isLight ? 'bg-emerald-100 border-emerald-300 scale-105' : 'bg-emerald-500/20 border-emerald-500/40 scale-105' 
                          : isLight ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300' : 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20 hover:border-amber-500/40'
                      }`}
                      title={`${roleLabelRu} — нажмите чтобы скопировать`}
                    >
                      <svg className={`w-3 h-3 flex-shrink-0 ${isCopied ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-amber-500' : 'text-amber-400')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {isCopied ? (
                          <polyline points="20 6 9 17 4 12"/>
                        ) : (
                          <>
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                          </>
                        )}
                      </svg>
                      <span className={`text-xs font-medium ${isLight ? 'text-gray-700' : 'text-zinc-300'}`}>{author.fullName}</span>
                      <span className={`text-[10px] leading-none ${isCopied ? (isLight ? 'text-emerald-600/70' : 'text-emerald-400/70') : (isLight ? 'text-amber-600/70' : 'text-amber-400/70')}`}>({roleLabel})</span>
                      <svg className={`w-3 h-3 flex-shrink-0 ${isCopied ? (isLight ? 'text-emerald-600' : 'text-emerald-400') : (isLight ? 'text-gray-400 hidden group-hover/author:block' : 'text-zinc-500 hidden group-hover/author:block')}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {isCopied ? (
                          <polyline points="20 6 9 17 4 12"/>
                        ) : (
                          <>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                          </>
                        )}
                      </svg>
                    </button>
                  );
                })}
              </div>
            )}
            {/* Версия */}
            {track.version && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                isLight 
                  ? 'bg-violet-50 border-violet-200' 
                  : 'bg-violet-500/10 border-violet-500/20'
              }`}>
                <span className={`text-[10px] font-semibold uppercase ${isLight ? 'text-violet-600' : 'text-violet-400'}`}>Ver.</span>
                <span className={`text-xs ${isLight ? 'text-gray-600' : 'text-zinc-400'}`}>{track.version}</span>
              </div>
            )}

            {/* Язык - только если НЕ инструментал */}
            {!track.isInstrumental && track.language && (
              <span className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${
                isLight 
                  ? 'bg-cyan-50 border-cyan-200 text-cyan-600' 
                  : 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400'
              }`}>
                {track.language}
              </span>
            )}
            {/* Explicit/Clean - только если НЕ инструментал */}
            {!track.isInstrumental && (
              track.hasDrugs ? (
                <span className="inline-flex items-center justify-center w-[22px] h-[22px] bg-red-500/15 text-red-400 text-[10px] font-bold rounded-lg border border-red-500/40 leading-none">
                  E
                </span>
              ) : (
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${
                  isLight 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                }`}>
                  Clean
                </span>
              )
            )}
            {/* Instrumental - только если включено */}
            {track.isInstrumental && (
              <span className={`px-2 py-1 rounded-lg text-[10px] font-medium border ${
                isLight 
                  ? 'bg-amber-50 border-amber-200 text-amber-600' 
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              }`}>
                Instrumental
              </span>
            )}
          </div>
        </div>
      )}

      {/* ISRC для опубликованных */}
      {(releaseStatus === 'approved' || releaseStatus === 'published' || releaseStatus === 'distributed') && (
        <div className={`mt-3 pt-3 border-t ${isLight ? 'border-gray-200' : 'border-white/5'}`}>
          {editingISRC?.trackIndex === index ? (
            <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 rounded-xl border ${
              isLight 
                ? 'bg-violet-50 border-violet-200' 
                : 'bg-violet-500/10 border-violet-500/20'
            }`}>
              <div className="flex items-center gap-2 flex-1">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M3 5h18M3 5v14a2 2 0 002 2h14a2 2 0 002-2V5M7 8v8M12 8v8M17 8v8"/>
                  </svg>
                </div>
                <input
                  type="text"
                  value={editingISRC.isrc}
                  onChange={(e) => setEditingISRC({ trackIndex: index, isrc: e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase() })}
                  maxLength={12}
                  placeholder="XXCC0000000"
                  className={`flex-1 px-3 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:border-violet-500 tracking-wider ${
                    isLight 
                      ? 'bg-white border-gray-200 text-gray-800' 
                      : 'bg-black/50 border-white/10 text-white'
                  }`}
                  disabled={savingISRC}
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => onSaveISRC(index, editingISRC.isrc)} 
                  disabled={savingISRC} 
                  className="flex-1 sm:flex-none px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 disabled:from-zinc-700 disabled:to-zinc-700 text-black rounded-lg font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5"
                >
                  {savingISRC ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span className="text-xs">Сохранить</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setEditingISRC(null)} 
                  className={`px-3 py-2 rounded-lg transition-colors text-xs font-medium ${
                    isLight 
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-700' 
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  Отмена
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className={`text-[10px] uppercase tracking-wider ${isLight ? 'text-gray-500' : 'text-zinc-500'}`}>ISRC</span>
                <span className={`text-sm font-mono ${
                  track.isrc 
                    ? isLight ? 'text-emerald-600 font-semibold tracking-wider' : 'text-emerald-400 font-semibold tracking-wider' 
                    : isLight ? 'text-gray-400 italic' : 'text-zinc-600 italic'
                }`}>
                  {track.isrc || '—'}
                </span>
              </div>
              <button 
                onClick={() => setEditingISRC({ trackIndex: index, isrc: track.isrc || '' })} 
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 border ${
                  track.isrc 
                    ? isLight 
                      ? 'bg-gray-50 hover:bg-violet-50 text-gray-500 hover:text-violet-600 border-gray-200 hover:border-violet-300' 
                      : 'bg-white/5 hover:bg-violet-500/20 text-zinc-400 hover:text-violet-400 border-white/5 hover:border-violet-500/30' 
                    : isLight 
                      ? 'bg-violet-50 hover:bg-violet-100 text-violet-600 hover:text-violet-700 border-violet-200 hover:border-violet-300' 
                      : 'bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 hover:text-violet-300 border-violet-500/30 hover:border-violet-500/50'
                }`}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {track.isrc ? (
                    <>
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </>
                  ) : (
                    <>
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </>
                  )}
                </svg>
                <span className="hidden sm:inline">{track.isrc ? 'Изменить' : 'Добавить ISRC'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {error && <div className="mt-2 text-[10px] text-red-400">{error}</div>}
    </div>
  );
}

