-- ==============================================================
-- ЗАЩИТА РОЛЕЙ ADMIN И OWNER ОТ ПОНИЖЕНИЯ
-- ==============================================================
-- Этот триггер предотвращает изменение роли admin или owner
-- на basic или exclusive. Только owner может изменять роли admin.
-- ==============================================================

-- Создаем функцию для проверки изменения роли
CREATE OR REPLACE FUNCTION protect_admin_owner_roles()
RETURNS TRIGGER AS $$
BEGIN
  -- Если старая роль была admin или owner
  IF OLD.role IN ('admin', 'owner') THEN
    -- И новая роль является basic или exclusive
    IF NEW.role IN ('basic', 'exclusive') THEN
      RAISE EXCEPTION 'Нельзя понизить роль admin или owner до basic/exclusive';
    END IF;
    
    -- Если старая роль была owner, вообще запрещаем изменение
    IF OLD.role = 'owner' AND NEW.role != 'owner' THEN
      RAISE EXCEPTION 'Роль owner нельзя изменить';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Удаляем старый триггер если существует
DROP TRIGGER IF EXISTS prevent_role_downgrade ON profiles;

-- Создаем триггер
CREATE TRIGGER prevent_role_downgrade
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.role IS DISTINCT FROM NEW.role)
  EXECUTE FUNCTION protect_admin_owner_roles();

COMMENT ON FUNCTION protect_admin_owner_roles() IS 'Защищает роли admin и owner от понижения';

SELECT '✅ Защита ролей admin и owner установлена!' as status;
