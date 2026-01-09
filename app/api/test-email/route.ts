import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {}
  };

  // 1. Проверка SMTP переменных окружения
  diagnostics.checks.smtp_env = {
    SMTP_HOST: process.env.SMTP_HOST ? '✅ Установлен' : '❌ Отсутствует',
    SMTP_PORT: process.env.SMTP_PORT ? `✅ ${process.env.SMTP_PORT}` : '⚠️ Не указан (будет 587)',
    SMTP_USER: process.env.SMTP_USER ? '✅ Установлен' : '❌ Отсутствует',
    SMTP_PASS: process.env.SMTP_PASS ? `✅ Установлен (${process.env.SMTP_PASS.length} символов)` : '❌ Отсутствует',
    SMTP_FROM: process.env.SMTP_FROM ? '✅ Установлен' : '⚠️ Не указан (будет SMTP_USER)',
  };

  // 2. Проверка Supabase
  diagnostics.checks.supabase = {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✅ Установлен' : '❌ Отсутствует',
    SUPABASE_SERVICE_ROLE_KEY: supabaseServiceKey ? `✅ Установлен (${supabaseServiceKey.length} символов)` : '❌ Отсутствует',
  };

  // 3. Проверка таблицы email_tokens
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data, error } = await supabase
      .from('email_tokens')
      .select('id')
      .limit(1);

    if (error) {
      diagnostics.checks.email_tokens_table = `❌ Ошибка: ${error.message}`;
      diagnostics.checks.email_tokens_hint = 'Выполните SQL скрипт из sql/create_email_tokens_table.sql в Supabase';
    } else {
      diagnostics.checks.email_tokens_table = '✅ Таблица существует';
    }
  } catch (e: any) {
    diagnostics.checks.email_tokens_table = `❌ Ошибка подключения: ${e.message}`;
  }

  // 4. Тест SMTP соединения
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      await transporter.verify();
      diagnostics.checks.smtp_connection = '✅ SMTP соединение успешно';
    } catch (e: any) {
      diagnostics.checks.smtp_connection = `❌ Ошибка SMTP: ${e.message}`;
      
      // Подсказки по частым ошибкам
      if (e.message.includes('ECONNREFUSED')) {
        diagnostics.checks.smtp_hint = 'Хост недоступен. Проверьте SMTP_HOST';
      } else if (e.message.includes('Invalid login') || e.message.includes('authentication')) {
        diagnostics.checks.smtp_hint = 'Неверные учетные данные. Проверьте SMTP_USER и SMTP_PASS';
      } else if (e.message.includes('self signed certificate')) {
        diagnostics.checks.smtp_hint = 'Проблема с SSL сертификатом. Попробуйте добавить tls: { rejectUnauthorized: false }';
      } else if (e.message.includes('ETIMEDOUT')) {
        diagnostics.checks.smtp_hint = 'Таймаут соединения. Порт может быть заблокирован';
      }
    }
  } else {
    diagnostics.checks.smtp_connection = '⚠️ Пропущено - нет SMTP настроек';
  }

  // 5. Информация о хосте
  const host = request.headers.get('host') || 'unknown';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  diagnostics.checks.host_info = {
    host,
    protocol,
    verificationUrl: `${protocol}://${host}/api/verify-email?token=TEST`,
    resetUrl: `${protocol}://${host}/reset-password?token=TEST`,
  };

  // Итоговый статус
  const allSmtpOk = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  const tableOk = diagnostics.checks.email_tokens_table?.startsWith('✅');
  const connectionOk = diagnostics.checks.smtp_connection?.startsWith('✅');

  diagnostics.summary = {
    smtp_configured: allSmtpOk ? '✅' : '❌',
    database_ready: tableOk ? '✅' : '❌',
    smtp_working: connectionOk ? '✅' : '❌',
    overall: allSmtpOk && tableOk && connectionOk ? '✅ ВСЁ РАБОТАЕТ' : '❌ ЕСТЬ ПРОБЛЕМЫ',
  };

  return NextResponse.json(diagnostics, { status: 200 });
}

// POST - отправка тестового письма
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Укажите email для тестового письма' }, { status: 400 });
    }

    // Проверяем SMTP
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return NextResponse.json({ 
        error: 'SMTP не настроен',
        details: {
          SMTP_HOST: process.env.SMTP_HOST ? 'OK' : 'MISSING',
          SMTP_USER: process.env.SMTP_USER ? 'OK' : 'MISSING',
          SMTP_PASS: process.env.SMTP_PASS ? 'OK' : 'MISSING',
        }
      }, { status: 500 });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      debug: true,
      logger: true,
    });

    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from: `"THQ Label Test" <${fromEmail}>`,
      to: email,
      subject: 'Тестовое письмо от THQ Label',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #0c0c0e; color: white;">
          <h1 style="color: #6050ba;">✅ Email работает!</h1>
          <p>Это тестовое письмо от THQ Label.</p>
          <p>Время отправки: ${new Date().toISOString()}</p>
          <p>SMTP хост: ${process.env.SMTP_HOST}</p>
        </div>
      `,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Тестовое письмо отправлено',
      messageId: info.messageId,
      response: info.response,
    });

  } catch (error: any) {
    console.error('Ошибка отправки тестового письма:', error);
    return NextResponse.json({ 
      error: error.message,
      code: error.code,
      command: error.command,
      responseCode: error.responseCode,
    }, { status: 500 });
  }
}
