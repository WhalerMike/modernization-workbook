# Runs Microsoft Learn's pinned samples (examples/third_party/entra-role-assignments-page and
# entra-emergency-access-page) offline and unmodified. The PowerShell samples run against
# stand-ins for the three Graph PowerShell cmdlets they call, served from the fixture tenant; the
# log queries are evaluated over fictional exported rows by a small evaluator that handles only
# their shape. Nothing is installed, nothing signs in, and nothing leaves the machine.

$script:ThirdParty = Join-Path $PSScriptRoot '../../third_party'
$script:RolePage = Join-Path $script:ThirdParty 'entra-role-assignments-page/view-assignments.md'
$script:EmergencyPage = Join-Path $script:ThirdParty 'entra-emergency-access-page/security-emergency-access.md'

function Get-LearnBlock {
    <# Fenced code blocks of one language from a pinned Learn page, dedented, in page order. #>
    param([Parameter(Mandatory)][string]$Page, [Parameter(Mandatory)][string]$Language)
    $lines = [IO.File]::ReadAllLines((Resolve-Path -LiteralPath $Page).Path)
    $blocks = [Collections.Generic.List[string]]::new()
    $in = $false; $indent = 0; $buf = $null
    foreach ($l in $lines) {
        if (-not $in -and $l -match "^(\s*)``````$([regex]::Escape($Language))\s*$") { $in = $true; $indent = $Matches[1].Length; $buf = [Collections.Generic.List[string]]::new(); continue }
        if ($in -and $l -match '^\s*```\s*$') { $in = $false; $blocks.Add(($buf -join "`n")); continue }
        if ($in) { $buf.Add($(if ($l.Length -ge $indent) { $l.Substring([Math]::Min($indent, $l.Length - $l.TrimStart().Length)) } else { $l.TrimStart() })) }
    }
    , $blocks.ToArray()
}

function Get-LearnRoleSample {
    <# The named PowerShell sample from the role assignments page. #>
    param([Parameter(Mandatory)][ValidateSet('Connect', 'AllRoles', 'OneRole', 'Transitive', 'Group')][string]$Name)
    $blocks = Get-LearnBlock -Page $script:RolePage -Language 'powershell'
    $match = switch ($Name) {
        'Connect' { $blocks | Where-Object { $_.Trim() -eq 'Connect-MgGraph' } }
        'AllRoles' { $blocks | Where-Object { $_ -match 'foreach \(\$role in \$roles\)' } }
        'OneRole' { $blocks | Where-Object { $_ -match 'UnifiedRoleDefinitionId fdd7a751' } }
        'Transitive' { $blocks | Where-Object { $_ -match 'transitiveRoleAssignments' } }
        'Group' { $blocks | Where-Object { $_ -match "PrincipalId eq '<object id of group>'" } }
    }
    $match = @($match)
    if ($match.Count -ne 1) { throw "Expected one '$Name' sample on the pinned page, found $($match.Count)" }
    $match[0]
}

