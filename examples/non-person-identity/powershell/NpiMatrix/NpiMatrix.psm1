#Requires -Version 7.1
<#
    NpiMatrix: Chapter 03 of the developer workbook "Building Non-Person Identity".

    Book 02, Chapter 09's migration path matrix as reviewed data (config/migration-matrix.json): a
    proposed target for every identity in Chapter 01's register (N2.1), read with Chapter 02's
    ownership run; the application owner's disposition checked against it (D-N3: retire, re-platform,
    keep, or keep on Kerberos with an SPN owner and an end date); conversion waves with HIGH-risk
    accounts first and a rollback recorded per wave (N2.2); the Workload ID Premium scope as a
    decision file (D-N4); and Gate 2 as a check. Offline logic: the only network calls are two
    declared reads in config/calls-ch03.json. Nothing here writes.

    Illustrative: tested against fixtures and fakes, not against a production tenant or domain.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiOwnership/NpiOwnership.psm1') -Force -Global

$script:ConfigRoot = Join-Path $PSScriptRoot '../../config'
$script:AdTypes = @('Traditional', 'MSA', 'gMSA', 'dMSA', 'UnknownServiceAccount')
$script:Confirm = 'Detected only by a password that never expires*'

function ConvertTo-NpiMatrixDate {
    param([string]$Text)
    if (-not $Text) { return $null }
    [datetime]::Parse($Text, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

# ----------------------------------------------------------------------------- the call list (calls-ch03.json)

function Get-NpiMatrixCallList {
    <#
    .SYNOPSIS
        Reads Chapter 03's call list (config/calls-ch03.json unless -Path names another file) and
        returns it as a hashtable of tasks and calls.
    .EXAMPLE
        # List the IDs of the calls Chapter 03 declares.
        (Get-NpiMatrixCallList).calls | ForEach-Object { $_.id }
    .DESCRIPTION
    #>
    <# Chapter 03's own call list, in calls.json's schema. #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'calls-ch03.json'))
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiMatrixRequiredPermission {
    <#
    .SYNOPSIS
        Returns the Microsoft Graph permissions, Azure roles, AD rights and methods that a task's
        declared calls in Chapter 03's call list need, combined into one object.
    .EXAMPLE
        # What the migration-matrix task must be granted.
        Get-NpiMatrixRequiredPermission -Task migration-matrix
    .DESCRIPTION
    #>
    <# The union of the migration-matrix task's calls: Graph permissions, Azure roles, AD rights, methods. #>
    [CmdletBinding()]
    param([string]$Task = 'migration-matrix')
    $list = Get-NpiMatrixCallList
    if (-not $list.tasks.ContainsKey($Task)) { throw "Unknown task '$Task'." }
    $calls = @($list.calls | Where-Object { $_.tasks -contains $Task })
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        AzureRoles       = @($calls | Where-Object api -EQ 'arm' | ForEach-Object { $_.azureRole } | Sort-Object -Unique)
        AdRights         = @($calls | Where-Object api -EQ 'ad' | ForEach-Object { $_.adRight } | Sort-Object -Unique)
        Methods          = @($calls | ForEach-Object { $_.method } | Sort-Object -Unique)
    }
}

function New-NpiMatrixReader {
    <#
    .SYNOPSIS
        A read-only client for the migration-matrix task, shaped like NpiCore's reader so its
        Invoke-NpiGetOne and Invoke-NpiList work, but with Chapter 03's own call list.
    .EXAMPLE
        # A reader over the fake Graph with the Chapter 03 SKU fixture.
        $fake = New-NpiMatrixFixtureInvoker -Path tests/fixtures/estate.json -SkuPath tests/fixtures/ch03/subscribed-skus.json
        $reader = New-NpiMatrixReader -Cloud gcc -Invoke $fake.Invoke
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][scriptblock]$Invoke)
    $list = Get-NpiMatrixCallList
    $decl = $list.tasks['migration-matrix']
    if ($decl.mode -ne 'read') { throw 'migration-matrix must be declared as a read task.' }
    [pscustomobject]@{
        Cloud    = Get-NpiCloud -Cloud $Cloud
        Task     = 'migration-matrix'
        Calls    = @($list.calls | Where-Object { $_.tasks -contains 'migration-matrix' })
        Invoke   = $Invoke
        AdInvoke = $null
        Evidence = [Collections.Generic.List[object]]::new()
    }
}

function New-NpiMatrixFixtureInvoker {
    <#
    .SYNOPSIS
        NpiCore's fake Graph for the estate, plus a GET /subscribedSkus route served from a
        Chapter 03 fixture. GET only; every call is recorded in .Calls.
    .EXAMPLE
        # The fake, then the calls it received after a run.
        $fake = New-NpiMatrixFixtureInvoker -Path tests/fixtures/estate.json -SkuPath tests/fixtures/ch03/subscribed-skus.json -Cloud gcc
        $fake.Calls | Select-Object Method, Uri
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [Parameter(Mandatory)][string]$SkuPath, [string]$Cloud = 'gcc')
    $inner = New-NpiFixtureInvoker -Path $Path -Cloud $Cloud
    $skus = Get-Content -LiteralPath $SkuPath -Raw | ConvertFrom-Json -AsHashtable -Depth 20
    $calls = $inner.Calls
    $state = [pscustomobject]@{ Calls = $calls; Invoke = $null }
    $state.Invoke = {
        param($Method, $Uri, $Body, $Headers)
        if ($Method -ne 'GET') { $calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body; Headers = $Headers }); throw "The fake refuses $Method" }
        if (([Uri]$Uri).AbsolutePath -eq '/v1.0/subscribedSkus') {
            $calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body; Headers = $Headers })
            return @{ value = @($skus['value']) }
        }
        & $inner.Invoke $Method $Uri $Body $Headers
    }.GetNewClosure()
    $state
}

