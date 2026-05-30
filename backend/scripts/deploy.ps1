param(
  [string]$EnvFile = "backend/.env",
  [string]$Python = "C:/Users/adity/AppData/Local/Programs/Python/Python313/python.exe"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $EnvFile)) {
  throw "Missing environment file: $EnvFile"
}

Push-Location (Split-Path $PSScriptRoot -Parent)
try {
  & $Python -m pip install -r requirements.txt
  & $Python scripts/generate_crypto_material.py
  & $Python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
}
finally {
  Pop-Location
}
