#Requires -Version 7.1
<#
    SqlIdentity: the functions behind "Building SQL Server Identity", the developer workbook for Book 06.

    Every function here is pure: it reads objects (from fixtures in Lab 1, or from the read-only queries in
    queries/ in Lab 2) and returns objects. Nothing in this module connects to SQL Server, Active Directory
    or Azure, and nothing changes anything. The entry scripts beside the module write the files; the deploy/
    scripts are the only ones that can change an instance, and only with -Apply and the approved hash.
#>
Set-StrictMode -Version 2.0

$script:KitRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent

function Get-SqlKitConfig {
    <#
    .SYNOPSIS
        Reads one of the kit's configuration files (requirements, thresholds or drivers) from config/.
    .EXAMPLE
        (Get-SqlKitConfig -Name thresholds).zombieDays
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('requirements', 'thresholds', 'drivers')][string]$Name)
    Get-Content -Raw -Path (Join-Path $script:KitRoot "config/$Name.json") | ConvertFrom-Json
}

function Read-SqlJson {
    <#
    .SYNOPSIS
        Reads a JSON file (a fixture, or a saved query result) and returns its object.
    .EXAMPLE
        $estate = Read-SqlJson -Path tests/fixtures/estate/estate.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { throw "No file at '$Path'." }
    Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json
}

function Get-SqlMajorVersion {
    <#
    .SYNOPSIS
        Turns a SQL Server product version (16.0.4135.4) into its release year (2022). Returns $null when
        the version is unknown.
    .EXAMPLE
        Get-SqlMajorVersion -ProductVersion 15.0.4375.4    # 2019
    #>
    [CmdletBinding()]
    param([AllowNull()][AllowEmptyString()][string]$ProductVersion)
    if (-not $ProductVersion) { return $null }
    $major = [int]($ProductVersion.Split('.')[0])
    $map = @{ 10 = 2008; 11 = 2012; 12 = 2014; 13 = 2016; 14 = 2017; 15 = 2019; 16 = 2022; 17 = 2025 }
    if ($map.ContainsKey($major)) { return $map[$major] }
    return $null
}

# ---------------------------------------------------------------------------------------------- Chapter 01

function Get-SqlEstateClassification {
    <#
    .SYNOPSIS
        Classifies every instance in an estate inventory retain, consolidate, retire or review (Book 06,
        Chapter 06 and Runbook R02), and records the constraint that changed any first-pass answer.
    .DESCRIPTION
        The first pass follows Runbook R02's classifier: an instance whose every database is past the zombie
        threshold (400 days by default), or whose every owning application is decommissioned, is retire; a
        version before SQL Server 2022 is consolidate; 2022 or later is retain; no version is review, never
        retain. Recorded constraints then adjust it as Chapter 06 says: a vendor-locked or clustered instance
        is retained where it sits; a collation, compliance-isolation or indivisible-dependency constraint
        makes a consolidate a dedicated-target consolidation. The architects confirm or override every row.
    .EXAMPLE
        Get-SqlEstateClassification -Estate (Read-SqlJson tests/fixtures/estate/estate.json)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Estate, [int]$ZombieDays = (Get-SqlKitConfig thresholds).zombieDays)
    $min = (Get-SqlKitConfig thresholds).entraMinimumMajor
    foreach ($i in $Estate.instances) {
        $year = Get-SqlMajorVersion $i.productVersion
        $dbs = @($i.databases)
        $constraints = @($i.constraints)
        $reason = ''
        if ($dbs.Count -and (@($dbs | Where-Object { $_.lastAccessDays -lt $ZombieDays }).Count -eq 0)) {
            $class = 'retire'; $reason = "Every database idle $ZombieDays days or more"
        } elseif ($dbs.Count -and (@($dbs | Where-Object { $_.applicationStatus -ne 'decommissioned' }).Count -eq 0)) {
            $class = 'retire'; $reason = 'Every owning application is decommissioned'
        } elseif ($null -eq $year) {
            $class = 'review'; $reason = 'No version: discovery found the instance but nothing read it'
        } elseif ($year -lt $min) {
            $class = 'consolidate'; $reason = "SQL Server $year can't take Entra logins"
        } else {
            $class = 'retain'; $reason = "SQL Server $year, in use"
        }
        $target = if ($class -eq 'consolidate') { 'shared' } else { '' }
        foreach ($c in $constraints) {
            if ($class -in 'retire', 'review') { break }
            switch ($c.type) {
                'vendor-lock' { $class = 'retain'; $target = ''; $reason = "Constraint: $($c.detail) Retained in place; upgrade or exception needed" }
                { $_ -in 'collation', 'compliance-isolation', 'indivisible' } {
                    if ($class -eq 'consolidate') { $target = 'dedicated'; $reason = "Constraint ($($c.type)): $($c.detail)" }
                }
            }
        }
        if ($class -ne 'retire' -and $i.clustered -eq $true -and $class -eq 'consolidate') {
            $class = 'retain'; $reason = 'Failover cluster instance: re-platform before consolidating'
        }
        if ($i.PSObject.Properties.Name -contains 'consolidationTarget' -and $i.consolidationTarget) { $reason += '; consolidation target' }
        [pscustomobject]@{
            Instance       = $i.name
            Version        = if ($year) { "$year" } else { 'unknown' }
            Utilization    = if ($null -ne $i.utilizationPct) { "$($i.utilizationPct)%" } else { 'unknown' }
            Classification = $class
            Target         = $target
            EntersMigration = if ($class -eq 'retain') { 'yes' } elseif ($class -eq 'consolidate') { 'at the target' } else { 'no' }
            Reason         = $reason
        }
    }
}

# ---------------------------------------------------------------------------------------------- Chapter 02

function Get-SqlLoginCensus {
    <#
    .SYNOPSIS
        Counts an instance's logins by sys.server_principals type (U, G, S, C, K, E, X), leaving out the
        built-in service principals, and says which are usable (enabled and holding CONNECT SQL).
    .EXAMPLE
        Get-SqlLoginCensus -Instance $audit.instances[0]
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Instance)
    $builtin = (Get-SqlKitConfig thresholds).builtinLoginPattern
    $logins = @($Instance.logins | Where-Object { $_.name -notmatch $builtin })
    $usable = @($logins | Where-Object { -not $_.isDisabled -and $_.hasConnectSql })
    $count = { param($set, $t) @($set | Where-Object { $_.type -eq $t }).Count }
    [pscustomobject]@{
        Instance = $Instance.name
        U = & $count $usable 'U'; G = & $count $usable 'G'; S = & $count $usable 'S'
        C = & $count $usable 'C'; K = & $count $usable 'K'; E = & $count $usable 'E'; X = & $count $usable 'X'
        Disabled = @($logins | Where-Object { $_.isDisabled }).Count
        Usable   = $usable.Count
    }
}