function Get-NpiMatrixPersonCache {
    param($Reader)
    $cache = @{}
    {
        param([string]$Key)
        if (-not $Key) { return $null }
        if (-not $cache.ContainsKey($Key)) {
            try { $cache[$Key] = Invoke-NpiGetOne -Reader $Reader -CallId 'matrix-user' -Bind @{ id = [Uri]::EscapeDataString($Key) } -Query '$select=id,userPrincipalName,userType,accountEnabled' }
            catch { if ("$_" -match '404|does not exist|Request_ResourceNotFound') { $cache[$Key] = $null } else { throw } }
        }
        $cache[$Key]
    }.GetNewClosure()
}

function Test-NpiMatrixPerson {
    # Chapter 02's rule: only an enabled member counts.
    param($Person)
    if (-not $Person) { return 'not found' }
    if ($Person.userType -ne 'Member') { return 'a guest' }
    if (-not $Person.accountEnabled) { return 'disabled' }
    $null
}

# ----------------------------------------------------------------------------- inputs

function Import-NpiMatrixConfig {
    <#
    .SYNOPSIS
        Reads the migration matrix (config/migration-matrix.json unless -Path names another file),
        checks that every row names a known target, and returns it as a hashtable with the file's
        SHA-256 under the sha256 key.
    .EXAMPLE
        # Load the reviewed matrix and show its hash for the manifest.
        $config = Import-NpiMatrixConfig
        $config.sha256
    .DESCRIPTION
    #>
    <# config/migration-matrix.json, with its SHA-256 for the manifest. #>
    [CmdletBinding()]
    param([string]$Path = (Join-Path $script:ConfigRoot 'migration-matrix.json'))
    $c = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 20
    foreach ($r in $c.rows) { if (-not $c.targets.ContainsKey($r.target)) { throw "Matrix row $($r.id) names an unknown target '$($r.target)'." } }
    $c['sha256'] = Get-NpiFileHash -Path $Path
    $c
}

function Import-NpiOwnershipRun {
    <#
    .SYNOPSIS
        Chapter 02's run, checked against its manifest: ownership.json and orphan-plan.json must
        have the SHA-256 the manifest records, and the run must have checked this very register.
    .EXAMPLE
        # Load Chapter 02's run for the register Chapter 01 wrote.
        $register = Import-NpiRegister -RunPath out/inventory
        $ownership = Import-NpiOwnershipRun -RunPath out/ownership -RegisterSha256 $register.Sha256
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$RegisterSha256)
    $man = Join-Path $RunPath 'manifest.json'
    if (-not (Test-Path -LiteralPath $man)) { throw "Missing $man; run Chapter 02's Invoke-NpiOwnership.ps1 first." }
    $manifest = Get-Content -LiteralPath $man -Raw | ConvertFrom-Json -AsHashtable
    if ($manifest.task -ne 'ownership') { throw "$man isn't an ownership run." }
    if ($manifest.registerSha256 -ne $RegisterSha256) { throw "The ownership run checked register $($manifest.registerSha256), not $RegisterSha256; run Chapter 02 on this register." }
    $out = @{}
    foreach ($f in 'ownership.json', 'orphan-plan.json') {
        $p = Join-Path $RunPath $f
        $h = Get-NpiFileHash -Path $p
        if ($h -ne $manifest.files[$f]) { throw "$f doesn't match its manifest (SHA-256 $h); refusing to decide on a changed ownership run." }
        $out[$f] = $h
    }
    [pscustomobject]@{
        Identities = @(Get-Content -LiteralPath (Join-Path $RunPath 'ownership.json') -Raw | ConvertFrom-Json)
        OrphanPlan = Get-Content -LiteralPath (Join-Path $RunPath 'orphan-plan.json') -Raw | ConvertFrom-Json
        Manifest   = $manifest
        Sha256     = $out
    }
}

function Import-NpiMatrixJson {
    <#
    .SYNOPSIS
        Reads a JSON input file and returns it as a hashtable. Returns $null when the path is empty
        or the file doesn't exist, so an optional input can be left out.
    .EXAMPLE
        # Read the program dates from the Chapter 03 fixture inputs.
        Import-NpiMatrixJson -Path tests/fixtures/ch03/inputs/program-dates.json
    #>
    param([string]$Path)
    if (-not $Path -or -not (Test-Path -LiteralPath $Path)) { return $null }
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 20
}

# ----------------------------------------------------------------------------- N2.1: the proposal

function Test-NpiMatrixYes { param([string]$Text) "$Text".Trim() -in 'Yes', 'yes', 'true', 'True', 'Y', 'y' }
function Test-NpiMatrixNo { param([string]$Text) "$Text".Trim() -in 'No', 'no', 'false', 'False', 'N', 'n' }

