import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Доступ к глобальному хранилищу токенов
declare global {
  var resetTokensStore: Map<string, { email: string, expiresAt: number }> | undefined;
}

const resetTokens = globalThis.resetTokensStore ?? new Map<string, { email: string, expiresAt: number }>();

if (process.env.NODE_ENV !== 'production') {
  globalThis.resetTokensStore = resetTokens;
}

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Токен и новый пароль обязательны' },
        { status: 400 }
      );
    }

    // Проверяем токен в нашем хранилище
    console.log('Проверка токена:', token);
    console.log('Всего токенов в памяти:', resetTokens.size);
    console.log('Доступные токены:', Array.from(resetTokens.keys()));
    
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return NextResponse.json(
        { error: 'Недействительный или истекший токен восстановления' },
        { status: 400 }
      );
    }
    
    // Проверяем не истек ли токен
    if (tokenData.expiresAt < Date.now()) {
      resetTokens.delete(token);
      return NextResponse.json(
        { error: 'Токен восстановления истек. Запросите новую ссылку.' },
        { status: 400 }
      );
    }

    // Создаем admin клиент для сброса пароля
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Находим пользователя по email
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Ошибка получения пользователей:', listError);
      return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
    
    const user = users?.find(u => u.email === tokenData.email);
    
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }
    
    // Обновляем пароль через Admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    );

    if (updateError) {
      console.error('Ошибка обновления пароля:', updateError);
      return NextResponse.json(
        { error: 'Не удалось обновить пароль' },
        { status: 500 }
      );
    }

    // Удаляем использованный токен
    resetTokens.delete(token);
    
    console.log('Пароль успешно обновлен для:', tokenData.email);
    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error('Ошибка сброса пароля:', error);
    return NextResponse.json(
      { error: error.message || 'Произошла ошибка при сбросе пароля' },
      { status: 500 }
    );
  }
}
