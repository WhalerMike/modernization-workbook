# Export a narrated deck to a 1080p MP4 in a fresh PowerPoint (Windows), for when build_narrated.ps1 -Video
# stalls: the export there runs in the PowerPoint that just built the deck and can sit at 0 bytes.
#   powershell -File presentations/_build/export_mp4.ps1 -Src <abs path>\<Base>_Narrated.pptx -Mp4 <abs path>\<Base>_Narrated.mp4
# Refuses to start while PowerPoint is open (it would attach to that window). A deck of about 18 slides takes 2 to 8 minutes.
param([Parameter(Mandatory)][string]$Src, [Parameter(Mandatory)][string]$Mp4, [int]$TimeoutMinutes = 60)
$ErrorActionPreference = "Stop"
if (Get-Process POWERPNT -ErrorAction SilentlyContinue) { throw "PowerPoint is open; close it first." }
if (Test-Path $Mp4) { Remove-Item $Mp4 -Force }
$start = Get-Date
$pp = New-Object -ComObject PowerPoint.Application
try {
  $p = $pp.Presentations.Open($Src, -1, 0, 0)   # read-only, no window
  $p.CreateVideo($Mp4, -1, 5, 1080, 30, 85)     # use slide timings; 1080p, 30 fps, quality 85
  while ($p.CreateVideoStatus -eq 1 -or $p.CreateVideoStatus -eq 2) {
    Start-Sleep -Seconds 10
    if (((Get-Date) - $start).TotalMinutes -gt $TimeoutMinutes) { throw "export still running after $TimeoutMinutes minutes" }
  }
  $status = $p.CreateVideoStatus                # 3 = done, 4 = failed
  $p.Close()
} finally { $pp.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($pp) }
$mb = if (Test-Path $Mp4) { [math]::Round((Get-Item $Mp4).Length / 1MB) } else { 0 }
"$([IO.Path]::GetFileName($Mp4)): status $status, $mb MB, $([math]::Round(((Get-Date) - $start).TotalMinutes, 1)) min"
if ($status -ne 3) { exit 1 }