function Get-NpiMatrixProposal {
    <#
    .SYNOPSIS
        A proposed target for every identity in the register (N2.1): Retire for an unowned or
        disabled one, otherwise the first matrix row that matches its type, its workload's location
        and facts, and its credential kind. Identities outside the matrix get a reason, not a row.
    .EXAMPLE
        # Propose a target for every row, using the fixture workload facts.
        $proposals = Get-NpiMatrixProposal -Rows $register.Rows -Ownership $ownership -Config (Import-NpiMatrixConfig) -Workloads (Import-NpiInput tests/fixtures/ch03/inputs/workloads.csv)
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][object[]]$Rows,
        [Parameter(Mandatory)]$Ownership,
        [Parameter(Mandatory)]$Config,
        [object[]]$Workloads = @()
    )
    $own = @{}; foreach ($i in $Ownership.Identities) { $own[$i.IdentityId] = $i }
    $orphan = @{}; foreach ($a in @($Ownership.OrphanPlan.actions)) { if ($a.IdentityId -and -not $orphan.ContainsKey($a.IdentityId) -and $a.Action -notin 'AddOwner', 'NomineeRefused', 'AlreadyOwner', 'RecordOwner') { $orphan[$a.IdentityId] = $a.Action } }
    $facts = @{}; foreach ($w in $Workloads) { if ($w.IdentityId) { $facts[$w.IdentityId] = $w } }
    $out = [Collections.Generic.List[object]]::new()

    foreach ($row in $Rows) {
        $p = [ordered]@{
            IdentityId = $row.IdentityId; Name = $row.Name; Type = $row.Type; Enabled = $row.Enabled; Risk = $row.Risk; RiskReasons = "$($row.RiskReasons)"
            Scope = 'Matrix'; Location = ''; Facts = ''; MatrixRow = ''; Proposed = ''; ProposedLabel = ''; Why = ''; Cautions = @()
            ChapterOneCandidate = "$($row.CandidateTarget)"; OrphanState = ''; SpnCount = [int]$row.SpnCount; Delegation = "$($row.Delegation)"
        }
        if ($row.Handoff -eq 'DataPlatform') { $p.Scope = 'HandedOff'; $p.Why = 'SQL Server account: the Data Platform plan decides its disposition (N0.4)'; $out.Add([pscustomobject]$p); continue }
        if ($Config.outOfScope.ContainsKey($row.Type)) { $p.Scope = 'OutOfScope'; $p.Why = $Config.outOfScope[$row.Type]; $out.Add([pscustomobject]$p); continue }
        if ($row.Type -notin $Config.inScopeTypes) { $p.Scope = 'OutOfScope'; $p.Why = "Type '$($row.Type)' isn't in the matrix (NPI-INV-09)"; $out.Add([pscustomobject]$p); continue }
        if ("$($row.Note)" -like $script:Confirm) { $p.Scope = 'ConfirmFirst'; $p.Why = 'Not decided until someone confirms it is a service account (NPI-INV-08, NPI-OWN-09)'; $out.Add([pscustomobject]$p); continue }

        $o = if ($own.ContainsKey($row.IdentityId)) { $own[$row.IdentityId] } else { $null }
        $state = if ($orphan.ContainsKey($row.IdentityId)) { $orphan[$row.IdentityId] } else { '' }
        $p.OrphanState = $state
        $unowned = $o -and $o.OrphanCandidate -and $state -notin 'Exception', 'ClaimRecorded'
        if ($row.Enabled -eq $false -or $unowned) {
            $p.MatrixRow = 'R'; $p.Proposed = 'Retire'; $p.ProposedLabel = $Config.targets['Retire'].label
            $p.Why = if ($row.Enabled -eq $false) { 'Disabled: retire after confirming against sign-in logs' } else { "No owner (Chapter 02, orphan plan: $(if ($state) { $state } else { 'candidate' }))" }
            if ($row.StaleLead) { $p.Cautions += 'Stale lead: confirm against domain controller and Entra sign-in logs before retiring' }
            $out.Add([pscustomobject]$p); continue
        }

        $f = if ($facts.ContainsKey($row.IdentityId)) { $facts[$row.IdentityId] } else { $null }
        $isMi = $row.Type -like 'ManagedIdentity*'
        $loc = if ($isMi) { 'Azure' } elseif ($f) { "$($f.Location)".Trim() } else { '' }
        $p.Location = $loc
        if (-not $loc) { $p.Why = 'No workload facts: the application owner records where it runs (workloads.csv)'; $out.Add([pscustomobject]$p); continue }
        if ($loc -notin $Config.workloadLocations) { $p.Why = "Unknown location '$loc'; use one of $($Config.workloadLocations -join ', ')"; $out.Add([pscustomobject]$p); continue }
        $missing = @()
        if (-not $isMi) {
            if ($loc -eq 'Azure' -and -not ((Test-NpiMatrixYes $f.MiSupported) -or (Test-NpiMatrixNo $f.MiSupported))) { $missing += 'MiSupported (does the service support a managed identity?)' }
            if ($loc -eq 'OidcIssuer' -and -not "$($f.Issuer)") { $missing += 'Issuer (the OIDC issuer URL)' }
            if ($loc -in 'OnPremKerberos', 'Hybrid' -and $row.Type -in 'Traditional', 'UnknownServiceAccount' -and -not ((Test-NpiMatrixYes $f.Dmsa) -or (Test-NpiMatrixNo $f.Dmsa))) { $missing += 'Dmsa (a Windows Server 2025 domain controller and every host dMSA-capable?)' }
        }
        if ($missing) { $p.Why = "Incomplete workload facts: $($missing -join '; ')"; $out.Add([pscustomobject]$p); continue }
        $p.Facts = if ($f) { (@("Location=$loc") + @(foreach ($k in 'MiSupported', 'Dmsa', 'Issuer') { if ($f.PSObject.Properties[$k] -and "$($f.$k)") { "$k=$($f.$k)" } })) -join '; ' } else { "Location=$loc" }

        $hit = $null
        foreach ($m in $Config.rows) {
            if ($row.Type -notin $m.types) { continue }
            if ($m.locations -notcontains '*' -and $loc -notin $m.locations) { continue }
            if ($m.ContainsKey('credentialKinds') -and "$($row.CredentialKind)" -notin $m.credentialKinds) { continue }
            if ($m.ContainsKey('miSupported') -and ($m.miSupported -ne (Test-NpiMatrixYes $f.MiSupported))) { continue }
            if ($m.ContainsKey('dmsa') -and ($m.dmsa -ne (Test-NpiMatrixYes $f.Dmsa))) { continue }
            $hit = $m; break
        }
        if (-not $hit) { $p.Why = "No matrix row for a $($row.Type) at $loc with credential '$($row.CredentialKind)'"; $out.Add([pscustomobject]$p); continue }
        $p.MatrixRow = $hit.id; $p.Proposed = $hit.target; $p.ProposedLabel = $Config.targets[$hit.target].label; $p.Why = $hit.source
        if ($loc -eq 'ArcServer' -and $hit.target -eq 'ManagedIdentity') { $p.Cautions += 'An Arc-enabled server has one system-assigned identity, shared by every app its local administrators let request tokens; Learn''s cloud service account page says managed identities can''t be used outside Azure (research gaps, row 23)' }
        if ($hit.target -eq 'dMSA') {
            $p.Cautions += 'Every host using the account must support dMSA, or authentication fails once the account is disabled (Learn)'
            if ($row.Delegation -eq 'Unconstrained') { $p.Cautions += 'Unconstrained delegation stops working once the dMSA migration completes (Learn)' }
        }
        $out.Add([pscustomobject]$p)
    }
    $out.ToArray()
}