function Invoke-LearnRoleSample {
    <#
    Run one role assignment sample against stand-ins served from the fixture tenant. The stand-ins
    record their bound parameters; Get-MgRoleManagementDirectoryRoleAssignment answers a
    roleDefinitionId or principalId filter from the fixture's roleAssignments (active assignments,
    which is what the List unifiedRoleAssignments API returns). Returns @{ Output; Calls; Connected }.
    #>
    param([Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][string]$Fixture)
    $t = Get-Content -LiteralPath $Fixture -Raw | ConvertFrom-Json
    $global:LearnRun = [pscustomobject]@{ Tenant = $t; Calls = [Collections.Generic.List[object]]::new(); Connected = $null; Output = $null }
    try {
        function global:Connect-MgGraph { [CmdletBinding()] param($Environment, $Scopes, $TenantId, $ClientId) $global:LearnRun.Connected = [pscustomobject]@{ Bound = @($PSBoundParameters.Keys) } }
        function global:Get-MgRoleManagementDirectoryRoleDefinition {
            [CmdletBinding()] param([string]$UnifiedRoleDefinitionId, [string]$Filter, [switch]$All, [int]$PageSize, [int]$Top)
            $global:LearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-MgRoleManagementDirectoryRoleDefinition'; Bound = @($PSBoundParameters.Keys); Filter = $Filter })
            $defs = @($global:LearnRun.Tenant.roleDefinitions | ForEach-Object { [pscustomobject]@{ Id = $_.id; DisplayName = $_.displayName; TemplateId = $_.templateId } })
            if ($UnifiedRoleDefinitionId) { $defs | Where-Object Id -EQ $UnifiedRoleDefinitionId } else { $defs }
        }
        function global:Get-MgRoleManagementDirectoryRoleAssignment {
            [CmdletBinding()] param([string]$Filter, [switch]$All, [int]$PageSize, [int]$Top, [string[]]$ExpandProperty)
            $global:LearnRun.Calls.Add([pscustomobject]@{ Cmdlet = 'Get-MgRoleManagementDirectoryRoleAssignment'; Bound = @($PSBoundParameters.Keys); Filter = $Filter })
            $rows = @($global:LearnRun.Tenant.roleAssignments)
            if ($Filter -match "roleDefinitionId eq '([^']+)'") { $v = $Matches[1]; $rows = @($rows | Where-Object roleDefinitionId -EQ $v) }
            elseif ($Filter -match "PrincipalId eq '([^']+)'") { $v = $Matches[1]; $rows = @($rows | Where-Object principalId -EQ $v) }
            $rows | ForEach-Object { [pscustomobject]@{ Id = $_.id; PrincipalId = $_.principalId; RoleDefinitionId = $_.roleDefinitionId; DirectoryScopeId = $_.directoryScopeId; AppScopeId = $null } }
        }
        $code = Get-LearnRoleSample -Name $Name
        $global:LearnRun.Output = @(& ([scriptblock]::Create($code)))
    } finally {
        foreach ($f in 'Connect-MgGraph', 'Get-MgRoleManagementDirectoryRoleDefinition', 'Get-MgRoleManagementDirectoryRoleAssignment') {
            Remove-Item "function:global:$f" -ErrorAction SilentlyContinue
        }
    }
    $global:LearnRun
}

function Get-LearnEmergencyQuery {
    <# The three sample queries from the emergency access page, as published. #>
    , (Get-LearnBlock -Page $script:EmergencyPage -Language 'kusto')
}

function ConvertFrom-LearnKql {
    <#
    Parse a query of the sample's shape only: a table name, one "| where" of Column == "value"
    terms joined by "or", and a "| project". Anything else throws, so a new upstream shape fails
    the tests instead of being half-read.
    #>
    param([Parameter(Mandatory)][string]$Query)
    $lines = @($Query -split "`n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -and -not $_.StartsWith('//') })
    $q = [pscustomobject]@{ Table = $lines[0]; Terms = @(); Project = @() }
    if ($q.Table -notmatch '^[A-Za-z]+$') { throw "Unexpected first line: $($q.Table)" }
    foreach ($l in $lines | Select-Object -Skip 1) {
        if ($l -match '^\|\s*where\s+(.+)$') {
            $q.Terms = @($Matches[1] -split '\s+or\s+' | ForEach-Object {
                    if ($_ -notmatch '^(\w+)\s*==\s*"([^"]*)"$') { throw "Unexpected term: $_" }
                    [pscustomobject]@{ Column = $Matches[1]; Value = $Matches[2] }
                })
        } elseif ($l -match '^\|\s*project\s+(.+)$') {
            $q.Project = @($Matches[1] -split ',\s*')
        } else { throw "Unexpected line: $l" }
    }
    $q
}

function Invoke-LearnKql {
    <# Evaluate a parsed sample query over exported rows. == is case-sensitive, as in KQL. #>
    param([Parameter(Mandatory)]$Parsed, [Parameter(Mandatory)][object[]]$Rows)
    foreach ($r in $Rows) {
        if ($r.Table -ne $Parsed.Table) { continue }
        foreach ($t in $Parsed.Terms) {
            $v = $r.PSObject.Properties[$t.Column]
            if ($v -and [string]$v.Value -ceq $t.Value) { $r; break }
        }
    }
}
