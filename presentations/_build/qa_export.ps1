param(
  [Parameter(Mandatory)][string[]]$Deck,
  [string]$Out = "",
  [switch]$NoPng
)
# Visual QA through PowerPoint itself (no LibreOffice on the build machine): exports every slide as a PNG
# and measures what PowerPoint actually laid out. Reports, per slide:
#   overflow   text whose rendered height runs past its box (more than 2 pt)
#   low        a shape, or a table's rendered rows, ending below the Sources line (6.6 in), except the footer,
#              the slide number, the Sources line and off-slide narration audio
#   overlap    two body shapes (text boxes, tables, panels) whose boxes overlap, outside a panel's own contents
# Exits 1 if anything is reported. Refuses to start while PowerPoint is open, like build_narrated.ps1.
$ErrorActionPreference = "Stop"
if (Get-Process POWERPNT -ErrorAction SilentlyContinue) { throw "PowerPoint is already running; close it first" }
$started = Get-Date
$problems = 0
$pp = New-Object -ComObject PowerPoint.Application
try {
  foreach ($d in $Deck) {
    $path = (Resolve-Path $d).Path
    $dir = if ($Out) { $Out } else { Join-Path (Split-Path $path) ("qa_" + [IO.Path]::GetFileNameWithoutExtension($path)) }
    if (-not $NoPng) { New-Item -ItemType Directory -Force $dir | Out-Null }
    $p = $pp.Presentations.Open($path, -1, 0, 0)
    $limit = 6.6 * 72
    foreach ($s in $p.Slides) {
      $i = $s.SlideIndex
      $boxes = @()
      foreach ($sh in $s.Shapes) {
        $name = $sh.Name
        if ($name -in @("Sources", "Narration") -or $sh.Left -ge $p.PageSetup.SlideWidth) { continue }
        if ($sh.Top -ge 6.9 * 72) { continue }      # footer and slide number
        $bottom = $sh.Top + $sh.Height
        if ($sh.HasTable) {
          $h = 0; for ($r = 1; $r -le $sh.Table.Rows.Count; $r++) { $h += $sh.Table.Rows.Item($r).Height }
          $bottom = $sh.Top + $h
        } elseif ($sh.HasTextFrame -and $sh.TextFrame.HasText) {
          $tr = $sh.TextFrame.TextRange
          $tb = $tr.BoundTop + $tr.BoundHeight
          if ($tb -gt $sh.Top + $sh.Height + 2) { "slide $i overflow: '$name' text ends $([math]::Round(($tb - $sh.Top - $sh.Height)/72,2)) in below its box"; $problems++ }
          $bottom = [math]::Max($bottom, $tb)
        }
        if ($bottom -gt $limit + 1 -and $s.Layout -ne 1 -and $i -gt 1) { "slide $i low: '$name' ends at $([math]::Round($bottom/72,2)) in"; $problems++ }
        if ($sh.HasTable -or ($sh.HasTextFrame -and $sh.TextFrame.HasText -and $name -notmatch '^(Tag|Step|Card|Panel|Callout|Code|Icon)')) {
          $boxes += ,@($name, $sh.Left, $sh.Top, ($sh.Left + $sh.Width), $bottom)
        }
      }
      for ($a = 0; $a -lt $boxes.Count; $a++) { for ($b = $a + 1; $b -lt $boxes.Count; $b++) {
        $u = $boxes[$a]; $v = $boxes[$b]
        $ox = [math]::Min($u[3], $v[3]) - [math]::Max($u[1], $v[1]); $oy = [math]::Min($u[4], $v[4]) - [math]::Max($u[2], $v[2])
        if ($ox -gt 2 -and $oy -gt 2) { "slide $i overlap: '$($u[0])' and '$($v[0])' by $([math]::Round($oy/72,2)) in"; $problems++ }
      } }
      if (-not $NoPng) { $s.Export((Join-Path $dir ("slide{0:D2}.png" -f $i)), "PNG", 1600, 900) }
    }
    "$([IO.Path]::GetFileName($path)): $($p.Slides.Count) slides checked"
    $p.Close()
  }
} finally {
  $pp.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($pp)
  Get-Process POWERPNT -ErrorAction SilentlyContinue | Where-Object { $_.StartTime -gt $started } | Stop-Process -Force -Confirm:$false
}
"problems: $problems"
if ($problems) { exit 1 }