# ----------------------------------------------------------------------------- D-N3: the disposition, and N2.2: the waves

function Test-NpiMigrationDecision {
    <#
    .SYNOPSIS
        Check each owner's disposition (D-N3) against the matrix's proposal, sequence the waves
        (N2.2) and return @{ Decisions; Waves; Findings }. Findings NPI-MAT-01 to NPI-MAT-08,
        each with a stable ID (rule:identity, or rule:wave-N).
    .EXAMPLE
        # Check the fixture dispositions and waves against the proposals.
        $fake = New-NpiMatrixFixtureInvoker -Path tests/fixtures/estate.json -SkuPath tests/fixtures/ch03/subscribed-skus.json
        $reader = New-NpiMatrixReader -Cloud gcc -Invoke $fake.Invoke
        $decision = Test-NpiMigrationDecision -Reader $reader -Proposals $proposals -Config (Import-NpiMatrixConfig) -AsOf '2026-10-30T12:00:00Z' -Dispositions (Import-NpiInput tests/fixtures/ch03/inputs/dispositions.csv) -Waves (Import-NpiInput tests/fixtures/ch03/inputs/waves.csv) -ProgramDates (Import-NpiMatrixJson tests/fixtures/ch03/inputs/program-dates.json)
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)][object[]]$Proposals,
        [Parameter(Mandatory)]$Config,
        [Parameter(Mandatory)][datetime]$AsOf,
        [object[]]$Dispositions = @(),
        [object[]]$Waves = @(),
        $ProgramDates
    )
    $person = Get-NpiMatrixPersonCache -Reader $Reader
    $f = [Collections.Generic.List[object]]::new()
    $dec = [Collections.Generic.List[object]]::new()
    $byId = @{}; foreach ($d in $Dispositions) { if ($d.IdentityId) { $byId[$d.IdentityId] = $d } }
    $d08 = if ($ProgramDates) { ConvertTo-NpiMatrixDate $ProgramDates['d08LegacyAuthEndDate'] } else { $null }
    $g5 = if ($ProgramDates) { ConvertTo-NpiMatrixDate $ProgramDates['g5AdRetired'] } else { $null }
    $first = [int]$Config.firstWave

    foreach ($p in $Proposals) {
        $label = "$($p.Name) ($($p.Type))"
        $r = [ordered]@{ IdentityId = $p.IdentityId; Name = $p.Name; Type = $p.Type; Risk = $p.Risk; Scope = $p.Scope; Proposed = $p.Proposed; MatrixRow = $p.MatrixRow; Disposition = ''; Target = ''; Wave = ''; WaveSource = ''; EndDate = ''; SpnOwner = ''; DecidedBy = ''; Decided = $false; Reason = '' }
        if ($p.Scope -eq 'OutOfScope') { continue }
        if ($p.Scope -eq 'HandedOff') { $r.Disposition = 'HandedOff'; $r.Reason = $p.Why; $dec.Add([pscustomobject]$r); continue }
        if ($p.Scope -eq 'ConfirmFirst') {
            $f.Add((New-NpiFinding 'NPI-MAT-01' 'Info' $p.IdentityId $label 'Not decided: confirm it is a service account first (NPI-INV-08)'))
            $r.Reason = $p.Why; $dec.Add([pscustomobject]$r); continue
        }
        if (-not $p.Proposed) { $f.Add((New-NpiFinding 'NPI-MAT-02' 'Finding' $p.IdentityId $label "The matrix can't propose a target: $($p.Why)")) }

        $d = if ($byId.ContainsKey($p.IdentityId)) { $byId[$p.IdentityId] } else { $null }
        if (-not $d -or -not "$($d.Disposition)" -or -not "$($d.DecidedBy)" -or -not "$($d.DecidedOn)") {
            $f.Add((New-NpiFinding 'NPI-MAT-01' 'Finding' $p.IdentityId $label "No disposition recorded by the application owner (D-N3)$(if ($p.Proposed) { "; the matrix proposes $($p.Proposed)" })"))
            $dec.Add([pscustomobject]$r); continue
        }
        $disp = "$($d.Disposition)".Trim()
        $r.Disposition = $disp; $r.DecidedBy = "$($d.DecidedBy)"; $r.Reason = "$($d.Reason)"
        if (-not $Config.dispositions.ContainsKey($disp)) {
            $f.Add((New-NpiFinding 'NPI-MAT-01' 'Finding' $p.IdentityId $label "Unknown disposition '$disp'; use Retire, Replatform, Keep or KeepKerberos"))
            $dec.Add([pscustomobject]$r); continue
        }
        $target = if ("$($d.Target)") { "$($d.Target)".Trim() } elseif ($Config.dispositions[$disp].Count -eq 1) { $Config.dispositions[$disp][0] } elseif ($p.Proposed -in $Config.dispositions[$disp]) { $p.Proposed } else { '' }
        $r.Target = $target
        $ok = $true
        if (-not $target -or $target -notin $Config.dispositions[$disp]) {
            $f.Add((New-NpiFinding 'NPI-MAT-03' 'Finding' $p.IdentityId $label "Target '$target' isn't a $disp target ($($Config.dispositions[$disp] -join ', '))")); $ok = $false
        }
        foreach ($n in $Config.neverAllowed) {
            if ($p.Type -in $n.types -and $target -eq $n.target) { $f.Add((New-NpiFinding 'NPI-MAT-03' 'Finding' $p.IdentityId $label "$target isn't allowed for a $($p.Type): $($n.why)")); $ok = $false }
        }
        if ($ok -and $target -eq 'dMSA' -and $p.Facts -notmatch 'Dmsa=(Yes|yes|true|True|Y|y)') { $f.Add((New-NpiFinding 'NPI-MAT-03' 'Finding' $p.IdentityId $label 'dMSA chosen, but the workload facts don''t record a Windows Server 2025 domain controller and dMSA-capable hosts')); $ok = $false }
        if ($ok -and $target -eq 'dMSA' -and $p.Delegation -eq 'Unconstrained') { $f.Add((New-NpiFinding 'NPI-MAT-03' 'Warn' $p.IdentityId $label 'Unconstrained delegation stops working once the dMSA migration completes (Learn); test before Complete-ADServiceAccountMigration')) }
        if ($ok -and $p.Proposed -and $target -ne $p.Proposed -and $disp -ne 'KeepKerberos') {
            if ("$($d.Reason)") { $f.Add((New-NpiFinding 'NPI-MAT-04' 'Warn' $p.IdentityId $label "The owner chose $target where the matrix proposes $($p.Proposed): $($d.Reason)")) }
            else { $f.Add((New-NpiFinding 'NPI-MAT-04' 'Finding' $p.IdentityId $label "The owner chose $target where the matrix proposes $($p.Proposed), with no reason recorded")) }
        }

        # Kept accounts: an end date, and for Kerberos an SPN owner (Gate 2) and the authorizing official.
        $isAd = $p.Type -in $script:AdTypes
        if ($disp -eq 'KeepKerberos' -or ($disp -eq 'Keep' -and $isAd)) {
            $end = ConvertTo-NpiMatrixDate $d.EndDate
            $r.EndDate = "$($d.EndDate)"
            $limit = if ($disp -eq 'KeepKerberos') { $d08 } else { $g5 }
            $limitName = if ($disp -eq 'KeepKerberos') { 'the program''s legacy-authentication end date (D08)' } else { 'AD retirement (G5)' }
            if (-not $end) { $f.Add((New-NpiFinding 'NPI-MAT-05' 'Finding' $p.IdentityId $label "Kept on Active Directory with no end date; it must end by $limitName")) }
            elseif ($end -le $AsOf) { $f.Add((New-NpiFinding 'NPI-MAT-05' 'Finding' $p.IdentityId $label "The end date $($d.EndDate) has passed")) }
            elseif (-not $limit) { $f.Add((New-NpiFinding 'NPI-MAT-05' 'Warn' $p.IdentityId $label "End date $($d.EndDate) can't be checked: $limitName isn't in program-dates.json")) }
            elseif ($end -gt $limit) { $f.Add((New-NpiFinding 'NPI-MAT-05' 'Finding' $p.IdentityId $label "End date $($d.EndDate) is after $limitName, $($limit.ToString('yyyy-MM-dd'))")) }
            if ($disp -eq 'KeepKerberos' -and -not "$($d.AoAcceptedBy)") { $f.Add((New-NpiFinding 'NPI-MAT-05' 'Finding' $p.IdentityId $label 'Kept on Kerberos without the authorizing official''s acceptance recorded (D-N3)')) }
            if ($disp -eq 'KeepKerberos' -or $p.SpnCount -gt 0) {
                $r.SpnOwner = "$($d.SpnOwnerUpn)"
                if (-not "$($d.SpnOwnerUpn)") { $f.Add((New-NpiFinding 'NPI-MAT-06' 'Finding' $p.IdentityId $label 'Kept on Kerberos with no SPN owner (Gate 2)')) }
                else {
                    $why = Test-NpiMatrixPerson (& $person "$($d.SpnOwnerUpn)")
                    if ($why) { $f.Add((New-NpiFinding 'NPI-MAT-06' 'Finding' $p.IdentityId $label "SPN owner $($d.SpnOwnerUpn) is $why; an SPN owner is an enabled member")) }
                }
            }
        }

        # N2.2: HIGH first.
        if ($disp -eq 'Replatform') {
            if ("$($d.Wave)") { $r.Wave = [int]$d.Wave; $r.WaveSource = 'Owner' }
            else { $r.Wave = $(if ($p.Risk -eq 'HIGH') { $first } else { $first + 1 }); $r.WaveSource = 'Proposed' }
            if ($p.Risk -eq 'HIGH' -and $r.Wave -ne $first) { $f.Add((New-NpiFinding 'NPI-MAT-07' 'Finding' $p.IdentityId $label "HIGH risk ($($p.RiskReasons)) but in wave $($r.Wave); HIGH-risk accounts go in wave $first (N2.2)")) }
        } elseif ($p.Risk -eq 'HIGH' -and $disp -in 'Keep', 'KeepKerberos') {
            $f.Add((New-NpiFinding 'NPI-MAT-07' 'Warn' $p.IdentityId $label "HIGH risk ($($p.RiskReasons)) and kept: the risk stays until its privilege is cut (Chapter 07; the Privileged Access plan's A3.4)"))
        }
        $r.Decided = -not @($f | Where-Object { $_.ObjectKey -eq $p.IdentityId -and $_.Severity -eq 'Finding' -and $_.Rule -in 'NPI-MAT-01', 'NPI-MAT-03', 'NPI-MAT-04', 'NPI-MAT-05', 'NPI-MAT-06' }).Count
        $dec.Add([pscustomobject]$r)
    }

    # The waves and their rollback (N2.2).
    $declared = @{}; foreach ($w in $Waves) { if ("$($w.Wave)") { $declared[[int]$w.Wave] = $w } }
    $plan = [Collections.Generic.List[object]]::new()
    $numbers = @(@($dec | Where-Object { "$($_.Wave)" }) | ForEach-Object { [int]$_.Wave }) + @($declared.Keys) | Sort-Object -Unique
    foreach ($n in $numbers) {
        $members = @($dec | Where-Object { "$($_.Wave)" -and [int]$_.Wave -eq $n })
        $w = if ($declared.ContainsKey($n)) { $declared[$n] } else { $null }
        $key = "wave-$n"; $label = "Wave $n"
        $rollback = @($members | ForEach-Object { $_.Target } | Where-Object { $_ } | Sort-Object -Unique | ForEach-Object { "$_`: $($Config.targets[$_].rollback)" })
        $problems = @()
        if (-not $w) { $problems += 'not declared in waves.csv' }
        else {
            if (-not "$($w.RollbackOwnerUpn)") { $problems += 'no rollback owner' }
            else { $why = Test-NpiMatrixPerson (& $person "$($w.RollbackOwnerUpn)"); if ($why) { $problems += "rollback owner $($w.RollbackOwnerUpn) is $why" } }
            if (-not "$($w.RollbackReviewedOn)") { $problems += 'rollback not reviewed' }
            if (-not "$($w.ParallelRunDays)" -or [int]$w.ParallelRunDays -lt [int]$Config.parallelRunDays) { $problems += "parallel run under $($Config.parallelRunDays) days" }
        }
        if ($members.Count -and $problems) { $f.Add((New-NpiFinding 'NPI-MAT-08' 'Finding' $key $label "Rollback isn't recorded: $($problems -join '; ')")) }
        $plan.Add([pscustomobject][ordered]@{
                Wave = $n; Name = $(if ($w) { "$($w.Name)" } else { '' }); Starts = $(if ($w) { "$($w.Starts)" } else { '' }); ParallelRunDays = $(if ($w -and "$($w.ParallelRunDays)") { [int]$w.ParallelRunDays } else { $null })
                Members = @($members | ForEach-Object { [ordered]@{ IdentityId = $_.IdentityId; Name = $_.Name; Risk = $_.Risk; Target = $_.Target; WaveSource = $_.WaveSource } })
                High = @($members | Where-Object Risk -EQ 'HIGH').Count
                Rollback = $rollback; RollbackOwner = $(if ($w) { "$($w.RollbackOwnerUpn)" } else { '' }); RollbackReviewedOn = $(if ($w) { "$($w.RollbackReviewedOn)" } else { '' })
                Recorded = ($members.Count -eq 0 -or -not $problems)
            })
    }
    [pscustomobject]@{ Decisions = $dec.ToArray(); Waves = $plan.ToArray(); Findings = $f.ToArray() }
}

