import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Supabase admin client
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stripe client
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

// ============================================
// STRIPE WEBHOOK
// Настроить в Stripe Dashboard:
// URL: https://yourdomain.com/api/payments/webhook/stripe
// Events: checkout.session.completed
// ============================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Проверяем подпись
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Stripe signature verification failed:', err.message);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Stripe webhook received:', event.type);

    // Обрабатываем успешную оплату
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      
      const orderId = session.metadata?.order_id;
      if (!orderId) {
        console.error('No order_id in session metadata');
        return NextResponse.json({ error: 'No order_id' }, { status: 400 });
      }

      // Находим ордер
      const { data: order, error: orderError } = await supabaseAdmin
        .from('payment_orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Order not found:', orderId);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Проверяем что ордер ещё не оплачен
      if (order.status === 'paid') {
        return NextResponse.json({ status: 'already_paid' });
      }

      // Зачисляем на баланс
      const { error: depositError } = await supabaseAdmin
        .rpc('deposit_balance', {
          p_user_id: order.user_id,
          p_amount: order.amount,
          p_description: `Пополнение через Stripe (${session.currency?.toUpperCase()})`,
          p_metadata: {
            payment_order_id: orderId,
            provider: 'stripe',
            provider_payment_id: session.payment_intent,
            currency: session.currency,
            amount_total: session.amount_total,
          },
        });

      if (depositError) {
        console.error('Deposit error:', depositError);
        return NextResponse.json({ error: 'Deposit failed' }, { status: 500 });
      }

      // Обновляем статус ордера
      await supabaseAdmin
        .from('payment_orders')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          provider_data: session,
        })
        .eq('id', orderId);

      console.log('Stripe payment successful:', orderId);
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
