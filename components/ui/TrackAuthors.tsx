'use client';

import React, { useState, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

// Типы для авторов треков
export interface TrackAuthor {
  role: 'composer' | 'lyricist' | 'producer' | 'arranger' | 'performer' | 'mixer' | 'mastering' | 'other';
  fullName: string;
}

export const TRACK_AUTHOR_ROLES = [
  { value: 'composer', label: 'Composer', labelRu: 'Композитор' },
  { value: 'lyricist', label: 'Lyricist', labelRu: 'Автор текста' },
  { value: 'producer', label: 'Producer', labelRu: 'Продюсер' },
  { value: 'arranger', label: 'Arranger', labelRu: 'Аранжир.' },
  { value: 'performer', label: 'Performer', labelRu: 'Исполнитель' },
  { value: 'mixer', label: 'Mixer', labelRu: 'Сведение' },
  { value: 'mastering', label: 'Mastering', labelRu: 'Мастеринг' },
  { value: 'other', label: 'Other', labelRu: 'Другое' },
] as const;

interface TrackAuthorsProps {
  authors: TrackAuthor[];
  setAuthors: (authors: TrackAuthor[]) => void;
  maxAuthors?: number;
  compact?: boolean;
}

export default function TrackAuthors({ 
  authors, 
  setAuthors, 
  maxAuthors = 20,
  compact = false 
}: TrackAuthorsProps) {
  const { themeName } = useTheme();
  const isLight = themeName === 'light';
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<TrackAuthor['role']>('composer');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const addAuthor = () => {
    if (newName.trim() && authors.length < maxAuthors) {
      setAuthors([...authors, { role: newRole, fullName: newName.trim() }]);
      setNewName('');
      inputRef.current?.focus();
    }
  };

  const removeAuthor = (index: number) => {
    setAuthors(authors.filter((_, i) => i !== index));
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newAuthors = [...authors];
    const [dragged] = newAuthors.splice(draggedIndex, 1);
    newAuthors.splice(targetIndex, 0, dragged);
    setAuthors(newAuthors);
    
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getRoleInfo = (role: string) => {
    return TRACK_AUTHOR_ROLES.find(r => r.value === role) || { label: role, labelRu: role };
  };

  // Показываем drag & drop только если больше 1 автора
  const showDragDrop = authors.length > 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-500 dark:text-amber-400/70">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          Авторы (ФИО)
          {authors.length > 0 && <span className="text-gray-400 dark:text-zinc-600 text-xs">({authors.length})</span>}
        </label>
      </div>

      {/* Пояснение */}
      {!compact && (
        <div className="mb-3 px-3 py-2 bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-zinc-400 flex items-start gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 mt-0.5 text-amber-500 dark:text-amber-400/50">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>
              Укажите <strong>ФИО</strong> авторов трека. Выберите роль и добавьте.
              {showDragDrop && <><br/><span className="text-gray-400 dark:text-zinc-500">Перетаскивайте для изменения порядка.</span></>}
            </span>
          </p>
        </div>
      )}

      {/* Список авторов */}
      {authors.length > 0 && (
        <div className="space-y-1.5 sm:space-y-2 mb-3">
          {authors.map((author, idx) => {
            const roleInfo = getRoleInfo(author.role);
            return (
              <div
                key={idx}
                draggable={showDragDrop}
                onDragStart={showDragDrop ? (e) => handleDragStart(e, idx) : undefined}
                onDragOver={showDragDrop ? (e) => handleDragOver(e, idx) : undefined}
                onDragLeave={showDragDrop ? handleDragLeave : undefined}
                onDrop={showDragDrop ? (e) => handleDrop(e, idx) : undefined}
                onDragEnd={showDragDrop ? handleDragEnd : undefined}
                className={`
                  flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border transition-all
                  ${showDragDrop ? 'cursor-grab active:cursor-grabbing' : ''}
                  ${draggedIndex === idx ? 'opacity-50 border-dashed border-amber-400/50 bg-amber-500/10' : ''}
                  ${dragOverIndex === idx && draggedIndex !== idx ? 'border-amber-400/60 bg-amber-500/15 scale-[1.02]' : ''}
                  ${isLight 
                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 hover:border-amber-400' 
                    : 'bg-gradient-to-r from-amber-500/[0.08] to-yellow-500/[0.04] border-amber-500/15 hover:border-amber-400/30'}
                `}
              >
                {/* Иконка перетаскивания - только если больше 1 */}
                {showDragDrop && (
                  <div className="text-amber-500 dark:text-amber-400/40 hover:text-amber-600 dark:hover:text-amber-300/60 transition touch-manipulation min-w-[20px] sm:min-w-[16px] flex justify-center">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 sm:w-4 sm:h-4">
                      <circle cx="9" cy="5" r="1" fill="currentColor"/>
                      <circle cx="9" cy="12" r="1" fill="currentColor"/>
                      <circle cx="9" cy="19" r="1" fill="currentColor"/>
                      <circle cx="15" cy="5" r="1" fill="currentColor"/>
                      <circle cx="15" cy="12" r="1" fill="currentColor"/>
                      <circle cx="15" cy="19" r="1" fill="currentColor"/>
                    </svg>
                  </div>
                )}

                {/* Роль */}
                <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium flex-shrink-0" style={{ backgroundColor: '#f59e0b', color: 'white' }}>
                  {roleInfo.label}
                </div>

                {/* ФИО */}
                <span className="flex-1 text-xs sm:text-sm truncate font-medium" style={{ color: isLight ? '#1f2937' : '#ffffff' }}>
                  {author.fullName}
                </span>

                {/* Кнопка удаления */}
                <button
                  type="button"
                  onClick={() => removeAuthor(idx)}
                  className="p-1.5 text-zinc-500 hover:text-red-400 transition rounded-lg hover:bg-red-500/10 touch-manipulation min-w-[32px] sm:min-w-[28px] min-h-[32px] sm:min-h-[28px] flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 sm:w-3.5 sm:h-3.5">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Поле добавления */}
      <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
        {/* Выбор роли */}
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className={`w-full sm:w-auto px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl text-sm flex items-center gap-2 transition min-w-[110px] sm:min-w-[130px] border ${
              isLight 
                ? 'bg-white border-amber-300 hover:border-amber-400 shadow-sm' 
                : 'bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 border-white/10 hover:border-amber-400/30'
            }`}
          >
            <span className="flex-1 text-left text-xs font-medium" style={{ color: isLight ? '#1f2937' : '#e4e4e7' }}>{getRoleInfo(newRole).label}</span>
            <svg 
              width="14" 
              height="14" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              className={`transition-transform w-3.5 h-3.5 ${showRoleDropdown ? 'rotate-180' : ''}`}
              style={{ color: isLight ? '#f59e0b' : 'rgba(251, 191, 36, 0.7)' }}
            >
              <polyline points="6 9 12 15 18 9" strokeWidth="2"/>
            </svg>
          </button>
          {showRoleDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowRoleDropdown(false)} />
              <div className="absolute top-full left-0 right-0 sm:right-auto mt-1 bg-white dark:bg-[#0d0d0f] border border-gray-200 dark:border-amber-500/20 rounded-xl shadow-xl z-20 overflow-hidden min-w-[160px] sm:min-w-[200px] max-h-[50vh] overflow-y-auto">
                {TRACK_AUTHOR_ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => {
                      setNewRole(role.value as TrackAuthor['role']);
                      setShowRoleDropdown(false);
                    }}
                    className="w-full px-3 py-2.5 sm:py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 transition flex items-center justify-between gap-4 touch-manipulation"
                  >
                    <span className="text-gray-900 dark:text-white">{role.label}</span>
                    <span className="text-gray-500 dark:text-zinc-500 text-xs">{role.labelRu}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Поле ввода ФИО и кнопка */}
        <div className="flex gap-1.5 sm:gap-2 flex-1">
          <input
            ref={inputRef}
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addAuthor();
              }
            }}
            onBlur={() => {
              if (newName.trim()) addAuthor();
            }}
            placeholder="Фамилия Имя Отчество"
            disabled={authors.length >= maxAuthors}
            className={`flex-1 px-3 py-2 sm:py-2.5 text-sm rounded-xl border outline-none transition-all disabled:opacity-50 ${
              isLight
                ? 'bg-white text-gray-900 placeholder:text-gray-400 border-gray-200 hover:border-amber-400 focus:border-amber-400'
                : 'bg-gradient-to-br from-zinc-900/90 to-zinc-950/90 text-white placeholder:text-zinc-600 border-white/10 hover:border-amber-400/30 focus:border-amber-400/50 focus:shadow-lg focus:shadow-amber-500/5'
            }`}
          />

          {/* Кнопка добавления */}
          <button
            type="button"
            onClick={addAuthor}
            disabled={!newName.trim() || authors.length >= maxAuthors}
            className={`px-3 py-2 sm:py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center min-w-[44px] border touch-manipulation ${
              isLight 
                ? 'bg-amber-500 hover:bg-amber-600 border-amber-500 shadow-md shadow-amber-500/30' 
                : 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/20'
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isLight ? 'white' : '#fcd34d'} strokeWidth="2.5" className="w-4.5 h-4.5 sm:w-[18px] sm:h-[18px]">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {authors.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">
          Введите ФИО и нажмите Enter или кликните в другое место
        </p>
      )}
    </div>
  );
}
