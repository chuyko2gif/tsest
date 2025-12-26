import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Создает Supabase клиент для использования в API routes
 * Получает токен из заголовка Authorization
 */
export async function createSupabaseClient(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  // Получаем токен из заголовка Authorization
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), client: null };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
  
  // Проверяем валидность токена
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), client: null };
  }
  
  return { client: supabase, user, error: null };
}
