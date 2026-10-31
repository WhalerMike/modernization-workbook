<#
.SYNOPSIS
    Conditional Access personas: VK-CA-01. Read-only.
    Sources: Attribute-Driven Migration implementation guide, Gate 5; Book 04, Chapter 03
    (policies come in pairs, exclusions); Book 01, Chapter 04 (verification).
#>

function Get-VkCaUserPolicies {
    # Policies that target users: not Off, with a users condition, and not a workload identity
    # policy (those name service principals and are VK-NPI-04's). Report-only counts: the persona
    # set runs report-only before it's enforced. Permission: Policy.Read.All.
    param($Context)
    @(Get-VkData -Context $Context -Name 'caPolicies' -Uri '/v1.0/identity/conditionalAccess/policies' | Where-Object {
            $c = Get-VkValue $_ 'conditions'
            $sp = @(Get-VkValue (Get-VkValue $c 'clientApplications') 'includeServicePrincipals' @() | Where-Object { $_ })
            "$($_.state)" -ne 'disabled' -and $null -ne (Get-VkValue $c 'users') -and $sp.Count -eq 0
        })
}

function Get-VkCaList {
    # A list property of a policy's users or applications condition, as strings.
    param($Policy, [string]$Condition, [string]$Name)
    @(Get-VkValue (Get-VkValue (Get-VkValue $Policy 'conditions') $Condition) $Name @() | Where-Object { $_ } | ForEach-Object { "$_" })
}

function Test-VkCaBlock {
    param($Policy)
    @(Get-VkValue (Get-VkValue $Policy 'grantControls') 'builtInControls' @()) -contains 'block'
}

function Test-VkCaAppOverlap {
    # True when two policies' included applications overlap; 'All' overlaps everything.
    param($A, $B)
    $a = Get-VkCaList $A 'applications' 'includeApplications'
    $b = Get-VkCaList $B 'applications' 'includeApplications'
    if ($a -contains 'All' -or $b -contains 'All') { return $true }
    @($a | Where-Object { $b -contains $_ }).Count -gt 0
}

function Invoke-VkCa01 {
    <#
    .SYNOPSIS
        Implements VK-CA-01: checks the Conditional Access persona policies. Fails on a policy that
        doesn't exclude every emergency-access group, targets a group outside governed-groups.csv,
        or grants to groups with no paired block. NotApplicable without both inputs.
    .EXAMPLE
        # From the kit folder: against the fictional "fail" fixture tenant (no sign-in).
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkCa01 -Context $ctx | Select-Object -ExpandProperty Details
    .DESCRIPTION
    #>
    <#
    VK-CA-01. The persona policies, read against two inputs: governed-groups.csv (GroupId, Name,
    Owner), the groups the persona design may target, and emergency-access-groups.csv (GroupId,
    Name). Reports each policy that doesn't exclude every emergency-access group; each policy
    that includes or excludes a group not on the governed list; and each grant policy that
    includes groups but has no paired block: a block policy on all users, for an overlapping
    application, that excludes every group the grant includes. A grant on all users needs no
    pair. NotApplicable when either input is missing.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-CA-01' $Context {
        param($Context)
        $governedRows = Read-VkInputCsv -Context $Context -Option 'GovernedGroupsFile'
        $eaRows = Read-VkInputCsv -Context $Context -Option 'EmergencyAccessGroupsFile'
        if ($null -eq $governedRows) { return Get-VkNotApplicable "No governed-group list ($($Context.Options['GovernedGroupsFile'])) supplied" }
        if ($null -eq $eaRows -or @($eaRows | Where-Object { -not (Test-VkBlank $_.GroupId) }).Count -eq 0) { return Get-VkNotApplicable "No emergency-access group ($($Context.Options['EmergencyAccessGroupsFile'])) supplied" }
        $governed = @($governedRows | ForEach-Object { "$($_.GroupId)".Trim().ToLowerInvariant() } | Where-Object { $_ })
        $ea = @($eaRows | ForEach-Object { "$($_.GroupId)".Trim().ToLowerInvariant() } | Where-Object { $_ })
        $policies = Get-VkCaUserPolicies $Context
        $blocks = @($policies | Where-Object { (Test-VkCaBlock $_) -and (Get-VkCaList $_ 'users' 'includeUsers') -contains 'All' })
        $rows = foreach ($p in $policies) {
            $inc = @(Get-VkCaList $p 'users' 'includeGroups' | ForEach-Object { $_.ToLowerInvariant() })
            $exc = @(Get-VkCaList $p 'users' 'excludeGroups' | ForEach-Object { $_.ToLowerInvariant() })
            $missing = @($ea | Where-Object { $exc -notcontains $_ })
            if ($missing.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $p.displayName -ObjectId $p.id -Issue 'Emergency-access group not excluded' -Data ([ordered]@{ State = $p.state; MissingExclusions = $missing })
            }
            $ungoverned = @(@($inc) + @($exc) | Where-Object { $ea -notcontains $_ -and $governed -notcontains $_ } | Sort-Object -Unique)
            if ($ungoverned.Count -gt 0) {
                ConvertTo-VkFinding -Severity Finding -Object $p.displayName -ObjectId $p.id -Issue 'Targets a group outside the governed-group list' -Data ([ordered]@{ State = $p.state; Groups = $ungoverned })
            }
            if (-not (Test-VkCaBlock $p) -and $inc.Count -gt 0 -and (Get-VkCaList $p 'users' 'includeUsers') -notcontains 'All') {
                $pair = @($blocks | Where-Object {
                        $bx = @(Get-VkCaList $_ 'users' 'excludeGroups' | ForEach-Object { $_.ToLowerInvariant() })
                        (Test-VkCaAppOverlap $p $_) -and @($inc | Where-Object { $bx -notcontains $_ }).Count -eq 0
                    })
                if ($pair.Count -eq 0) {
                    ConvertTo-VkFinding -Severity Finding -Object $p.displayName -ObjectId $p.id -Issue 'Grant with no paired block: everyone outside its groups gets a token without its controls' -Data ([ordered]@{ State = $p.state; IncludeGroups = $inc })
                }
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} user-targeting policy(ies) read (enabled and report-only); {1} governed group(s); {2} emergency-access group(s)' -f $policies.Count, $governed.Count, $ea.Count)
    }
}
