Add-Type -AssemblyName System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public class WinCap {
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT lpRect);
  [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr hWnd, IntPtr hdcBlt, uint nFlags);
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  public struct RECT { public int Left; public int Top; public int Right; public int Bottom; }
}
"@
$outDir = "C:\Users\ccpru\sendflow-rebuild\checks\live"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$procs = Get-Process chrome, msedge -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -match 'SendFlow' -and $_.MainWindowHandle -ne 0 }
if (-not $procs) {
  Get-Process | Where-Object { $_.MainWindowTitle -and $_.MainWindowTitle.Length -gt 0 } | Select-Object -First 30 ProcessName, MainWindowTitle | Format-Table -AutoSize | Out-String | Write-Host
  throw "no SendFlow window"
}
$p = $procs | Select-Object -First 1
Write-Host "WINDOW" $p.ProcessName $p.MainWindowTitle $p.MainWindowHandle
$rect = New-Object WinCap+RECT
[WinCap]::GetWindowRect($p.MainWindowHandle, [ref]$rect) | Out-Null
$w = $rect.Right - $rect.Left
$h = $rect.Bottom - $rect.Top
Write-Host "RECT" $rect.Left $rect.Top $w $h
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$hdc = $g.GetHdc()
$ok = [WinCap]::PrintWindow($p.MainWindowHandle, $hdc, 2)
$g.ReleaseHdc($hdc)
$g.Dispose()
$path = Join-Path $outDir "overview-window.png"
$bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Host "SAVED" $ok $path (Get-Item $path).Length
