import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { isTyping, isAdmin } = await request.json();
    const { id: ticketId } = await params;

    if (isTyping) {
      // Обновляем или вставляем статус печати
      const { error } = await supabase
        .from('typing_status')
        .upsert({
          ticket_id: ticketId,
          user_id: user.id,
          is_admin: isAdmin || false,
          last_activity: new Date().toISOString()
        }, {
          onConflict: 'ticket_id,user_id'
        });

      if (error) {
        console.error('Error updating typing status:', error);
      }
    } else {
      // Удаляем статус печати
      const { error } = await supabase
        .from('typing_status')
        .delete()
        .eq('ticket_id', ticketId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting typing status:', error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in typing status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');

    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await params;

    // Сначала очищаем старые записи (старше 5 секунд)
    try {
      await supabase.rpc('clean_old_typing_status');
    } catch (err) {
      // Игнорируем ошибки очистки
      console.log('Clean typing status error:', err);
    }

    // Получаем статус печати (исключая текущего пользователя)
    const { data: typingStatus } = await supabase
      .from('typing_status')
      .select('*')
      .eq('ticket_id', ticketId)
      .neq('user_id', user.id)
      .gte('last_activity', new Date(Date.now() - 5000).toISOString())
      .single();

    if (typingStatus) {
      // Получаем информацию о пользователе
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, nickname, email')
        .eq('id', typingStatus.user_id)
        .single();

      const displayName = profile?.nickname || profile?.username || profile?.email?.split('@')[0] || 'Пользователь';
      
      console.log('Typing status found:', {
        userId: typingStatus.user_id,
        isAdmin: typingStatus.is_admin,
        displayName,
        profile
      });

      return NextResponse.json({ 
        isTyping: true,
        isAdmin: typingStatus.is_admin,
        username: displayName
      });
    }

    return NextResponse.json({ 
      isTyping: false,
      isAdmin: false,
      username: null
    });
  } catch (error) {
    console.error('Error getting typing status:', error);
    return NextResponse.json({ isTyping: false });
  }
}