# ----------------------------------------------------------------------------- D-N4: Workload ID Premium scope

function Get-NpiWorkloadIdScope {
    <#
    .SYNOPSIS
        The Workload ID Premium licensing scope (D-N4) as a decision file checked against the
        register, the decisions and the tenant's subscriptions: which identities Conditional Access
        and ID Protection for workload identities can cover, now and after conversion, how many each
        option scopes, and whether the tenant holds the license. Finding NPI-MAT-09.
    .EXAMPLE
        # Check the fixture D-N4 decision against the register and the decisions.
        $wid = Get-NpiWorkloadIdScope -Reader $reader -Rows $register.Rows -Decisions $decision.Decisions -Config (Import-NpiMatrixConfig) -Decision (Import-NpiMatrixJson tests/fixtures/ch03/inputs/workload-id-premium.json)
        $wid.Scope.scope
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Reader,
        [Parameter(Mandatory)][object[]]$Rows,
        [Parameter(Mandatory)][object[]]$Decisions,
        [Parameter(Mandatory)]$Config,
        $Decision
    )
    $f = [Collections.Generic.List[object]]::new()
    $dec = @{}; foreach ($d in $Decisions) { $dec[$d.IdentityId] = $d }
    # Learn: Conditional Access covers single-tenant service principals registered in the tenant; ID
    # Protection covers single-tenant and multitenant apps; managed identities and Microsoft apps neither.
    $ca = @($Rows | Where-Object { $_.Type -eq 'AppRegistration' -and $_.HomeTenant -eq 'Own' -and $_.SignInAudience -eq 'AzureADMyOrg' -and $_.Enabled -ne $false })
    $idp = @($Rows | Where-Object { ($_.Type -eq 'AppRegistration' -and $_.HomeTenant -eq 'Own') -or $_.Type -eq 'ExternalServicePrincipal' })
    $caIds = @($ca.IdentityId)
    $leaving = @($caIds | Where-Object { $dec.ContainsKey($_) -and $dec[$_].Target -in 'ManagedIdentity', 'Retire' })
    $joining = @($Decisions | Where-Object { $_.Target -in 'AppRegistrationFederated', 'AppRegistrationCertificate', 'GmsaPlusAppRegistration' -and $_.IdentityId -notin $caIds } | ForEach-Object IdentityId)
    $after = @(@($caIds | Where-Object { $_ -notin $leaving }) + $joining)

    $skus = @(Invoke-NpiList -Reader $Reader -CallId 'matrix-subscribed-skus' -Query '$select=skuId,skuPartNumber,capabilityStatus,prepaidUnits,servicePlans')
    $wid = @($skus | Where-Object { $s = $_; @($s['servicePlans'] | Where-Object { $_['servicePlanId'] -in $Config.workloadIdPremium.servicePlanIds }).Count })
    $enabled = @($wid | Where-Object { $_['capabilityStatus'] -eq 'Enabled' })
    $units = 0; foreach ($s in $enabled) { $units += [int]$s['prepaidUnits']['enabled'] }

    $label = 'Workload ID Premium scope (D-N4)'; $key = 'D-N4'
    $option = if ($Decision) { "$($Decision['decision'])" } else { '' }
    $scope = @()
    if (-not $Decision) { $f.Add((New-NpiFinding 'NPI-MAT-09' 'Finding' $key $label 'No D-N4 decision file: the CISO decides the Workload ID Premium scope before Gate 2')) }
    elseif ($option -notin $Config.workloadIdPremium.options) { $f.Add((New-NpiFinding 'NPI-MAT-09' 'Finding' $key $label "Unknown option '$option'; use $($Config.workloadIdPremium.options -join ', ')")) }
    else {
        if (-not "$($Decision['decidedBy'])" -or -not "$($Decision['decidedOn'])") { $f.Add((New-NpiFinding 'NPI-MAT-09' 'Finding' $key $label 'The decision has no decidedBy or decidedOn')) }
        switch ($option) {
            'Tier1' {
                $listed = @($Decision['tier1'] | Where-Object { $_ })
                $scope = @($listed | Where-Object { $_ -in $caIds })
                if (-not $listed) { $f.Add((New-NpiFinding 'NPI-MAT-09' 'Finding' $key $label 'Tier1 chosen, but no Tier 1 identities listed')) }
                foreach ($id in $listed) {
                    $row = @($Rows | Where-Object IdentityId -EQ $id)
                    $name = if ($row) { "$($row[0].Name) ($($row[0].Type))" } else { $id }
                    if ($id -notin $caIds) { $f.Add((New-NpiFinding 'NPI-MAT-09' 'Finding' "D-N4:$id" $name 'Listed for Tier 1, but Conditional Access for workload identities can''t cover it: only single-tenant service principals registered in this tenant')) }
                    elseif ($id -in $leaving) { $f.Add((New-NpiFinding 'NPI-MAT-09' 'Warn' "D-N4:$id" $name "Listed for Tier 1, but its decision ($($dec[$id].Target)) takes it out of scope: managed identities aren't covered")) }
                }
            }
            'Wide' { $scope = $after }
            'None' {
                if (-not @($Decision['compensatingControls']).Count) { $f.Add((New-NpiFinding 'NPI-MAT-09' 'Finding' $key $label 'None chosen, with no compensating controls recorded (app management policies, owner reviews)')) }
            }
        }
        if ($option -ne 'None') {
            if (-not $enabled) { $f.Add((New-NpiFinding 'NPI-MAT-09' 'Warn' $key $label 'No enabled Workload ID Premium subscription in this tenant: workload Conditional Access can''t be created or changed until one is bought')) }
            elseif ($units -lt @($scope).Count) { $f.Add((New-NpiFinding 'NPI-MAT-09' 'Warn' $key $label "$units enabled units for $(@($scope).Count) identities in scope; Microsoft prices per workload identity (research gaps, row 26)")) }
        } elseif ($enabled) {
            $f.Add((New-NpiFinding 'NPI-MAT-09' 'Info' $key $label "None chosen, but the tenant holds $units enabled Workload ID Premium units"))
        }
    }
    $result = [pscustomobject][ordered]@{
        decision = $option; decidedBy = $(if ($Decision) { "$($Decision['decidedBy'])" } else { '' }); decidedOn = $(if ($Decision) { "$($Decision['decidedOn'])" } else { '' })
        conditionalAccessEligibleNow = $caIds; idProtectionEligibleNow = @($idp.IdentityId)
        leavingScopeAfterConversion = $leaving; joiningScopeAfterConversion = $joining; conditionalAccessEligibleAfter = $after
        options = [ordered]@{ Tier1 = $(if ($option -eq 'Tier1') { @($scope).Count } else { $null }); Wide = $after.Count; None = 0 }
        scope = @($scope)
        tenant = [ordered]@{ workloadIdSkus = @($wid | ForEach-Object { [ordered]@{ skuId = $_['skuId']; skuPartNumber = $_['skuPartNumber']; capabilityStatus = $_['capabilityStatus']; enabledUnits = [int]$_['prepaidUnits']['enabled'] } }); enabledUnits = $units }
        compensatingControls = $(if ($Decision) { @($Decision['compensatingControls']) } else { @() })
    }
    [pscustomobject]@{ Scope = $result; Findings = $f.ToArray() }
}

