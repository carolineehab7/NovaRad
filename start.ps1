# NovaRad — start everything with one command
# Usage: .\start.ps1

# Load .env into current process environment
if (Test-Path .\.env) {
    Get-Content .\.env | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' } | ForEach-Object {
        $parts = $_ -split '=', 2
        $key   = $parts[0].Trim()
        $value = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($key, $value, 'Process')
        Write-Host "  Loaded: $key" -ForegroundColor DarkGray
    }
    Write-Host ""
}

# Verify the API key is set
$apiKey = [System.Environment]::GetEnvironmentVariable('ANTHROPIC_API_KEY', 'Process')
if (-not $apiKey -or $apiKey -eq 'your_api_key_here') {
    Write-Host "[WARNING] ANTHROPIC_API_KEY not set — chatbot will use basic keyword mode." -ForegroundColor Yellow
    Write-Host "  Edit .env and add your key, then restart." -ForegroundColor DarkGray
    Write-Host ""
}

Write-Host "Starting NovaRad..." -ForegroundColor Cyan
Write-Host "  React  -> http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Flask  -> http://localhost:5000" -ForegroundColor Yellow
Write-Host ""

npm run dev
