// Тест SMTP соединения без Next.js сервера
// Запустить: node test-smtp.js

const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env.local' });

async function testSMTP() {
  console.log('\n=== ДИАГНОСТИКА SMTP ===\n');
  
  // Проверяем переменные окружения
  console.log('1. Проверка переменных окружения:');
  console.log('   SMTP_HOST:', process.env.SMTP_HOST || '❌ НЕ УСТАНОВЛЕН');
  console.log('   SMTP_PORT:', process.env.SMTP_PORT || '⚠️ не указан (будет 587)');
  console.log('   SMTP_USER:', process.env.SMTP_USER || '❌ НЕ УСТАНОВЛЕН');
  console.log('   SMTP_PASS:', process.env.SMTP_PASS ? `✅ установлен (${process.env.SMTP_PASS.length} символов)` : '❌ НЕ УСТАНОВЛЕН');
  console.log('   SMTP_FROM:', process.env.SMTP_FROM || '⚠️ не указан');
  
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log('\n❌ SMTP не настроен. Заполните .env.local');
    return;
  }

  console.log('\n2. Создание транспорта...');
  
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

  console.log('\n3. Проверка соединения с SMTP сервером...');
  
  try {
    await transporter.verify();
    console.log('\n✅ SMTP соединение УСПЕШНО!\n');
  } catch (error) {
    console.log('\n❌ ОШИБКА SMTP:', error.message);
    
    if (error.message.includes('Invalid login') || error.message.includes('authentication')) {
      console.log('\n💡 ПОДСКАЗКА: Неверные учётные данные.');
      console.log('   - Проверь SMTP_USER и SMTP_PASS в .env.local');
      console.log('   - В Brevo: Account → SMTP & API → SMTP Settings');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 ПОДСКАЗКА: Хост недоступен.');
      console.log('   - Проверь SMTP_HOST');
      console.log('   - Возможно заблокирован firewall');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('\n💡 ПОДСКАЗКА: Таймаут соединения.');
      console.log('   - Порт 587 может быть заблокирован провайдером');
      console.log('   - Попробуй порт 465 с secure: true');
    }
    return;
  }

  // Спрашиваем про тестовое письмо
  const testEmail = process.argv[2];
  
  if (testEmail) {
    console.log(`4. Отправка тестового письма на ${testEmail}...`);
    
    const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
    
    try {
      const info = await transporter.sendMail({
        from: `"THQ Label Test" <${fromEmail}>`,
        to: testEmail,
        subject: 'Тестовое письмо от THQ Label',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; background: #0c0c0e; color: white;">
            <h1 style="color: #6050ba;">✅ Email работает!</h1>
            <p>Это тестовое письмо от THQ Label.</p>
            <p>Время отправки: ${new Date().toLocaleString('ru-RU')}</p>
          </div>
        `,
      });
      
      console.log('\n✅ ПИСЬМО ОТПРАВЛЕНО!');
      console.log('   Message ID:', info.messageId);
      console.log('   Response:', info.response);
    } catch (error) {
      console.log('\n❌ ОШИБКА ОТПРАВКИ:', error.message);
      
      if (error.message.includes('sender') || error.message.includes('from')) {
        console.log('\n💡 ПОДСКАЗКА: Проблема с адресом отправителя.');
        console.log(`   Email ${fromEmail} должен быть верифицирован в Brevo!`);
        console.log('   В Brevo: Senders, Domains & Dedicated IPs → Senders');
      }
    }
  } else {
    console.log('\n💡 Чтобы отправить тестовое письмо, запусти:');
    console.log('   node test-smtp.js your@email.com\n');
  }
}

testSMTP();