# ----------------------------------------------------------------------------- Gate 2

function Test-NpiGate2 {
    <#
    .SYNOPSIS
        Gate 2, "every account has a decision": every account in scope has a disposition and a
        target from the matrix; HIGH-risk accounts in the first wave; every kept Kerberos account
        has an SPN owner; waves and their rollback recorded; the D-N4 scope decided.
    .EXAMPLE
        # Gate 2 over the decision and scope findings.
        $gate = Test-NpiGate2 -Findings (@($decision.Findings) + @($wid.Findings)) -Decisions $decision.Decisions
        $gate.criteria | Where-Object { -not $_.met }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][object[]]$Findings, [Parameter(Mandatory)][object[]]$Decisions)
    $blocking = @($Findings | Where-Object Severity -EQ 'Finding')
    $crit = [ordered]@{
        'Every account has a disposition and a target from the matrix' = @($blocking | Where-Object Rule -In 'NPI-MAT-01', 'NPI-MAT-02', 'NPI-MAT-03', 'NPI-MAT-04', 'NPI-MAT-05').Count
        'HIGH-risk accounts in the first wave'                         = @($blocking | Where-Object Rule -EQ 'NPI-MAT-07').Count
        'Every kept Kerberos account has an SPN owner'                 = @($blocking | Where-Object Rule -EQ 'NPI-MAT-06').Count
        'Waves and their rollback recorded'                            = @($blocking | Where-Object Rule -EQ 'NPI-MAT-08').Count
        'Workload ID Premium scope decided (D-N4)'                     = @($blocking | Where-Object Rule -EQ 'NPI-MAT-09').Count
    }
    [pscustomobject][ordered]@{
        gate = 'NG2'; met = ($blocking.Count -eq 0)
        criteria = @($crit.Keys | ForEach-Object { [ordered]@{ criterion = $_; open = $crit[$_]; met = ($crit[$_] -eq 0) } })
        decided = @($Decisions | Where-Object Decided).Count; inScope = @($Decisions | Where-Object { $_.Disposition -ne 'HandedOff' }).Count; handedOff = @($Decisions | Where-Object Disposition -EQ 'HandedOff').Count
        approver = 'ISSO'
    }
}