function Get-SqlAuthFinding {
    <#
    .SYNOPSIS
        The authentication audit's findings for one instance (Book 06, Chapter 07 and Runbook R03): usable SQL
        logins, an enabled sa, a running mode that disagrees with the registry, the engine's service account
        and the instance's first-pass Arc-eligibility category.
    .DESCRIPTION
        Severity follows Chapter 07: an enabled sa is the highest-priority finding; any usable SQL login is
        critical. The category here uses only what the audit knows (version and clustering): Category 3 for
        a failover cluster instance or a version before 2022, otherwise "1 or 2", which Chapter 03's Arc
        check settles.
    .EXAMPLE
        Get-SqlAuthFinding -Instance $audit.instances[0]
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Instance)
    $min = (Get-SqlKitConfig thresholds).entraMinimumMajor
    $builtin = (Get-SqlKitConfig thresholds).builtinLoginPattern
    $year = Get-SqlMajorVersion $Instance.productVersion
    $out = [System.Collections.Generic.List[object]]::new()
    $add = { param($sev, $what, $detail) $out.Add([pscustomobject]@{ Instance = $Instance.name; Severity = $sev; Finding = $what; Detail = $detail }) }
    $sa = @($Instance.logins | Where-Object { $_.isSa })[0]
    if ($sa -and -not $sa.isDisabled) { & $add 'highest' 'sa enabled' "sa is enabled under the name '$($sa.name)'" }
    elseif ($sa -and $sa.name -eq 'sa') { & $add 'medium' 'sa not renamed' 'sa is disabled but keeps its name' }
    foreach ($l in @($Instance.logins | Where-Object { $_.type -eq 'S' -and -not $_.isSa -and -not $_.isDisabled -and $_.hasConnectSql })) {
        & $add 'critical' 'Usable SQL login' "$($l.name): migrate to an Entra login or record an exception"
    }
    if ($Instance.isIntegratedSecurityOnly -eq 0) { & $add 'high' 'Mixed mode' 'SQL authentication is accepted (IsIntegratedSecurityOnly = 0)' }
    $regMode = $Instance.registryLoginMode
    if ($null -ne $regMode) {
        $running = if ($Instance.isIntegratedSecurityOnly -eq 1) { 1 } else { 2 }
        if ($regMode -ne $running) { & $add 'high' 'Mode anomaly' "Registry LoginMode $regMode, running mode $($running): changed without a restart; resolve before migrating" }
    }
    $svc = "$($Instance.serviceAccount)"
    $kind = if ($svc -match '\$$') { 'gMSA or computer account' } elseif ($svc -match '^NT SERVICE\\') { 'virtual account' }
            elseif ($svc -match '^(NT AUTHORITY\\|LocalSystem$|\.\\LocalSystem$)') { 'built-in account' } else { 'domain user account' }
    if ($kind -eq 'domain user account') { & $add 'medium' 'Service account' "$svc is a user account with a password: the Data Platform project converts it (service account guide)" }
    elseif ($kind -eq 'built-in account') { & $add 'medium' 'Service account' "$svc is a built-in account: move the engine to a virtual account or gMSA (Book 06, Chapter 07)" }
    foreach ($l in @($Instance.logins | Where-Object { $_.type -in 'U', 'G' -and -not $_.isDisabled -and $_.name -notmatch $builtin })) {
        & $add 'info' 'Windows login to migrate' "$($l.name) ($($l.type))"
    }
    $category = if ($Instance.isClustered -eq 1) { '3 (failover cluster instance)' }
                elseif ($null -eq $year -or $year -lt $min) { "3 (SQL Server $year)" }
                else { '1 or 2 (run the Arc check)' }
    & $add 'info' 'Arc-eligibility' "Category $category"
    $out
}

# ---------------------------------------------------------------------------------------------- Chapter 03

function Get-SqlArcCategory {
    <#
    .SYNOPSIS
        Settles each audited instance's Arc-eligibility category (Book 06, Chapter 07): 1 when the Connected
        Machine agent is connected, the Azure extension for SQL Server is deployed and Entra authentication is
        configured on SQL Server 2022 or later; 2 when the instance is eligible but one of those is missing;
        3 for a failover cluster instance or a version before 2022.
    .DESCRIPTION
        Reads the Azure Resource Graph results the kit's queries return (machines, extensions and SQL Server
        instances) and checks that they came from the Azure cloud a GCC (Moderate) tenant uses: Arc for SQL
        Server lives in commercial Azure (AzureCloud), decided as WD-028 and WD-085.
    .EXAMPLE
        Get-SqlArcCategory -Audit (Read-SqlJson tests/fixtures/audit-day1/audit.json) -Arc (Read-SqlJson tests/fixtures/arc/arc.json)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Audit, [Parameter(Mandatory)]$Arc)
    if ($Arc.environment -ne 'AzureCloud') { throw "The Arc results came from '$($Arc.environment)'. A GCC (Moderate) tenant's Arc resources are in AzureCloud (WD-028)." }
    $min = (Get-SqlKitConfig thresholds).entraMinimumMajor
    foreach ($i in $Audit.instances) {
        $year = Get-SqlMajorVersion $i.productVersion
        $sql = @($Arc.sqlInstances | Where-Object { $_.name -eq $i.name })[0]
        $machineName = if ($sql) { $sql.machine } else { $i.name.ToLowerInvariant() }
        $m = @($Arc.machines | Where-Object { $_.name -eq $machineName })[0]
        $ext = @($Arc.extensions | Where-Object { $_.machine -eq $machineName -and $_.type -match 'SqlServer$' -and $_.provisioningState -eq 'Succeeded' })[0]
        $agent = if ($m) { $m.status } else { 'not installed' }
        $entra = if ($sql -and $sql.entraAuthentication.configured) { $sql.entraAuthentication.method } else { 'not configured' }
        $missing = @()
        if ($agent -ne 'Connected') { $missing += "agent $agent" }
        if (-not $ext) { $missing += 'SQL extension not deployed' }
        if ($entra -eq 'not configured') { $missing += 'Entra authentication not configured' }
        if ($i.isClustered -eq 1) { $cat = 3; $agent = 'cluster: see its nodes'; $next = 'Re-platform as a standalone instance or availability group, or record an exception' }
        elseif ($null -eq $year -or $year -lt $min) { $cat = 3; $next = 'Upgrade to SQL Server 2022 or later first' }
        elseif ($missing.Count) { $cat = 2; $next = 'Deploy Arc (Runbook R04): ' + ($missing -join '; ') }
        else { $cat = 1; $next = 'Ready: plan the logins (Chapter 04)' }
        if ($cat -eq 1 -and $year -lt 2025 -and $entra -eq 'managedIdentity') { $next += '; note: the managed identity method needs SQL Server 2025' }
        [pscustomobject]@{ Instance = $i.name; Version = "$year"; Agent = $agent; Extension = if ($ext) { 'deployed' } else { 'missing' }; Entra = $entra; Category = $cat; Next = $next }
    }
}

# ---------------------------------------------------------------------------------------------- Chapter 04

