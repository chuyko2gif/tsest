import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Доступ к глобальному хранилищу токенов верификации
declare global {
  var verificationTokensStore: Map<string, { email: string, password: string, nickname: string, expiresAt: number }> | undefined;
}

const verificationTokens = globalThis.verificationTokensStore ?? new Map<string, { email: string, password: string, nickname: string, expiresAt: number }>();

if (process.env.NODE_ENV !== 'production') {
  globalThis.verificationTokensStore = verificationTokens;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth?error=invalid_token', request.url));
    }

    // Проверяем токен
    const userData = verificationTokens.get(token);
    
    if (!userData) {
      return NextResponse.redirect(new URL('/auth?error=token_expired', request.url));
    }

    // Проверяем не истек ли токен
    if (userData.expiresAt < Date.now()) {
      verificationTokens.delete(token);
      return NextResponse.redirect(new URL('/auth?error=token_expired', request.url));
    }

    // Создаем пользователя в Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Email сразу подтвержден
      user_metadata: {
        nickname: userData.nickname,
        display_name: userData.nickname,
        full_name: userData.nickname
      }
    });

    if (authError) {
      console.error('Ошибка создания пользователя:', authError);
      verificationTokens.delete(token);
      return NextResponse.redirect(new URL('/auth?error=registration_failed', request.url));
    }

    // Удаляем использованный токен
    verificationTokens.delete(token);
    
    console.log('Пользователь успешно создан:', userData.email);
    
    // Перенаправляем на страницу входа с сообщением об успехе
    return NextResponse.redirect(new URL('/auth?verified=true', request.url));

  } catch (error: any) {
    console.error('Ошибка верификации email:', error);
    return NextResponse.redirect(new URL('/auth?error=verification_failed', request.url));
  }
}
