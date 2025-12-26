import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/releases - получить все релизы текущего пользователя из обеих таблиц (любой статус)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    
    // Создаем клиент с токеном пользователя
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Получаем релизы из ОБЕИХ таблиц (releases_basic и releases_exclusive)
    const [basicResult, exclusiveResult] = await Promise.all([
      supabase
        .from('releases_basic')
        .select('id, title, artist_name, cover_url, status, created_at, genre')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('releases_exclusive')
        .select('id, title, artist_name, cover_url, status, created_at, genre')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    if (basicResult.error) {
      console.error('Error fetching basic releases:', basicResult.error);
    }
    
    if (exclusiveResult.error) {
      console.error('Error fetching exclusive releases:', exclusiveResult.error);
    }

    // Объединяем релизы из обеих таблиц
    const basicReleases = (basicResult.data || []).map(r => ({
      id: r.id,
      title: r.title,
      artist: r.artist_name,
      artwork_url: r.cover_url,
      status: r.status,
      created_at: r.created_at,
      genre: r.genre,
      release_type: 'basic'
    }));

    const exclusiveReleases = (exclusiveResult.data || []).map(r => ({
      id: r.id,
      title: r.title,
      artist: r.artist_name,
      artwork_url: r.cover_url,
      status: r.status,
      created_at: r.created_at,
      genre: r.genre,
      release_type: 'exclusive'
    }));

    // Объединяем и сортируем по дате создания
    const allReleases = [...basicReleases, ...exclusiveReleases].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return NextResponse.json({ releases: allReleases });
  } catch (error) {
    console.error('Error in releases API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