function Get-SqlSessionSum { param($Rows) $t = 0; foreach ($r in @($Rows)) { if ($null -ne $r) { $t += [int]$r.sessions } }; $t }
function ConvertTo-SqlVersion { param([string]$Text) $p = @($Text.Split('.') + @('0', '0', '0', '0'))[0..3]; [version]($p -join '.') }
function ConvertTo-SqlLiteral { param([string]$Name) $Name.Replace("'", "''") }
function ConvertTo-SqlIdentifier { param([string]$Name) '[' + $Name.Replace(']', ']]') + ']' }

function New-SqlLoginPlan {
    <#
    .SYNOPSIS
        Writes the dry-run T-SQL for one instance's login migration (Book 06, Runbook R05): an Entra login
        FROM EXTERNAL PROVIDER for each mapped principal, an Entra database user beside each Windows or SQL
        user with the same role memberships, and the matching server roles. Executes nothing.
    .DESCRIPTION
        Every statement is idempotent (IF NOT EXISTS). Several Windows logins mapped to one Entra principal
        produce it once. A login the mapping doesn't name is written as an UNRESOLVED comment, never guessed.
        The cutover and its rollback are returned separately, for Chapter 10: a Windows user or SQL login is
        disabled (ALTER LOGIN ... DISABLE) and re-enabled; a Windows group, which ALTER LOGIN can't disable,
        loses CONNECT SQL (DENY) and gets it back (GRANT); a group in sysadmin, which DENY doesn't bind,
        leaves the role first and rejoins it on rollback. No login is dropped. Warnings flag a principal
        that would hold more than one role, or db_owner or sysadmin, against Book 06, Chapter 16.
    .EXAMPLE
        New-SqlLoginPlan -Instance $audit.instances[0] -Mapping (Import-Csv tests/fixtures/mapping/sqlprd01-mapping.csv)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Instance, [Parameter(Mandatory)]$Mapping)
    $builtin = (Get-SqlKitConfig thresholds).builtinLoginPattern
    $map = @{}
    foreach ($r in $Mapping) { if ($r.EntraPrincipal) { $map[$r.WindowsLogin] = $r.EntraPrincipal } }
    $legacy = @($Instance.logins | Where-Object { $_.type -in 'U', 'G', 'S' -and -not $_.isSa -and -not $_.isDisabled -and $_.name -notmatch $builtin })
    $unresolved = @($legacy | Where-Object { -not $map.ContainsKey($_.name) })
    $create = [System.Collections.Generic.List[string]]::new()
    $create.Add("-- Login plan for $($Instance.name). Dry run: review every line; nothing here has run.")
    $create.Add('USE master;'); $create.Add('GO')
    foreach ($u in $unresolved) { $create.Add("-- UNRESOLVED: $($u.name) ($($u.type)): map it, or record why it isn't migrated") }
    $principals = @($legacy | Where-Object { $map.ContainsKey($_.name) } | ForEach-Object { $map[$_.name] } | Sort-Object -Unique)
    foreach ($p in $principals) {
        $create.Add("IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = N'$(ConvertTo-SqlLiteral $p)')")
        $create.Add("    CREATE LOGIN $(ConvertTo-SqlIdentifier $p) FROM EXTERNAL PROVIDER;")
        $roles = @($legacy | Where-Object { $map[$_.name] -eq $p } | ForEach-Object { @($_.serverRoles) } | Sort-Object -Unique)
        foreach ($role in $roles) { $create.Add("ALTER SERVER ROLE $(ConvertTo-SqlIdentifier $role) ADD MEMBER $(ConvertTo-SqlIdentifier $p);") }
        $create.Add('GO')
    }
    foreach ($db in @($Instance.databases)) {
        $users = @($db.users | Where-Object { $map.ContainsKey($_.login) })
        if (-not $users.Count) { continue }
        $create.Add("USE $(ConvertTo-SqlIdentifier $db.name);"); $create.Add('GO')
        foreach ($p in @($users | ForEach-Object { $map[$_.login] } | Sort-Object -Unique)) {
            $create.Add("IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = N'$(ConvertTo-SqlLiteral $p)')")
            $create.Add("    CREATE USER $(ConvertTo-SqlIdentifier $p) FROM LOGIN $(ConvertTo-SqlIdentifier $p);")
            $roles = @($users | Where-Object { $map[$_.login] -eq $p } | ForEach-Object { @($_.roles) } | Sort-Object -Unique)
            foreach ($role in $roles) { $create.Add("ALTER ROLE $(ConvertTo-SqlIdentifier $role) ADD MEMBER $(ConvertTo-SqlIdentifier $p);") }
        }
        $create.Add('GO')
    }
    $migrated = @($legacy | Where-Object { $map.ContainsKey($_.name) })
    # ALTER LOGIN ... DISABLE doesn't deny a Windows group (Learn: error 15151), so a group loses CONNECT SQL
    # instead, and the rollback grants it back. Users and SQL logins are disabled, never dropped.
    # DENY doesn't apply to members of sysadmin (Learn), so a group in sysadmin leaves the role first, and
    # the rollback puts it back.
    $cutover = @('USE master;', 'GO') + @($migrated | ForEach-Object {
        if ($_.type -eq 'G') {
            if (@($_.serverRoles) -contains 'sysadmin') { "ALTER SERVER ROLE [sysadmin] DROP MEMBER $(ConvertTo-SqlIdentifier $_.name);  -- DENY doesn't bind sysadmin members" }
            "DENY CONNECT SQL TO $(ConvertTo-SqlIdentifier $_.name);  -- group: superseded by $($map[$_.name])"
        } else { "ALTER LOGIN $(ConvertTo-SqlIdentifier $_.name) DISABLE;  -- superseded by $($map[$_.name])" } }) + 'GO'
    $rollback = @('USE master;', 'GO') + @($migrated | ForEach-Object {
        if ($_.type -eq 'G') {
            "GRANT CONNECT SQL TO $(ConvertTo-SqlIdentifier $_.name);"
            if (@($_.serverRoles) -contains 'sysadmin') { "ALTER SERVER ROLE [sysadmin] ADD MEMBER $(ConvertTo-SqlIdentifier $_.name);" }
        } else { "ALTER LOGIN $(ConvertTo-SqlIdentifier $_.name) ENABLE;" } }) + 'GO'
    # Book 06, Chapter 16: one group, one role, on one database. Flag the principals the mapping gives more.
    $warnings = @(foreach ($p in $principals) {
        $grants = @(foreach ($db in @($Instance.databases)) { foreach ($u in @($db.users | Where-Object { $map[$_.login] -eq $p })) { foreach ($r in @($u.roles)) { "$($db.name):$r" } } })
        $grants = @($grants | Sort-Object -Unique)
        $server = @($legacy | Where-Object { $map[$_.name] -eq $p } | ForEach-Object { @($_.serverRoles) } | Sort-Object -Unique)
        if ($grants.Count -gt 1) { "$p would hold $($grants.Count) database roles ($($grants -join ', ')): Book 06, Chapter 16 gives each group one role on one database" }
        if (@($grants | Where-Object { $_ -match ':db_owner$' }).Count -or $server -contains 'sysadmin') { "$p would hold db_owner or sysadmin: confirm it's needed (Chapter 16)" }
    })
    [pscustomobject]@{
        Instance   = $Instance.name
        Create     = @($create)
        Cutover    = @($cutover)
        Rollback   = @($rollback)
        Mapped     = $migrated.Count
        Principals = $principals.Count
        Unresolved = @($unresolved | ForEach-Object { $_.name })
        Warnings   = @($warnings)
    }
}

