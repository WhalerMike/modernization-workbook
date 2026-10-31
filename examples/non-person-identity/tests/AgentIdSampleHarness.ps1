# Chapter 09: runs Microsoft Learn's Agent ID samples offline and unmodified:
#   examples/third_party/entra-agent-id-pages     (create a blueprint and its credentials, inheritable
#                                                  permissions, the agent Conditional Access policies)
#   examples/third_party/graph-agent-id-api-pages (list blueprints, agent identities and their sponsors)
# The HTTP requests are extracted from the pinned page sources and sent, as published, to the
# chapter's fake Graph (New-NpiAgentFixtureInvoker). Placeholders such as <id> are the only thing
# replaced, with fixture values, and only when a test says so. Nothing is installed, nothing signs
# in, and nothing leaves the machine.

$script:AgentPages = Join-Path $PSScriptRoot '../../third_party/entra-agent-id-pages'
$script:GraphAgentPages = Join-Path $PSScriptRoot '../../third_party/graph-agent-id-api-pages'

function Get-AgentIdPagePath {
    param([Parameter(Mandatory)][string]$File)
    foreach ($d in $script:AgentPages, $script:GraphAgentPages) { $p = Join-Path $d $File; if (Test-Path -LiteralPath $p) { return (Resolve-Path -LiteralPath $p).Path } }
    throw "No pinned page $File"
}

function Get-AgentIdPageText {
    param([Parameter(Mandatory)][string]$File)
    [IO.File]::ReadAllText((Get-AgentIdPagePath $File))
}

function Get-AgentIdLearnRequest {
    <#
    The HTTP requests on one pinned page, in page order: Title (the nearest heading), Method, Uri,
    Headers, Body (parsed JSON as a hashtable, or $null). Fenced blocks tagged http or
    msgraph-interactive whose first line is METHOD https://...; response blocks and relative
    syntax blocks are left out.
    #>
    param([Parameter(Mandatory)][string]$File)
    $lines = [IO.File]::ReadAllLines((Get-AgentIdPagePath $File))
    $out = [Collections.Generic.List[object]]::new()
    $title = $null; $in = $false; $buf = $null
    foreach ($l in $lines) {
        if (-not $in -and $l -match '^#{2,4} (?!\[)(.+)$') { $title = $Matches[1].Trim(); continue }
        if (-not $in -and $l -match '^```\s?(http|msgraph-interactive)\s*$') { $in = $true; $buf = [Collections.Generic.List[string]]::new(); continue }
        if ($in -and $l -match '^```\s*$') {
            $in = $false
            if ($buf.Count -and $buf[0] -match '^(GET|POST|PATCH|PUT|DELETE) (https://\S+)\s*$') {
                $m = $Matches[1]; $u = $Matches[2]
                $headers = @{}; $j = 1
                while ($j -lt $buf.Count -and $buf[$j].Trim()) { if ($buf[$j] -match '^([A-Za-z-]+):\s*(.+)$') { $headers[$Matches[1]] = $Matches[2].Trim() }; $j++ }
                $text = (($buf | Select-Object -Skip $j) -join "`n").Trim()
                $out.Add([pscustomobject]@{ Title = $title; Method = $m; Uri = $u; Headers = $headers; Body = $(if ($text) { $text | ConvertFrom-Json -AsHashtable } else { $null }) })
            }
            continue
        }
        if ($in) { $buf.Add($l) }
    }
    $out.ToArray()
}

function Send-AgentIdLearnRequest {
    <# Send one sample to a fake, as published, or with -Replace @{ '<placeholder>' = 'value' } applied to the URI and body. Returns Status and Response. #>
    param([Parameter(Mandatory)]$Request, [Parameter(Mandatory)]$Fake, [hashtable]$Replace = @{})
    $uri = $Request.Uri
    $json = if ($null -ne $Request.Body) { $Request.Body | ConvertTo-Json -Depth 20 } else { $null }
    foreach ($k in $Replace.Keys) { $uri = $uri.Replace($k, $Replace[$k]); if ($json) { $json = $json.Replace($k, $Replace[$k]) } }
    $body = if ($json) { $json | ConvertFrom-Json -AsHashtable } else { $null }
    try { [pscustomobject]@{ Status = 'OK'; Response = (& $Fake.Invoke $Request.Method $uri $body $Request.Headers) } }
    catch { [pscustomobject]@{ Status = "$($_.Exception.Message)"; Response = $null } }
}
