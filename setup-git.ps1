# Инициализация Git репозитория для проекта thq-label

Write-Host "🚀 Настройка Git для проекта thq-label" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия Git
try {
    $gitVersion = git --version
    Write-Host "✅ Git установлен: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git не установлен!" -ForegroundColor Red
    Write-Host "Скачайте Git с: https://git-scm.com/download/win" -ForegroundColor Yellow
    exit
}

# Инициализация Git
Write-Host ""
Write-Host "1️⃣ Инициализирую Git репозиторий..." -ForegroundColor Yellow
git init

# Проверка .gitignore
if (Test-Path ".gitignore") {
    Write-Host "✅ .gitignore уже существует" -ForegroundColor Green
} else {
    Write-Host "⚠️ .gitignore не найден" -ForegroundColor Yellow
}

# Добавление всех файлов
Write-Host ""
Write-Host "2️⃣ Добавляю файлы в Git..." -ForegroundColor Yellow
git add .

# Первый коммит
Write-Host ""
Write-Host "3️⃣ Создаю первый коммит..." -ForegroundColor Yellow
git commit -m "Initial commit: THQ Label project with modular admin structure"

# Настройка ветки main
Write-Host ""
Write-Host "4️⃣ Настраиваю ветку main..." -ForegroundColor Yellow
git branch -M main

Write-Host ""
Write-Host "═══════════════════════════════════" -ForegroundColor Green
Write-Host "✨ GIT РЕПОЗИТОРИЙ СОЗДАН!" -ForegroundColor Green
Write-Host "═══════════════════════════════════" -ForegroundColor Green
Write-Host ""

Write-Host "📌 Следующие шаги:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Создайте репозиторий на GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Подключите удалённый репозиторий:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/ВАШ_ЛОГИН/thq-label.git" -ForegroundColor Yellow
Write-Host ""
Write-Host "3. Отправьте код на GitHub:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Yellow
Write-Host ""
Write-Host "═══════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎯 ЕЖЕДНЕВНАЯ РАБОТА С GIT:" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Сохранить изменения:" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor Yellow
Write-Host "  git commit -m 'Описание изменений'" -ForegroundColor Yellow
Write-Host "  git push" -ForegroundColor Yellow
Write-Host ""
Write-Host "Посмотреть историю:" -ForegroundColor White
Write-Host "  git log --oneline" -ForegroundColor Yellow
Write-Host ""
Write-Host "Вернуться к предыдущей версии:" -ForegroundColor White
Write-Host "  git log --oneline" -ForegroundColor Yellow
Write-Host "  git checkout COMMIT_ID" -ForegroundColor Yellow
Write-Host ""
Write-Host "Создать точку восстановления (тег):" -ForegroundColor White
Write-Host "  git tag -a v1.0 -m 'Working version'" -ForegroundColor Yellow
Write-Host "  git push --tags" -ForegroundColor Yellow
Write-Host ""