function Test-SqlParallelRun {
    <#
    .SYNOPSIS
        Judges a parallel run against Runbook R05's exit criteria, for each Windows or SQL login the plan
        supersedes: its Entra principal is observed connecting, no remote NTLM remains, and nothing still
        arrives only on the legacy login. Local sessions (which always report NTLM) are left out. A legacy
        login that is already disabled or denied CONNECT SQL is reported as cut over.
    .EXAMPLE
        Test-SqlParallelRun -Instance $day30.instances[0] -Mapping (Import-Csv tests/fixtures/mapping/sqlprd01-mapping.csv)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Instance, [Parameter(Mandatory)]$Mapping)
    $remote = @($Instance.connections | Where-Object { -not $_.local })
    foreach ($r in $Mapping) {
        $login = @($Instance.logins | Where-Object { $_.name -eq $r.WindowsLogin })[0]
        $cutOver = $login -and ($login.isDisabled -or -not $login.hasConnectSql)
        $legacySessions = (Get-SqlSessionSum @($remote | Where-Object { $_.principal -eq $r.WindowsLogin }))
        $entraSessions = (Get-SqlSessionSum @($remote | Where-Object { $_.principal -eq $r.EntraPrincipal }))
        $ntlm = (Get-SqlSessionSum @($remote | Where-Object { $_.principal -eq $r.WindowsLogin -and $_.authScheme -eq 'NTLM' }))
        $legacySessions = [int]$legacySessions; $entraSessions = [int]$entraSessions; $ntlm = [int]$ntlm
        $why = @()
        if (-not $r.EntraPrincipal) { $why += 'no Entra principal mapped' }
        if ($entraSessions -eq 0) { $why += 'Entra principal not seen connecting' }
        if ($ntlm -gt 0) { $why += "$ntlm remote NTLM sessions" }
        if ($legacySessions -gt 0 -and $entraSessions -eq 0) { $why += 'still arrives only on the legacy login' }
        $done = if (-not $login) { 'legacy login no longer exists' }
                elseif ($cutOver) { 'already cut over (disabled or denied): observe 30 days, then drop' }
                else { 'exit criteria met: cut over (disable or deny), then observe 30 days' }
        [pscustomobject]@{
            Legacy = $r.WindowsLogin; Entra = $r.EntraPrincipal; LegacySessions = $legacySessions; EntraSessions = $entraSessions
            Ready = -not $why.Count; Why = if ($why.Count) { $why -join '; ' } else { $done }
        }
    }
}

# ---------------------------------------------------------------------------------------------- Chapter 05

function Get-SqlGroupPattern {
    <#
    .SYNOPSIS
        Sorts each Active Directory group that reaches SQL Server into Book 06, Chapter 16's four patterns
        and names its Microsoft Entra target: dynamic (organization-derived), assigned (explicit role
        assignment, PIM for a privileged role), mail-only (distribution list) or split (mail-enabled
        security group). Nested groups are flagged: Entra groups that grant SQL Server access are flat.
    .EXAMPLE
        Get-SqlGroupPattern -Groups (Read-SqlJson tests/fixtures/groups/groups.json).groups
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Groups)
    foreach ($g in $Groups) {
        $privileged = @($g.grants | Where-Object { @($_.serverRoles) -contains 'sysadmin' -or @($_.serverRoles) -contains 'securityadmin' }).Count -gt 0
        if ($g.category -eq 'Distribution') { $pattern = 3; $target = 'Mail-only group; update the SQL Server Agent operator address; no login' }
        elseif ($g.mailEnabled) { $pattern = 4; $target = 'Split: a mail-only group plus an assigned security group; record the pairing in both descriptions' }
        elseif ($g.membershipBasis -eq 'org-chart') {
            $pattern = 1
            $codes = @($g.orgCodes)
            $target = if ($codes.Count) {
                $rule = '(user.extensionAttribute10 -in [' + (($codes | ForEach-Object { "`"$_`"" }) -join ',') + ']) -and (user.accountEnabled -eq true) -and (user.userType -eq "Member")'
                "Dynamic group, rule $rule; never department or jobTitle"
            } else { 'Dynamic group on an HR-maintained code: no code recorded yet, so ask HR for it before writing the rule' }
        } else {
            $pattern = 2
            $target = if ($privileged) { 'Assigned group, eligible through PIM (privileged server role)' } else { 'Assigned group, managed by a delegated administrator' }
        }
        $flags = @()
        if (@($g.nestedGroups).Count) { $flags += 'nested: flatten (' + (@($g.nestedGroups) -join ', ') + ')' }
        if ($privileged -and $pattern -eq 1) { $flags += 'privileged role on a dynamic group: use an assigned group under PIM instead' }
        [pscustomobject]@{
            Group = $g.name; Pattern = $pattern; Members = $g.members; Target = $target
            Grants = (@($g.grants | ForEach-Object { "$($_.instance)" + $(if (@($_.serverRoles).Count) { ' (' + (@($_.serverRoles) -join ',') + ')' } else { '' }) }) -join '; ')
            Flags = $flags -join '; '
        }
    }
}

# ---------------------------------------------------------------------------------------------- Chapter 06

function Get-SqlNtlmFinding {
    <#
    .SYNOPSIS
        Finds the SQL Server patterns that generate NTLM (Book 06, Chapter 14 and Runbook R06): a missing
        SPN, an SPN on the wrong account (Kerberos then fails outright), a duplicate SPN, a linked server
        that passes the caller's credentials through, and NTLM from a client that isn't domain-joined.
        Returns each finding with the setspn command that would fix it, as text for review.
    .EXAMPLE
        Get-SqlNtlmFinding -Audit $audit -Estate $estate -Spns $spns.spns -LinkedServers $ls.linkedServers -Clients $clients.clients
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Audit, [Parameter(Mandatory)]$Estate, [Parameter(Mandatory)][AllowEmptyCollection()]$Spns,
          $LinkedServers = @(), $Clients = @())
    foreach ($i in $Audit.instances) {
        $host_ = @($Estate.instances | Where-Object { $_.name -eq $i.name })[0].host
        $want = "MSSQLSvc/$($host_):$($i.port)"
        $holders = @($Spns | Where-Object { $_.spn -eq $want } | ForEach-Object { $_.account } | Sort-Object -Unique)
        $svc = $i.serviceAccount
        # A virtual or built-in account presents the computer account on the network, so the SPN belongs there.
        if ($svc -match '^(NT SERVICE|NT AUTHORITY)\\') {
            $domain = if ($Estate.PSObject.Properties.Name -contains 'netbiosDomain') { $Estate.netbiosDomain } else { ($Estate.domain -split '\.')[0].ToUpperInvariant() }
            $svc = "$domain\$($host_.Split('.')[0].ToUpperInvariant())`$"
        }
        if ($holders.Count -eq 0) {
            [pscustomobject]@{ Instance = $i.name; Pattern = 'Missing SPN'; Effect = 'Remote connections fall back to NTLM'; Fix = "setspn -S $want $svc" }
        } elseif ($holders.Count -gt 1) {
            $wrong = @($holders | Where-Object { $_ -ne $svc })
            [pscustomobject]@{ Instance = $i.name; Pattern = 'Duplicate SPN'; Effect = "Held by $($holders -join ' and '): Kerberos can't choose"; Fix = (@($wrong | ForEach-Object { "setspn -D $want $_" }) -join '; ') }
        } elseif ($holders[0] -ne $svc) {
            [pscustomobject]@{ Instance = $i.name; Pattern = 'SPN on the wrong account'; Effect = "Held by $($holders[0]), service runs as $($svc): authentication fails"; Fix = "setspn -D $want $($holders[0]); setspn -S $want $svc" }
        }
        $remoteNtlm = (Get-SqlSessionSum @($i.connections | Where-Object { -not $_.local -and $_.authScheme -eq 'NTLM' }))
        if ($remoteNtlm) {
            [pscustomobject]@{ Instance = $i.name; Pattern = 'Remote NTLM observed'; Effect = "$remoteNtlm remote NTLM sessions in the sample"; Fix = 'Find each client (the clients rows, or sys.dm_exec_connections client_net_address); local sessions are excluded' }
        }
    }
    foreach ($l in @($LinkedServers | Where-Object { $_.usesSelfCredential })) {
        [pscustomobject]@{ Instance = $l.instance; Pattern = 'Linked-server passthrough'; Effect = "Calls to $($l.linkedServer) pass the caller's credentials: NTLM unless delegation is set"; Fix = 'Constrained delegation, a mapped login, or the SQL Server 2025 managed-identity linked server' }
    }
    foreach ($c in @($Clients | Where-Object { -not $_.domainJoined })) {
        [pscustomobject]@{ Instance = $c.instance; Pattern = 'Non-domain-joined client'; Effect = "$($c.clientHost) ($($c.clientAddress)) can't get a Kerberos ticket"; Fix = "Move $($c.principal) to an Entra login with a token-based connection (Chapter 07)" }
    }
}

# ---------------------------------------------------------------------------------------------- Chapter 07

function ConvertFrom-SqlConnectionString {
    <#
    .SYNOPSIS
        Parses a connection string into its keywords (lower case) and says how it authenticates: sql-password,
        windows, entra or unknown. Never returns the password.
    .EXAMPLE
        ConvertFrom-SqlConnectionString 'Server=s;Database=d;Integrated Security=SSPI'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory, Position = 0)][string]$ConnectionString)
    $kv = [ordered]@{}
    foreach ($part in $ConnectionString -split ';') {
        if ($part -match '^\s*([^=]+?)\s*=\s*(.*?)\s*$') { $kv[$Matches[1].ToLowerInvariant()] = $Matches[2] }
    }
    $auth = 'unknown'
    if ($kv.Contains('authentication') -and $kv['authentication'] -match 'Active ?Directory') { $auth = 'entra' }
    elseif (($kv.Contains('integrated security') -and $kv['integrated security'] -match '^(sspi|true|yes)$') -or
            ($kv.Contains('trusted_connection') -and $kv['trusted_connection'] -match '^(yes|true)$')) { $auth = 'windows' }
    elseif ($kv.Contains('password') -or $kv.Contains('pwd')) { $auth = 'sql-password' }
    $server = foreach ($k in 'server', 'data source', 'address') { if ($kv.Contains($k)) { $kv[$k]; break } }
    $masked = ($ConnectionString -replace '(?i)((?:password|pwd)\s*=\s*)[^;]*', '$1********')
    [pscustomobject]@{ Server = "$server"; Authentication = $auth; Mode = if ($kv.Contains('authentication')) { $kv['authentication'] } else { '' }; Masked = $masked }
}

