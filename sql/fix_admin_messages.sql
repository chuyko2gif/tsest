-- Исправить is_admin для существующих сообщений
-- Сообщения от админов и овнера должны иметь is_admin = true

UPDATE ticket_messages tm
SET is_admin = true
FROM profiles p
WHERE tm.sender_id = p.id 
  AND (p.role = 'admin' OR p.role = 'owner')
  AND tm.is_admin = false;

-- Проверка результата
SELECT 
  tm.id,
  tm.sender_id,
  tm.is_admin,
  p.role,
  tm.created_at
FROM ticket_messages tm
JOIN profiles p ON tm.sender_id = p.id
ORDER BY tm.created_at DESC
LIMIT 20;
