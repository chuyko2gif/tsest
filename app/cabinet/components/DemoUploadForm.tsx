"use client";
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

interface DemoUploadFormProps {
  userId?: string | null;
  artistName?: string;
  onClose?: () => void;
}

export default function DemoUploadForm({ userId, artistName, onClose }: DemoUploadFormProps) {
  const [type, setType] = useState<'single' | 'album'>('single');
  const [releaseTitle, setReleaseTitle] = useState('');
  const [tracks, setTracks] = useState<Array<{ title: string; audioFile?: File | null; audioUrl?: string; coverFile?: File | null; coverUrl?: string }>>([
    { title: '', audioFile: null, audioUrl: '' },
  ]);
  const [genres, setGenres] = useState('');
  const [creator, setCreator] = useState(artistName || '');
  const [coauthors, setCoauthors] = useState<string[]>([]);
  const [producer, setProducer] = useState('');
  const [loading, setLoading] = useState(false);

  const addTrack = () => setTracks(prev => [...prev, { title: '', audioFile: null, audioUrl: '' }]);
  const removeTrack = (i: number) => setTracks(prev => prev.filter((_, idx) => idx !== i));
  const setTrackField = (i: number, field: string, value: any) => {
    setTracks(prev => prev.map((t, idx) => idx === i ? { ...t, [field]: value } : t));
  };

  const addCoauthor = () => setCoauthors(prev => [...prev, '']);
  const setCoauthor = (i: number, value: string) => setCoauthors(prev => prev.map((c, idx) => idx === i ? value : c));
  const removeCoauthor = (i: number) => setCoauthors(prev => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return alert('Нет соединения с базой');
    if (!userId) return alert('Необходима авторизация');
    if (type === 'single') {
      if (!tracks[0].title) return alert('Введите название трека');
      if (!tracks[0].audioFile && !tracks[0].audioUrl) return alert('Укажите файл или ссылку для трека');
    } else {
      if (!releaseTitle) return alert('Введите название релиза');
      if (tracks.some(t => !t.title || (!t.audioFile && !t.audioUrl))) return alert('Укажите название и файл/ссылку для всех треков альбома');
    }

    setLoading(true);
    const sanitize = (name: string | undefined | null) => {
      return String(name)
        .replace(/\s+/g, '_')
        .replace(/[^a-zA-Z0-9_\-.]/g, '');
    };
    const MAX_AUDIO = 50 * 1024 * 1024;
    const MAX_COVER = 75 * 1024 * 1024;
    
    try {
      const uploadedCovers: string[] = [];
      for (let i = 0; i < tracks.length; i++) {
        const t = tracks[i];
        if (t.coverFile) {
          if (t.coverFile.size > MAX_COVER) throw new Error('Cover file exceeds 75MB limit');
          const safeCover = sanitize(t.coverFile.name);
          const coverName = `covers/${userId}/${Date.now()}_${i}_${safeCover}`;
          const upc = await supabase.storage.from('demos').upload(coverName, t.coverFile as File, { upsert: false });
          if (upc.error) {
            console.warn('Cover upload error:', upc.error);
            uploadedCovers[i] = '';
          } else {
            uploadedCovers[i] = supabase.storage.from('demos').getPublicUrl(coverName).data.publicUrl;
          }
        } else {
          uploadedCovers[i] = t.coverUrl || '';
        }
      }

      const batchId = `${userId || 'anon'}_${Date.now()}`;

      for (let i = 0; i < tracks.length; i++) {
        const tr = tracks[i];
        let audioUrl = tr.audioUrl || '';
        if (!audioUrl && tr.audioFile) {
          const f = tr.audioFile as File;
          if (f.size > MAX_AUDIO) { console.warn('Audio too large, skipping', tr.title); continue; }
          const safeName = sanitize(f.name);
          const filename = `${userId}/${Date.now()}_${i}_${safeName}`;
          const up = await supabase.storage.from('demos').upload(filename, f, { upsert: false });
          if (up.error) { console.warn('Audio upload error:', up.error); continue; }
          audioUrl = supabase.storage.from('demos').getPublicUrl(filename).data.publicUrl;
        }

        if (!audioUrl) { console.warn('No audio URL for track, skipping', tr.title); continue; }

        const payload = {
          title: tr.title,
          artist_name: creator || artistName || null,
          description: '',
          audio_url: audioUrl,
          cover_url: uploadedCovers[i] || tr.coverUrl || null,
          social_links: JSON.stringify({ batchId, releaseTitle: type === 'album' ? releaseTitle : tr.title, type, genres: genres.split(',').map(s=>s.trim()).filter(Boolean), coauthors, producer }),
          status: 'reviewing',
          user_id: userId,
        };
        try {
          await supabase.from('demos').insert(payload);
        } catch (e) {
          console.warn('Insert demo error', e);
        }
      }

      alert('Демо отправлено на модерацию');
      onClose && onClose();
    } catch (err: any) {
      console.error(err);
      alert('Ошибка: ' + (err.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-6 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-3">
          <label className="text-sm">Тип релиза</label>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => setType('single')} className={`px-3 py-2 rounded-xl ${type === 'single' ? 'bg-[#6050ba] text-white' : 'bg-white/5'}`}>Single</button>
            <button type="button" onClick={() => setType('album')} className={`px-3 py-2 rounded-xl ${type === 'album' ? 'bg-[#6050ba] text-white' : 'bg-white/5'}`}>Album</button>
          </div>
        </div>

        <div>
          {type === 'album' ? (
            <>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Название релиза</label>
              <input value={releaseTitle} onChange={(e) => setReleaseTitle(e.target.value)} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl mb-4" />
            </>
          ) : (
            <>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Название трека</label>
              <input value={tracks[0].title} onChange={(e) => setTrackField(0, 'title', e.target.value)} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl mb-4" />
            </>
          )}

          <div className="space-y-3">
            {tracks.map((t, idx) => (
              <div key={idx} className="p-3 bg-black/20 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <div className="font-bold">Трек {idx + 1}</div>
                  {tracks.length > 1 && <button type="button" onClick={() => removeTrack(idx)} className="ml-auto text-xs text-red-400">Удалить</button>}
                </div>
                <input placeholder="Название трека" value={t.title} onChange={(e) => setTrackField(idx, 'title', e.target.value)} className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md mb-2" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">Аудио файл (или можно вставить ссылку ниже)</label>
                    <input type="file" accept="audio/*" onChange={(e) => setTrackField(idx, 'audioFile', e.target.files?.[0] || null)} className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">Ссылка на файл (Yandex/Google Disk)</label>
                    <input value={t.audioUrl || ''} onChange={(e) => setTrackField(idx, 'audioUrl', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">Обложка (файл)</label>
                    <input type="file" accept="image/*" onChange={(e) => setTrackField(idx, 'coverFile', e.target.files?.[0] || null)} className="w-full text-sm" />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 mb-1 block">Ссылка на обложку</label>
                    <input value={t.coverUrl || ''} onChange={(e) => setTrackField(idx, 'coverUrl', e.target.value)} placeholder="https://..." className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-md text-sm" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {type === 'album' && (
            <div className="mt-3">
              <button type="button" onClick={addTrack} className="px-4 py-2 bg-white/5 rounded-xl">Добавить трек</button>
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Жанры (через запятую)</label>
              <input value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="hip-hop, pop" className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl" />
            </div>
            <div>
              <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Создатель (исполнитель)</label>
              <input value={creator} onChange={(e) => setCreator(e.target.value)} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl" />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Соавторы (feat.)</label>
            <div className="space-y-2">
              {coauthors.map((c, i) => (
                <div key={i} className="flex gap-2">
                  <input value={c} onChange={(e) => setCoauthor(i, e.target.value)} placeholder="Имя соавтора" className="flex-1 px-3 py-2 bg-black/30 border border-white/10 rounded-md" />
                  <button type="button" onClick={() => removeCoauthor(i)} className="px-3 py-2 bg-red-600 rounded-md">Удалить</button>
                </div>
              ))}
              <button type="button" onClick={addCoauthor} className="mt-2 px-4 py-2 bg-white/5 rounded-xl">Добавить соавтора</button>
            </div>
          </div>

          <div className="mt-3">
            <label className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 block">Продюсер</label>
            <input value={producer} onChange={(e) => setProducer(e.target.value)} className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl" />
          </div>
        </div>

        <div className="flex gap-2">
          <button disabled={loading} className="px-4 py-2 bg-[#6050ba] rounded-xl">Отправить на модерацию</button>
          <button type="button" onClick={() => onClose && onClose()} className="px-4 py-2 bg-white/5 rounded-xl">Отмена</button>
        </div>
      </form>
    </div>
  );
}