function Find-SqlConnectionString {
    <#
    .SYNOPSIS
        Scans an application folder's configuration files for SQL Server connection strings and classifies
        each on Book 06, Chapter 18's database axis: A (configuration only), B (code or driver change),
        C (vendor-dependent) or D (no Entra path, set by the owner). Stored passwords are reported, masked.
    .DESCRIPTION
        Reads *.config, *.json, *.ini, *.dsn and *.udl files. The application's app.json (driver, driver
        version, host and whether a vendor owns it) supplies what a string can't say. The driver rules are
        config/drivers.json, from Chapter 19's table. The recommended mode is the managed identity on an
        Arc-enabled or Azure host, and a service principal otherwise (a host off Arc has no managed identity); the deprecated Entra password mode is
        never a target.
    .EXAMPLE
        Find-SqlConnectionString -Path tests/fixtures/apps
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $drivers = Get-SqlKitConfig drivers
    $root = (Resolve-Path -LiteralPath $Path).Path
    foreach ($appDir in Get-ChildItem -LiteralPath $root -Directory | Sort-Object Name) {
        $meta = if (Test-Path (Join-Path $appDir.FullName 'app.json')) { Read-SqlJson (Join-Path $appDir.FullName 'app.json') } else { $null }
        $files = Get-ChildItem -LiteralPath $appDir.FullName -File -Recurse |
            Where-Object { $_.Extension -in '.config', '.json', '.ini', '.dsn', '.udl' -and $_.Name -ne 'app.json' } | Sort-Object FullName
        foreach ($f in $files) {
            $text = Get-Content -Raw -LiteralPath $f.FullName
            $found = @()
            foreach ($m in [regex]::Matches($text, '(?im)(?:connectionString="|"[^"]*"\s*:\s*"|ConnectionString=)([^"\r\n]*(?:Server|Data Source)=[^"\r\n]*)')) { $found += $m.Groups[1].Value }
            if ($f.Extension -eq '.dsn') {
                $kv = @(); foreach ($line in $text -split "`r?`n") { if ($line -match '^\s*(SERVER|DATABASE|Trusted_Connection|DRIVER|Authentication|UID|PWD)\s*=\s*(.+)$') { $kv += "$($Matches[1])=$($Matches[2].Trim())" } }
                if ($kv.Count) { $found += ($kv -join ';') }
            }
            foreach ($cs in $found) {
                $p = ConvertFrom-SqlConnectionString $cs
                $driver = if ($meta) { "$($meta.driver)" } else { '' }
                $family = @($drivers.families | Where-Object { @($_.match) -contains $driver })[0]
                $column = if ($meta -and $meta.vendor) { 'C' }
                          elseif ($p.Authentication -eq 'entra' -and @($drivers.deprecatedModes) -notcontains $p.Mode) { 'done' }
                          elseif ($family -and $meta.driverVersion -and (ConvertTo-SqlVersion $meta.driverVersion) -ge (ConvertTo-SqlVersion $family.managedIdentity)) { 'A' }
                          elseif (@($drivers.noEntraPath) -contains $driver -or $family) { 'B' }
                          else { 'review' }
                $target = if ($family -and $meta -and $meta.host -in 'arc', 'azure') { $family.managedIdentityKeyword }
                          elseif ($family) { "$($family.servicePrincipalKeyword) (no managed identity off Arc; certificate preferred, Book 06 Ch 19)" }
                          else { 'Move to Microsoft.Data.SqlClient, ODBC Driver 18 or MSOLEDBSQL first' }
                $finding = switch ($p.Authentication) {
                    'sql-password' { 'Stored password' }
                    'windows' { 'Windows integrated' }
                    'entra' { if (@($drivers.deprecatedModes) -contains $p.Mode) { 'Deprecated Entra password mode' } else { 'Entra already' } }
                    default { 'Unknown' }
                }
                [pscustomobject]@{
                    Application = if ($meta) { $meta.application } else { $appDir.Name }
                    File = [IO.Path]::GetRelativePath($root, $f.FullName).Replace('\', '/')
                    Server = $p.Server; Finding = $finding; Driver = $driver; Column = $column
                    Target = if ($column -eq 'done') { '' } else { $target }
                    Masked = $p.Masked
                }
            }
        }
    }
}

