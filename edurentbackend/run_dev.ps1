# Helper script to run EduRent Backend with local secrets
# usage: ./run_dev.ps1

$EnvFile = ".env"

if (-not (Test-Path $EnvFile)) {
    Write-Host "⚠️ Error: '$EnvFile' not found." -ForegroundColor Red
    Write-Host "Please copy '.env.example' to '.env' and fill in your secrets." -ForegroundColor Yellow
    exit 1
}

Write-Host "🌱 Loading environment variables from $EnvFile..." -ForegroundColor Cyan

$LoadedKeys = @()

Get-Content $EnvFile | ForEach-Object {
    $Line = $_.Trim()
    # Match line valid key=value pair (ignoring comments)
    if ($Line -match '^([^#=]+)=(.*)$') {
        $Name = $matches[1].Trim()
        $Value = $matches[2].Trim()
        
        # Remove potential inline comments (rudimentary check)
        # Assuming values don't contain ' #' inside them usually
        # But let's stick to simple raw value for now to avoid breaking valid chars.
        
        # Remove surrounding quotes if present
        if ($Value -match '^"(.*)"$') { $Value = $matches[1] }
        elseif ($Value -match "^'(.*)'$") { $Value = $matches[1] }

        [System.Environment]::SetEnvironmentVariable($Name, $Value, "Process")
        $LoadedKeys += $Name
        Write-Host "   + Loaded: $Name" -ForegroundColor Gray
    }
}

# Verify Critical Vars
$Required = @("DB_PASSWORD", "SUPABASE_KEY", "JWT_SECRET", "MAIL_PASSWORD")
$Missing = $Required | Where-Object { $LoadedKeys -notcontains $_ }

if ($Missing) {
    Write-Host "❌ Error: Missing required variables in .env:" -ForegroundColor Red
    $Missing | ForEach-Object { Write-Host "   - $_" -ForegroundColor Red }
    Write-Host "Please ensure your .env file defines these keys." -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Starting Spring Boot Application..." -ForegroundColor Green
mvn spring-boot:run
