import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Глобальное хранилище токенов подтверждения email
declare global {
  var verificationTokensStore: Map<string, { email: string, password: string, nickname: string, expiresAt: number }> | undefined;
}

const verificationTokens = globalThis.verificationTokensStore ?? new Map<string, { email: string, password: string, nickname: string, expiresAt: number }>();

if (process.env.NODE_ENV !== 'production') {
  globalThis.verificationTokensStore = verificationTokens;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, nickname } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 });
    }

    // Создаем admin клиент
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Проверяем существует ли пользователь
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Ошибка получения списка пользователей:', listError);
      return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
    
    const existingUser = users?.find(u => u.email === email);
    
    if (existingUser) {
      return NextResponse.json({ 
        error: 'Этот email уже зарегистрирован' 
      }, { status: 400 });
    }

    // Генерируем уникальный токен подтверждения
    const verificationToken = randomUUID();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 часа
    
    // Сохраняем данные регистрации во временное хранилище
    verificationTokens.set(verificationToken, {
      email,
      password,
      nickname: nickname || email.split('@')[0],
      expiresAt
    });
    
    console.log('Создан токен подтверждения:', verificationToken);
    console.log('Всего токенов в памяти:', verificationTokens.size);
    
    // Очищаем истекшие токены
    for (const [token, data] of verificationTokens.entries()) {
      if (data.expiresAt < Date.now()) {
        verificationTokens.delete(token);
      }
    }
    
    // Получаем URL хоста динамически
    const host = request.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const verificationLink = `${protocol}://${host}/api/verify-email?token=${verificationToken}`;
    
    // Отправляем email через Brevo
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: `"thqlabel" <maksbroska@gmail.com>`,
      to: email,
      replyTo: 'maksbroska@gmail.com',
      subject: 'Подтвердите email для thqlabel',
      html: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Подтверждение регистрации - THQ Label</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #0c0c0e; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 0 80px rgba(96, 80, 186, 0.15);">
                            
                            <!-- Шапка -->
                            <tr>
                                <td style="background: linear-gradient(135deg, #6050ba 0%, #9d8df1 100%); padding: 40px 20px; text-align: center;">
                                    <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 900; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3); letter-spacing: -1px;">
                                        thqlabel
                                    </h1>
                                    <p style="margin: 10px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500; letter-spacing: 2px; text-transform: uppercase;">
                                        Music Label
                                    </p>
                                </td>
                            </tr>
                            
                            <!-- Контент -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px; font-weight: 800;">
                                        Добро пожаловать!
                                    </h2>
                                    
                                    <p style="margin: 0 0 20px 0; color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6;">
                                        Спасибо за регистрацию в thqlabel!
                                    </p>
                                    
                                    <p style="margin: 0 0 30px 0; color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6;">
                                        Чтобы завершить регистрацию и подтвердить email, нажмите на кнопку ниже:
                                    </p>
                                    
                                    <!-- Кнопка -->
                                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px 0;">
                                        <tr>
                                            <td align="center">
                                                <a href="${verificationLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6050ba 0%, #7060ca 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(96, 80, 186, 0.3);">
                                                    Подтвердить email
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- Информация -->
                                    <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin: 0 0 20px 0;">
                                        <tr>
                                            <td style="color: rgba(255, 255, 255, 0.6); font-size: 13px; line-height: 1.6;">
                                                <p style="margin: 0 0 10px 0;">
                                                    • Ссылка действительна в течение 24 часов
                                                </p>
                                                <p style="margin: 0 0 10px 0;">
                                                    • После подтверждения вы сможете войти в систему
                                                </p>
                                                <p style="margin: 0;">
                                                    • Если вы не регистрировались, проигнорируйте это письмо
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            
                            <!-- Подвал -->
                            <tr>
                                <td style="background: rgba(255, 255, 255, 0.02); padding: 30px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                                    <p style="margin: 0 0 10px 0; color: rgba(255, 255, 255, 0.4); font-size: 12px;">
                                        © 2025 thqlabel. Все права защищены.
                                    </p>
                                    <p style="margin: 0; color: rgba(255, 255, 255, 0.3); font-size: 11px;">
                                        Это автоматическое письмо, пожалуйста, не отвечайте на него.
                                    </p>
                                </td>
                            </tr>
                            
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    
    console.log('Письмо подтверждения отправлено:', email);
    
    return NextResponse.json({ 
      success: true,
      message: 'Письмо для подтверждения email отправлено' 
    });

  } catch (error: any) {
    console.error('Ошибка отправки письма:', error);
    return NextResponse.json({ 
      error: error.message || 'Не удалось отправить письмо' 
    }, { status: 500 });
  }
}
