-- SQL миграция: создать таблицы releases и tracks и добавить колонку date если отсутствует

-- Убедимся, что доступна функция генерации UUID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Создать таблицу releases если её нет
CREATE TABLE IF NOT EXISTS public.releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist text,
  cover_url text,
  status text DEFAULT 'pending', -- pending / distributed / rejected / draft
  type text DEFAULT 'single',   -- single / album
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  date timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Если таблица уже существовала, но без колонки date — добавим её
ALTER TABLE public.releases
  ADD COLUMN IF NOT EXISTS date timestamptz;

-- Создать таблицу tracks (треки внутри релиза)
CREATE TABLE IF NOT EXISTS public.tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  release_id uuid REFERENCES public.releases(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_url text,
  created_at timestamptz DEFAULT now()
);

-- Рекомендация: создать bucket 'demos' в Supabase Storage для загрузки файлов треков.
-- Применение: выполните этот SQL в Supabase SQL Editor или через psql от имени проекта.
-- Пример: в Dashboard -> SQL Editor -> New query -> вставьте содержимое и выполните.
