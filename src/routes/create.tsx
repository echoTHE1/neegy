````powershell
$ErrorActionPreference = "Stop"

$git = "C:\Users\Colt.Pierce\NEEGY-Git\PortableGit\cmd\git.exe"
$project = "C:\Users\Colt.Pierce\Downloads\neegy-upload\neegy-main"

Set-Location $project

Write-Host "NEEGY BUILD REPAIR" -ForegroundColor Cyan
Write-Host "Project: $project" -ForegroundColor DarkGray
Write-Host ""

# Make sure the project and Git exist
if (!(Test-Path $project)) {
    Write-Host "ERROR: Project folder not found." -ForegroundColor Red
    exit 1
}

if (!(Test-Path $git)) {
    Write-Host "ERROR: Portable Git not found." -ForegroundColor Red
    exit 1
}

# Make sure origin points at the correct repository
& $git remote set-url origin "https://github.com/echoTHE1/neegy.git"

Write-Host "[1/4] Removing accidental Markdown fences..." -ForegroundColor Yellow

# Clean every TS/TSX file in the project.
$files = Get-ChildItem $project -Recurse -File |
    Where-Object {
        $_.Extension -in ".ts", ".tsx"
    }

$fixed = 0

foreach ($f in $files) {
    $text = Get-Content -LiteralPath $f.FullName -Raw

    $newText = $text

    # Remove a Markdown fence at the beginning.
    $newText = $newText -replace '^\s*```(?:tsx|ts|typescript)?\s*\r?\n', ''

    # Remove a Markdown fence at the end.
    $newText = $newText -replace '\r?\n\s*```\s*$', ''

    if ($newText -ne $text) {
        Set-Content -LiteralPath $f.FullName -Value $newText -Encoding UTF8
        Write-Host "  FIXED: $($f.FullName.Substring($project.Length + 1))" -ForegroundColor Green
        $fixed++
    }
}

Write-Host ""
Write-Host "Fixed $fixed file(s)." -ForegroundColor Green

Write-Host ""
Write-Host "[2/4] Checking create.tsx..." -ForegroundColor Yellow

$createFile = Join-Path $project "src\routes\create.tsx"

if (!(Test-Path $createFile)) {
    Write-Host "ERROR: create.tsx not found." -ForegroundColor Red
    exit 1
}

$createText = Get-Content -LiteralPath $createFile -Raw

if ($createText -match '```') {
    Write-Host "ERROR: create.tsx still contains Markdown fences." -ForegroundColor Red
    exit 1
}

Write-Host "  create.tsx is clean." -ForegroundColor Green

Write-Host ""
Write-Host "[3/4] Committing repair..." -ForegroundColor Yellow

& $git add .

$status = & $git status --porcelain

if (!$status) {
    Write-Host "  No changes detected." -ForegroundColor Green
} else {
    & $git commit -m "Repair TypeScript build syntax"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Commit failed." -ForegroundColor Red
        exit 1
    }

    Write-Host "  Repair committed." -ForegroundColor Green
}

Write-Host ""
Write-Host "[4/4] Pushing to GitHub..." -ForegroundColor Yellow

& $git push origin main

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Push failed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "        NEEGY REPAIR COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "GitHub: https://github.com/echoTHE1/neegy" -ForegroundColor Cyan
Write-Host ""
Write-Host "Now refresh Lovable and run the update again." -ForegroundColor White
````
