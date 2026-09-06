# Local preview only; GitHub Pages serves the site independently.
param(
    [int]$Port = 8080,
    [string]$Root = $PSScriptRoot
)

$nodeCommand = Get-Command node -ErrorAction SilentlyContinue
$nodePath = if ($nodeCommand) { $nodeCommand.Source } else {
    Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not (Test-Path -LiteralPath $nodePath)) {
    Write-Error 'Node.js is required for local preview. Install Node.js, reopen your terminal, and run .\serve.bat again.'
    exit 1
}

& $nodePath (Join-Path $PSScriptRoot 'scripts\serve.cjs') $Port $Root
exit $LASTEXITCODE
