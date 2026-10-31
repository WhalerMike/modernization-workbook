# Runs Chapter 07's pinned Learn sample offline and unmodified:
#   examples/third_party/entra-review-app-permissions-page  ("Review permissions granted to enterprise applications")
# The Microsoft Graph PowerShell script runs against stand-ins for the cmdlets it calls, served
# from the Chapter 07 fixture; the Microsoft Graph HTTP requests are parsed from the page. Nothing
# is installed, nothing signs in, and nothing leaves the machine. Kept apart from
# LearnSampleHarness.ps1 so chapters written in parallel don't collide.

$script:LpPage = Join-Path $PSScriptRoot '../../third_party/entra-review-app-permissions-page/manage-application-permissions.md'

function Get-LpLearnSection {
    <# The lines of the pinned page from one '## ' heading to the next. #>
    param([Parameter(Mandatory)][string]$Heading)
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $script:LpPage).Path)
    $start = [Array]::IndexOf($lines, "## $Heading")
    if ($start -lt 0) { throw "No section '$Heading' on the pinned page" }
    $end = $start + 1
    while ($end -lt $lines.Count -and $lines[$end] -notmatch '^## ') { $end++ }
    , $lines[$start..($end - 1)]
}

function Get-LpLearnBlock {
    <# Fenced code blocks of one language in a section, in page order, with their indentation removed. #>
    param([Parameter(Mandatory)][string]$Heading, [Parameter(Mandatory)][string]$Language)
    $blocks = [Collections.Generic.List[string]]::new(); $in = $false; $buf = $null; $indent = 0
    foreach ($l in (Get-LpLearnSection -Heading $Heading)) {
        if (-not $in -and $l -match "^(\s*)``````$([regex]::Escape($Language))\s*$") { $in = $true; $indent = $Matches[1].Length; $buf = [Collections.Generic.List[string]]::new(); continue }
        if ($in -and $l -match '^\s*```\s*$') { $in = $false; $blocks.Add((($buf -join "`n").Trim())); continue }
        if ($in) { $buf.Add($(if ($l.Length -ge $indent) { $l.Substring($indent) } else { $l.TrimStart() })) }
    }
    $blocks.ToArray()
}

function Get-LpLearnGraphPsScript {
    $b = @(Get-LpLearnBlock -Heading 'Review and revoke permissions using Microsoft Graph PowerShell' -Language 'powershell')
    if ($b.Count -ne 1) { throw "Expected one Microsoft Graph PowerShell script, found $($b.Count)" }
    $b[0]
}

function Get-LpLearnHttpRequest {
    <# The Microsoft Graph section's HTTP requests: @{ Method; Uri }. #>
    foreach ($b in @(Get-LpLearnBlock -Heading 'Review and revoke permissions using Microsoft Graph' -Language 'http')) {
        if ($b -notmatch '^(GET|DELETE|POST|PATCH) (\S+)$') { throw "Unexpected request: $b" }
        [pscustomobject]@{ Method = $Matches[1]; Uri = $Matches[2] }
    }
}

