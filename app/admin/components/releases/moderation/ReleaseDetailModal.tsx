'use client';

import React, { useState, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import AudioPlayer from '@/components/ui/AudioPlayer';
import { Release } from '../types';
import { showSuccessToast, showErrorToast } from '@/lib/utils/showToast';

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
  
  // Состояния для редактирования
  const [editingTrackISRC, setEditingTrackISRC] = useState<{trackIndex: number, isrc: string} | null>(null);
  const [savingISRC, setSavingISRC] = useState(false);
  const [editingReleaseUPC, setEditingReleaseUPC] = useState(false);
  const [releaseUPCInput, setReleaseUPCInput] = useState('');
  const [savingReleaseUPC, setSavingReleaseUPC] = useState(false);

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
      onRefresh();
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
      onRefresh();
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

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-black/80 via-black/70 to-[#6050ba]/20 backdrop-blur-md p-2 sm:p-4 gap-2 sm:gap-4 animate-in fade-in duration-200" 
      onClick={onClose}
    >
      {/* Левое окно: информация о релизе */}
      <div 
        className="bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/20 shadow-2xl shadow-[#6050ba]/10 rounded-2xl sm:rounded-3xl w-full lg:w-[800px] flex-shrink-0 max-h-[90vh] overflow-y-auto scrollbar-hide animate-in slide-in-from-left duration-300 relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Кнопка закрытия (мобильная) */}
          <button 
            onClick={onClose} 
            className="lg:hidden absolute top-4 right-4 w-12 h-12 rounded-xl bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 flex items-center justify-center transition-all z-50"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" stroke="#ef4444" />
              <line x1="6" y1="6" x2="18" y2="18" stroke="#ef4444" />
            </svg>
          </button>
          
          {/* Заголовок */}
          <div className="mb-6">
            <div className="w-12 h-1 bg-gradient-to-r from-[#6050ba] to-[#9d8df1] rounded-full mb-4"></div>
            <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              {release.title}
            </h2>
            <p className="text-zinc-400 mt-1">{release.artist_name}</p>
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <RoleBadge role={release.user_role} />
              <StatusBadge status={release.status} />
            </div>
          </div>

          {/* Обложка и детали */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Обложка */}
            {release.cover_url && (
              <div className="group relative">
                <img 
                  src={release.cover_url} 
                  alt={release.title} 
                  className="w-full aspect-square object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500" 
                />
                <button
                  onClick={() => handleDownloadFile(release.cover_url, `${release.title}_cover.jpg`)}
                  className="absolute bottom-3 right-3 p-2.5 bg-black/60 hover:bg-[#6050ba] backdrop-blur-sm rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  title="Скачать обложку"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
              </div>
            )}

            {/* Детали */}
            <div className="space-y-4">
              <InfoCard label="Жанр" value={release.genre} />
              {release.release_date && (
                <InfoCard 
                  label="Дата релиза" 
                  value={new Date(release.release_date).toLocaleDateString('ru-RU')} 
                />
              )}
              
              {/* UPC код */}
              {release.status === 'published' && (
                <UPCEditor
                  upc={release.upc}
                  editing={editingReleaseUPC}
                  setEditing={setEditingReleaseUPC}
                  input={releaseUPCInput}
                  setInput={setReleaseUPCInput}
                  saving={savingReleaseUPC}
                  onSave={handleSaveReleaseUPC}
                />
              )}
            </div>
          </div>

          {/* Треки */}
          {release.tracks && release.tracks.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6050ba] to-[#9d8df1] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <circle cx="12" cy="12" r="2"/>
                    <path d="M12 2v7.5"/>
                    <path d="M12 14.5V22"/>
                  </svg>
                </div>
                Треклист ({release.tracks.length})
              </h3>
              <div className="space-y-3">
                {release.tracks.map((track: any, idx: number) => (
                  <TrackItem
                    key={idx}
                    track={track}
                    index={idx}
                    releaseId={release.id}
                    releaseType={release.release_type}
                    releaseStatus={release.status}
                    supabase={supabase}
                    editingISRC={editingTrackISRC}
                    setEditingISRC={setEditingTrackISRC}
                    savingISRC={savingISRC}
                    onSaveISRC={handleSaveTrackISRC}
                    onDownload={() => handleDownloadTrack(idx, track.title)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Платформы */}
          {release.platforms && release.platforms.length > 0 && (
            <div className="mb-6">
              <h3 className="font-bold mb-3">Платформы</h3>
              <div className="flex flex-wrap gap-2">
                {release.platforms.map((platform: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-white/5 rounded-lg text-sm">
                    {platform}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Правое окно: действия */}
      <div 
        className="hidden lg:block bg-gradient-to-br from-[#0d0d0f] to-[#1a1a1f] border border-white/20 shadow-2xl rounded-3xl w-[400px] flex-shrink-0 max-h-[90vh] overflow-y-auto scrollbar-hide animate-in slide-in-from-right duration-300" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Заголовок */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <h3 className="text-xl font-black uppercase">Действия</h3>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-xl bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/50 flex items-center justify-center transition-all"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" stroke="#ef4444"/>
                <line x1="6" y1="6" x2="18" y2="18" stroke="#ef4444"/>
              </svg>
            </button>
          </div>

          {/* Проверка платежа для Basic */}
          {release.user_role === 'basic' && (release as any).payment_status === 'pending' && (
            <PaymentVerification
              release={release as any}
              onVerify={() => handleVerifyPayment(true)}
              onReject={() => handleVerifyPayment(false)}
            />
          )}

          {/* Кнопки действий */}
          <div className="space-y-3">
            {/* Редактировать */}
            <button
              onClick={() => {
                const path = release.release_type === 'basic'
                  ? `/cabinet/release-basic/edit/${release.id}?from=admin`
                  : `/cabinet/release/edit/${release.id}?from=admin`;
                router.push(path);
              }}
              className="w-full px-6 py-4 bg-white/10 hover:bg-[#6050ba]/30 border-2 border-white/20 hover:border-[#6050ba]/50 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Редактировать
            </button>

            {/* Удалить */}
            <button
              onClick={onDelete}
              className="w-full px-6 py-4 bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500/40 hover:border-red-500/60 rounded-xl font-bold text-red-400 transition-all flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Удалить
            </button>

            {/* Действия в зависимости от статуса */}
            {release.status === 'pending' && (
              <>
                <button
                  onClick={onApprove}
                  disabled={release.user_role === 'basic' && (release as any).payment_status !== 'verified'}
                  className="w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 disabled:from-zinc-700 disabled:to-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-black transition-all shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Утвердить
                </button>

                <div>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Причина отклонения..."
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none mb-2"
                    rows={3}
                  />
                  <button
                    onClick={onReject}
                    disabled={!rejectionReason.trim()}
                    className="w-full px-6 py-3 bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 rounded-xl font-bold transition"
                  >
                    Отклонить
                  </button>
                </div>
              </>
            )}

            {/* Статус информация */}
            <StatusInfo status={release.status} release={release as any} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Вспомогательные компоненты
function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`px-4 py-2 rounded-xl text-xs font-bold border-2 ${
      role === 'basic' 
        ? 'bg-blue-500/30 border-blue-400/50 text-blue-300' 
        : 'bg-purple-500/30 border-purple-400/50 text-purple-300'
    }`}>
      {role === 'basic' ? 'BASIC' : 'EXCLUSIVE'}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { text: string; className: string }> = {
    pending: { text: 'НА МОДЕРАЦИИ', className: 'bg-yellow-500/30 border-yellow-400/50 text-yellow-300' },
    distributed: { text: 'НА ДИСТРИБЬЮЦИИ', className: 'bg-blue-500/30 border-blue-400/50 text-blue-300' },
    published: { text: 'ОПУБЛИКОВАН', className: 'bg-green-500/30 border-green-400/50 text-green-300' },
    rejected: { text: 'ОТКЛОНЕН', className: 'bg-red-500/30 border-red-400/50 text-red-300' },
  };

  const { text, className } = config[status] || { text: status.toUpperCase(), className: 'bg-zinc-500/30 border-zinc-400/50 text-zinc-300' };

  return (
    <span className={`px-4 py-2 rounded-xl text-xs font-bold border-2 ${className}`}>
      {text}
    </span>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <div className="font-bold text-white">{value}</div>
    </div>
  );
}

function UPCEditor({ upc, editing, setEditing, input, setInput, saving, onSave }: {
  upc?: string;
  editing: boolean;
  setEditing: (v: boolean) => void;
  input: string;
  setInput: (v: string) => void;
  saving: boolean;
  onSave: () => void;
}) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
      <div className="text-xs text-zinc-500 mb-1">UPC код</div>
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="13 цифр"
            maxLength={13}
            className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#6050ba]"
            disabled={saving}
          />
          <button onClick={onSave} disabled={saving || !input.trim()} className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-700 text-black rounded-lg font-bold text-sm">
            {saving ? '...' : '✓'}
          </button>
          <button onClick={() => setEditing(false)} className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm">✕</button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          {upc ? (
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm font-mono text-emerald-400 flex-1">{upc}</span>
          ) : (
            <span className="text-zinc-500 flex-1">Не указан</span>
          )}
          <button onClick={() => { setEditing(true); setInput(upc || ''); }} className="px-3 py-2 bg-[#6050ba] hover:bg-[#6050ba]/80 text-white rounded-lg text-xs font-bold">
            {upc ? 'Изменить' : 'Добавить'}
          </button>
        </div>
      )}
    </div>
  );
}

function TrackItem({ track, index, releaseId, releaseType, releaseStatus, supabase, editingISRC, setEditingISRC, savingISRC, onSaveISRC, onDownload }: any) {
  return (
    <details className="group bg-white/5 border border-white/10 hover:border-[#6050ba]/50 rounded-xl transition-all">
      <summary className="cursor-pointer p-4 list-none flex items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#6050ba]/30 border-2 border-[#6050ba]/40 flex items-center justify-center font-bold flex-shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white truncate">{track.title}</div>
          <div className="text-xs text-zinc-500">{track.language || 'Unknown'}</div>
        </div>
        <svg className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9" strokeWidth="2"/>
        </svg>
      </summary>
      <div className="px-4 pb-4 pt-2 border-t border-white/10">
        {/* Аудио плеер */}
        {(track.link || track.audio_url || track.audioFile) && (
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <AudioPlayer
                releaseId={releaseId}
                releaseType={releaseType}
                trackIndex={index}
                supabase={supabase}
                variant="full"
              />
            </div>
            <button
              onClick={onDownload}
              className="p-2.5 bg-[#6050ba]/30 hover:bg-[#6050ba] border border-[#6050ba]/30 rounded-xl transition-all"
              title="Скачать"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </button>
          </div>
        )}

        {/* ISRC редактор (для опубликованных) */}
        {releaseStatus === 'published' && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-zinc-500">ISRC:</span>
            {editingISRC?.trackIndex === index ? (
              <>
                <input
                  type="text"
                  value={editingISRC.isrc}
                  onChange={(e) => setEditingISRC({ trackIndex: index, isrc: e.target.value.replace(/[^A-Za-z0-9]/g, '') })}
                  maxLength={12}
                  className="flex-1 px-2 py-1 bg-white/5 border border-white/10 rounded text-sm focus:outline-none focus:border-[#6050ba]"
                  disabled={savingISRC}
                />
                <button onClick={() => onSaveISRC(index, editingISRC.isrc)} disabled={savingISRC} className="px-2 py-1 bg-emerald-500 text-black rounded text-xs font-bold">
                  {savingISRC ? '...' : '✓'}
                </button>
                <button onClick={() => setEditingISRC(null)} className="px-2 py-1 bg-white/5 rounded text-xs">✕</button>
              </>
            ) : (
              <>
                <span className={`flex-1 ${track.isrc ? 'text-emerald-400 font-mono' : 'text-zinc-500'}`}>
                  {track.isrc || 'Не указан'}
                </span>
                <button
                  onClick={() => setEditingISRC({ trackIndex: index, isrc: track.isrc || '' })}
                  className="px-2 py-1 bg-[#6050ba] hover:bg-[#6050ba]/80 text-white rounded text-xs font-bold"
                >
                  {track.isrc ? 'Изменить' : 'Добавить'}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </details>
  );
}

function PaymentVerification({ release, onVerify, onReject }: any) {
  return (
    <div className="mb-6 p-4 bg-yellow-500/20 border-2 border-yellow-400/40 rounded-xl">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-yellow-500/30 border-2 border-yellow-400/50 flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-yellow-300" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>
        <div>
          <h4 className="text-yellow-300 font-bold">Проверка платежа</h4>
          <p className="text-xs text-yellow-400/70">Сумма: {release.payment_amount} ₽</p>
        </div>
      </div>

      {release.payment_receipt_url && (
        <a href={release.payment_receipt_url} target="_blank" rel="noopener noreferrer" className="block mb-3">
          <img src={release.payment_receipt_url} alt="Чек" className="w-full rounded-lg border-2 border-white/10 hover:border-yellow-500/50 transition" />
        </a>
      )}

      <div className="space-y-2">
        <button onClick={onVerify} className="w-full px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition">
          ✓ Подтвердить
        </button>
        <button onClick={onReject} className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl font-bold transition">
          ✕ Отклонить
        </button>
      </div>
    </div>
  );
}

function StatusInfo({ status, release }: { status: string; release: any }) {
  if (status === 'distributed') {
    return (
      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center">
        <div className="text-blue-400 font-bold flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          На дистрибьюции
        </div>
        {release.approved_at && (
          <div className="text-xs text-zinc-500 mt-1">
            {new Date(release.approved_at).toLocaleString('ru-RU')}
          </div>
        )}
      </div>
    );
  }

  if (status === 'published') {
    return (
      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
        <div className="text-green-400 font-bold">✅ Опубликован</div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
        <div className="text-red-400 font-bold mb-2">Отклонен</div>
        {release.rejection_reason && (
          <div className="text-sm text-white">{release.rejection_reason}</div>
        )}
      </div>
    );
  }

  return null;
}
