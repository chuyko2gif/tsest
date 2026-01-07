import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

// PATCH - Обновить статус заявки (для админов)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: withdrawalId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Проверяем права админа
    const { data: adminProfile } = await supabaseAdmin
      .from('profiles')
      .select('role, email')
      .eq('id', user.id)
      .single();

    if (!adminProfile || !['admin', 'owner'].includes(adminProfile.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const body = await request.json();
    const { status, adminComment } = body;

    // Валидация статуса
    const validStatuses = ['approved', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Недопустимый статус. Допустимые: ${validStatuses.join(', ')}` 
      }, { status: 400 });
    }

    // Получаем заявку
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }

    // Проверяем можно ли менять статус
    if (withdrawal.status === 'completed') {
      return NextResponse.json({ 
        error: 'Заявка уже завершена' 
      }, { status: 400 });
    }

    if (withdrawal.status === 'rejected') {
      return NextResponse.json({ 
        error: 'Заявка уже отклонена' 
      }, { status: 400 });
    }

    const amount = parseFloat(withdrawal.amount);
    const userId = withdrawal.user_id;

    // Получаем текущие балансы
    const [profileResult, balanceResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('balance, display_name, email')
        .eq('id', userId)
        .single(),
      supabaseAdmin
        .from('user_balances')
        .select('balance, frozen_balance, total_withdrawn')
        .eq('user_id', userId)
        .single()
    ]);

    const profileBalance = parseFloat(profileResult.data?.balance) || 0;
    const userBalance = parseFloat(balanceResult.data?.balance) || 0;
    const frozenBalance = parseFloat(balanceResult.data?.frozen_balance) || 0;
    const totalWithdrawn = parseFloat(balanceResult.data?.total_withdrawn) || 0;

    let transactionType: string;
    let transactionDescription: string;
    let newProfileBalance = profileBalance;
    let newUserBalance = userBalance;
    let newFrozenBalance = frozenBalance;
    let newTotalWithdrawn = totalWithdrawn;

    if (status === 'rejected') {
      // При отклонении - возвращаем деньги на баланс
      transactionType = 'unfreeze';
      transactionDescription = `Возврат средств - заявка на вывод отклонена${adminComment ? `: ${adminComment}` : ''}`;
      newProfileBalance = profileBalance + amount;
      newUserBalance = userBalance + amount;
      newFrozenBalance = Math.max(0, frozenBalance - amount);
    } else if (status === 'completed') {
      // При завершении - средства уходят из системы
      transactionType = 'withdrawal';
      transactionDescription = `Вывод средств завершён: ${amount.toLocaleString('ru')} ₽`;
      newFrozenBalance = Math.max(0, frozenBalance - amount);
      newTotalWithdrawn = totalWithdrawn + amount;
    } else if (status === 'approved') {
      // При одобрении - просто меняем статус, деньги уже заморожены
      transactionType = 'freeze'; // Подтверждение заморозки
      transactionDescription = `Заявка на вывод одобрена: ${amount.toLocaleString('ru')} ₽`;
    }

    // Обновляем заявку
    const { data: updatedWithdrawal, error: updateError } = await supabaseAdmin
      .from('withdrawal_requests')
      .update({
        status,
        admin_comment: adminComment || null,
        processed_at: new Date().toISOString()
      })
      .eq('id', withdrawalId)
      .select()
      .single();

    if (updateError) {
      console.error('Update withdrawal error:', updateError);
      return NextResponse.json({ error: 'Ошибка обновления заявки' }, { status: 500 });
    }

    // Обновляем балансы если нужно
    if (status === 'rejected' || status === 'completed') {
      // Обновляем profiles
      await supabaseAdmin
        .from('profiles')
        .update({ balance: newProfileBalance })
        .eq('id', userId);

      // Обновляем user_balances
      await supabaseAdmin
        .from('user_balances')
        .update({
          balance: newUserBalance,
          frozen_balance: newFrozenBalance,
          total_withdrawn: newTotalWithdrawn,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);
    }

    // Создаём транзакцию
    const transactionData = {
      user_id: userId,
      type: transactionType!,
      amount: amount,
      currency: 'RUB',
      balance_before: status === 'rejected' ? profileBalance : userBalance,
      balance_after: status === 'rejected' ? newProfileBalance : newUserBalance,
      status: 'completed',
      description: transactionDescription!,
      reference_id: withdrawalId,
      reference_table: 'withdrawal_requests',
      admin_id: user.id,
      admin_comment: adminComment || null,
      metadata: {
        withdrawal_request_id: withdrawalId,
        new_status: status,
        admin_email: adminProfile.email,
        processed_at: new Date().toISOString()
      }
    };

    const { data: transaction } = await supabaseAdmin
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    return NextResponse.json({
      success: true,
      withdrawal: updatedWithdrawal,
      transaction,
      balances: {
        profileBalance: newProfileBalance,
        userBalance: newUserBalance,
        frozenBalance: newFrozenBalance,
        totalWithdrawn: newTotalWithdrawn
      }
    });

  } catch (error: any) {
    console.error('Update withdrawal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Отменить заявку (для пользователя, только pending)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: withdrawalId } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Получаем заявку
    const { data: withdrawal, error: fetchError } = await supabaseAdmin
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: 'Заявка не найдена' }, { status: 404 });
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Можно отменить только заявки в статусе "В обработке"' 
      }, { status: 400 });
    }

    const amount = parseFloat(withdrawal.amount);

    // Получаем текущие балансы
    const [profileResult, balanceResult] = await Promise.all([
      supabaseAdmin
        .from('profiles')
        .select('balance')
        .eq('id', user.id)
        .single(),
      supabaseAdmin
        .from('user_balances')
        .select('balance, frozen_balance')
        .eq('user_id', user.id)
        .single()
    ]);

    const profileBalance = parseFloat(profileResult.data?.balance) || 0;
    const userBalance = parseFloat(balanceResult.data?.balance) || 0;
    const frozenBalance = parseFloat(balanceResult.data?.frozen_balance) || 0;

    // Возвращаем средства
    const newProfileBalance = profileBalance + amount;
    const newUserBalance = userBalance + amount;
    const newFrozenBalance = Math.max(0, frozenBalance - amount);

    // Удаляем заявку
    await supabaseAdmin
      .from('withdrawal_requests')
      .delete()
      .eq('id', withdrawalId);

    // Обновляем балансы
    await supabaseAdmin
      .from('profiles')
      .update({ balance: newProfileBalance })
      .eq('id', user.id);

    await supabaseAdmin
      .from('user_balances')
      .update({
        balance: newUserBalance,
        frozen_balance: newFrozenBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);

    // Создаём транзакцию отмены
    await supabaseAdmin
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'unfreeze',
        amount: amount,
        currency: 'RUB',
        balance_before: profileBalance,
        balance_after: newProfileBalance,
        status: 'completed',
        description: 'Отмена заявки на вывод пользователем',
        reference_id: withdrawalId,
        reference_table: 'withdrawal_requests',
        metadata: {
          cancelled_by_user: true,
          cancelled_at: new Date().toISOString()
        }
      });

    return NextResponse.json({
      success: true,
      message: 'Заявка отменена, средства возвращены на баланс',
      newBalance: newProfileBalance
    });

  } catch (error: any) {
    console.error('Cancel withdrawal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
