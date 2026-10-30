#Requires -Version 7.1
# Chapter 07: reads Learn's tutorial "Review access to administrative roles using access reviews
# APIs" from its pinned, unmodified source page and returns the HTTP requests it publishes, so the
# tests can run them against the fake. Nothing here edits the page or calls a tenant.

$script:ArTutorialPath = Join-Path $PSScriptRoot '../../third_party/graph-access-reviews-roles-tutorial/tutorial-accessreviews-roleassignments.md'

function Get-ArTutorialText { [IO.File]::ReadAllText($script:ArTutorialPath) }

function Get-ArTutorialRequests {
    <#
    .SYNOPSIS
        Every request block on the page (```http or ```msgraph-interactive whose first line is a
        method and a URL), in order, with the step heading it sits under and its JSON body.
    #>
    $lines = (Get-ArTutorialText) -split "`r?`n"
    $step = ''
    $out = [Collections.Generic.List[object]]::new()
    for ($i = 0; $i -lt $lines.Count; $i++) {
        if ($lines[$i] -match '^## (Step \d+)') { $step = $Matches[1] }
        if ($lines[$i] -match '^```(http|msgraph-interactive)\s*$') {
            $block = [Collections.Generic.List[string]]::new()
            for ($j = $i + 1; $j -lt $lines.Count -and $lines[$j] -notmatch '^```\s*$'; $j++) { $block.Add($lines[$j]) }
            $i = $j
            if ($block.Count -eq 0 -or $block[0] -notmatch '^(GET|POST|PUT|PATCH|DELETE) (\S+)') { continue }
            $method = $Matches[1]; $uri = $Matches[2]
            $blank = $block.IndexOf('')
            $text = if ($blank -ge 0) { ($block | Select-Object -Skip ($blank + 1)) -join "`n" } else { '' }
            $body = if ($text.Trim().StartsWith('{')) { $text | ConvertFrom-Json -AsHashtable -Depth 30 } else { $null }
            $out.Add([pscustomobject]@{ Step = $step; Method = $method; Uri = $uri; Body = $body; BodyText = $text })
        }
    }
    $out.ToArray()
}

function Get-ArTutorialCreateRequest {
    # Step 1: the POST that creates the access review definition, exactly as published.
    @(Get-ArTutorialRequests | Where-Object { $_.Step -eq 'Step 1' -and $_.Method -eq 'POST' })[0]
}
