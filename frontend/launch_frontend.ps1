$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $root 'frontend.log'
$err = Join-Path $root 'frontend.err.log'
$pidFile = Join-Path $root 'frontend.pid'

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
$psi.FileName = 'C:\Windows\System32\cmd.exe'
$psi.WorkingDirectory = $root
$psi.Arguments = '/c set "BROWSER=none" && node_modules\.bin\craco.cmd start'
$psi.UseShellExecute = $true
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden

$process = [System.Diagnostics.Process]::Start($psi)
if ($process) {
    $process.Id | Set-Content -LiteralPath $pidFile
}