# ---------------------------------------------------------------------------------------------- Chapter 08

function Get-SqlCertificateDependency {
    <#
    .SYNOPSIS
        Lists the certificates SQL Server depends on (Book 06, Chapter 22 and Runbook R10) by class (TLS for
        client connections, certificate-mapped logins and endpoints, certificate-based sign-in held as the
        NTLM interim) and says which an enterprise AD CS CA issued, so must be moved before that CA is
        retired (to the issuer Book 07, Chapter 04 assigns), and which expire inside the warning window.
    .EXAMPLE
        Get-SqlCertificateDependency -Certs (Read-SqlJson tests/fixtures/certs/certs.json)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Certs, [int]$WarningDays = (Get-SqlKitConfig thresholds).certificateWarningDays)
    $asOf = [datetime]::ParseExact($Certs.asOf, 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture)
    foreach ($c in $Certs.certificates) {
        $class = switch ($c.use) {
            'tls' { 'TLS for client connections' }
            'login' { 'Certificate-mapped login' }
            'endpoint' { 'Certificate-mapped endpoint' }
            'client-auth' { 'Certificate-based sign-in (NTLM interim)' }
            default { $c.use }
        }
        $adcs = @($Certs.enterpriseCAs) -contains $c.issuer
        $days = ([datetime]::ParseExact($c.notAfter, 'yyyy-MM-dd', [Globalization.CultureInfo]::InvariantCulture) - $asOf).Days
        $action = if ($adcs -and $c.use -eq 'tls') { 'Retained AD CS issues it through the CLM platform (Book 07, Ch 04); move it before this CA is retired' }
                  elseif ($adcs -and $c.use -in 'login', 'endpoint') { 'Not renewed by the CLM platform: replace or re-map before this CA is retired (Chapter 22)' }
                  elseif ($adcs) { 'NTLM interim: it also depends on the domain controllers certificates; retire it with the interim posture' }
                  else { 'Not AD CS: track it in the certificate lifecycle platform' }
        [pscustomobject]@{
            Instance = $c.instance; Class = $class; Subject = $c.subject; Issuer = $c.issuer
            ADCS = if ($adcs) { 'yes' } else { 'no' }; ExpiresInDays = $days
            Warning = if ($days -lt 0) { 'expired' } elseif ($days -le $WarningDays) { "expires within $WarningDays days" } else { '' }
            Action = $action
        }
    }
}

# ---------------------------------------------------------------------------------------------- Chapter 09

function Get-SqlClosureRecord {
    <#
    .SYNOPSIS
        Projects one audit run onto Book 06, Chapter 20's closure record: the five conditions and their
        fields, per instance, each met, not met or external (evidenced by telemetry the audit points at).
        An instance closes only when every field it can show is met; the assessor decides. On SQL Server 2025
        an unreported IsExternalAuthenticationOnly is NOT MET, never assumed.
    .EXAMPLE
        Get-SqlClosureRecord -Audit $day30 -Exceptions $exc.exceptions -Arc $arc
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Audit, $Exceptions = @(), $Arc = $null)
    $builtin = (Get-SqlKitConfig thresholds).builtinLoginPattern
    $asOf = $Audit.asOf
    foreach ($i in $Audit.instances) {
        $excepted = @($Exceptions | Where-Object { ($_.instance -eq '*' -or $_.instance -eq $i.name) -and (-not $_.expires -or $_.expires -ge $asOf) } | ForEach-Object { $_.login })
        $logins = @($i.logins | Where-Object { $_.name -notmatch $builtin -and -not $_.isDisabled -and $_.hasConnectSql -and $excepted -notcontains $_.name })
        $sa = @($i.logins | Where-Object { $_.isSa })[0]
        $year = Get-SqlMajorVersion $i.productVersion
        $remoteLegacy = (Get-SqlSessionSum @($i.connections | Where-Object { -not $_.local -and $_.authScheme -in 'NTLM', 'KERBEROS' }))
        $cat = if ($Arc) { (@(Get-SqlArcCategory -Audit ([pscustomobject]@{ instances = @($i) }) -Arc $Arc))[0] } else { $null }
        $rows = [ordered]@{
            '1 No usable Windows login'    = (@($logins | Where-Object { $_.type -in 'U', 'G' }).Count -eq 0)
            '2 SQL logins refused'         = ($i.isIntegratedSecurityOnly -eq 1 -and ($year -lt 2025 -or $i.isExternalAuthenticationOnly -eq 1))
            '2 No usable SQL login'        = (@($logins | Where-Object { $_.type -eq 'S' -and -not $_.isSa }).Count -eq 0)
            '2 sa disabled and renamed'    = ($sa -and $sa.isDisabled -and $sa.name -ne 'sa')
            '3 Only Entra logins remain'   = (@($logins | Where-Object { $_.type -notin 'E', 'X' -and -not $_.isSa }).Count -eq 0)
            '3 No remote NTLM or Kerberos' = (-not $remoteLegacy)
            '3 Entra sign-ins and audit'   = 'external'
            '4 Arc agent connected'        = if ($cat) { $cat.Agent -eq 'Connected' } else { 'external' }
            '4 SQL extension deployed'     = if ($cat) { $cat.Extension -eq 'deployed' } else { 'external' }
            '4 Entra configured'           = if ($cat) { $cat.Entra -ne 'not configured' } else { 'external' }
            '5 MFA for every human'        = 'external'
        }
        foreach ($k in $rows.Keys) {
            $v = $rows[$k]
            [pscustomobject]@{ Instance = $i.name; Condition = $k; Status = if ($v -is [bool]) { if ($v) { 'met' } else { 'NOT MET' } } else { $v } }
        }
    }
}

