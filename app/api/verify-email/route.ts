import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Получаем базовый URL для редиректов
function getBaseUrl(request: NextRequest): string {
  // Приоритет: NEXT_PUBLIC_APP_URL > host header > request.url
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  const host = request.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth?error=invalid_token', baseUrl));
    }

    // Создаем admin клиент
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Получаем токен из базы данных
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'verification')
      .eq('used', false)
      .single();
    
    if (tokenError || !tokenData) {
      console.error('Токен не найден:', tokenError);
      return NextResponse.redirect(new URL('/auth?error=token_expired', baseUrl));
    }

    // Проверяем не истек ли токен
    if (new Date(tokenData.expires_at) < new Date()) {
      // Удаляем истекший токен
      await supabase.from('email_tokens').delete().eq('id', tokenData.id);
      return NextResponse.redirect(new URL('/auth?error=token_expired', baseUrl));
    }

    // Создаем пользователя в Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: tokenData.email,
      password: tokenData.password_hash,
      email_confirm: true, // Email сразу подтвержден
      user_metadata: {
        nickname: tokenData.nickname,
        display_name: tokenData.nickname,
        full_name: tokenData.nickname
      }
    });

    if (authError) {
      console.error('Ошибка создания пользователя:', authError);
      // Помечаем токен как использованный даже при ошибке
      await supabase.from('email_tokens').update({ used: true }).eq('id', tokenData.id);
      return NextResponse.redirect(new URL('/auth?error=registration_failed', baseUrl));
    }

    // Помечаем токен как использованный
    await supabase.from('email_tokens').update({ used: true }).eq('id', tokenData.id);
    
    console.log('Пользователь успешно создан:', tokenData.email);
    
    // Перенаправляем на страницу входа с сообщением об успехе
    return NextResponse.redirect(new URL('/auth?verified=true', baseUrl));

  } catch (error: any) {
    console.error('Ошибка верификации email:', error);
    return NextResponse.redirect(new URL('/auth?error=verification_failed', baseUrl));
  }
}