# ----------------------------------------------------------------------------- the run

function Export-NpiMatrixRun {
    <#
    .SYNOPSIS
        Write the run's files and a manifest: task, mode, cloud, tenant, as-of date, the permissions
        the task holds (from calls-ch03.json), every request, the SHA-256 of the register, the
        ownership run, the matrix and each input, and of each file written.
    .EXAMPLE
        # Write the proposals and findings with a manifest.
        Export-NpiMatrixRun -OutputPath out/matrix -Cloud gcc -TenantId $register.Manifest.tenantId -AsOf '2026-10-30' -Evidence $reader.Evidence -Files @{ 'proposals.json' = @($proposals); 'findings.json' = @($decision.Findings) }
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][hashtable]$Files, [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId, [string]$AsOf, [object[]]$Evidence = @(), [string]$Mode = 'Fixture', [hashtable]$Extra = @{}
    )
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        Write-NpiJson -Path $p -Value $Files[$name]
        $hashes[$name] = Get-NpiFileHash -Path $p
    }
    $perm = Get-NpiMatrixRequiredPermission
    $manifest = [ordered]@{
        task = 'migration-matrix'; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; asOf = $AsOf
        generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = $perm.GraphPermissions; azureRoles = $perm.AzureRoles; adRights = $perm.AdRights
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } })
        files = $hashes
    }
    foreach ($k in $Extra.Keys) { $manifest[$k] = $Extra[$k] }
    Write-NpiJson -Path (Join-Path $OutputPath 'manifest.json') -Value $manifest
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

Export-ModuleMember -Function Get-NpiMatrixCallList, Get-NpiMatrixRequiredPermission, New-NpiMatrixReader, New-NpiMatrixFixtureInvoker,
    Import-NpiMatrixConfig, Import-NpiOwnershipRun, Import-NpiMatrixJson, Get-NpiMatrixProposal, Test-NpiMigrationDecision, Get-NpiWorkloadIdScope,
    Test-NpiGate2, Export-NpiMatrixRun
