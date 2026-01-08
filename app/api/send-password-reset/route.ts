import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import nodemailer from 'nodemailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Глобальное хранилище токенов (переживает hot reload в dev режиме)
declare global {
  var resetTokensStore: Map<string, { email: string, expiresAt: number }> | undefined;
}

const resetTokens = globalThis.resetTokensStore ?? new Map<string, { email: string, expiresAt: number }>();

if (process.env.NODE_ENV !== 'production') {
  globalThis.resetTokensStore = resetTokens;
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email обязателен' }, { status: 400 });
    }

    // Создаем admin клиент
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Проверяем существует ли пользователь
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('Ошибка получения списка пользователей:', listError);
      return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
    }
    
    const user = users?.find(u => u.email === email);
    
    if (!user) {
      // Не раскрываем что пользователь не существует (безопасность)
      return NextResponse.json({ 
        success: true, 
        message: 'Если email существует, письмо было отправлено' 
      });
    }

    // Генерируем уникальный токен восстановления
    const resetToken = randomUUID();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 час
    
    // Сохраняем токен во временное хранилище
    resetTokens.set(resetToken, {
      email: email,
      expiresAt: expiresAt
    });
    
    console.log('Создан токен восстановления:', resetToken);
    console.log('Всего токенов в памяти:', resetTokens.size);
    
    // Очищаем истекшие токены
    for (const [token, data] of resetTokens.entries()) {
      if (data.expiresAt < Date.now()) {
        resetTokens.delete(token);
      }
    }
    
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
    
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
      subject: 'Сброс пароля | thqlabel',
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high',
        'X-Auto-Response-Suppress': 'OOF, DR, RN, NRN, AutoReply'
      },
      html: `
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Смена пароля - thqlabel</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #ffffff;" bgcolor="#ffffff">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #ffffff; padding: 40px 20px;" bgcolor="#ffffff">
                <tr>
                    <td align="center">
                        <!-- Черная карточка -->
                        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #0c0c0e; border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; overflow: hidden; box-shadow: 0 0 80px rgba(96, 80, 186, 0.15);" bgcolor="#0c0c0e">
                            
                            <!-- Шапка с фиолетовым градиентом -->
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
                            
                            <!-- Контент на черном фоне -->
                            <tr>
                                <td style="padding: 40px 30px;">
                                    <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px; font-weight: 800;">
                                        Смена пароля
                                    </h2>
                                    
                                    <p style="margin: 0 0 20px 0; color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6;">
                                        Вы запросили изменение пароля вашего аккаунта.
                                    </p>
                                    
                                    <p style="margin: 0 0 30px 0; color: rgba(255, 255, 255, 0.7); font-size: 15px; line-height: 1.6;">
                                        Чтобы установить новый пароль, нажмите на кнопку ниже:
                                    </p>
                                    
                                    <!-- Кнопка -->
                                    <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0 0 30px 0;">
                                        <tr>
                                            <td align="center">
                                                <a href="${resetLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #6050ba 0%, #7060ca 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 4px 15px rgba(96, 80, 186, 0.3);">
                                                    Сменить пароль
                                                </a>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <!-- Информационный блок -->
                                    <table role="presentation" style="width: 100%; border-collapse: collapse; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 20px; margin: 0 0 20px 0;">
                                        <tr>
                                            <td style="color: rgba(255, 255, 255, 0.6); font-size: 13px; line-height: 1.6;">
                                                <p style="margin: 0 0 10px 0;">
                                                    • Ссылка действительна в течение 60 минут
                                                </p>
                                                <p style="margin: 0 0 10px 0;">
                                                    • После смены вы сможете войти с новым паролем
                                                </p>
                                                <p style="margin: 0;">
                                                    • Если вы не запрашивали смену пароля, проигнорируйте это письмо
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                    
                                    <hr style="border: none; border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 30px 0;">
                                    
                                    <p style="margin: 0; color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.6;">
                                        Если вы не запрашивали изменение пароля, просто проигнорируйте это письмо — с вашим аккаунтом всё в порядке.
                                    </p>
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

    const info = await transporter.sendMail(mailOptions);
    
    console.log('Письмо восстановления отправлено:', email);
    console.log('Brevo Message ID:', info.messageId);
    console.log('Response:', info.response);
    
    return NextResponse.json({ 
      success: true,
      message: 'Письмо для восстановления пароля отправлено' 
    });

  } catch (error: any) {
    console.error('Ошибка отправки письма:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      responseCode: error.responseCode
    });
    return NextResponse.json({ 
      error: error.message || 'Не удалось отправить письмо' 
    }, { status: 500 });
  }
}
