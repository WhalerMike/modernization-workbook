# Chapter 05: runs Microsoft's PIM for Groups request samples (examples/third_party/
# graph-pim-for-groups-pages) offline and unmodified. The HTTP requests are extracted from the
# pinned Microsoft Graph documentation pages and sent, as published, to the chapter's fake Graph
# (New-PaPgFixtureInvoker). Nothing is installed, nothing signs in, and nothing leaves the machine.

$script:PgPages = Join-Path $PSScriptRoot '../../third_party/graph-pim-for-groups-pages'

function Get-PgLearnRequest {
    <#
    The HTTP requests on one pinned page, in page order: Title (the nearest example heading),
    Method, Uri, Body (parsed JSON as a hashtable, or $null). Response blocks and the relative
    syntax blocks under "HTTP request" are left out.
    #>
    param([Parameter(Mandatory)][ValidateSet('eligibility', 'assignment', 'rules')][string]$Page)
    $file = switch ($Page) {
        'eligibility' { 'privilegedaccessgroup-post-eligibilityschedulerequests.md' }
        'assignment' { 'privilegedaccessgroup-post-assignmentschedulerequests.md' }
        'rules' { 'how-to-pim-update-rules.md' }
    }
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath (Join-Path $script:PgPages $file)).Path)
    $out = [Collections.Generic.List[object]]::new()
    $title = $null; $in = $false; $buf = $null
    foreach ($l in $lines) {
        if (-not $in -and $l -match '^#{2,3} (?!\[)(.+)$') { $title = $Matches[1].Trim(); continue }
        if (-not $in -and $l -match '^```http\s*$') { $in = $true; $buf = [Collections.Generic.List[string]]::new(); continue }
        if ($in -and $l -match '^```\s*$') {
            $in = $false
            if ($buf.Count -and $buf[0] -match '^(GET|POST|PATCH|PUT|DELETE) (https://\S+)$') {
                $m = $Matches[1]; $u = $Matches[2]
                $start = -1; for ($i = 1; $i -lt $buf.Count; $i++) { if ($buf[$i].TrimStart().StartsWith('{')) { $start = $i; break } }
                $body = if ($start -ge 0) { ($buf[$start..($buf.Count - 1)] -join "`n") | ConvertFrom-Json -AsHashtable } else { $null }
                $out.Add([pscustomobject]@{ Title = $title; Method = $m; Uri = $u; Body = $body })
            }
            continue
        }
        if ($in) { $buf.Add($l) }
    }
    $out.ToArray()
}

function Get-PgLearnPageText {
    param([Parameter(Mandatory)][string]$File)
    [IO.File]::ReadAllText((Resolve-Path -LiteralPath (Join-Path $script:PgPages $File)).Path)
}

function Invoke-PgLearnRequest {
    <#
    Send one sample request, unmodified, to a fake. The fake's tenant gets a group with the
    sample's groupId (and, if -Policy, a member and owner policy from the fixture's T1 group)
    so the request reaches the fake's checks. Returns Status (Created or the fake's error) and
    the fake.
    #>
    param([Parameter(Mandatory)]$Request, [Parameter(Mandatory)][string]$Fixture, [string]$Cloud = 'gcc', [switch]$Policy)
    $fake = New-PaPgFixtureInvoker -Path $Fixture -Cloud $Cloud
    $gid = if ($Request.Body -and $Request.Body.ContainsKey('groupId')) { $Request.Body.groupId } else { $null }
    if ($gid) {
        $fake.Tenant.groups += @{ id = $gid; displayName = 'Learn sample group'; isAssignableToRole = $true; securityEnabled = $true; groupTypes = @() }
        if ($Policy) {
            foreach ($pa in @($fake.Tenant.policyAssignments | Where-Object { $_.scopeId -eq '5a000000-0000-4000-8000-000000000002' })) {
                $copy = $pa | ConvertTo-Json -Depth 30 | ConvertFrom-Json -AsHashtable
                $copy.scopeId = $gid
                $fake.Tenant.policyAssignments += $copy
            }
        }
    }
    try { $r = & $fake.Invoke $Request.Method $Request.Uri $Request.Body; $status = if ($Request.Method -eq 'PATCH') { 'NoContent' } else { 'Created' } }
    catch { $status = $_.Exception.Message; $r = $null }
    [pscustomobject]@{ Status = $status; Response = $r; Fake = $fake }
}
