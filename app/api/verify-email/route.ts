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
  console.log('=== VERIFY-EMAIL API CALLED ===');
  console.log('Full URL:', request.url);
  console.log('BaseUrl:', baseUrl);
  
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    console.log('Token from URL:', token);
    
    if (!token) {
      console.log('ERROR: No token in URL');
      return NextResponse.redirect(new URL('/auth?error=invalid_token', baseUrl));
    }

    // Создаем admin клиент
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Сначала проверим ВСЕ токены в базе для дебага
    const { data: allTokens } = await supabase
      .from('email_tokens')
      .select('token, email, used, expires_at')
      .eq('token_type', 'verification');
    console.log('All verification tokens in DB:', JSON.stringify(allTokens, null, 2));
    
    // Получаем токен из базы данных
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'verification')
      .eq('used', false)
      .single();
    
    console.log('Token lookup result:', tokenData ? 'FOUND' : 'NOT FOUND');
    console.log('Token error:', tokenError);
    
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
        full_name: tokenData.nickname,
        telegram: tokenData.telegram || null
      }
    });

    if (authError) {
      console.error('Ошибка создания пользователя:', authError);
      // Помечаем токен как использованный даже при ошибке
      await supabase.from('email_tokens').update({ used: true }).eq('id', tokenData.id);
      return NextResponse.redirect(new URL('/auth?error=registration_failed', baseUrl));
    }

    // Явно создаём профиль (fallback если триггер не сработал)
    if (authData?.user) {
      const memberId = 'THQ-' + Math.floor(1000 + Math.random() * 9000).toString();
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authData.user.id,
          email: tokenData.email,
          nickname: tokenData.nickname || tokenData.email.split('@')[0],
          telegram: tokenData.telegram || null,
          member_id: memberId,
          role: 'basic',
          balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      
      if (profileError) {
        console.error('Ошибка создания профиля:', profileError);
        // Продолжаем, профиль может быть создан триггером
      } else {
        console.log('Профиль создан:', tokenData.email, 'member_id:', memberId);
      }
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