function Compare-SqlAuditRun {
    <#
    .SYNOPSIS
        Compares two audit runs and returns the drift Book 06, Chapter 20 treats as a regression: a new usable
        Windows or SQL login, sa re-enabled, SQL authentication accepted again, remote NTLM back, or an
        Entra login removed, or (given both runs' Arc snapshots) an instance that fell out of Arc Category 1. A
        login in the exception registry isn't drift.
    .EXAMPLE
        Compare-SqlAuditRun -Before $day1 -After $day30 -Exceptions $exc.exceptions
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Before, [Parameter(Mandatory)]$After, $Exceptions = @(), $BeforeArc = $null, $AfterArc = $null)
    $builtin = (Get-SqlKitConfig thresholds).builtinLoginPattern
    foreach ($a in $After.instances) {
        $b = @($Before.instances | Where-Object { $_.name -eq $a.name })[0]
        if (-not $b) { [pscustomobject]@{ Instance = $a.name; Drift = 'New instance'; Detail = 'Not in the earlier run: classify it (Chapter 01)' }; continue }
        $usable = { param($x) @($x.logins | Where-Object { -not $_.isDisabled -and $_.hasConnectSql -and $_.name -notmatch $builtin }) }
        $bNames = @(& $usable $b | ForEach-Object { $_.name })
        $excepted = @($Exceptions | Where-Object { ($_.instance -eq '*' -or $_.instance -eq $a.name) -and (-not $_.expires -or $_.expires -ge $After.asOf) } | ForEach-Object { $_.login })
        foreach ($l in @(& $usable $a | Where-Object { $_.type -in 'U', 'G', 'S' -and $bNames -notcontains $_.name -and $excepted -notcontains $_.name })) {
            [pscustomobject]@{ Instance = $a.name; Drift = 'New legacy login'; Detail = "$($l.name) ($($l.type))$(if (@($l.serverRoles).Count) { ', ' + (@($l.serverRoles) -join ',') })" }
        }
        $aE = @(& $usable $a | Where-Object { $_.type -in 'E', 'X' } | ForEach-Object { $_.name })
        foreach ($n in @(& $usable $b | Where-Object { $_.type -in 'E', 'X' -and $aE -notcontains $_.name } | ForEach-Object { $_.name })) {
            [pscustomobject]@{ Instance = $a.name; Drift = 'Entra login removed'; Detail = $n }
        }
        $saA = @($a.logins | Where-Object { $_.isSa })[0]; $saB = @($b.logins | Where-Object { $_.isSa })[0]
        if ($saA -and -not $saA.isDisabled -and $saB -and $saB.isDisabled) { [pscustomobject]@{ Instance = $a.name; Drift = 'sa re-enabled'; Detail = $saA.name } }
        if ($a.isIntegratedSecurityOnly -eq 0 -and $b.isIntegratedSecurityOnly -eq 1) { [pscustomobject]@{ Instance = $a.name; Drift = 'SQL authentication accepted again'; Detail = 'IsIntegratedSecurityOnly went from 1 to 0' } }
        $nA = (Get-SqlSessionSum @($a.connections | Where-Object { -not $_.local -and $_.authScheme -eq 'NTLM' }))
        $nB = (Get-SqlSessionSum @($b.connections | Where-Object { -not $_.local -and $_.authScheme -eq 'NTLM' }))
        if ($nA -and -not $nB) { [pscustomobject]@{ Instance = $a.name; Drift = 'Remote NTLM back'; Detail = "$nA sessions" } }
        if ($BeforeArc -and $AfterArc) {
            $cb = @(Get-SqlArcCategory -Audit ([pscustomobject]@{ instances = @($b) }) -Arc $BeforeArc)[0]
            $ca = @(Get-SqlArcCategory -Audit ([pscustomobject]@{ instances = @($a) }) -Arc $AfterArc)[0]
            if ($cb.Category -eq 1 -and $ca.Category -ne 1) { [pscustomobject]@{ Instance = $a.name; Drift = 'Arc regressed'; Detail = "Category 1 to $($ca.Category): $($ca.Next)" } }
        }
    }
}

# ---------------------------------------------------------------------------------------------- Evidence

function Write-SqlText {
    <#
    .SYNOPSIS
        Writes (or appends) UTF-8 text with LF line endings to a path given relative to the PowerShell
        location, which .NET's own file calls would resolve against the process folder instead.
    .EXAMPLE
        Write-SqlText -Path out/logins/sqlprd01-create.sql -Text $sql
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][AllowEmptyString()][string]$Text, [switch]$Append)
    $full = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($Path)
    $dir = Split-Path $full -Parent
    if ($dir -and -not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
    if ($Append) { [IO.File]::AppendAllText($full, $Text) } else { [IO.File]::WriteAllText($full, $Text) }
}

function Get-SqlFileHash {
    <#
    .SYNOPSIS
        The SHA-256 of a file, lower case, with line endings normalized to LF first so a hash approved on one
        platform matches on another (WD-094).
    .EXAMPLE
        Get-SqlFileHash -Path out/logins/sqlprd01-create.sql
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $text = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $Path).Path).Replace("`r`n", "`n")
    $bytes = [Text.Encoding]::UTF8.GetBytes($text)
    -join ([Security.Cryptography.SHA256]::HashData($bytes) | ForEach-Object { $_.ToString('x2') })
}

function Write-SqlOutput {
    <#
    .SYNOPSIS
        Writes rows to <name>.csv and <name>.json (LF line endings) in an output folder and returns the paths.
    .EXAMPLE
        Write-SqlOutput -Rows $rows -OutputPath out/estate -Name estate
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()]$Rows, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Name)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $csv = Join-Path $OutputPath "$Name.csv"; $json = Join-Path $OutputPath "$Name.json"
    $rows = @($Rows)
    $csvText = if ($rows.Count) { ($rows | ConvertTo-Csv -NoTypeInformation) -join "`n" } else { '' }
    Write-SqlText -Path $csv -Text ($csvText + "`n")
    Write-SqlText -Path $json -Text ((ConvertTo-Json -InputObject $rows -Depth 6) + "`n")
    @($csv, $json)
}

function Write-SqlManifest {
    <#
    .SYNOPSIS
        Writes manifest.json for a run: the step, its NIST SP 800-53 controls and FedRAMP 20x KSIs from
        config/requirements.json, the as-of date, and the SHA-256 of every file the run wrote. The manifest
        is the evidence an ISSO keeps; Test-SqlManifest re-hashes it.
    .EXAMPLE
        Write-SqlManifest -Step ESTATE -OutputPath out/estate -Files $files -AsOf 2026-11-20
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Step, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string[]]$Files,
          [Parameter(Mandatory)][string]$AsOf, [string]$Mode = 'read-only')
    $req = Get-SqlKitConfig requirements
    $s = $req.steps.$Step
    if (-not $s) { throw "No step '$Step' in config/requirements.json." }
    $entries = foreach ($f in $Files) { [ordered]@{ file = (Split-Path $f -Leaf); sha256 = Get-SqlFileHash $f } }
    $m = [ordered]@{ step = $Step; title = $s.title; mode = $Mode; asOf = $AsOf; controls = @($s.controls); ksis = @($s.ksis); files = @($entries) }
    $path = Join-Path $OutputPath 'manifest.json'
    Write-SqlText -Path $path -Text ((ConvertTo-Json -InputObject $m -Depth 5) + "`n")
    $path
}

