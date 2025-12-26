'use client';
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from '../../lib/fetchWithAuth';

interface CreateTicketFormProps {
  onCancel: () => void;
  onCreated: (ticket: any) => void;
}

const categories = [
  { value: 'general', label: 'Общий вопрос' },
  { value: 'releases', label: 'Релизы' },
  { value: 'problem', label: 'Проблема' },
  { value: 'payout', label: 'Выплаты' },
  { value: 'account', label: 'Аккаунт' },
  { value: 'other', label: 'Другое' }
];

export default function CreateTicketForm({ onCancel, onCreated }: CreateTicketFormProps) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [releases, setReleases] = useState<any[]>([]);
  const [selectedRelease, setSelectedRelease] = useState('');
  const [loadingReleases, setLoadingReleases] = useState(false);
  const [releaseSearch, setReleaseSearch] = useState('');

  useEffect(() => {
    if (category === 'releases') {
      loadReleases();
    } else {
      setSelectedRelease('');
    }
  }, [category]);

  const loadReleases = async () => {
    setLoadingReleases(true);
    try {
      const response = await fetchWithAuth('/api/releases');
      const data = await response.json();
      if (response.ok) {
        const filteredReleases = (data.releases || []).filter((r: any) => r.status !== 'draft');
        setReleases(filteredReleases);
      }
    } catch (err) {
      console.error('Error loading releases:', err);
    } finally {
      setLoadingReleases(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');

    const uploadedUrls: string[] = [];
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          setError(`Файл "${file.name}" не является изображением.`);
          setTimeout(() => setError(''), 3000);
          e.target.value = '';
          setUploading(false);
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          setError(`Файл "${file.name}" слишком большой. Максимум 10 МБ.`);
          setTimeout(() => setError(''), 3000);
          e.target.value = '';
          setUploading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetchWithAuth('/api/support/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          uploadedUrls.push(data.url);
        } else {
          setError(data.error || 'Ошибка загрузки изображения');
          e.target.value = '';
          break;
        }
      }

      if (uploadedUrls.length > 0) {
        setImages([...images, ...uploadedUrls]);
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Ошибка загрузки изображений');
      e.target.value = '';
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      setError('Пожалуйста, укажите тему обращения');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (!message.trim() && images.length === 0) {
      setError('Напишите сообщение или прикрепите фото');
      setTimeout(() => setError(''), 3000);
      return;
    }

    if (category === 'releases' && !selectedRelease) {
      setError('Выберите релиз из списка');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCreating(true);
    setError('');

    try {
      const response = await fetchWithAuth('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subject, 
          category, 
          message, 
          images,
          release_id: category === 'releases' ? selectedRelease : null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onCreated(data.ticket);
      } else {
        setError(data.error || 'Ошибка создания тикета');
      }
    } catch (err) {
      console.error('Error creating ticket:', err);
      setError('Ошибка соединения с сервером');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800">
        <button
          onClick={onCancel}
          className="mb-3 px-3 py-2 flex items-center gap-2 text-zinc-300 bg-zinc-800/50 hover:bg-zinc-700/70 rounded-lg transition-all duration-200 border border-zinc-700/50 hover:border-zinc-600 group"
        >
          <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Назад</span>
        </button>
        <h3 className="text-lg font-bold text-white">Новый тикет</h3>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Ошибка */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 animate-fade-in">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <p className="text-sm font-medium text-red-300">{error}</p>
            </div>
          )}

          {/* Тема */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-1">
              Тема <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={`w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition-all ${
                error && !subject.trim() 
                  ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' 
                  : 'border-zinc-700 focus:ring-purple-500 focus:border-purple-500'
              }`}
              placeholder="Кратко опишите проблему"
              required
            />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Категория</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Выбор релиза */}
          {category === 'releases' && (
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-3">Выберите релиз</label>
              
              {!loadingReleases && releases.length > 0 && (
                <div className="mb-3 relative">
                  <input
                    type="text"
                    value={releaseSearch}
                    onChange={(e) => setReleaseSearch(e.target.value)}
                    placeholder="Поиск по названию..."
                    className="w-full px-3 py-2 pl-10 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                  />
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              )}
              
              {loadingReleases ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                </div>
              ) : releases.length === 0 ? (
                <div className="p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-400 text-sm text-center">
                  У вас пока нет релизов
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {releases
                    .filter(release => {
                      if (!releaseSearch.trim()) return true;
                      const searchLower = releaseSearch.toLowerCase();
                      return release.title.toLowerCase().includes(searchLower) || 
                             release.artist.toLowerCase().includes(searchLower);
                    })
                    .map(release => {
                    const isSelected = selectedRelease === release.id;
                    const statusConfig: Record<string, { label: string; color: string; emoji: string }> = {
                      pending: { label: 'На модерации', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30', emoji: '⏳' },
                      approved: { label: 'Одобрен', color: 'bg-green-500/20 text-green-300 border-green-500/30', emoji: '✅' },
                      rejected: { label: 'Отклонен', color: 'bg-red-500/20 text-red-300 border-red-500/30', emoji: '❌' },
                      published: { label: 'Опубликован', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30', emoji: '🎵' }
                    };
                    const status = statusConfig[release.status] || { label: release.status, color: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30', emoji: '📀' };

                    return (
                      <div
                        key={release.id}
                        onClick={() => setSelectedRelease(release.id)}
                        className={`relative p-3 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                          isSelected 
                            ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20' 
                            : 'bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800'
                        }`}
                      >
                        <div className="flex gap-3">
                          {release.artwork_url ? (
                            <img src={release.artwork_url} alt={release.title} className="w-16 h-16 rounded-lg object-cover" />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                              </svg>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="font-bold text-white text-sm truncate">{release.title}</h4>
                              {isSelected && (
                                <div className="flex-shrink-0 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400 mb-2">{release.artist}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.color}`}>
                                <span>{status.emoji}</span>
                                <span>{status.label}</span>
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {new Date(release.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Сообщение */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-1">
              Сообщение <span className="text-red-400">*</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 min-h-[120px] transition-all ${
                error && !message.trim() 
                  ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' 
                  : 'border-zinc-700 focus:ring-purple-500 focus:border-purple-500'
              }`}
              placeholder="Подробно опишите вашу проблему"
              required
            />
          </div>

          {/* Изображения */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Изображения</label>
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="hidden" id="ticket-image-upload" />
            
            {images.length === 0 ? (
              <label htmlFor="ticket-image-upload" className="block w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-750 border-2 border-dashed border-zinc-700 hover:border-purple-500 rounded-lg text-center cursor-pointer transition-all duration-200 group">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-purple-300 transition-colors">
                      {uploading ? 'Загрузка...' : 'Нажмите для выбора фото'}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">PNG, JPG, GIF, WebP до 10 МБ</p>
                  </div>
                </div>
              </label>
            ) : (
              <div className="border-2 border-dashed border-zinc-700 rounded-lg p-3 bg-zinc-800/50">
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {images.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-20 object-cover rounded-lg border-2 border-zinc-700" />
                      <button
                        type="button"
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                      >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                <label htmlFor="ticket-image-upload" className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm text-purple-300 cursor-pointer transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {uploading ? 'Загрузка...' : 'Добавить ещё'}
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm">
            Отмена
          </button>
          <button
            type="submit"
            disabled={creating || uploading}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
          >
            {creating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Создание...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Создать тикет
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
