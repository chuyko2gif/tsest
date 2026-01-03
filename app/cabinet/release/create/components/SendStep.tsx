import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { showSuccessToast, showErrorToast } from '@/lib/utils/showToast';

interface SendStepProps {
  releaseTitle: string;
  artistName: string;
  genre: string;
  tracksCount: number;
  coverFile: File | null;
  collaborators: string[];
  subgenres: string[];
  releaseDate: string | null;
  selectedPlatforms: number;
  agreedToContract: boolean;
  focusTrack: string;
  focusTrackPromo: string;
  albumDescription: string;
  promoPhotos: string[];
  tracks: Array<{
    title: string;
    link: string;
    audioFile?: File | null;
    audioMetadata?: {
      format: string;
      duration?: number;
      bitrate?: string;
      sampleRate?: string;
      size: number;
    } | null;
    hasDrugs: boolean;
    lyrics: string;
    language: string;
    version?: string;
    producers?: string[];
    featuring?: string[];
  }>;
  platforms: string[];
  countries: string[];
  draftId?: string | null;
  onBack: () => void;
}

export default function SendStep({ 
  releaseTitle,
  artistName, 
  genre, 
  tracksCount,
  coverFile,
  selectedPlatforms,
  agreedToContract,
  collaborators,
  subgenres,
  releaseDate,
  focusTrack,
  focusTrackPromo,
  albumDescription,
  promoPhotos,
  tracks,
  platforms,
  countries,
  draftId,
  onBack 
}: SendStepProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Явный набор обязательных проверок (promo не включён)
  const requiredChecks = [
    {
      name: 'Релиз',
      isValid: !!(releaseTitle.trim() && genre && coverFile && releaseDate),
      issues: [
        !releaseTitle.trim() && 'Не указано название релиза',
        !genre && 'Не выбран жанр',
        !coverFile && 'Не загружена обложка',
        !releaseDate && 'Не указана дата релиза'
      ].filter(Boolean)
    },
    {
      name: 'Треклист',
      isValid: tracksCount > 0,
      issues: tracksCount === 0 ? ['Не добавлено ни одного трека'] : []
    },
    {
      name: 'Договор',
      isValid: agreedToContract,
      issues: !agreedToContract ? ['Не принят договор'] : []
    },
    {
      name: 'Площадки',
      isValid: selectedPlatforms > 0,
      issues: selectedPlatforms === 0 ? ['Не выбрано ни одной площадки'] : []
    },
  ];

  const allValid = requiredChecks.every(c => c.isValid);
  const invalidSteps = requiredChecks.filter(c => !c.isValid);

  if (typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.debug('[SendStep exclusive] invalidSteps:', invalidSteps.map(s => s.name));
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center ring-1 ring-white/10">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-300">
              <path d="M22 2L11 13"/>
              <path d="M22 2L15 22L11 13L2 9L22 2z"/>
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">Отправка на модерацию</h2>
            <p className="text-sm text-zinc-500 mt-1">Проверьте заполнение всех шагов</p>
          </div>
        </div>
      </div>
      
      {/* Статус проверки шагов */}
      <div className="mb-6 p-5 bg-white/[0.02] border border-white/5 rounded-xl">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-[#9d8df1]">
            <path d="M9 11l3 3L22 4" strokeWidth="2"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2"/>
          </svg>
          Проверка заполнения
        </h3>
        
        <div className="space-y-3">
          {requiredChecks.map((step, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded-lg border transition ${
                step.isValid 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              <div className="flex items-center gap-2">
                {step.isValid ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-emerald-400 flex-shrink-0">
                    <polyline points="20 6 9 17 4 12" strokeWidth="2"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
                    <line x1="15" y1="9" x2="9" y2="15" strokeWidth="2"/>
                    <line x1="9" y1="9" x2="15" y2="15" strokeWidth="2"/>
                  </svg>
                )}
                <div className="flex-1">
                  <span className={`font-bold ${
                    step.isValid ? 'text-emerald-300' : 'text-red-300'
                  }`}>
                    {step.name}
                  </span>
                  {step.issues.length > 0 && (
                    <div className="mt-1 text-xs text-red-400">
                      {step.issues.map((issue, i) => (
                        <div key={i}>• {issue}</div>
                      ))}
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  step.isValid ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {step.isValid ? 'Готово' : 'Требуется'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Предупреждение если не все заполнено */}
      {!allValid && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-red-400 flex-shrink-0 mt-0.5">
              <circle cx="12" cy="12" r="10" strokeWidth="2"/>
              <line x1="12" y1="8" x2="12" y2="12" strokeWidth="2"/>
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2"/>
            </svg>
            <div>
              <div className="text-red-300 font-bold mb-1">Невозможно отправить релиз</div>
              <div className="text-sm text-red-400">
                Заполните все обязательные поля в следующих разделах: {invalidSteps.map(s => s.name).join(', ')}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 pt-6 border-white/10 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between">
        <button onClick={onBack} className="w-full sm:w-auto px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="15 18 9 12 15 6" strokeWidth="2"/></svg>
          Назад
        </button>
        <button 
          onClick={async () => {
            if (!allValid || submitting) return;
            
            setSubmitting(true);
            
            try {
              if (!supabase) throw new Error('Supabase не инициализирован');
              
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) throw new Error('Пользователь не авторизован');
              
              // Загрузка обложки
              let coverUrl = '';
              if (coverFile) {
                const fileExt = coverFile.name.split('.').pop();
                const fileName = `${user.id}/${Date.now()}.${fileExt}`;
                
                const { data: uploadData, error: uploadError } = await supabase.storage
                  .from('release-covers')
                  .upload(fileName, coverFile, { contentType: coverFile.type, upsert: true });
                
                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = supabase.storage
                  .from('release-covers')
                  .getPublicUrl(fileName);
                  
                coverUrl = publicUrl;
              }
              
              // Загрузка аудиофайлов треков
              console.log('📤 Загружаем аудиофайлы треков (Exclusive)...');
              const tracksWithUrls = await Promise.all(tracks.map(async (track, index) => {
                // Если есть audioFile, загружаем его
                if (track.audioFile) {
                  try {
                    const audioFileExt = track.audioFile.name.split('.').pop();
                    const audioFileName = `${user.id}/${Date.now()}-track-${index}.${audioFileExt}`;
                    
                    const { data: audioUploadData, error: audioUploadError } = await supabase.storage
                      .from('release-audio')
                      .upload(audioFileName, track.audioFile, {
                        contentType: track.audioFile.type,
                        upsert: true
                      });
                    
                    if (audioUploadError) {
                      console.error(`Ошибка загрузки аудио для трека ${index}:`, audioUploadError);
                      return {
                        title: track.title,
                        link: track.link || '',
                        hasDrugs: track.hasDrugs,
                        lyrics: track.lyrics,
                        language: track.language,
                        version: track.version,
                        producers: track.producers,
                        featuring: track.featuring,
                        audioMetadata: track.audioMetadata,
                      };
                    }
                    
                    const { data: { publicUrl: audioUrl } } = supabase.storage
                      .from('release-audio')
                      .getPublicUrl(audioFileName);
                    
                    console.log(`✅ Аудио для трека ${index} загружено: ${audioUrl}`);
                    
                    return {
                      title: track.title,
                      link: audioUrl,
                      audio_url: audioUrl,
                      hasDrugs: track.hasDrugs,
                      lyrics: track.lyrics,
                      language: track.language,
                      version: track.version,
                      producers: track.producers,
                      featuring: track.featuring,
                      audioMetadata: track.audioMetadata,
                    };
                  } catch (err) {
                    console.error(`Ошибка при загрузке аудио для трека ${index}:`, err);
                    return {
                      title: track.title,
                      link: track.link || '',
                      hasDrugs: track.hasDrugs,
                      lyrics: track.lyrics,
                      language: track.language,
                      version: track.version,
                      producers: track.producers,
                      featuring: track.featuring,
                      audioMetadata: track.audioMetadata,
                    };
                  }
                }
                
                return {
                  title: track.title,
                  link: track.link || '',
                  hasDrugs: track.hasDrugs,
                  lyrics: track.lyrics,
                  language: track.language,
                  version: track.version,
                  producers: track.producers,
                  featuring: track.featuring,
                  audioMetadata: track.audioMetadata,
                };
              }));
              
              console.log('✅ Все аудиофайлы загружены (Exclusive)');
              
              // Создание или обновление релиза в базе (Exclusive - бесплатные релизы)
              const releaseData = {
                user_id: user.id,
                title: releaseTitle,
                artist_name: artistName || user.user_metadata?.display_name || user.email?.split('@')[0] || 'Artist',
                cover_url: coverUrl,
                genre: genre,
                subgenres: subgenres,
                release_date: releaseDate,
                collaborators: collaborators,
                tracks: tracksWithUrls,
                countries: countries,
                contract_agreed: agreedToContract,
                contract_agreed_at: agreedToContract ? new Date().toISOString() : null,
                platforms: platforms,
                focus_track: focusTrack,
                focus_track_promo: focusTrackPromo,
                album_description: albumDescription,
                promo_photos: promoPhotos,
                status: 'pending',
                status_updated_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              
              // Если есть draftId, обновляем черновик, иначе создаем новый
              if (draftId) {
                const { error } = await supabase
                  .from('releases_exclusive')
                  .update(releaseData)
                  .eq('id', draftId)
                  .eq('user_id', user.id);
                
                if (error) throw error;
              } else {
                const { error } = await supabase
                  .from('releases_exclusive')
                  .insert([releaseData]);
                
                if (error) throw error;
              }
              
              // Отладка: проверяем данные треков
              console.log('Треки для сохранения (Exclusive):', JSON.stringify(tracksWithUrls, null, 2));
              
              // Удаляем черновик из releases_exclusive (если был создан)
              if (draftId) {
                try {
                  console.log('🗑️ Удаляем черновик:', draftId);
                  await supabase
                    .from('releases_exclusive')
                    .delete()
                    .eq('id', draftId);
                  console.log('✅ Черновик удален');
                } catch (draftErr) {
                  console.warn('Не удалось удалить черновик:', draftErr);
                }
              }
              
              // Удаляем возможные оставшиеся черновики (releases_basic), которые могли быть созданы на этапе 1
              try {
                await supabase
                  .from('releases_basic')
                  .delete()
                  .eq('user_id', user.id)
                  .eq('status', 'draft')
                  .eq('title', releaseTitle);
              } catch (cleanupErr) {
                console.warn('Не удалось удалить оставшиеся черновики:', cleanupErr);
              }

              showSuccessToast('Релиз успешно отправлен на модерацию!', 5000);
              setTimeout(() => router.push('/cabinet'), 1500);
            } catch (error: any) {
              console.error('Ошибка при отправке релиза:', error);
              
              // Формируем детальное сообщение об ошибке
              let errorMessage = 'Произошла ошибка при отправке релиза.';
              
              if (error?.message) {
                errorMessage += '\n\nДетали: ' + error.message;
              }
              
              if (error?.code) {
                errorMessage += '\nКод ошибки: ' + error.code;
              }
              
              if (error?.details) {
                errorMessage += '\nПодробности: ' + error.details;
              }
              
              errorMessage += '\n\nПроверьте консоль браузера (F12) для получения дополнительной информации.';
              
              showErrorToast('Ошибка при отправке релиза', 6000);
              console.error(errorMessage);
            } finally {
              setSubmitting(false);
            }
          }}
          disabled={!allValid || submitting}
          className={`w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold sm:font-black transition flex items-center justify-center gap-2 ${
            allValid && !submitting
              ? 'bg-emerald-500 hover:bg-emerald-400 text-black cursor-pointer' 
              : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="22" y1="2" x2="11" y2="13" strokeWidth="2"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2" strokeWidth="2"/>
          </svg>
          {submitting ? 'Отправка...' : 'Отправить на модерацию'}
        </button>
      </div>
    </div>
  );
}
