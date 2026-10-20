param(
  [Parameter(Mandatory)][string]$Dir,
  [Parameter(Mandatory)][string]$Base,
  [switch]$Video
)
# Build the narrated, self-running version of a deck edition (and optionally an MP4).
$src  = Join-Path $Dir "$Base.pptx"
$dst  = Join-Path $Dir "$($Base)_Narrated.pptx"
$mp4  = Join-Path $Dir "$($Base)_Narrated.mp4"
$nar  = Join-Path $Dir "narration_$Base"
$dur  = Get-Content (Join-Path $nar "durations.json") -Raw | ConvertFrom-Json

Copy-Item $src $dst -Force
$pp = New-Object -ComObject PowerPoint.Application
try {
  $p = $pp.Presentations.Open($dst, 0, 0, 0)          # read-write, untitled=false, no window
  $n = @($dur.PSObject.Properties).Count                # narrated slides; anything after (Backup) is dropped
  for ($k = $p.Slides.Count; $k -gt $n; $k--) { $p.Slides.Item($k).Delete() }
  for ($i = 1; $i -le $n; $i++) {
    $slide = $p.Slides.Item($i)
    $mp3 = Join-Path $nar ("slide{0:D2}.mp3" -f $i)
    if (-not (Test-Path $mp3)) { throw "missing $mp3" }
    # small icon in the bottom-left corner; hidden while not playing
    $shp = $slide.Shapes.AddMediaObject2($mp3, 0, -1, 10, 500, 24, 24)
    $shp.Name = "Narration"
    $shp.AnimationSettings.PlaySettings.HideWhileNotPlaying = -1
    $eff = $slide.TimeLine.MainSequence.AddEffect($shp, 83, 0, 2)   # media play, with previous = automatic
    $secs = [double]$dur.("$i") + 1.0
    $t = $slide.SlideShowTransition
    $t.AdvanceOnClick = -1
    $t.AdvanceOnTime = -1
    $t.AdvanceTime = $secs
    "slide $i : $([math]::Round($secs,1)) s"
  }
  $p.SlideShowSettings.AdvanceMode = 2                  # use timings
  $p.Save()
  if ($Video) {
    $p.CreateVideo($mp4, -1, 5, 1080, 30, 85)
    while ($p.CreateVideoStatus -eq 1 -or $p.CreateVideoStatus -eq 2) { Start-Sleep -Seconds 5 }
    "video status: $($p.CreateVideoStatus)"            # 3 = done, 4 = failed
  }
  $p.Close()
} finally { $pp.Quit() }
"done"
