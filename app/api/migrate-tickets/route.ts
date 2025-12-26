import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// ВРЕМЕННЫЙ ЭНДПОИНТ ДЛЯ МИГРАЦИИ
// После выполнения удалите этот файл!

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Добавляем колонки (если их нет)
    console.log('Adding columns...');
    const alterTableSQL = `
      ALTER TABLE public.support_tickets 
      ADD COLUMN IF NOT EXISTS user_email TEXT,
      ADD COLUMN IF NOT EXISTS user_nickname TEXT,
      ADD COLUMN IF NOT EXISTS user_telegram TEXT,
      ADD COLUMN IF NOT EXISTS user_avatar TEXT,
      ADD COLUMN IF NOT EXISTS user_role TEXT;
    `;

    // 2. Обновляем существующие тикеты
    console.log('Updating existing tickets...');
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('id, user_id');

    if (ticketsError) {
      throw ticketsError;
    }

    let updated = 0;
    for (const ticket of tickets || []) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, nickname, telegram, avatar, role')
        .eq('id', ticket.user_id)
        .single();

      if (profile) {
        await supabase
          .from('support_tickets')
          .update({
            user_email: profile.email,
            user_nickname: profile.nickname,
            user_telegram: profile.telegram,
            user_avatar: profile.avatar,
            user_role: profile.role || 'basic'
          })
          .eq('id', ticket.id);
        updated++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Migration completed. Updated ${updated} tickets.`,
      instructions: 'Теперь удалите этот файл: app/api/migrate-tickets/route.ts'
    });

  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