function Test-SqlManifest {
    <#
    .SYNOPSIS
        Re-hashes every file a run's manifest.json lists and reports any that changed or went missing.
    .EXAMPLE
        Test-SqlManifest -OutputPath out/estate
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath)
    $m = Read-SqlJson (Join-Path $OutputPath 'manifest.json')
    foreach ($f in $m.files) {
        $p = Join-Path $OutputPath $f.file
        $now = if (Test-Path -LiteralPath $p) { Get-SqlFileHash $p } else { 'missing' }
        [pscustomobject]@{ File = $f.file; Recorded = $f.sha256.Substring(0, 12); Now = if ($now -eq 'missing') { $now } else { $now.Substring(0, 12) }; Match = $now -eq $f.sha256 }
    }
}

function Add-SqlEvidenceRecord {
    <#
    .SYNOPSIS
        Seals a stage's run manifests into one evidence record, appended to a hash chain (evidence/chain.jsonl):
        each record names the stage, the instance, the steps it holds with their modes, the SHA-256 of each
        manifest and the hash of the record before it. Refuses a stage whose required steps
        (config/requirements.json, stages) are missing, and one whose deployment was a dry run unless it is
        sealed as a -Rehearsal, which production preflight never accepts.
    .EXAMPLE
        Add-SqlEvidenceRecord -Stage test -Instance SQLPRD01 -RunPaths out/audit, out/arc -ChainPath evidence/chain.jsonl -AsOf 2026-11-20 -Rehearsal
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][ValidateSet('test', 'production')][string]$Stage, [Parameter(Mandatory)][string]$Instance,
          [Parameter(Mandatory)][string[]]$RunPaths, [Parameter(Mandatory)][string]$ChainPath, [Parameter(Mandatory)][string]$AsOf, [switch]$Rehearsal)
    $req = Get-SqlKitConfig requirements
    $manifests = foreach ($r in $RunPaths) { [pscustomobject]@{ Path = $r; M = Read-SqlJson (Join-Path $r 'manifest.json') } }
    $runs = foreach ($x in $manifests) { [ordered]@{ step = $x.M.step; mode = $x.M.mode; path = $x.Path.Replace('\', '/'); manifestSha256 = Get-SqlFileHash (Join-Path $x.Path 'manifest.json') } }
    $have = @($runs | ForEach-Object { $_.step })
    $missing = @($req.stages.$Stage | Where-Object { $have -notcontains $_ })
    if ($missing.Count) { throw "Stage '$Stage' is missing evidence for: $($missing -join ', '). No record written." }
    $dry = @($runs | Where-Object { $_.step -eq 'DEPLOY' -and $_.mode -ne 'applied' })
    if ($dry.Count -and -not $Rehearsal) { throw "Stage '$Stage' has a DEPLOY run that wasn't applied ($($dry[0].mode)). Seal it with -Rehearsal, which preflight never accepts as a stage." }
    $prev = if (Test-Path -LiteralPath $ChainPath) { @(Get-Content -LiteralPath $ChainPath | Where-Object { $_ })[-1] | ConvertFrom-Json | ForEach-Object { $_.recordSha256 } } else { '' }
    $body = [ordered]@{ stage = $Stage; instance = $Instance; rehearsal = [bool]$Rehearsal; asOf = $AsOf; runs = @($runs); previous = $prev }
    $bodyJson = ConvertTo-Json -InputObject $body -Depth 5 -Compress
    $sha = -join ([Security.Cryptography.SHA256]::HashData([Text.Encoding]::UTF8.GetBytes($bodyJson)) | ForEach-Object { $_.ToString('x2') })
    $body['recordSha256'] = $sha
    New-Item -ItemType Directory -Force -Path (Split-Path $ChainPath -Parent) | Out-Null
    Write-SqlText -Path $ChainPath -Text ((ConvertTo-Json -InputObject $body -Depth 5 -Compress) + "`n") -Append
    [pscustomobject]@{ Stage = $Stage + $(if ($Rehearsal) { ' (rehearsal)' } else { '' }); Instance = $Instance; Steps = ($have -join ', '); Record = $sha.Substring(0, 16); Previous = if ($prev) { $prev.Substring(0, 16) } else { '(first)' } }
}

function Complete-SqlRun {
    <#
    .SYNOPSIS
        Finishes an entry script's run: writes the rows (CSV and JSON), writes manifest.json with the step's
        controls and KSIs and every file's SHA-256, prints the chosen columns, and says what it wrote.
    .EXAMPLE
        Complete-SqlRun -Rows $rows -Name estate -Step ESTATE -OutputPath out/estate -AsOf 2026-11-20 -Show Instance, Classification
    .NOTES
        -DisplayRows prints a subset (for example only the rows that fail) while every row is written.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][AllowEmptyCollection()]$Rows, [Parameter(Mandatory)][string]$Name, [Parameter(Mandatory)][string]$Step,
          [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$AsOf, [string[]]$Extra = @(), [string]$Mode = 'read-only',
          [string[]]$Show, [int]$Width = 160, [object[]]$DisplayRows)
    $files = @(Write-SqlOutput -Rows $Rows -OutputPath $OutputPath -Name $Name) + @($Extra)
    $manifest = Write-SqlManifest -Step $Step -OutputPath $OutputPath -Files $files -AsOf $AsOf -Mode $Mode
    $rows = if ($PSBoundParameters.ContainsKey('DisplayRows')) { @($DisplayRows) } else { @($Rows) }
    if ($rows.Count) {
        $view = if ($Show) { $rows | Select-Object -Property $Show } else { $rows }
        ($view | Format-Table -AutoSize -Wrap | Out-String -Width $Width).TrimEnd() | Write-Host
    } else { Write-Host 'Nothing found.' }
    $s = (Get-SqlKitConfig requirements).steps.$Step
    Write-Host ''
    Write-Host "Wrote $($files.Count) files and manifest.json to $($OutputPath.Replace([char]92, [char]47))"
    Write-Host "Evidence for $Step ($($s.title)): $(@($s.controls) -join ', '); $(@($s.ksis) -join ', ')"
}

Export-ModuleMember -Function Get-SqlKitConfig, Read-SqlJson, Get-SqlMajorVersion, Get-SqlEstateClassification, Get-SqlLoginCensus,
    Get-SqlAuthFinding, Get-SqlArcCategory, New-SqlLoginPlan, Test-SqlParallelRun, Get-SqlGroupPattern, Get-SqlNtlmFinding,
    ConvertFrom-SqlConnectionString, Find-SqlConnectionString, Get-SqlCertificateDependency, Get-SqlClosureRecord, Compare-SqlAuditRun,
    Get-SqlFileHash, Write-SqlText, Write-SqlOutput, Write-SqlManifest, Test-SqlManifest, Add-SqlEvidenceRecord, Complete-SqlRun
