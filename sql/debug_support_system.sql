-- ДИАГНОСТИКА СИСТЕМЫ ПОДДЕРЖКИ

-- 1. Проверяем все тикеты
SELECT 
    id,
    user_id,
    subject,
    status,
    category,
    created_at
FROM support_tickets
ORDER BY created_at DESC;

-- 2. Проверяем все сообщения
SELECT 
    tm.id,
    tm.ticket_id,
    tm.sender_id,
    tm.message,
    tm.is_admin,
    tm.created_at,
    p.email as sender_email,
    p.role as sender_role
FROM ticket_messages tm
LEFT JOIN profiles p ON tm.sender_id = p.id
ORDER BY tm.created_at DESC
LIMIT 50;

-- 3. Проверяем профили (админы и овнеры)
SELECT 
    id,
    email,
    role
FROM profiles
WHERE role IN ('admin', 'owner')
ORDER BY email;

-- 4. ИСПРАВЛЕНИЕ: Обновить is_admin для всех сообщений от админов и овнеров
UPDATE ticket_messages tm
SET is_admin = true
FROM profiles p
WHERE tm.sender_id = p.id 
  AND (p.role = 'admin' OR p.role = 'owner')
  AND (tm.is_admin = false OR tm.is_admin IS NULL);

-- 5. ПРОВЕРКА: Сколько сообщений исправлено
SELECT 
    COUNT(*) as total_messages,
    SUM(CASE WHEN is_admin = true THEN 1 ELSE 0 END) as admin_messages,
    SUM(CASE WHEN is_admin = false OR is_admin IS NULL THEN 1 ELSE 0 END) as user_messages
FROM ticket_messages;

-- 6. Показать тикеты с количеством сообщений
SELECT 
    t.id,
    t.subject,
    t.status,
    p.email as user_email,
    COUNT(tm.id) as message_count
FROM support_tickets t
LEFT JOIN profiles p ON t.user_id = p.id
LEFT JOIN ticket_messages tm ON t.id = tm.ticket_id
GROUP BY t.id, t.subject, t.status, p.email
ORDER BY t.created_at DESC;
