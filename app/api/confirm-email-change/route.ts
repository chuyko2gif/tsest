import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    
    // Используем правильный базовый URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thqlabel.ru';
    
    if (!token) {
      return NextResponse.redirect(`${baseUrl}/change-email?error=missing_token`);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Ищем токен в базе
    const { data: tokenData, error: tokenError } = await supabase
      .from('email_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'email_change')
      .eq('used', false)
      .single();
    
    if (tokenError || !tokenData) {
      console.error('Токен не найден:', tokenError);
      return NextResponse.redirect(`${baseUrl}/change-email?error=invalid_token`);
    }
    
    // Проверяем срок действия
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.redirect(`${baseUrl}/change-email?error=expired_token`);
    }
    
    const newEmail = tokenData.new_email;
    const userId = tokenData.user_id;
    
    if (!newEmail || !userId) {
      return NextResponse.redirect(`${baseUrl}/change-email?error=invalid_data`);
    }
    
    // Меняем email пользователя через admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { email: newEmail, email_confirm: true }
    );
    
    if (updateError) {
      console.error('Ошибка обновления email:', updateError);
      return NextResponse.redirect(`${baseUrl}/change-email?error=update_failed`);
    }
    
    // Обновляем профиль
    await supabase
      .from('profiles')
      .update({ 
        email: newEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    
    // Помечаем токен как использованный
    await supabase
      .from('email_tokens')
      .update({ used: true })
      .eq('token', token);
    
    console.log('Email успешно изменён на:', newEmail);
    
    // Перенаправляем на страницу успеха
    return NextResponse.redirect(`${baseUrl}/change-email?success=true&email=${encodeURIComponent(newEmail)}`);

  } catch (error: any) {
    console.error('Ошибка подтверждения смены email:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || 'https://thqlabel.ru'}/change-email?error=server_error`);
  }
}
