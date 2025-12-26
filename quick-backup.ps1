# SUPER SIMPLE BACKUP - One line command
# Just copy important folders to Backups with timestamp

$date = Get-Date -Format "yyyy-MM-dd_HH-mm"
$backup = "C:\Backups\thq-label_$date"

Write-Host "Creating backup at: $backup" -ForegroundColor Cyan

New-Item -Path $backup -ItemType Directory -Force | Out-Null

Copy-Item "app" -Destination $backup -Recurse -Force
Copy-Item "components" -Destination $backup -Recurse -Force
Copy-Item "contexts" -Destination $backup -Recurse -Force -ErrorAction SilentlyContinue
Copy-Item "sql" -Destination $backup -Recurse -Force
Copy-Item "package.json" -Destination $backup -Force
Copy-Item "next.config.ts" -Destination $backup -Force
Copy-Item "tsconfig.json" -Destination $backup -Force

Write-Host ""
Write-Host "DONE! Backup saved to:" -ForegroundColor Green
Write-Host $backup -ForegroundColor Yellow
