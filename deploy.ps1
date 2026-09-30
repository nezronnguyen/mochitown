# 🍡 MOCHI TOWN — DEPLOY LÊN VERCEL (Chạy 1 lần)
# PowerShell Script tự động login + cấu hình + deploy

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host "  MOCHI TOWN  →  VERCEL DEPLOY TOOL  " -ForegroundColor Magenta
Write-Host "==========================================" -ForegroundColor Magenta
Write-Host ""

# ─── BƯỚC 1: Đọc .env ─────────────────────────────────────────────────────────
$envPath = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "[ERR] Không tìm thấy file .env!" -ForegroundColor Red
    exit 1
}

$envVars = @{}
Get-Content $envPath | ForEach-Object {
    $line = $_.Trim()
    if ($line -and -not $line.StartsWith("#") -and $line -match "=") {
        $parts = $line -split "=", 2
        $k = $parts[0].Trim()
        $v = $parts[1].Trim()
        if ($k -and $v -and $k -ne "PORT") {
            $envVars[$k] = $v
        }
    }
}

Write-Host "[OK] Đã đọc .env: $($envVars.Count) biến môi trường" -ForegroundColor Green
Write-Host ""

# ─── BƯỚC 2: Login Vercel ─────────────────────────────────────────────────────
Write-Host "[1/4] Đăng nhập Vercel (sẽ mở trình duyệt)..." -ForegroundColor Cyan
npx vercel login
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERR] Login thất bại!" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Đã đăng nhập!" -ForegroundColor Green
Write-Host ""

# ─── BƯỚC 3: Link project ─────────────────────────────────────────────────────
Write-Host "[2/4] Kết nối project Vercel..." -ForegroundColor Cyan
npx vercel link --yes --project "mochi-town"
Write-Host "[OK] Đã link project!" -ForegroundColor Green
Write-Host ""

# ─── BƯỚC 4: Set env vars ─────────────────────────────────────────────────────
Write-Host "[3/4] Cấu hình biến môi trường lên Vercel..." -ForegroundColor Cyan
foreach ($entry in $envVars.GetEnumerator()) {
    Write-Host "  → $($entry.Key)" -ForegroundColor Gray
    # Xóa biến cũ (nếu có) rồi thêm lại để tránh conflict
    npx vercel env rm $entry.Key production --yes 2>&1 | Out-Null
    $entry.Value | npx vercel env add $entry.Key production
}
Write-Host "[OK] Đã cấu hình xong env!" -ForegroundColor Green
Write-Host ""

# ─── BƯỚC 5: Deploy ───────────────────────────────────────────────────────────
Write-Host "[4/4] Deploy lên Vercel production..." -ForegroundColor Cyan
$deployOutput = npx vercel --prod --yes 2>&1 | Tee-Object -Variable deployLines
$deployUrlMatch = $deployLines | Select-String "https://" | Select-Object -Last 1
$deployUrl = if ($deployUrlMatch) { $deployUrlMatch.ToString().Trim() } else { "" }

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  DEPLOY THÀNH CÔNG!" -ForegroundColor Green
if ($deployUrl) {
    Write-Host "  URL: $deployUrl" -ForegroundColor Yellow
}
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Bước tiếp theo:" -ForegroundColor White
Write-Host "  1. Vào Vercel Dashboard → Settings → Domains → thêm domain riêng (nếu có)" -ForegroundColor Gray
Write-Host "  2. Cập nhật og:url trong index.html nếu bạn có domain tùy chỉnh" -ForegroundColor Gray
Write-Host ""
