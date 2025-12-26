# ====================================
# QUICK BACKUP SCRIPT
# ====================================

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$projectName = "thq-label"
$backupDir = "C:\Backups"
$backupName = "${projectName}_${timestamp}"
$backupPath = Join-Path $backupDir $backupName

# Create backup directory if not exists
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "[+] Created backup folder: $backupDir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "   BACKUP STARTED" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Source: $PWD" -ForegroundColor Gray
Write-Host "Destination: $backupPath" -ForegroundColor Gray
Write-Host ""

# Files and folders to copy
$itemsToCopy = @(
    "app",
    "components", 
    "contexts",
    "email-templates",
    "public",
    "scripts",
    "sql",
    "src",
    "package.json",
    "package-lock.json",
    "next.config.ts",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.mjs",
    "eslint.config.mjs",
    ".gitignore"
)

# Also copy all .md files
$mdFiles = Get-ChildItem "*.md" -ErrorAction SilentlyContinue
foreach ($mdFile in $mdFiles) {
    $itemsToCopy += $mdFile.Name
}

# Create backup folder
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null

# Copy files
$copiedItems = 0
$skippedItems = 0

foreach ($item in $itemsToCopy) {
    if (Test-Path $item) {
        try {
            Copy-Item -Path $item -Destination $backupPath -Recurse -Force -ErrorAction Stop
            $copiedItems++
            Write-Host "[OK] $item" -ForegroundColor Green
        } catch {
            Write-Host "[ERROR] Failed to copy $item" -ForegroundColor Red
            $skippedItems++
        }
    } else {
        $skippedItems++
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "   BACKUP COMPLETED!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host "Location: $backupPath" -ForegroundColor White
Write-Host "Copied: $copiedItems items" -ForegroundColor White
Write-Host "Skipped: $skippedItems items" -ForegroundColor White
Write-Host "Time: $timestamp" -ForegroundColor White
Write-Host ""
Write-Host "To restore, copy files back from:" -ForegroundColor Yellow
Write-Host "$backupPath" -ForegroundColor Cyan
Write-Host ""

# Optional: Create ZIP archive
$createZip = Read-Host "Create ZIP archive? (y/n)"
if ($createZip -eq 'y') {
    $zipPath = "${backupPath}.zip"
    Write-Host ""
    Write-Host "[*] Creating ZIP archive..." -ForegroundColor Cyan
    Compress-Archive -Path $backupPath -DestinationPath $zipPath -Force
    Write-Host "[OK] ZIP created: $zipPath" -ForegroundColor Green
    
    # Remove folder after creating archive
    Remove-Item -Path $backupPath -Recurse -Force
    Write-Host "[*] Folder removed, ZIP kept" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Final backup: $zipPath" -ForegroundColor Cyan
}
