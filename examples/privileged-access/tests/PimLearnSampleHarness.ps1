# Chapter 04: extracts the HTTP requests from Learn's pinned PIM pages
# (examples/third_party/graph-pim-rules-pages), unmodified, so the tests can send them to the fake
# Graph in PimEntraRoles.psm1. Nothing signs in and nothing leaves the machine.

$script:PimPages = Join-Path $PSScriptRoot '../../third_party/graph-pim-rules-pages'
$script:RulesPage = Join-Path $script:PimPages 'how-to-pim-update-rules.md'
$script:TutorialPage = Join-Path $script:PimPages 'tutorial-assign-azureadroles.md'

function Get-PimLearnRequest {
    <#
    Every request sample on a pinned page, in page order: fenced blocks marked http,
    msgraph-interactive or msgraph whose first line is a method and a Graph URL. Response blocks
    (which start with HTTP/1.1 or a header) are skipped. Returns Method, Uri, Body (a hashtable,
    or $null) and Text.
    #>
    param([Parameter(Mandatory)][string]$Page)
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $Page).Path)
    $in = $false; $buf = $null
    foreach ($l in $lines) {
        if (-not $in -and $l -match '^\s*```(http|msgraph-interactive|msgraph)\s*$') { $in = $true; $buf = [Collections.Generic.List[string]]::new(); continue }
        if ($in -and $l -match '^\s*```\s*$') {
            $in = $false
            $first = ($buf | Where-Object { $_.Trim() } | Select-Object -First 1)
            if ($first -match '^(GET|POST|PATCH|DELETE)\s+(https://\S+.*)$') {
                $method = $Matches[1]; $uri = $Matches[2].Trim()
                $text = $buf -join "`n"
                $brace = $text.IndexOf('{')
                $body = if ($method -ne 'GET' -and $brace -ge 0) { $text.Substring($brace) | ConvertFrom-Json -AsHashtable } else { $null }
                [pscustomobject]@{ Method = $method; Uri = $uri; Body = $body; Text = $text }
            }
            continue
        }
        if ($in) { $buf.Add($l) }
    }
}

function ConvertTo-PimFakeUri {
    # Learn's sample URLs contain spaces and quotes in $filter; encode the query as a client would.
    param([string]$Uri)
    $i = $Uri.IndexOf('?')
    if ($i -lt 0) { return $Uri }
    $q = ($Uri.Substring($i + 1).Split('&') | ForEach-Object { $kv = $_.Split('=', 2); "$($kv[0])=$([Uri]::EscapeDataString($kv[1]))" }) -join '&'
    $Uri.Substring(0, $i) + '?' + $q
}
