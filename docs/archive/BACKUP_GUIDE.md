# 📦 Гид по бэкапам проекта

## 🏆 Способ 1: Git + GitHub (ЛУЧШИЙ)

### Первоначальная настройка:
```bash
# 1. Инициализировать Git
git init

# 2. Добавить все файлы
git add .

# 3. Первый коммит
git commit -m "Initial commit"

# 4. Создать репозиторий на GitHub и подключить его
git remote add origin https://github.com/ВАШ_ЛОГИН/thq-label.git
git branch -M main
git push -u origin main
```

### Ежедневная работа:
```bash
# Сохранить изменения
git add .
git commit -m "Описание изменений"
git push

# Посмотреть историю
git log --oneline

# Вернуться к предыдущей версии
git revert HEAD
# или
git reset --hard COMMIT_ID
```

### Создание точек восстановления:
```bash
# Перед рискованными изменениями
git add .
git commit -m "Backup before refactoring"
git tag -a v1.0 -m "Working version 1.0"
git push --tags
```

---

## 🚀 Способ 2: Быстрый бэкап (PowerShell скрипт)

### Создайте файл `backup.ps1`:
```powershell
# Быстрый бэкап проекта
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backupName = "thq-label_backup_$date"
$backupPath = "C:\Backups\$backupName"

Write-Host "Создаю бэкап в $backupPath..." -ForegroundColor Cyan

# Копируем все кроме node_modules и .next
Copy-Item -Path . -Destination $backupPath -Recurse -Exclude @("node_modules", ".next", ".turbo", ".git")

Write-Host "✅ Бэкап готов: $backupPath" -ForegroundColor Green
```

### Использование:
```bash
# Запустить бэкап
.\backup.ps1

# Или напрямую в консоли:
$date = Get-Date -Format "yyyy-MM-dd_HH-mm"; Copy-Item -Path . -Destination "C:\Backups\thq-label_$date" -Recurse -Exclude @("node_modules", ".next", ".turbo")
```

---

## 💾 Способ 3: Ручные бэкапы важных файлов

### Создайте папку структуру:
```
C:\Backups\thq-label\
├── 2025-12-25_working/
├── 2025-12-24_before-refactor/
└── 2025-12-20_stable/
```

### Команда для быстрого копирования:
```powershell
# Копировать только важные файлы
$date = Get-Date -Format "yyyy-MM-dd"
New-Item -ItemType Directory -Path "C:\Backups\thq-label\$date" -Force
Copy-Item "app","components","contexts","sql" -Destination "C:\Backups\thq-label\$date" -Recurse
Copy-Item "package.json","next.config.ts","tsconfig.json" -Destination "C:\Backups\thq-label\$date"
```

---

## 🔧 Способ 4: VSCode настройки (автобэкап)

### Расширение "Local History"
1. Установить: `Ctrl+Shift+X` → искать "Local History"
2. Автоматически сохраняет историю каждого файла
3. Восстановление через ПКМ → "Local History: Show Local History"

---

## ☁️ Способ 5: Облачная синхронизация

### OneDrive / Google Drive:
```powershell
# Создать символическую ссылку в облако
New-Item -ItemType SymbolicLink -Path "D:\OneDrive\Projects\thq-label" -Target "C:\Users\Asus\Downloads\Telegram Desktop\thq-label"
```

---

## 🎯 Быстрая команда для экстренного бэкапа

**Добавьте в PowerShell профиль:**
```powershell
# Открыть профиль: notepad $PROFILE

function Backup-Project {
    $date = Get-Date -Format "yyyy-MM-dd_HH-mm"
    $backup = "C:\Backups\thq-label_$date.zip"
    Compress-Archive -Path "app","components","contexts","sql","package.json","next.config.ts" -DestinationPath $backup -Force
    Write-Host "✅ Backup saved: $backup" -ForegroundColor Green
}

# Использование:
# Backup-Project
```

---

## ⚡ Рекомендации

### Перед любыми изменениями:
1. **Git коммит** (если настроен Git)
2. **Или быстрый ZIP архив** важных папок
3. **Или просто скопировать файл с суффиксом** `_BACKUP`

### Что бэкапить:
✅ `app/` - весь код приложения
✅ `components/` - компоненты
✅ `contexts/` - контексты
✅ `sql/` - SQL скрипты
✅ `package.json` - зависимости
✅ `next.config.ts`, `tsconfig.json` - конфиги

❌ `node_modules/` - можно восстановить через `npm install`
❌ `.next/` - автогенерируется
❌ `.turbo/` - кеш

---

## 🆘 Восстановление из бэкапа

### Из Git:
```bash
git checkout main
git reset --hard COMMIT_ID
```

### Из ZIP/папки:
1. Удалить текущие файлы
2. Скопировать из бэкапа
3. Запустить `npm install`
4. Запустить `npm run dev`

