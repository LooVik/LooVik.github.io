param(
  [string]$ExePath,
  [string]$OutPath,
  [string]$WindowTitle = '',
  [int]$WaitSeconds = 14
)

Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WinCap {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
  [StructLayout(LayoutKind.Sequential)] public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@

$proc = Start-Process -FilePath $ExePath -PassThru
Start-Sleep -Seconds $WaitSeconds

$targetPid = $proc.Id
$hwnd = [IntPtr]::Zero
[WinCap]::EnumWindows({
  param($h, $l)
  if (-not [WinCap]::IsWindowVisible($h)) { return $true }
  $winPid = 0
  [void][WinCap]::GetWindowThreadProcessId($h, [ref]$winPid)
  if ($winPid -ne $targetPid) { return $true }
  $sb = New-Object System.Text.StringBuilder 256
  [void][WinCap]::GetWindowText($h, $sb, 256)
  $title = $sb.ToString()
  if ($title.Length -eq 0) { return $true }
  if ($WindowTitle -and $title -notlike "*$WindowTitle*") { return $true }
  $script:hwnd = $h
  return $false
}, [IntPtr]::Zero) | Out-Null

if ($hwnd -eq [IntPtr]::Zero) {
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  throw "No visible window for PID $targetPid"
}

[void][WinCap]::SetForegroundWindow($hwnd)
Start-Sleep -Seconds 2
$rect = New-Object WinCap+RECT
[void][WinCap]::GetWindowRect($hwnd, [ref]$rect)
$w = $rect.Right - $rect.Left
$h = $rect.Bottom - $rect.Top
if ($w -lt 100 -or $h -lt 100) { throw "Window too small: ${w}x${h}" }

$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($rect.Left, $rect.Top, 0, 0, (New-Object System.Drawing.Size $w, $h))
$dir = Split-Path $OutPath -Parent
if ($dir) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
$bmp.Save($OutPath, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose()
$bmp.Dispose()
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Write-Output "saved ${w}x${h} -> $OutPath"
