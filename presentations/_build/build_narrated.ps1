param(
  [Parameter(Mandatory)][string]$Dir,
  [Parameter(Mandatory)][string]$Base,
  [switch]$Video
)
# Build the narrated, self-running version of a deck (and optionally an MP4), with closed captions.
#
#   1. Run narrate.py first (clips, durations, sentence timings) and captions.py (slideNN.vtt and <Base>_Narrated.vtt).
#   2. This script adds each slide's clip, sets the slide timings and saves <Base>_Narrated.pptx.
#   3. a11y_fix.py then embeds each slide's WebVTT caption track and the accessibility fixes.
#   4. With -Video, the captioned deck is reopened and exported as <Base>_Narrated.mp4; <Base>_Narrated.vtt is the
#      caption track for that video (players and Stream/SharePoint load it as closed captions).
$ErrorActionPreference = "Stop"
$src  = Join-Path $Dir "$Base.pptx"
$dst  = Join-Path $Dir "$($Base)_Narrated.pptx"
$mp4  = Join-Path $Dir "$($Base)_Narrated.mp4"
$nar  = Join-Path $Dir "narration_$Base"
$dur  = Get-Content (Join-Path $nar "durations.json") -Raw | ConvertFrom-Json
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$py   = if ($env:PYTHON) { $env:PYTHON } else { "python" }

if (-not (Test-Path (Join-Path $nar "slide01.vtt"))) { throw "no captions in $nar - run captions.py first" }
# New-Object attaches to a running PowerPoint and Quit() would close it, including someone's open window.
if (Get-Process POWERPNT -ErrorAction SilentlyContinue) { throw "PowerPoint is already running; close it first" }
$started = Get-Date

function Stop-OwnPowerPoint {   # a hidden POWERPNT can linger after Quit(); kill only ones this run started
  Get-Process POWERPNT -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -gt $started } | Stop-Process -Force -Confirm:$false
}

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
    # Placed just off the right edge of the slide: it still plays in the slide show and the MP4 export,
    # but the icon isn't in the picture. (On the slide, the icon showed for the whole clip, because
    # "hide while not playing" only hides it before and after.)
    $shp = $slide.Shapes.AddMediaObject2($mp3, 0, -1, $p.PageSetup.SlideWidth + 20, 10, 24, 24)
    $shp.Name = "Narration"
    $shp.AlternativeText = "Narration for this slide; captions available"
    $shp.AnimationSettings.PlaySettings.HideWhileNotPlaying = -1
    $eff = $slide.TimeLine.MainSequence.AddEffect($shp, 83, 0, 2)   # media play, with previous = automatic
    $t = $slide.SlideShowTransition
    # The clip starts only after the slide's transition finishes, but the advance timer runs from the
    # start of the slide. So the slide stays up for the transition, the clip, and a 2-second pause
    # (which also covers media load lag). The old "clip + 1 s" cut off the end of every clip.
    $secs = [double]$t.Duration + [double]$dur.("$i") + 2.0
    $t.AdvanceOnClick = -1
    $t.AdvanceOnTime = -1
    $t.AdvanceTime = $secs
    "slide $i : $([math]::Round($secs,1)) s"
  }
  $p.SlideShowSettings.AdvanceMode = 2                  # use timings
  $p.Save()
  $p.Close()
} finally { $pp.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($pp); Stop-OwnPowerPoint }

& $py (Join-Path $here "a11y_fix.py") $dst --captions $nar
if ($LASTEXITCODE) { throw "a11y_fix.py failed" }

if ($Video) {
  $pp = New-Object -ComObject PowerPoint.Application
  try {
    $p = $pp.Presentations.Open($dst, -1, 0, 0)        # read-only for the export
    $p.CreateVideo($mp4, -1, 5, 1080, 30, 85)
    $last = Get-Date
    while ($p.CreateVideoStatus -eq 1 -or $p.CreateVideoStatus -eq 2) {
      Start-Sleep -Seconds 5
      if (((Get-Date) - $last).TotalMinutes -gt 30) { throw "video export stalled" }
    }
    "video status: $($p.CreateVideoStatus)"            # 3 = done, 4 = failed
    $p.Close()
  } finally { $pp.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($pp); Stop-OwnPowerPoint }
}
"done"
