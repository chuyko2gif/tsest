'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { 
  User, Track, UserSearch, TrackItem, CountriesSelector, PlatformsSelector,
  allCountries, genreList, platformsList
} from './create/components';

interface AdminCreateReleaseProps {
  supabase: SupabaseClient;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function AdminCreateRelease({ supabase, onSuccess, onCancel }: AdminCreateReleaseProps) {
  // User
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Release data
  const [releaseType, setReleaseType] = useState<'single' | 'ep' | 'album'>('single');
  const [title, setTitle] = useState('');
  const [artistName, setArtistName] = useState('');
  const [genre, setGenre] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [upc, setUpc] = useState('');
  
  // Cover
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [coverError, setCoverError] = useState('');
  const [coverInfo, setCoverInfo] = useState<{ width: number; height: number } | null>(null);
  
  // Tracks
  const [tracks, setTracks] = useState<Track[]>([{ title: '', artists: '', file: null, explicit: false, isrc: '' }]);
  const [trackError, setTrackError] = useState('');
  
  // Countries & Platforms
  const [selectedCountries, setSelectedCountries] = useState<string[]>(allCountries);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(platformsList.map(p => p.id));
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Handle cover change
  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverError(''); setCoverInfo(null);
    
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) { setCoverError('Формат должен быть JPG или PNG'); return; }
    if (file.size > 50 * 1024 * 1024) { setCoverError('Размер файла не должен превышать 50 МБ'); return; }
    
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      setCoverInfo({ width, height });
      if (width !== height) { setCoverError(`❌ Обложка должна быть квадратной! Ваш размер: ${width}x${height}px`); return; }
      if (width < 3000) { setCoverError(`❌ Минимум 3000x3000px. Ваш размер: ${width}x${height}px`); return; }
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    };
    img.onerror = () => setCoverError('Ошибка загрузки изображения');
    img.src = URL.createObjectURL(file);
  };

  // Track management
  const addTrack = () => {
    if (releaseType === 'single' && tracks.length >= 1) { setTrackError('Для сингла можно добавить только 1 трек'); return; }
    if (releaseType === 'ep' && tracks.length >= 6) { setTrackError('Для EP максимум 6 треков'); return; }
    setTrackError('');
    setTracks([...tracks, { title: '', artists: artistName, file: null, explicit: false, isrc: '' }]);
  };

  const removeTrack = (index: number) => {
    if (tracks.length > 1) setTracks(tracks.filter((_, i) => i !== index));
  };

  const updateTrack = (index: number, field: keyof Track, value: any) => {
    const updated = [...tracks];
    updated[index] = { ...updated[index], [field]: value };
    setTracks(updated);
  };

  useEffect(() => {
    if (releaseType === 'single' && tracks.length > 1) setTracks([tracks[0]]);
  }, [releaseType]);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) { setError('Выберите пользователя'); return; }
    if (!title.trim()) { setError('Введите название релиза'); return; }
    if (!artistName.trim()) { setError('Введите имя артиста'); return; }
    if (!genre) { setError('Выберите жанр'); return; }
    if (tracks.some(t => !t.title.trim())) { setError('Заполните названия всех треков'); return; }
    
    setIsSubmitting(true); setError('');
    
    try {
      // Upload cover
      let coverUrl = '';
      if (coverFile) {
        const fileName = `${selectedUser.id}/${Date.now()}_cover.${coverFile.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage.from('releases').upload(fileName, coverFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('releases').getPublicUrl(fileName);
        coverUrl = urlData.publicUrl;
      }
      
      // Upload tracks
      const uploadedTracks = [];
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        let fileUrl = '';
        if (track.file) {
          const fileName = `${selectedUser.id}/${Date.now()}_track_${i}.${track.file.name.split('.').pop()}`;
          const { error: uploadError } = await supabase.storage.from('releases').upload(fileName, track.file);
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage.from('releases').getPublicUrl(fileName);
          fileUrl = urlData.publicUrl;
        }
        uploadedTracks.push({
          title: track.title, artists: track.artists || artistName, file_url: fileUrl,
          explicit: track.explicit, isrc: track.isrc || null, order: i + 1,
        });
      }
      
      // Generate custom_id
      const { data: maxIdData } = await supabase.rpc('generate_release_custom_id');
      const customId = maxIdData || `thqrel-${String(Date.now()).slice(-4)}`;
      
      // Create release
      const { error: releaseError } = await supabase.from('releases_exclusive').insert({
        user_id: selectedUser.id, custom_id: customId, title, artist_name: artistName, genre,
        cover_url: coverUrl, release_date: releaseDate || null, status: 'published',
        release_type: releaseType, platforms: selectedPlatforms, countries: selectedCountries,
        tracks: uploadedTracks, contract_agreed: true, upc: upc || null,
      }).select().single();
      
      if (releaseError) throw releaseError;
      setSuccess(true);
      setTimeout(() => onSuccess?.(), 1500);
    } catch (err: any) {
      setError(err?.message || 'Ошибка при создании релиза');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Релиз создан!</h3>
        <p className="text-zinc-400">Релиз успешно добавлен и опубликован</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Добавить релиз</h2>
          <p className="text-zinc-400 text-sm mt-1">Создание релиза для пользователя (с площадок)</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition">Отмена</button>
        )}
      </div>

      {error && <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* User Search */}
        <UserSearch supabase={supabase} selectedUser={selectedUser} onSelectUser={setSelectedUser} />

        {/* Release Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">2</span>
            Информация о релизе
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Release Type */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Тип релиза</label>
              <div className="flex gap-2">
                {(['single', 'ep', 'album'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => setReleaseType(type)}
                    className={`flex-1 py-3 rounded-xl font-bold transition ${releaseType === type ? 'bg-purple-500 text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
                    {type === 'single' ? 'Сингл' : type === 'ep' ? 'EP' : 'Альбом'}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Название релиза *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Название"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition" required />
            </div>
            
            {/* Artist */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Имя артиста *</label>
              <input type="text" value={artistName} onChange={(e) => setArtistName(e.target.value)} placeholder="Имя артиста"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition" required />
            </div>
            
            {/* Genre */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Жанр *</label>
              <select value={genre} onChange={(e) => setGenre(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:outline-none transition appearance-none cursor-pointer" required>
                <option value="" className="bg-zinc-900">Выберите жанр</option>
                {genreList.map((g) => <option key={g} value={g} className="bg-zinc-900">{g}</option>)}
              </select>
            </div>
            
            {/* Release Date */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Дата релиза</label>
              <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-purple-500/50 focus:outline-none transition" />
            </div>
            
            {/* UPC */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">UPC код <span className="text-purple-400 ml-1">(если есть)</span></label>
              <input type="text" value={upc} onChange={(e) => setUpc(e.target.value)} placeholder="123456789012"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-purple-500/50 focus:outline-none transition font-mono" />
            </div>
            
            {/* Cover */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Обложка</label>
              <div className="flex gap-4 items-start">
                {coverPreview ? (
                  <div className="relative group">
                    <img src={coverPreview} alt="Обложка" className="w-32 h-32 rounded-xl object-cover" />
                    <button type="button" onClick={() => { setCoverFile(null); setCoverPreview(''); }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label className="w-32 h-32 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-purple-500/50 transition">
                    <svg className="w-8 h-8 text-zinc-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-zinc-500">Загрузить</span>
                    <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  </label>
                )}
                <div className="text-sm text-zinc-500">
                  <p className="font-medium text-white">Требования:</p>
                  <p>• Строго 3000x3000 px (квадрат)</p>
                  <p>• Форматы: JPG, PNG</p>
                  {coverInfo && <p className={`mt-2 ${coverError ? 'text-red-400' : 'text-emerald-400'}`}>Загружено: {coverInfo.width}x{coverInfo.height}px</p>}
                  {coverError && <p className="mt-2 text-red-400 whitespace-pre-line">{coverError}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracklist */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center text-purple-400">3</span>
            Треклист
            {releaseType === 'single' && <span className="text-xs text-zinc-500 ml-2">(макс. 1 трек)</span>}
            {releaseType === 'ep' && <span className="text-xs text-zinc-500 ml-2">(макс. 6 треков)</span>}
          </h3>
          
          {trackError && <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">{trackError}</div>}
          
          <div className="space-y-4">
            {tracks.map((track, index) => (
              <TrackItem key={index} track={track} index={index} canRemove={tracks.length > 1} artistName={artistName}
                onUpdate={(field, value) => updateTrack(index, field, value)} onRemove={() => removeTrack(index)} onFileError={setTrackError} />
            ))}
            
            {!(releaseType === 'single' && tracks.length >= 1) && (
              <button type="button" onClick={addTrack}
                className="w-full py-3 border-2 border-dashed border-white/20 rounded-xl text-zinc-400 hover:border-purple-500/50 hover:text-purple-400 transition flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Добавить трек
              </button>
            )}
          </div>
        </div>

        {/* Countries */}
        <CountriesSelector selected={selectedCountries} onChange={setSelectedCountries} />

        {/* Platforms */}
        <PlatformsSelector selected={selectedPlatforms} onChange={setSelectedPlatforms} />

        {/* Submit */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <button type="button" onClick={onCancel}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-zinc-400 hover:text-white transition font-bold">Отмена</button>
          )}
          <button type="submit" disabled={isSubmitting || !selectedUser}
            className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-xl text-white font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
            {isSubmitting ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />Создание...</>
            ) : (
              <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>Создать и опубликовать</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
