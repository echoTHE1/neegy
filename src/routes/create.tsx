````powershell
$ErrorActionPreference = "Stop"

$git = "C:\Users\Colt.Pierce\NEEGY-Git\PortableGit\cmd\git.exe"
$project = "C:\Users\Colt.Pierce\Downloads\neegy-upload\neegy-main"
$file = Join-Path $project "src\routes\create.tsx"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       NEEGY BUILD FIX + PUSH" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location $project

if (!(Test-Path $git)) {
    Write-Host "[ERROR] Portable Git not found:" -ForegroundColor Red
    Write-Host $git
    exit 1
}

if (!(Test-Path $file)) {
    Write-Host "[ERROR] create.tsx not found:" -ForegroundColor Red
    Write-Host $file
    exit 1
}

Write-Host "[1/5] Fixing create.tsx..." -ForegroundColor Yellow

$content = Get-Content -LiteralPath $file -Raw

# Remove accidental Markdown code fences.
$content = $content -replace '^\s*```tsx\s*\r?\n', ''
$content = $content -replace '\r?\n\s*```\s*$', ''
$content = $content.TrimEnd() + "`r`n"

Set-Content -LiteralPath $file -Value $content -Encoding UTF8

Write-Host "      create.tsx cleaned." -ForegroundColor Green

Write-Host ""
Write-Host "[2/5] Checking for code fences..." -ForegroundColor Yellow

$check = Get-Content -LiteralPath $file -Raw

if ($check -match '```') {
    Write-Host "[ERROR] Markdown code fences are still present." -ForegroundColor Red
    exit 1
}

Write-Host "      No code fences found." -ForegroundColor Green

Write-Host ""
Write-Host "[3/5] Installing dependencies if needed..." -ForegroundColor Yellow

if (Test-Path (Join-Path $project "package-lock.json")) {
    npm install
} else {
    Write-Host "      package-lock.json not found; skipping npm install." -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "[4/5] Running production build..." -ForegroundColor Yellow

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "[BUILD FAILED]" -ForegroundColor Red
    Write-Host "Nothing was pushed to GitHub." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "      BUILD SUCCESSFUL." -ForegroundColor Green

Write-Host ""
Write-Host "[5/5] Committing and pushing..." -ForegroundColor Yellow

& $git add "src/routes/create.tsx"

$changes = & $git diff --cached --name-only

if (!$changes) {
    Write-Host "      No Git changes detected." -ForegroundColor Green
    exit 0
}

& $git commit -m "Fix create room build"

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Commit failed." -ForegroundColor Red
    exit 1
}

& $git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Push failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "             PUSH SUCCESSFUL" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your fixed create.tsx is now on GitHub." -ForegroundColor Green
Write-Host "Repository: https://github.com/echoTHE1/neegy" -ForegroundColor Cyan
````
