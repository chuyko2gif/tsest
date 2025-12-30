import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const releaseId = searchParams.get('releaseId');
    const releaseType = searchParams.get('releaseType') as 'basic' | 'exclusive';
    const trackIndex = searchParams.get('trackIndex');

    if (!releaseId || !releaseType || trackIndex === null) {
      return NextResponse.json(
        { error: 'Недостаточно параметров' },
        { status: 400 }
      );
    }

    // Создаем клиент Supabase с service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Получаем данные релиза
    const tableName = releaseType === 'basic' ? 'releases_basic' : 'releases_exclusive';
    const { data: release, error: releaseError } = await supabase
      .from(tableName)
      .select('tracks, status, user_id')
      .eq('id', releaseId)
      .single();

    if (releaseError || !release) {
      return NextResponse.json(
        { error: 'Релиз не найден' },
        { status: 404 }
      );
    }

    // Проверяем авторизацию пользователя
    const authHeader = request.headers.get('authorization');
    let isAuthorized = false;
    let isOwner = false;
    let isAdmin = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        isAuthorized = true;
        isOwner = user.id === release.user_id;

        // Проверяем, является ли пользователь админом
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
      }
    }

    // Логика доступа:
    // 1. Админы могут слушать всегда
    // 2. Владелец релиза может слушать всегда
    // 3. Остальные пользователи могут слушать только published релизы
    if (!isAdmin && !isOwner) {
      if (release.status !== 'published') {
        return NextResponse.json(
          { error: 'Доступ запрещен. Релиз не опубликован.' },
          { status: 403 }
        );
      }
    }

    // Получаем трек
    const tracks = Array.isArray(release.tracks) ? release.tracks : [];
    const trackIdx = parseInt(trackIndex, 10);

    if (trackIdx < 0 || trackIdx >= tracks.length) {
      return NextResponse.json(
        { error: 'Трек не найден' },
        { status: 404 }
      );
    }

    const track = tracks[trackIdx];
    // Поддержка разных полей URL аудио
    const audioUrl = track.link || track.audio_url || track.audioFile;

    if (!audioUrl) {
      return NextResponse.json(
        { error: 'URL аудио не найден' },
        { status: 404 }
      );
    }

    // Если это Supabase Storage URL, получаем signed URL
    if (audioUrl.includes('supabase')) {
      try {
        // Извлекаем путь из URL
        const urlParts = audioUrl.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const [bucket, ...pathParts] = urlParts[1].split('/');
          const path = pathParts.join('/');

          // Создаем signed URL с ограниченным временем жизни (1 час)
          const { data: signedUrlData, error: signedUrlError } = await supabase
            .storage
            .from(bucket)
            .createSignedUrl(path, 3600); // 1 час

          if (signedUrlError) {
            console.error('Error creating signed URL:', signedUrlError);
            // Если не получилось создать signed URL, используем прямую ссылку
            return NextResponse.redirect(audioUrl);
          }

          // Перенаправляем на signed URL для стриминга
          return NextResponse.redirect(signedUrlData.signedUrl);
        }
      } catch (error) {
        console.error('Error processing Supabase URL:', error);
      }
    }

    // Для остальных URL просто перенаправляем
    return NextResponse.redirect(audioUrl);

  } catch (error) {
    console.error('Error streaming audio:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении аудио' },
      { status: 500 }
    );
  }
}
