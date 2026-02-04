param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$ScriptIdOrPath
)

$ErrorActionPreference = "Stop"

$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$envFile = Join-Path $here ".local.env"

if (-not (Test-Path -LiteralPath $envFile)) {
    throw "Missing .local.env at $envFile"
}

# Load KEY=VALUE lines from .local.env into current environment.
Get-Content -LiteralPath $envFile | ForEach-Object {
    $line = $_.Trim()
    if ($line.Length -eq 0) { return }
    if ($line.StartsWith("#")) { return }
    if ($line -notmatch "^[A-Z0-9_]+=.+") { return }

    $parts = $line -split "=", 2
    $key = $parts[0].Trim()
    $value = $parts[1]

    if ($key.Length -gt 0) {
        Set-Item -Path "Env:$key" -Value $value
    }
}

# Require GPT-4o-mini variables (others are loaded if present).
$required = @(
    "AZURE_OPENAI_ENDPOINT_GPT4O_MINI",
    "AZURE_OPENAI_API_KEY_GPT4O_MINI",
    "AZURE_OPENAI_API_VERSION_GPT4O_MINI"
)
foreach ($name in $required) {
    if (-not (Get-Item -Path "Env:$name" -ErrorAction SilentlyContinue)) {
        throw "Missing required env var: $name (check .local.env)"
    }
}

# Resolve script by short id or by path.
$scriptPath = switch ($ScriptIdOrPath) {
    "01" { Join-Path $here "01_company_lookup.js" }
    "02" { Join-Path $here "02_persona_and_companies.js" }
    "03" { Join-Path $here "03_deep_research_stub.js" }
    default {
        $candidate = if ([System.IO.Path]::IsPathRooted($ScriptIdOrPath)) {
            $ScriptIdOrPath
        } else {
            Join-Path $here $ScriptIdOrPath
        }
        $candidate
    }
}

if (-not (Test-Path -LiteralPath $scriptPath)) {
    throw "Script not found: $scriptPath"
}

Write-Host "Running: node $scriptPath"
node $scriptPath
