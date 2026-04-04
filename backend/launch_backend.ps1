$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $root 'backend.log'
$err = Join-Path $root 'backend.err.log'
$pidFile = Join-Path $root 'backend.pid'

if (Test-Path -LiteralPath $out) {
    Remove-Item -LiteralPath $out -Force
}

if (Test-Path -LiteralPath $err) {
    Remove-Item -LiteralPath $err -Force
}

if (Test-Path -LiteralPath $pidFile) {
    Remove-Item -LiteralPath $pidFile -Force
}

$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = "$root\.venv\Scripts\python.exe"
$psi.WorkingDirectory = $root
$psi.Arguments = '-m uvicorn server:app --host 127.0.0.1 --port 8000'
$psi.UseShellExecute = $true
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden

$process = [System.Diagnostics.Process]::Start($psi)
if ($process) {
    $process.Id | Set-Content -LiteralPath $pidFile
}