# The stand-ins, defined inside the sample's own runspace. $LpRun is the shared state.
$script:LpStandIns = @'
function Connect-MgGraph { [CmdletBinding()] param($Scopes) $LpRun.Scopes = @($Scopes) }
function Get-MgServicePrincipal {
    [CmdletBinding()] param([string]$ServicePrincipalId)
    $LpRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-MgServicePrincipal'; Id = $ServicePrincipalId; Bound = @($PSBoundParameters.Keys) })
    $id = if ($ServicePrincipalId -eq '<ServicePrincipal objectID>') { $LpRun.TargetId } else { $ServicePrincipalId }
    [pscustomobject]@{ Id = $id }
}
function Get-MgOauth2PermissionGrant {
    [CmdletBinding()] param([switch]$All, [string]$Filter)
    $LpRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-MgOauth2PermissionGrant'; Id = ''; Bound = @($PSBoundParameters.Keys) })
    foreach ($g in @($LpRun.Estate.graph.oauth2PermissionGrants)) { [pscustomobject]@{ Id = $g.id; ClientId = $g.clientId; ConsentType = $g.consentType; PrincipalId = $g.principalId; ResourceId = $g.resourceId; Scope = $g.scope } }
}
function Remove-MgOauth2PermissionGrant {
    [CmdletBinding()] param([string]$OAuth2PermissionGrantId)
    $LpRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Remove-MgOauth2PermissionGrant'; Id = $OAuth2PermissionGrantId; Bound = @($PSBoundParameters.Keys) })
    $LpRun.Estate.graph.oauth2PermissionGrants = @($LpRun.Estate.graph.oauth2PermissionGrants | Where-Object { $_.id -ne $OAuth2PermissionGrantId })
}
function Get-MgServicePrincipalAppRoleAssignment {
    [CmdletBinding()] param([string]$ServicePrincipalId, [switch]$All)
    $LpRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-MgServicePrincipalAppRoleAssignment'; Id = $ServicePrincipalId; Bound = @($PSBoundParameters.Keys) })
    foreach ($a in @($LpRun.Estate.graph.appRoleAssignments | Where-Object { $_.principalId -eq $ServicePrincipalId })) {
        [pscustomobject]@{ Id = $a.id; PrincipalId = $a.principalId; PrincipalType = $a.principalType; ResourceId = $a.resourceId; AppRoleId = $a.appRoleId }
    }
}
function Remove-MgServicePrincipalAppRoleAssignedTo {
    [CmdletBinding()] param([string]$ServicePrincipalId, [string]$AppRoleAssignmentId)
    $LpRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Remove-MgServicePrincipalAppRoleAssignedTo'; Id = $ServicePrincipalId; AssignmentId = $AppRoleAssignmentId; Bound = @($PSBoundParameters.Keys) })
    $hit = @($LpRun.Estate.graph.appRoleAssignments | Where-Object { $_.id -eq $AppRoleAssignmentId -and $_.resourceId -eq $ServicePrincipalId })
    if (-not $hit.Count) {
        $PSCmdlet.WriteError([Management.Automation.ErrorRecord]::new([Exception]::new("404 Not Found: no app role assignment $AppRoleAssignmentId on resource service principal $ServicePrincipalId"), 'Request_ResourceNotFound', 'ObjectNotFound', $AppRoleAssignmentId))
        return
    }
    $LpRun.Estate.graph.appRoleAssignments = @($LpRun.Estate.graph.appRoleAssignments | Where-Object { $_.id -ne $AppRoleAssignmentId })
}
'@

function Invoke-LpLearnGraphPsScript {
    <#
    Run the Microsoft Graph PowerShell script, unmodified, in its own runspace, the way a .ps1 file
    or a console paste runs it (inside Pester's try blocks, the page's stray 'Example:' line would
    stop the script, which a user running it wouldn't see), against stand-ins for Connect-MgGraph,
    Get-MgServicePrincipal (the page's placeholder resolves to -TargetId), Get-MgOauth2PermissionGrant,
    Remove-MgOauth2PermissionGrant, Get-MgServicePrincipalAppRoleAssignment and
    Remove-MgServicePrincipalAppRoleAssignedTo. The last follows Learn's Delete appRoleAssignedTo:
    the service principal named must be the assignment's RESOURCE, or it fails with 404, written as
    a non-terminating error. Returns @{ Estate; Calls; Errors; Scopes }.
    #>
    param([Parameter(Mandatory)][string]$Fixture, [Parameter(Mandatory)][string]$TargetId)
    $t = Get-Content -LiteralPath $Fixture -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $run = [pscustomobject]@{ Estate = $t; Calls = [Collections.Generic.List[object]]::new(); Errors = @(); Scopes = @(); TargetId = $TargetId }
    $ps = [powershell]::Create()
    try {
        $ps.Runspace.SessionStateProxy.SetVariable('LpRun', $run)
        $null = $ps.AddScript($script:LpStandIns).Invoke()
        $ps.Commands.Clear()
        $null = $ps.AddScript((Get-LpLearnGraphPsScript)).Invoke()
        $run.Errors = @($ps.Streams.Error)
    } finally { $ps.Dispose() }
    $run
}
