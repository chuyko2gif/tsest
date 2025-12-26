import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Получить сообщения тикета
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
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
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await context.params;

    // Получаем тикет БЕЗ JOIN
    const { data: ticket, error: ticketError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Проверяем роль
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
    const isOwner = ticket.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Получаем сообщения БЕЗ JOIN
    const { data: messages, error } = await supabase
      .from('ticket_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!messages || messages.length === 0) {
      return NextResponse.json({ messages: [] });
    }

    // Получаем профили отправителей ОТДЕЛЬНО
    const senderIds = [...new Set(messages.map(m => m.sender_id))];
    const { data: senders } = await supabase
      .from('profiles')
      .select('id, email, username')
      .in('id', senderIds);

    const sendersMap = new Map(senders?.map(s => [s.id, s]) || []);

    // Форматируем сообщения
    const formattedMessages = messages.map(msg => {
      const sender = sendersMap.get(msg.sender_id);
      return {
        ...msg,
        sender_email: sender?.email || null,
        sender_username: sender?.username || null
      };
    });

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error in GET /api/support/tickets/[id]/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Отправить сообщение
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
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
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: ticketId } = await context.params;
    const { message, images } = await request.json();

    if (!message?.trim() && (!images || images.length === 0)) {
      return NextResponse.json({ error: 'Message or image is required' }, { status: 400 });
    }

    // Получаем тикет
    const { data: ticket } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Получаем роль
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, email, nickname')
      .eq('id', user.id)
      .single();

    console.log('Profile data:', profile, 'Error:', profileError);

    const isAdmin = profile?.role === 'admin' || profile?.role === 'owner';
    
    console.log('User role:', profile?.role, 'isAdmin:', isAdmin, 'user.id:', user.id);

    // Создаём сообщение
    const { data: newMessage, error } = await supabase
      .from('ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        message: message.trim(),
        is_admin: isAdmin,
        images: images || []
      })
      .select()
      .single();

    console.log('Created message with is_admin:', isAdmin, 'Message ID:', newMessage?.id);

    if (error) {
      console.error('Error creating message:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Обновляем тикет и меняем статус
    // Если админ отвечает - статус "ожидание", если пользователь - "в работе"
    const updateData: any = {
      updated_at: new Date().toISOString(),
      last_message_at: new Date().toISOString()
    };

    if (isAdmin) {
      updateData.last_admin_message_at = new Date().toISOString();
      updateData.status = 'pending'; // Ожидание ответа от пользователя
    } else {
      updateData.status = 'in_progress'; // В работе - пользователь написал
    }

    await supabase
      .from('support_tickets')
      .update(updateData)
      .eq('id', ticketId);

    // Форматируем ответ с профилем
    const formattedMessage = {
      ...newMessage,
      sender_email: profile?.email || null,
      sender_username: profile?.nickname || null
    };

    return NextResponse.json({ message: formattedMessage });
  } catch (error) {
    console.error('Error in POST /api/support/tickets/[id]/messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
