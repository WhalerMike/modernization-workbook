#Requires -Version 7.1
<#
    NpiKerberosIsland: Chapter 06 of the developer workbook "Building Non-Person Identity".

    The Kerberos-only workloads in Chapter 01's register: MSAs upgraded to gMSAs; traditional
    accounts, IIS application pools and scheduled tasks moved to a gMSA or a dMSA (Windows Server
    2025's delegated MSA migration); the KDS root key checked read-only; the principals allowed to
    retrieve each managed password held as reviewed data; the Kerberos accounts that stay recorded
    with an end date (no later than G5, or the island's end of life where D11 keeps a Kerberos island;
    WD-165) and, where Chapter 03 requires one, an SPN owner, and exported for the program's SPN
    retirement (P4.6); and every gMSA and dMSA reconciled with the program's provisional end state
    (D11) before AD is retired at G5.

    Its own call list is config/calls-ch06.json (same schema as calls.json). Reads run only declared
    Get-AD* cmdlets. Writes are a reviewed plan applied only by Invoke-NpiKrbPlan -Apply through a
    separate writer whose calls are declared for kerberos-apply; nothing removes, uninstalls, undoes
    or resets, and the old account is never deleted: it is disabled and moved to the holding OU.
    Each write call says who sends it (runBy): the pipeline's own gMSA for gMSA creation, retrievers,
    disables and moves; a person for the dMSA steps (WD-163). New gMSAs follow the reviewed AD
    standard in ad-standard.json: their OU, password interval, name and retriever group.

    Illustrative: tested against fixtures and a fake Active Directory, not a production domain.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiCore/NpiCore.psm1') -Force -Global

$script:CallsPath = Join-Path $PSScriptRoot '../../config/calls-ch06.json'
# Learn: domain controllers wait up to 10 hours after a root key's effective time before gMSA passwords are generated.
$script:KdsReplicationHours = 10
# Learn: wait at least two ticket lifetimes ("equivalent to 14 days") before completing a dMSA migration; four (28 days) is
# recommended; the default ticket renewal time is 10 hours. Design guidance (WD-124): the program waits 30 days, the same
# as its parallel run, its own choice and longer than Learn's 28.
$script:MigrationWaitDays = 30
$script:LearnMinimumMigrationDays = 14
# Book 02, Chapter 10, Phase 4: old and new credentials run in parallel for 30 days before the legacy account is disabled.
$script:ParallelRunDays = 30
$script:MaxPlanAgeDays = 7
$script:ManagedTypes = @('gMSA', 'dMSA')
# Chapter 03's D-NP3 vocabulary, read from its decisions; Get-NpiKrbPath says what this chapter does with each.
$script:Dispositions = @('Retire', 'Replatform', 'Keep', 'KeepKerberos')
$script:WorkloadTargets = @('ManagedIdentity', 'AppRegistrationFederated', 'AppRegistrationCertificate')
$script:Workloads = @('Service', 'IisAppPool', 'ScheduledTask')
$script:TagKeys = @('SystemId', 'Owner1', 'Owner2', 'Sponsor', 'Environment', 'Tier', 'EntraTarget', 'Request', 'Change')   # WD-175
$script:NeverSent = '^(Remove|Uninstall|Undo|Reset|Clear)-'

function ConvertTo-NpiKrbDate {
    param([string]$Text)
    if (-not $Text) { return $null }
    [datetime]::Parse($Text, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

# ----------------------------------------------------------------------------- the call list

function Get-NpiKrbCallList {
    <#
    .SYNOPSIS
        Reads Chapter 06's call list (config/calls-ch06.json unless -Path names another file) and
        returns it as a hashtable of tasks and calls.
    .EXAMPLE
        # List the tasks Chapter 06 declares.
        (Get-NpiKrbCallList).tasks.Keys
    #>
    [CmdletBinding()]
    param([string]$Path = $script:CallsPath)
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiKrbCall {
    <#
    .SYNOPSIS
        Returns the calls in Chapter 06's call list as an array, narrowed to those declared for
        -Task and to the call with ID -Id when either is given.
    .EXAMPLE
        # The cmdlets the read-only task may run.
        Get-NpiKrbCall -Task kerberos-island | ForEach-Object { $_.cmdlet }
    #>
    [CmdletBinding()]
    param([string]$Task, [string]$Id)
    $calls = @((Get-NpiKrbCallList).calls)
    if ($Task) { $calls = @($calls | Where-Object { $_.tasks -contains $Task }) }
    if ($Id) { $calls = @($calls | Where-Object { $_.id -eq $Id }) }
    , $calls
}

function Get-NpiKrbTask {
    <#
    .SYNOPSIS
        Returns one task's declaration from Chapter 06's call list, such as its mode (read or
        write). Throws if the task isn't declared.
    .EXAMPLE
        # Confirm the apply task is declared as a write task.
        (Get-NpiKrbTask -Task kerberos-apply).mode
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $t = (Get-NpiKrbCallList).tasks
    if (-not $t.ContainsKey($Task)) { throw "Unknown task '$Task' in calls-ch06.json." }
    $t[$Task]
}

function Get-NpiKrbRequiredRight {
    <#
    .SYNOPSIS
        Returns the Active Directory rights, cmdlets and methods that a Chapter 06 task's declared
        calls need, combined into one object.
    .EXAMPLE
        # What the read-only Kerberos task must be granted in AD.
        Get-NpiKrbRequiredRight -Task kerberos-island
    .DESCRIPTION
    #>
    <# The union of a task's calls: Active Directory rights and cmdlets. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $null = Get-NpiKrbTask -Task $Task
    $calls = Get-NpiKrbCall -Task $Task
    [pscustomobject]@{
        Task     = $Task
        AdRights = @($calls | ForEach-Object { $_.adRight } | Sort-Object -Unique)
        Cmdlets  = @($calls | ForEach-Object { $_.cmdlet } | Sort-Object -Unique)
        Methods  = @($calls | ForEach-Object { $_.method } | Sort-Object -Unique)
    }
}

# ----------------------------------------------------------------------------- the reader

function New-NpiKrbReader {
    <#
    .SYNOPSIS
        A read-only Active Directory client for the kerberos-island task. -AdInvoke is
        { param($Cmdlet, [hashtable]$Params) } and returns AD objects. A write task can't have a reader.
    .EXAMPLE
        # A reader over the fake Active Directory built from the fixtures.
        $fake = New-NpiKrbFixtureAdInvoker -EstatePath tests/fixtures/estate.json -KerberosPath tests/fixtures/ch06/ad-kerberos.json
        $reader = New-NpiKrbReader -AdInvoke $fake.Invoke
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][scriptblock]$AdInvoke, [string]$Task = 'kerberos-island')
    $decl = Get-NpiKrbTask -Task $Task
    if ($decl.mode -ne 'read') { throw "Task '$Task' writes; use New-NpiKrbWriter, never a reader." }
    [pscustomobject]@{ Task = $Task; Calls = Get-NpiKrbCall -Task $Task; AdInvoke = $AdInvoke; Evidence = [Collections.Generic.List[object]]::new() }
}

function Invoke-NpiKrbAdRead {
    <#
    .SYNOPSIS
        Runs one declared Get-AD* read through a reader (or writer) client, records it in the
        client's Evidence and returns the AD objects. The cmdlet comes from the call list; an
        undeclared call or one that isn't a Get-AD* read throws.
    .EXAMPLE
        # Read every managed service account from the fake AD.
        $fake = New-NpiKrbFixtureAdInvoker -EstatePath tests/fixtures/estate.json -KerberosPath tests/fixtures/ch06/ad-kerberos.json
        $reader = New-NpiKrbReader -AdInvoke $fake.Invoke
        Invoke-NpiKrbAdRead -Client $reader -CallId krb-service-accounts -Params @{ Filter = '*' }
    .DESCRIPTION
    #>
    <# Run a declared Get-AD* read; the cmdlet comes from the call list, never from the caller. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId, [hashtable]$Params = @{})
    $call = $Client.Calls | Where-Object { $_.id -eq $CallId }
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Client.Task)'; add it to config/calls-ch06.json with its right." }
    if ($call.method -ne 'READ' -or $call.cmdlet -notmatch '^Get-AD[A-Za-z]+$') { throw "Refusing '$CallId': only declared Get-AD* reads run here." }
    $shown = ($Params.Keys | Sort-Object | ForEach-Object { "-$_ $(@($Params[$_]) -join ',')" }) -join ' '
    $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'READ'; Target = "$($call.cmdlet) $shown".Trim(); At = [DateTime]::UtcNow.ToString('o') })
    @(& $Client.AdInvoke $call.cmdlet $Params)
}

# ----------------------------------------------------------------------------- inputs

function Import-NpiKrbRegister {
    <#
    .SYNOPSIS
        Reads Chapter 01's register from a run folder and returns @{ Rows; Manifest; Sha256 }.
        Throws if register.json's SHA-256 isn't the one manifest.json records.
    .EXAMPLE
        # Load Chapter 01's fixture run from out/inventory.
        $register = Import-NpiKrbRegister -RunPath out/inventory
    .DESCRIPTION
    #>
    <# Chapter 01's register, refused unless its SHA-256 is the one its run manifest records. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RunPath)
    $reg = Join-Path $RunPath 'register.json'; $man = Join-Path $RunPath 'manifest.json'
    foreach ($p in $reg, $man) { if (-not (Test-Path -LiteralPath $p)) { throw "Missing $p; run Chapter 01's Invoke-NpiInventory.ps1 first." } }
    $manifest = Get-Content -LiteralPath $man -Raw | ConvertFrom-Json -AsHashtable
    if ($manifest.task -ne 'inventory') { throw "$man isn't an inventory run." }
    $hash = Get-NpiFileHash -Path $reg
    if ($hash -ne $manifest.files['register.json']) { throw "register.json doesn't match its manifest (SHA-256 $hash); refusing to plan from a changed register." }
    [pscustomobject]@{ Rows = @(Get-Content -LiteralPath $reg -Raw | ConvertFrom-Json); Manifest = $manifest; Sha256 = $hash }
}

function Import-NpiKrbMatrixRun {
    <#
    .SYNOPSIS
        Chapter 03's run, checked against its manifest: decisions.json must have the SHA-256 the
        manifest records, and the run must have decided on this very register. Returns
        @{ Decisions; Manifest; Sha256 }. The owners' D-NP3 dispositions (Retire, Replatform, Keep,
        KeepKerberos) and the authorizing official's acceptance come from here, not from a second file.
    .EXAMPLE
        # Load Chapter 03's fixture run for the register Chapter 01 wrote.
        $register = Import-NpiKrbRegister -RunPath out/inventory
        $matrix = Import-NpiKrbMatrixRun -RunPath out/matrix -RegisterSha256 $register.Sha256
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$RunPath, [Parameter(Mandatory)][string]$RegisterSha256)
    $man = Join-Path $RunPath 'manifest.json'; $dec = Join-Path $RunPath 'decisions.json'
    foreach ($p in $man, $dec) { if (-not (Test-Path -LiteralPath $p)) { throw "Missing $p; run Chapter 03's Invoke-NpiMatrix.ps1 first." } }
    $manifest = Get-Content -LiteralPath $man -Raw | ConvertFrom-Json -AsHashtable
    if ($manifest.task -ne 'migration-matrix') { throw "$man isn't a migration matrix run." }
    if ($manifest.registerSha256 -ne $RegisterSha256) { throw "Chapter 03's run decided on register $($manifest.registerSha256), not $RegisterSha256; run Chapter 03 on this register." }
    $hash = Get-NpiFileHash -Path $dec
    if ($hash -ne $manifest.files['decisions.json']) { throw "decisions.json doesn't match its manifest (SHA-256 $hash); refusing to plan from changed decisions." }
    [pscustomobject]@{ Decisions = @(Get-Content -LiteralPath $dec -Raw | ConvertFrom-Json); Manifest = $manifest; Sha256 = $hash }
}

function Get-NpiKrbPath {
    <#
    .SYNOPSIS
        What this chapter does with a D-NP3 disposition from Chapter 03: Convert (Replatform to a gMSA
        or a dMSA), WorkloadIdentity (Replatform to a managed identity or an app registration, which
        Chapter 05 moves), Island (Keep or KeepKerberos, or a gMSA kept beside an app registration:
        it stays on Kerberos) or Retire. Empty for a disposition or target it doesn't know.
    .EXAMPLE
        # The path for one account record.
        Get-NpiKrbPath ([pscustomobject]@{ Disposition = 'Replatform'; Target = 'dMSA' })
    #>
    param($Disposition)
    if ($null -eq $Disposition) { return '' }
    switch ("$($Disposition.Disposition)") {
        'Retire' { 'Retire' }
        'Keep' { 'Island' }
        'KeepKerberos' { 'Island' }
        'Replatform' {
            if ("$($Disposition.Target)" -in $script:ManagedTypes) { 'Convert' }
            elseif ("$($Disposition.Target)" -in $script:WorkloadTargets) { 'WorkloadIdentity' }
            elseif ("$($Disposition.Target)" -eq 'GmsaPlusAppRegistration') { 'Island' }
            else { '' }
        }
        default { '' }
    }
}

function Import-NpiKrbInput {
    <#
    .SYNOPSIS
        The inputs: Chapter 03's decisions (the D-NP3 disposition, target, end date, SPN owner and the
        authorizing official's acceptance for each AD account), this chapter's three reviewed files
        (kerberos-replatform.csv, password-retrievers.json and ad-standard.json, the service-account
        OU, holding OU, creator group, retriever group pattern and password interval) and the
        program's one program-dates.json, each with its SHA-256. Returns @{ Dispositions; Retrievers;
        RetrieverRequests; AdStandard; ProgramDates; Hashes }, one Dispositions record per account,
        with its OutboundOnlyReason, RequestId (SailPoint) and ChangeRecord (ServiceNow). A missing
        input or column throws, and so does a program-dates.json that isn't the one Chapter 03's run
        read: there is no default end state.
    .EXAMPLE
        # Load the inputs for the Chapter 06 fixtures, after Chapter 03's fixture run.
        $matrix = Import-NpiKrbMatrixRun -RunPath out/matrix -RegisterSha256 $register.Sha256
        $inputs = Import-NpiKrbInput -InputPath tests/fixtures/ch06/inputs -MatrixRun $matrix -ProgramDatesPath tests/fixtures/ch03/inputs/program-dates.json
        $inputs.ProgramDates.d11.decision
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$InputPath, [Parameter(Mandatory)]$MatrixRun, [Parameter(Mandatory)][string]$ProgramDatesPath)
    $files = [ordered]@{
        replatform   = Join-Path $InputPath 'kerberos-replatform.csv'
        retrievers   = Join-Path $InputPath 'password-retrievers.json'
        adStandard   = Join-Path $InputPath 'ad-standard.json'
        programDates = $ProgramDatesPath
    }
    foreach ($k in $files.Keys) { if (-not (Test-Path -LiteralPath $files[$k])) { throw "Missing reviewed input $($files[$k])." } }
    $datesHash = Get-NpiFileHash -Path $files.programDates
    $recorded = if ($MatrixRun.Manifest.inputs) { $MatrixRun.Manifest.inputs['program-dates.json'] } else { $null }
    if (-not $recorded) { throw "Chapter 03's run read no program-dates.json; run it with the program's dates first." }
    if ($datesHash -ne $recorded) { throw "program-dates.json has SHA-256 $datesHash, not the $recorded Chapter 03's run read: both chapters read one program-dates file. Re-run Chapter 03 with it." }
    $dates = Get-Content -LiteralPath $files.programDates -Raw | ConvertFrom-Json -AsHashtable
    if (-not $dates.d11 -or $dates.d11.decision -notin 'AdRetired', 'KerberosIsland') { throw "program-dates.json: d11.decision must be AdRetired or KerberosIsland, not '$(if ($dates.d11) { $dates.d11.decision })'." }
    if ($dates.d11.decision -eq 'KerberosIsland' -and -not $dates.d11.islandEndOfLife) { throw 'program-dates.json: a Kerberos island needs d11.islandEndOfLife.' }
    if (-not $dates.g5AdRetired) { throw 'program-dates.json: g5AdRetired is required.' }
    $retFile = Get-Content -LiteralPath $files.retrievers -Raw | ConvertFrom-Json -AsHashtable
    $ret = $retFile.accounts
    $retRequests = if ($retFile.ContainsKey('requests') -and $retFile.requests) { $retFile.requests } else { @{} }
    $std = Get-Content -LiteralPath $files.adStandard -Raw | ConvertFrom-Json -AsHashtable
    foreach ($k in 'serviceAccountOu', 'holdingOu') { if ("$($std[$k])" -notmatch '^OU=.+,DC=') { throw "ad-standard.json: $k must be an OU's distinguished name, not '$($std[$k])'." } }
    if ($std.serviceAccountOu -eq $std.holdingOu) { throw 'ad-standard.json: the holding OU must not be the service-account OU.' }
    if (-not "$($std.creatorGroup)") { throw 'ad-standard.json: creatorGroup is required (the group delegated the right to create gMSAs, WD-154).' }
    if (-not "$($std.retrieverGroupPattern)") { throw 'ad-standard.json: retrieverGroupPattern is required (WD-160).' }
    try { $null = [regex]::new("$($std.retrieverGroupPattern)") } catch { throw "ad-standard.json: retrieverGroupPattern isn't a valid regular expression." }
    if (($std.passwordIntervalDays -isnot [long] -and $std.passwordIntervalDays -isnot [int]) -or [int]$std.passwordIntervalDays -lt 1) { throw 'ad-standard.json: passwordIntervalDays must be a whole number of days, 1 or more.' }
    $adStandard = [pscustomobject][ordered]@{ ServiceAccountOu = "$($std.serviceAccountOu)"; HoldingOu = "$($std.holdingOu)"; CreatorGroup = "$($std.creatorGroup)"; RetrieverGroupPattern = "$($std.retrieverGroupPattern)"; PasswordIntervalDays = [int]$std.passwordIntervalDays }
    $hashes = [ordered]@{ 'decisions.json' = $MatrixRun.Sha256 }
    foreach ($k in $files.Keys) { $hashes[(Split-Path $files[$k] -Leaf)] = Get-NpiFileHash -Path $files[$k] }

    # One record per AD account: Chapter 03's decision and, for a re-platformed account, this chapter's work on it.
    $csv = @(Import-Csv -LiteralPath $files.replatform)
    $header = @((Get-Content -LiteralPath $files.replatform -TotalCount 1) -split ',' | ForEach-Object { $_.Trim('"') })
    $missing = @('OutboundOnlyReason', 'RequestId', 'ChangeRecord', 'Tags' | Where-Object { $_ -notin $header })
    if ($missing.Count) { throw "kerberos-replatform.csv has no $($missing -join ', ') column: each write carries its SailPoint request (RequestId) and ServiceNow change (ChangeRecord), and a create its tags (Tags, WD-175)." }
    $work = @{}; foreach ($w in $csv) { if ($w.SamAccountName) { $work[$w.SamAccountName] = $w } }
    $records = [Collections.Generic.List[object]]::new(); $seen = @{}
    foreach ($d in @($MatrixRun.Decisions | Where-Object { $_.Type -in 'Traditional', 'MSA', 'gMSA', 'dMSA' })) {
        $w = if ($work.ContainsKey($d.Name)) { $work[$d.Name] } else { $null }
        $replatform = "$($d.Disposition)" -eq 'Replatform'
        $records.Add([pscustomobject][ordered]@{
                SamAccountName = "$($d.Name)"; IdentityId = "$($d.IdentityId)"; Disposition = "$($d.Disposition)"; Target = "$($d.Target)"
                DecidedBy = "$($d.DecidedBy)"; DecidedOn = $(if ($d.PSObject.Properties['DecidedOn']) { "$($d.DecidedOn)" } else { '' })
                AoAcceptedBy = $(if ($d.PSObject.Properties['AoAcceptedBy']) { "$($d.AoAcceptedBy)" } else { '' })
                # A kept account: Chapter 03's end date and SPN owner. A re-platformed one: this chapter's, for the account it moves to.
                SpnOwnerUpn = $(if ($replatform) { if ($w) { "$($w.SpnOwnerUpn)" } else { '' } } else { "$($d.SpnOwner)" })
                EndDate = $(if ($replatform) { if ($w) { "$($w.EndDate)" } else { '' } } else { "$($d.EndDate)" })
                NewAccount = $(if ($w) { "$($w.NewAccount)" } else { '' }); Workload = $(if ($w) { "$($w.Workload)" } else { '' }); Hosts = $(if ($w) { "$($w.Hosts)" } else { '' })
                Reference = $(if ($w) { "$($w.Reference)" } else { '' }); HostChangedOn = $(if ($w) { "$($w.HostChangedOn)" } else { '' }); MigrationStartedOn = $(if ($w) { "$($w.MigrationStartedOn)" } else { '' })
                OutboundOnlyReason = $(if ($w) { "$($w.OutboundOnlyReason)" } else { '' }); RequestId = $(if ($w) { "$($w.RequestId)" } else { '' }); ChangeRecord = $(if ($w) { "$($w.ChangeRecord)" } else { '' }); Tags = $(if ($w) { "$($w.Tags)" } else { '' })
            })
        $seen[$d.Name] = $true
    }
    foreach ($name in ($work.Keys | Sort-Object)) {
        if ($seen.ContainsKey($name)) { continue }
        $w = $work[$name]   # a row for an account Chapter 03 has no decision for: it has no disposition
        $records.Add([pscustomobject][ordered]@{ SamAccountName = $name; IdentityId = ''; Disposition = ''; Target = ''; DecidedBy = ''; DecidedOn = ''; AoAcceptedBy = ''
                SpnOwnerUpn = "$($w.SpnOwnerUpn)"; EndDate = "$($w.EndDate)"; NewAccount = "$($w.NewAccount)"; Workload = "$($w.Workload)"; Hosts = "$($w.Hosts)"
                Reference = "$($w.Reference)"; HostChangedOn = "$($w.HostChangedOn)"; MigrationStartedOn = "$($w.MigrationStartedOn)"
                OutboundOnlyReason = "$($w.OutboundOnlyReason)"; RequestId = "$($w.RequestId)"; ChangeRecord = "$($w.ChangeRecord)"; Tags = "$($w.Tags)" })
    }
    [pscustomobject]@{ Dispositions = $records.ToArray(); Retrievers = $ret; RetrieverRequests = $retRequests; AdStandard = $adStandard; ProgramDates = $dates; Hashes = $hashes }
}

# ----------------------------------------------------------------------------- reading the domain

function Get-NpiKrbForestConfigDn {
    param([Parameter(Mandatory)][string]$Domain)
    'CN=Configuration,' + (($Domain.Split('.') | ForEach-Object { "DC=$_" }) -join ',')
}

function Get-NpiKdsRootKeyState {
    <#
    .SYNOPSIS
        The KDS root key prerequisite, read-only: whether a root key exists and when it became
        usable (msKds-UseStartTime), never the key data. Ready once the earliest key has been usable
        for 10 hours (Learn: domain controllers wait up to 10 hours for replication).
    .EXAMPLE
        # Check the KDS root key in the fake AD.
        $fake = New-NpiKrbFixtureAdInvoker -EstatePath tests/fixtures/estate.json -KerberosPath tests/fixtures/ch06/ad-kerberos.json
        $reader = New-NpiKrbReader -AdInvoke $fake.Invoke
        Get-NpiKdsRootKeyState -Client $reader -Domain corp.contoso.example -AsOf '2026-10-30T12:00:00Z'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$Domain, [Parameter(Mandatory)][datetime]$AsOf, [string]$CallId = 'krb-kds-root-keys')
    $base = "CN=Master Root Keys,CN=Group Key Distribution Service,CN=Services,$(Get-NpiKrbForestConfigDn -Domain $Domain)"
    $keys = @(Invoke-NpiKrbAdRead -Client $Client -CallId $CallId -Params @{ SearchBase = $base; LDAPFilter = '(objectClass=msKds-ProvRootKey)'; Properties = @('msKds-UseStartTime', 'msKds-CreateTime') })
    $starts = @($keys | ForEach-Object { [DateTime]::FromFileTimeUtc([int64]$_.'msKds-UseStartTime') } | Sort-Object)
    $usable = @($starts | Where-Object { $_ -le $AsOf.AddHours(-$script:KdsReplicationHours) })
    $state = if (-not $starts.Count) { 'Missing' } elseif ($usable.Count) { 'Ready' } else { 'Replicating' }
    [pscustomobject]@{ State = $state; Keys = $starts.Count; EarliestUsable = if ($starts.Count) { $starts[0].ToString('o') } else { '' }; SearchBase = $base }
}

function Get-NpiKrbScope {
    <#
    .SYNOPSIS
        Returns the register rows this chapter covers: AD rows that are enabled traditional accounts
        with at least one SPN, and every MSA, gMSA and dMSA.
    .EXAMPLE
        # The Kerberos accounts in Chapter 01's register.
        $register = Import-NpiKrbRegister -RunPath out/inventory
        Get-NpiKrbScope -Rows $register.Rows | Select-Object Name, Type
    .DESCRIPTION
    #>
    <# The register's Kerberos accounts: enabled traditional accounts with an SPN, MSAs, gMSAs and dMSAs. #>
    param([object[]]$Rows)
    @($Rows | Where-Object { $_.Source -eq 'AD' -and (($_.Type -eq 'Traditional' -and $_.Enabled -eq $true -and [int]$_.SpnCount -gt 0) -or $_.Type -in 'MSA', 'gMSA', 'dMSA') })
}

function Read-NpiKrbDomain {
    <#
    .SYNOPSIS
        Everything the plan reads from the domain, through the reader: the KDS root key state, the
        managed service accounts with their retrievers and dMSA migration state, the accounts to be
        superseded, the domain controllers and the hosts named for a dMSA.
    .EXAMPLE
        # Read the fake domain for the fixture register and dispositions.
        $fake = New-NpiKrbFixtureAdInvoker -EstatePath tests/fixtures/estate.json -KerberosPath tests/fixtures/ch06/ad-kerberos.json
        $reader = New-NpiKrbReader -AdInvoke $fake.Invoke
        $inputs = Import-NpiKrbInput -InputPath tests/fixtures/ch06/inputs -MatrixRun (Import-NpiKrbMatrixRun -RunPath out/matrix -RegisterSha256 $register.Sha256) -ProgramDatesPath tests/fixtures/ch03/inputs/program-dates.json
        $state = Read-NpiKrbDomain -Reader $reader -Rows $register.Rows -Dispositions $inputs.Dispositions -Domain corp.contoso.example -AsOf '2026-10-30T12:00:00Z'
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Reader, [Parameter(Mandatory)][object[]]$Rows, [Parameter(Mandatory)][object[]]$Dispositions, [Parameter(Mandatory)][string]$Domain, [Parameter(Mandatory)][datetime]$AsOf)
    $kds = Get-NpiKdsRootKeyState -Client $Reader -Domain $Domain -AsOf $AsOf
    $msas = @{}
    foreach ($m in @(Invoke-NpiKrbAdRead -Client $Reader -CallId 'krb-service-accounts' -Params @{ Filter = '*'; Properties = @('PrincipalsAllowedToRetrieveManagedPassword', 'msDS-DelegatedMSAState', 'msDS-ManagedAccountPrecededByLink') })) { $msas[$m.SamAccountName] = $m }
    $scope = Get-NpiKrbScope -Rows $Rows
    $users = @{}
    $dmsaRows = @($Dispositions | Where-Object { (Get-NpiKrbPath $_) -eq 'Convert' -and $_.Target -eq 'dMSA' })
    foreach ($d in $dmsaRows) {
        $row = @($scope | Where-Object { $_.Name -eq $d.SamAccountName -and $_.Type -eq 'Traditional' })
        if ($row.Count -eq 1) { $users[$d.SamAccountName] = @(Invoke-NpiKrbAdRead -Client $Reader -CallId 'krb-superseded-user' -Params @{ Identity = $row[0].ObjectId; Properties = @('Enabled') })[0] }
    }
    # An account moving to a gMSA, once its host changed: whether it's still enabled and where it is (the disable and the move to the holding OU).
    foreach ($d in @($Dispositions | Where-Object { (Get-NpiKrbPath $_) -eq 'Convert' -and $_.Target -eq 'gMSA' -and $_.HostChangedOn })) {
        $row = @($scope | Where-Object { $_.Name -eq $d.SamAccountName -and $_.Type -in 'Traditional', 'MSA' })
        if ($row.Count -ne 1) { continue }
        $id = if ($row[0].Type -eq 'Traditional') { 'krb-superseded-user' } else { 'krb-service-accounts' }
        $users[$d.SamAccountName] = @(Invoke-NpiKrbAdRead -Client $Reader -CallId $id -Params @{ Identity = $row[0].ObjectId; Properties = @('Enabled') })[0]
    }
    $dcs = @(); $hosts = @{}
    if ($dmsaRows.Count) {
        $dcs = @(Invoke-NpiKrbAdRead -Client $Reader -CallId 'krb-domain-controllers' -Params @{ Filter = '*' })
        foreach ($h in @($dmsaRows | ForEach-Object { "$($_.Hosts)" -split ';' } | Where-Object { $_ } | Sort-Object -Unique)) {
            try { $hosts[$h] = @(Invoke-NpiKrbAdRead -Client $Reader -CallId 'krb-host-computers' -Params @{ Identity = $h; Properties = @('OperatingSystem') })[0] }
            catch { if ("$_" -match 'Cannot find an object') { $hosts[$h] = $null } else { throw } }
        }
    }
    [pscustomobject]@{ Kds = $kds; ManagedAccounts = $msas; Users = $users; DomainControllers = $dcs; Hosts = $hosts }
}

# ----------------------------------------------------------------------------- the check, the plan and the island list

function Test-NpiWs2025 { param([string]$OperatingSystem) [bool]("$OperatingSystem" -match 'Windows Server 2025') }

function Get-NpiKrbRetrieverList {
    param($Account)
    if ($null -eq $Account -or -not $Account.PSObject.Properties['PrincipalsAllowedToRetrieveManagedPassword']) { return @() }
    @(@($Account.PrincipalsAllowedToRetrieveManagedPassword) | Where-Object { $_ } | ForEach-Object { "$_" } | Sort-Object)
}

function Get-NpiKrbDelegatedState {
    param($Account)
    if ($null -eq $Account -or -not $Account.PSObject.Properties['msDS-DelegatedMSAState'] -or $null -eq $Account.'msDS-DelegatedMSAState') { return 0 }
    [int]$Account.'msDS-DelegatedMSAState'
}

function Get-NpiKrbParentDn {
    # The container an object's distinguished name puts it in: everything after its first unescaped comma.
    param([string]$DistinguishedName)
    if ("$DistinguishedName" -match '^(?:[^,\\]|\\.)+,(.+)$') { $Matches[1] } else { '' }
}

function Test-NpiKrbNameStandard {
    # WD-159: a gMSA is gmsa-<app> and a dMSA dmsa-<app> (lowercase letters, digits, hyphens), 15 characters or fewer before the $.
    # Returns the reason a planned name breaks the standard, or '' when it doesn't.
    param([string]$Name, [string]$Target)
    $prefix = if ($Target -eq 'dMSA') { 'dmsa' } else { 'gmsa' }
    if ($Name -cnotmatch "^$prefix-[a-z0-9-]+\`$$") { return "NewAccount '$Name' doesn't follow the name standard (WD-159): a $Target is $prefix-<app>, in lowercase letters, digits and hyphens, ending in `$" }
    if ($Name.Length - 1 -gt 15) { return "NewAccount '$Name' must be 15 characters or fewer before the `$" }
    ''
}

function Test-NpiKrbTags {
    <#
    .SYNOPSIS
        Checks the AD description a new gMSA or dMSA is created with (WD-175): every tag key, as
        key=value pairs separated by '; ', naming the same SailPoint request and ServiceNow change as
        the write. Returns the problem, or an empty string when the tags pass.
    .EXAMPLE
        Test-NpiKrbTags -Tags 'SystemId=SYS-0412; Owner1=a@contoso.example; Owner2=b@contoso.example; Sponsor=c@contoso.example; Environment=prod; Tier=R2; EntraTarget=Undecided; Request=REQ-1; Change=CHG0000001' -RequestId REQ-1 -ChangeRecord CHG0000001
    #>
    param([AllowEmptyString()][string]$Tags, [AllowEmptyString()][string]$RequestId, [AllowEmptyString()][string]$ChangeRecord)
    if (-not $Tags) { return 'no tags: Chapter 12 writes them from the approved request (WD-175)' }
    $t = @{}
    foreach ($pair in ($Tags -split ';')) { if ($pair -match '^\s*([A-Za-z0-9]+)=(.*?)\s*$') { $t[$Matches[1]] = $Matches[2] } }
    $missing = @($script:TagKeys | Where-Object { -not "$($t[$_])" })
    if ($missing.Count) { return "tags missing $($missing -join ', ') (WD-175)" }
    if ($RequestId -and $t['Request'] -ne $RequestId) { return "tags name request $($t['Request']), not $RequestId" }
    if ($ChangeRecord -and $t['Change'] -ne $ChangeRecord) { return "tags name change $($t['Change']), not $ChangeRecord" }
    ''
}

function Test-NpiKrbRetrieverShape {
    # WD-160: a gMSA's reviewed retrievers are exactly one domain local group of its hosts (the ad-standard.json pattern), never a computer.
    # Returns the reason a reviewed list breaks the rule, or '' when it doesn't.
    param([object[]]$Retrievers, [string]$Pattern)
    $list = @($Retrievers | Where-Object { $_ })
    if ($list.Count -ne 1) { return "$($list.Count) reviewed retrievers: a gMSA's retriever is exactly one domain local group of its hosts, DL-gMSA-<app>-Hosts (WD-160)" }
    if ("$($list[0])" -notmatch $Pattern) { return "'$($list[0])' isn't a DL-gMSA-<app>-Hosts group: a gMSA's retriever is a domain local group of its hosts, never a computer account (WD-160)" }
    ''
}

function Test-NpiKerberosIsland {
    <#
    .SYNOPSIS
        Check the Kerberos accounts against the reviewed dispositions and build the plan, the island
        list for the program's SPN retirement (P4.6) and the reconciliation of every gMSA and dMSA
        with the provisional end state (D11). Returns @{ Findings; Plan; IslandList; Reconciliation }.
        Findings NPI-KRB-01 to NPI-KRB-10, each with a stable ID (rule:account). Nothing here writes.
        Every write in the plan names its call's runBy (pipeline or person), the SailPoint request
        (RequestId) that approved it, the ServiceNow change (ChangeRecord) that records it, and the controls and KSIs
        its call declares; a write with no request or no change record is Blocked (NPI-KRB-10).
    .EXAMPLE
        # Check the accounts and build the plan from what Read-NpiKrbDomain returned.
        $r = Test-NpiKerberosIsland -Rows $register.Rows -Domain $state -Inputs $inputs -AsOf '2026-10-30T12:00:00Z' -DomainName corp.contoso.example -Cloud gcc -TenantId $register.Manifest.tenantId -RegisterSha256 $register.Sha256
        $r.Plan.actions | Format-Table Account, Action, Write
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][object[]]$Rows,
        [Parameter(Mandatory)]$Domain,
        [Parameter(Mandatory)]$Inputs,
        [Parameter(Mandatory)][datetime]$AsOf,
        [Parameter(Mandatory)][string]$DomainName,
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId,
        [string]$RegisterSha256
    )
    $f = [Collections.Generic.List[object]]::new()
    $actions = [Collections.Generic.List[object]]::new()
    $island = [Collections.Generic.List[object]]::new()
    $recon = [Collections.Generic.List[object]]::new()
    $scope = Get-NpiKrbScope -Rows $Rows
    $byName = @{}; foreach ($r in $scope) { $byName[$r.Name] = $r }
    $disp = @{}; foreach ($d in $Inputs.Dispositions) { $disp[$d.SamAccountName] = $d }
    $coveredBy = @{}; foreach ($d in $Inputs.Dispositions) { if ((Get-NpiKrbPath $d) -eq 'Convert' -and $d.NewAccount) { $coveredBy[$d.NewAccount] = $d } }
    $end = $Inputs.ProgramDates
    $d08 = ConvertTo-NpiKrbDate "$($end.d08LegacyAuthEndDate)"
    $g5 = ConvertTo-NpiKrbDate "$($end.g5AdRetired)"
    $islandEol = ConvertTo-NpiKrbDate "$($end.d11.islandEndOfLife)"
    # WD-165's ceiling for every account that stays: the island's end of life where D11 keeps one, else G5.
    $onIsland = $end.d11.decision -eq 'KerberosIsland' -and $islandEol
    $ceiling = if ($onIsland) { $islandEol } else { $g5 }
    $ceilingBound = if ($onIsland) { 'IslandEOL' } else { 'G5' }
    $ceilingName = if ($onIsland) { 'the island''s end of life' } else { 'G5''s (AD retired)' }
    $kdsReady = $Domain.Kds.State -eq 'Ready'
    $ws2025Dc = @($Domain.DomainControllers | Where-Object { Test-NpiWs2025 $_.OperatingSystem }).Count -gt 0
    $std = $Inputs.AdStandard
    $writeCalls = @{}; foreach ($c in (Get-NpiKrbCall -Task 'kerberos-apply')) { if ($c.method -eq 'WRITE') { $writeCalls[$c.id] = $c } }
    $add = {
        param([hashtable]$a)
        $base = [ordered]@{ ActionId = ''; Account = ''; Type = ''; Action = ''; Write = $false; Call = ''; Cmdlet = ''; RunBy = ''; Params = $null; Before = $null; Precheck = ''; RequestId = ''; ChangeRecord = ''; Controls = @(); Ksis = @(); Reason = '' }
        foreach ($k in $a.Keys) { $base[$k] = $a[$k] }
        if (-not $base.ActionId) { $base.ActionId = "$($base.Action):$($base.Account)" }
        $actions.Add([pscustomobject]$base)
    }
    # Writes for one account, approved together: each carries its call's runBy, controls and KSIs and the request and change
    # record that approved it. With no SailPoint request or no ServiceNow change record, none is planned (NPI-KRB-10).
    $addWrites = {
        param([object[]]$Writes, [string]$RequestId, [string]$ChangeRecord)
        $why = @(if (-not $RequestId) { 'no approved request (RequestId is empty)' }; if (-not $ChangeRecord) { 'no change record (ChangeRecord is empty)' })
        $first = $Writes[0]
        if ($why.Count) {
            $names = ($Writes | ForEach-Object { $_.Action }) -join ' and '
            $f.Add((New-NpiFinding 'NPI-KRB-10' 'Finding' $first.Account "$($first.Account) ($($first.Type))" "$names not planned: $($why -join '; '). Every write needs its SailPoint request and its ServiceNow change"))
            & $add @{ Account = $first.Account; Type = $first.Type; Action = 'Blocked'; Reason = "$names`: $($why -join '; ')" }
            return
        }
        foreach ($w in $Writes) {
            $c = $writeCalls[$w.Call]
            & $add ($w + @{ Write = $true; RunBy = "$($c.runBy)"; RequestId = $RequestId; ChangeRecord = $ChangeRecord; Controls = @($c.controls); Ksis = @($c.ksis) })
        }
    }
    $label = { param($r) "$($r.Name) ($($r.Type))" }

    if ($Domain.Kds.State -eq 'Missing') { $f.Add((New-NpiFinding 'NPI-KRB-01' 'Finding' 'forest' 'KDS root key' 'No KDS root key in the forest: no gMSA or dMSA can be created. Creating one is a one-time, reviewed change by a Domain Admin (Learn), not this code''s')) }
    elseif ($Domain.Kds.State -eq 'Replicating') { $f.Add((New-NpiFinding 'NPI-KRB-01' 'Warn' 'forest' 'KDS root key' "The root key became usable at $($Domain.Kds.EarliestUsable), less than $($script:KdsReplicationHours) hours ago; creations wait for replication (Learn)")) }

    # A stay-on-Kerberos entry (NP3.6), by Chapter 03's rules and WD-165: every account that stays (KeepKerberos,
    # a kept or planned gMSA or dMSA) has an end date no later than G5, or the island's end of life where D11
    # keeps a Kerberos island. D08 is only when the program records that date; it bounds no end date. And an
    # SPN owner for a KeepKerberos account or any account with SPNs. A kept account with no SPNs needs none.
    $stay = {
        param([string]$Name, [string]$Type, [string]$Source, [string]$Spns, $d, [string]$Status)
        $owner = "$($d.SpnOwnerUpn)"; $endDate = ConvertTo-NpiKrbDate "$($d.EndDate)"; $ao = "$($d.AoAcceptedBy)"
        $key = $Source
        $keptOnKerberos = "$($d.Disposition)" -eq 'KeepKerberos'
        $needsOwner = $keptOnKerberos -or [bool]$Spns
        $bound = $ceilingBound; $limit = $ceiling; $limitName = $ceilingName
        if ($needsOwner -and -not $owner) { $f.Add((New-NpiFinding 'NPI-KRB-05' 'Finding' $key "$Name ($Type)" 'Stays on Kerberos with no SPN owner: name the person who answers for its SPNs (Chapter 03''s dispositions.csv for a kept account, kerberos-replatform.csv for a converted one)')) }
        $within = $false
        if (-not $endDate) { $f.Add((New-NpiFinding 'NPI-KRB-06' 'Finding' $key "$Name ($Type)" "Stays on Kerberos with no end date$(if ($d08) { "; the program records it by D08, $($d08.ToString('yyyy-MM-dd'))$(if ($d08 -le $AsOf) { ', which has passed' })" })")) }
        elseif (-not $limit) { $f.Add((New-NpiFinding 'NPI-KRB-06' 'Warn' $key "$Name ($Type)" "The program's $bound date isn't set yet: the island list can't be handed to the SPN retirement (P4.6)")) }
        elseif ($endDate -gt $limit) { $f.Add((New-NpiFinding 'NPI-KRB-06' 'Finding' $key "$Name ($Type)" "End date $($endDate.ToString('yyyy-MM-dd')) is after $limitName $($limit.ToString('yyyy-MM-dd'))")) }
        else { $within = $true }
        # KeepKerberos is the islanding exception: Chapter 03's authorizing official's acceptance travels with it.
        $island.Add([pscustomobject][ordered]@{ Account = $Name; Type = $Type; Source = $Source; Spns = $Spns; Disposition = "$($d.Disposition)"; SpnOwnerUpn = $owner; EndDate = "$($d.EndDate)"; EndBound = $bound; WithinBound = $within; AoAcceptedBy = $ao; Status = $Status; ReadyForP46 = [bool](($owner -or -not $needsOwner) -and $within -and ($ao -or -not $keptOnKerberos)) })
    }

    foreach ($r in ($scope | Sort-Object Name)) {
        $lbl = & $label $r
        if ($r.Handoff -eq 'DataPlatform') {
            $f.Add((New-NpiFinding 'NPI-KRB-09' 'Info' $r.Name $lbl 'SQL Server account: the Data Platform plan converts and reconciles it'))
            & $add @{ Account = $r.Name; Type = $r.Type; Action = 'HandedOff'; Reason = 'SQL Server account: the Data Platform plan owns its disposition and its end date' }
            continue
        }
        if ($r.Type -in 'MSA', 'gMSA', 'dMSA' -and "$($r.PrivilegedGroups)") { $f.Add((New-NpiFinding 'NPI-KRB-08' 'Warn' $r.Name $lbl "Member of $($r.PrivilegedGroups): remove it and grant only the rights its service needs (Learn)")) }

        $d = if ($disp.ContainsKey($r.Name)) { $disp[$r.Name] } else { $null }
        if ($coveredBy.ContainsKey($r.Name)) { continue }   # the dMSA or gMSA a conversion names: planned under the account it replaces
        $path = Get-NpiKrbPath $d
        if (-not $d -or -not $path) {
            $why = if (-not $d -or -not "$($d.Disposition)") { 'No disposition in Chapter 03''s decisions (D-NP3)' } elseif ($d.Disposition -notin $script:Dispositions) { "Unknown disposition '$($d.Disposition)'" } else { "Unknown $($d.Disposition) target '$($d.Target)'" }
            $f.Add((New-NpiFinding 'NPI-KRB-02' 'Finding' $r.Name $lbl "$why`: every Kerberos account is re-platformed (to a gMSA, a dMSA or a workload identity), kept on the island with an end date, or retired"))
            & $add @{ Account = $r.Name; Type = $r.Type; Action = 'AwaitDisposition'; Reason = $why }
            continue
        }
        if ($d.Workload -and $d.Workload -notin $script:Workloads) { $f.Add((New-NpiFinding 'NPI-KRB-02' 'Finding' $r.Name $lbl "Unknown workload '$($d.Workload)'; use Service, IisAppPool or ScheduledTask")) }

        switch ($path) {
            'Island' { & $stay $r.Name $r.Type $r.Name "$($r.Spns)" $d 'Island'; & $add @{ Account = $r.Name; Type = $r.Type; Action = 'Island'; Reason = "Stays on Kerberos until $($d.EndDate), SPN owner $(if ($d.SpnOwnerUpn) { $d.SpnOwnerUpn } else { 'none' })" } }
            'WorkloadIdentity' {
                if (-not $d.Reference) { $f.Add((New-NpiFinding 'NPI-KRB-02' 'Finding' $r.Name $lbl "Replatform to $($d.Target) needs a Reference in kerberos-replatform.csv to the workload identity that replaces it (Chapter 05)")) }
                & $add @{ Account = $r.Name; Type = $r.Type; Action = 'MovesToWorkloadIdentity'; Reason = "To $(if ($d.Reference) { $d.Reference } else { $d.Target }) by $($d.EndDate), with Chapter 05's token exchange test and 30-day parallel run" }
            }
            'Retire' { & $add @{ Account = $r.Name; Type = $r.Type; Action = 'RetireThroughDecommission'; Reason = 'Retire through the reviewed decommission process. This code disables at most; it never deletes' } }
            'Convert' {
                $new = "$($d.NewAccount)"; $blocked = [Collections.Generic.List[string]]::new()
                if ($r.Type -in $script:ManagedTypes) { $blocked.Add("it's already a $($r.Type); keep it on the island, or move it to a workload identity") }
                if (-not $new) { $blocked.Add("no row in kerberos-replatform.csv naming the new $($d.Target), its workload and its hosts") }
                else { $bad = Test-NpiKrbNameStandard -Name $new -Target $d.Target; if ($bad) { $blocked.Add($bad) } }
                if ($new -and @($Inputs.Dispositions | Where-Object { $_.NewAccount -eq $new }).Count -gt 1) { $blocked.Add("$new is named by more than one account; each service account needs its own (Learn: one dMSA per service account)") }
                if ($d.Target -eq 'dMSA') {
                    if ($r.Type -eq 'MSA') { $blocked.Add('an MSA or gMSA can''t be migrated to a dMSA (Learn): upgrade it to a gMSA') }
                    if ($r.Delegation -eq 'Unconstrained') { $blocked.Add('unconstrained delegation stops working once the dMSA migration completes (Learn): use a gMSA, or keep it on the island') }
                    if (-not $ws2025Dc) { $blocked.Add('no Windows Server 2025 domain controller: a dMSA needs at least one (Learn)') }
                    foreach ($h in @("$($d.Hosts)" -split ';' | Where-Object { $_ })) {
                        $c = if ($Domain.Hosts.ContainsKey($h)) { $Domain.Hosts[$h] } else { $null }
                        if (-not $c) { $blocked.Add("host $h not found in the domain") }
                        elseif (-not (Test-NpiWs2025 $c.OperatingSystem)) { $blocked.Add("host $h runs $($c.OperatingSystem); every machine using the account must support dMSA (Learn)") }
                    }
                    if (-not "$($d.Hosts)") { $blocked.Add('no hosts named: the plan can''t check that every host supports dMSA') }
                }
                $want = @(if ($Inputs.Retrievers -and $Inputs.Retrievers.ContainsKey($new)) { $Inputs.Retrievers[$new] | Sort-Object })
                if ($d.Target -eq 'gMSA' -and -not $want.Count) { $blocked.Add("no reviewed PrincipalsAllowedToRetrieveManagedPassword for $new in password-retrievers.json") }
                # WD-160: a planned gMSA's retriever is one domain local group of its hosts, never a computer.
                $badRetrievers = if ($d.Target -eq 'gMSA' -and $want.Count) { Test-NpiKrbRetrieverShape -Retrievers $want -Pattern $std.RetrieverGroupPattern } else { '' }
                if ($blocked.Count -or $badRetrievers) {
                    if ($blocked.Count) { $f.Add((New-NpiFinding 'NPI-KRB-04' 'Finding' $r.Name $lbl "$($d.Target) can't be used: $($blocked -join '; ')")) }
                    if ($badRetrievers) { $f.Add((New-NpiFinding 'NPI-KRB-03' 'Finding' $r.Name $lbl "$new isn't planned: $badRetrievers")) }
                    & $add @{ Account = $r.Name; Type = $r.Type; Action = 'Blocked'; Reason = (@($blocked) + @(if ($badRetrievers) { $badRetrievers }) -join '; ') }
                    & $stay $r.Name $r.Type $r.Name "$($r.Spns)" $d 'Blocked: still on its own account'
                    continue
                }
                & $stay $new $d.Target $r.Name "$($r.Spns)" $d "Planned: $($r.Name) moves to it"
                $newAcct = if ($Domain.ManagedAccounts.ContainsKey($new)) { $Domain.ManagedAccounts[$new] } else { $null }
                $name = $new.TrimEnd('$')
                $common = @{ Account = $r.Name; Type = $r.Type }
                $req = "$($d.RequestId)"; $chg = "$($d.ChangeRecord)"
                if (-not $newAcct) {
                    if (-not $kdsReady) { & $add ($common + @{ Action = 'Blocked'; Reason = "KDS root key $($Domain.Kds.State): no $($d.Target) can be created yet" }); continue }
                    $badTags = Test-NpiKrbTags -Tags "$($d.Tags)" -RequestId $req -ChangeRecord $chg
                    if ($badTags) {
                        $f.Add((New-NpiFinding 'NPI-KRB-10' 'Finding' $r.Name $lbl "$(if ($d.Target -eq 'gMSA') { 'CreateGmsa' } else { 'CreateDmsa' }) not planned: $badTags"))
                        & $add ($common + @{ Action = 'Blocked'; Reason = $badTags }); continue
                    }
                    if ($d.Target -eq 'gMSA') {
                        # WD-154: outbound-only when the account it replaces holds no SPN, unless the owner recorded why it needs inbound authentication.
                        $params = [ordered]@{ Name = $name; DNSHostName = "$name.$DomainName"; Path = $std.ServiceAccountOu; PrincipalsAllowedToRetrieveManagedPassword = $want; KerberosEncryptionType = 'AES256'; ManagedPasswordIntervalInDays = $std.PasswordIntervalDays; Description = "$($d.Tags)" }
                        $why = "Learn's procedure: create the gMSA for $($d.Workload) in $($std.ServiceAccountOu), then install it on $($d.Hosts) and change the identity there"
                        if ("$($r.Spns)") { $why += '. Not outbound-only: it takes over SPNs' }
                        elseif ("$($d.OutboundOnlyReason)") { $why += ". Not outbound-only: $($d.OutboundOnlyReason)" }
                        else { $params['RestrictToOutboundAuthenticationOnly'] = $true; $why += ". Outbound-only: $($r.Name) holds no SPN (WD-154)" }
                        & $addWrites @(($common + @{ Action = 'CreateGmsa'; Call = 'krb-new-gmsa'; Cmdlet = 'New-ADServiceAccount'; Params = $params
                                    Precheck = "krb-kds-root-keys: Ready; krb-service-accounts: $new doesn't exist"; Reason = $why })) $req $chg
                    } else {
                        & $addWrites @(($common + @{ Action = 'CreateDmsa'; Call = 'krb-new-dmsa'; Cmdlet = 'New-ADServiceAccount'
                                    Params = [ordered]@{ Name = $name; DNSHostName = "$name.$DomainName"; Path = $std.ServiceAccountOu; CreateDelegatedServiceAccount = $true; KerberosEncryptionType = 'AES256'; Description = "$($d.Tags)" }
                                    Precheck = "krb-kds-root-keys: Ready; krb-service-accounts: $new doesn't exist"; Reason = "Learn's procedure, step 1: create the dMSA in $($std.ServiceAccountOu); the migration starts in the next reviewed plan" })) $req $chg
                    }
                    continue
                }
                if ($d.Target -eq 'dMSA') {
                    $state = Get-NpiKrbDelegatedState $newAcct
                    $user = if ($Domain.Users.ContainsKey($r.Name)) { $Domain.Users[$r.Name] } else { $null }
                    $dn = if ($user) { "$($user.DistinguishedName)" } else { '' }
                    $started = ConvertTo-NpiKrbDate "$($d.MigrationStartedOn)"
                    switch ($state) {
                        0 { & $addWrites @(($common + @{ Action = 'StartDmsaMigration'; Call = 'krb-start-migration'; Cmdlet = 'Start-ADServiceAccountMigration'; Params = [ordered]@{ Identity = $new; SupersededAccount = $dn }; Precheck = "krb-service-accounts: $new msDS-DelegatedMSAState still 0"; Reason = "Links $($r.Name) to $new; record MigrationStartedOn, then wait $($script:MigrationWaitDays) days before completing" })) $req $chg }
                        1 {
                            if (-not $started) { & $add ($common + @{ Action = 'AwaitMigrationWindow'; Reason = "$new is in migration but MigrationStartedOn isn't recorded: record it before the plan can complete the migration" }) }
                            elseif (($AsOf - $started).TotalDays -lt $script:MigrationWaitDays) { & $add ($common + @{ Action = 'AwaitMigrationWindow'; Reason = "Started $($d.MigrationStartedOn); complete on or after $($started.AddDays($script:MigrationWaitDays).ToString('yyyy-MM-dd')) (the program's 30 days, which covers Learn's four ticket lifetimes)" }) }
                            else { & $addWrites @(($common + @{ Action = 'CompleteDmsaMigration'; Call = 'krb-complete-migration'; Cmdlet = 'Complete-ADServiceAccountMigration'; Params = [ordered]@{ Identity = $new; SupersededAccount = $dn }; Precheck = "krb-service-accounts: $new msDS-DelegatedMSAState still 1"; Reason = "Started $($d.MigrationStartedOn), $([int]($AsOf - $started).TotalDays) days ago. Disables $($r.Name) and moves its SPNs to $new (Learn); $($r.Name) is kept, never deleted" })) $req $chg }
                        }
                        2 { & $add ($common + @{ Action = 'MigrationComplete'; Reason = "$($r.Name) is superseded and disabled; keep it: the service and the dMSA link to it (Learn)" }) }
                        default { & $add ($common + @{ Action = 'Blocked'; Reason = "$new has msDS-DelegatedMSAState $state, which this plan doesn't handle" }) }
                    }
                    continue
                }
                $changed = ConvertTo-NpiKrbDate "$($d.HostChangedOn)"
                $old = if ($Domain.Users.ContainsKey($r.Name)) { $Domain.Users[$r.Name] } else { $null }
                $enabled = if ($old) { [bool]$old.Enabled } else { $r.Enabled -eq $true }
                $oldDn = if ($old) { "$($old.DistinguishedName)" } else { '' }
                $inHolding = $oldDn -and (Get-NpiKrbParentDn $oldDn) -eq $std.HoldingOu
                $readId = if ($r.Type -eq 'Traditional') { 'krb-superseded-user' } else { 'krb-service-accounts' }
                $move = $common + @{ Action = 'MoveSuperseded'; Call = 'krb-move-superseded'; Cmdlet = 'Move-ADObject'; Params = [ordered]@{ Identity = "$($r.ObjectId)"; TargetPath = $std.HoldingOu }; Before = $oldDn
                    Precheck = "$readId`: $($r.Name) disabled and not yet in $($std.HoldingOu)"; Reason = "Disabled $($r.Name) moves to the holding OU (WD-168); it's deleted only through the decommission ticket, 90 days after the disable (WD-167)" }
                if (-not $changed) { & $add ($common + @{ Action = 'AwaitHostChange'; Reason = "On $($d.Hosts): Install-ADServiceAccount $new, change the $($d.Workload) identity to $new with a blank password, validate, then record HostChangedOn (Learn)" }) }
                elseif (($AsOf - $changed).TotalDays -lt $script:ParallelRunDays) { & $add ($common + @{ Action = 'AwaitParallelRun'; Reason = "Changed $($d.HostChangedOn); disable $($r.Name) on or after $($changed.AddDays($script:ParallelRunDays).ToString('yyyy-MM-dd')) if the run is clean" }) }
                elseif ($enabled) {
                    & $addWrites @(($common + @{ Action = 'DisableSuperseded'; Call = 'krb-disable-superseded'; Cmdlet = 'Disable-ADAccount'; Params = [ordered]@{ Identity = "$($r.ObjectId)" }; Precheck = "$readId`: $($r.Name) still enabled"; Reason = "$($script:ParallelRunDays) days on $new since $($d.HostChangedOn): disable $($r.Name), never delete it" }), $move) $req $chg
                }
                elseif (-not $inHolding) { & $addWrites @($move) $req $chg }
                else { & $add ($common + @{ Action = 'Superseded'; Reason = "$($r.Name) is disabled and in the holding OU; delete it through the decommission ticket, 90 days after the disable (WD-167)" }) }
            }
        }
    }

    # Retrievers as reviewed data, for every gMSA and dMSA that exists (a dMSA in migration learns its hosts: checked after completion).
    # A gMSA's reviewed retriever is one DL-gMSA-<app>-Hosts group (WD-160); a dMSA's are the hosts it learned, so the group rule doesn't apply to it.
    foreach ($name in ($Domain.ManagedAccounts.Keys | Sort-Object)) {
        $a = $Domain.ManagedAccounts[$name]
        if ($a.ObjectClass -notin 'msDS-GroupManagedServiceAccount', 'msDS-DelegatedManagedServiceAccount') { continue }
        $row = if ($byName.ContainsKey($name)) { $byName[$name] } else { $null }
        if ($row -and $row.Handoff -eq 'DataPlatform') { continue }
        if ($a.ObjectClass -eq 'msDS-DelegatedManagedServiceAccount' -and (Get-NpiKrbDelegatedState $a) -eq 1) { continue }
        $have = @(Get-NpiKrbRetrieverList $a)
        $kind = if ($a.ObjectClass -eq 'msDS-GroupManagedServiceAccount') { 'gMSA' } else { 'dMSA' }
        $lbl = "$name ($kind)"
        if (-not $Inputs.Retrievers -or -not $Inputs.Retrievers.ContainsKey($name)) { $f.Add((New-NpiFinding 'NPI-KRB-03' 'Finding' $name $lbl 'No reviewed PrincipalsAllowedToRetrieveManagedPassword in password-retrievers.json')); continue }
        $want = @($Inputs.Retrievers[$name] | Sort-Object)
        if (-not $want.Count) { $f.Add((New-NpiFinding 'NPI-KRB-03' 'Finding' $name $lbl 'The reviewed retriever list is empty: no host could run the service; refusing to plan it')); continue }
        if ($kind -eq 'gMSA') {
            $bad = Test-NpiKrbRetrieverShape -Retrievers $want -Pattern $std.RetrieverGroupPattern
            if ($bad) { $f.Add((New-NpiFinding 'NPI-KRB-03' 'Finding' $name $lbl "The reviewed list breaks the retriever rule, so nothing is planned: $bad")); continue }
        }
        if ((($have | ForEach-Object { $_.ToLowerInvariant() }) -join '|') -ne (($want | ForEach-Object { $_.ToLowerInvariant() }) -join '|')) {
            $f.Add((New-NpiFinding 'NPI-KRB-03' 'Finding' $name $lbl "Retrievers in AD ($($have -join '; ')) differ from the reviewed list ($($want -join '; '))"))
            $rq = if ($Inputs.RetrieverRequests -and $Inputs.RetrieverRequests.ContainsKey($name)) { $Inputs.RetrieverRequests[$name] } else { @{} }
            & $addWrites @(@{ ActionId = "SetRetrievers:$name"; Account = $name; Type = $kind; Action = 'SetRetrievers'; Call = 'krb-set-retrievers'; Cmdlet = 'Set-ADServiceAccount'
                    Params = [ordered]@{ Identity = $name; PrincipalsAllowedToRetrieveManagedPassword = $want }; Before = $have; Precheck = "krb-service-accounts: $name retrievers still as read"; Reason = 'Set to the reviewed list' }) "$($rq['requestId'])" "$($rq['changeRecord'])"
        }
    }

    # NP7.3: every gMSA and dMSA, existing or planned, against the provisional end state (D11).
    $managed = [Collections.Generic.List[object]]::new()
    foreach ($r in @($scope | Where-Object { $_.Type -in $script:ManagedTypes } | Sort-Object Name)) { $managed.Add([pscustomobject]@{ Name = $r.Name; Type = $r.Type; Planned = $false; Handoff = $r.Handoff }) }
    foreach ($d in @($Inputs.Dispositions | Where-Object { (Get-NpiKrbPath $_) -eq 'Convert' -and $_.NewAccount } | Sort-Object NewAccount)) {
        if ($byName.ContainsKey($d.NewAccount) -or -not $byName.ContainsKey($d.SamAccountName)) { continue }
        if (@($actions | Where-Object { $_.Account -eq $d.SamAccountName -and $_.Action -eq 'Blocked' }).Count) { continue }
        $managed.Add([pscustomobject]@{ Name = $d.NewAccount; Type = $d.Target; Planned = $true; Handoff = '' })
    }
    foreach ($m in $managed) {
        $lbl = "$($m.Name) ($($m.Type))"
        if ($m.Handoff -eq 'DataPlatform') { $recon.Add([pscustomobject][ordered]@{ Account = $m.Name; Type = $m.Type; Planned = $m.Planned; Destination = 'HandedOff'; EndDate = ''; Reference = ''; Outcome = 'HandedOff'; Reason = 'The Data Platform plan reconciles SQL Server''s accounts' }); continue }
        $d = if ($coveredBy.ContainsKey($m.Name)) { $coveredBy[$m.Name] } elseif ($disp.ContainsKey($m.Name)) { $disp[$m.Name] } else { $null }
        $dest = if (-not $d) { '' } elseif ((Get-NpiKrbPath $d) -eq 'Convert') { 'Island' } else { Get-NpiKrbPath $d }
        $endDate = if ($d) { ConvertTo-NpiKrbDate "$($d.EndDate)" } else { $null }
        $problem = $null
        if (-not $d -or $dest -notin 'Island', 'WorkloadIdentity', 'Retire') { $problem = 'no destination: it would lose its credential when the last domain controller is demoted' }
        elseif (-not $endDate) { $problem = "no end date for $dest" }
        elseif ($dest -in 'WorkloadIdentity', 'Retire' -and $endDate -gt $g5) { $problem = "$dest by $($d.EndDate), after G5 ($($end.g5AdRetired))" }
        elseif ($dest -eq 'WorkloadIdentity' -and -not $d.Reference) { $problem = 'no workload identity named' }
        elseif ($dest -eq 'Island' -and $end.d11.decision -eq 'AdRetired' -and $endDate -gt $g5) { $problem = "D11 retires AD at G5 ($($end.g5AdRetired)); this account stays on Kerberos until $($d.EndDate) and loses its credential at domain controller demotion" }
        elseif ($dest -eq 'Island' -and $end.d11.decision -eq 'KerberosIsland' -and $endDate -gt $islandEol) { $problem = "its end date $($d.EndDate) is after the island's end of life ($($end.d11.islandEndOfLife))" }
        if ($problem) { $f.Add((New-NpiFinding 'NPI-KRB-07' 'Finding' $m.Name $lbl "Not reconciled with the provisional end state (D11 $($end.d11.decision)): $problem")) }
        $recon.Add([pscustomobject][ordered]@{ Account = $m.Name; Type = $m.Type; Planned = $m.Planned; Destination = $(if ($dest) { $dest } else { 'None' }); EndDate = $(if ($d) { "$($d.EndDate)" } else { '' }); Reference = $(if ($d) { "$($d.Reference)" } else { '' })
                Outcome = $(if ($problem) { 'Unreconciled' } elseif ($dest -eq 'WorkloadIdentity') { 'MovesToWorkloadIdentity' } elseif ($dest -eq 'Retire') { 'Retires' } else { 'OnIslandList' }); Reason = $(if ($problem) { $problem } else { '' }) })
    }

    $ordered = @($actions | Sort-Object Account, ActionId)
    $plan = [pscustomobject][ordered]@{
        planVersion = 2; task = 'kerberos-apply'; generated = $AsOf.ToString('o'); asOf = $AsOf.ToString('yyyy-MM-dd'); cloud = $Cloud; tenantId = $TenantId; domain = $DomainName
        registerSha256 = $RegisterSha256; inputs = $Inputs.Hashes; kds = $Domain.Kds.State; migrationWaitDays = $script:MigrationWaitDays; parallelRunDays = $script:ParallelRunDays
        adStandard = [ordered]@{ serviceAccountOu = $std.ServiceAccountOu; holdingOu = $std.HoldingOu; creatorGroup = $std.CreatorGroup; passwordIntervalDays = $std.PasswordIntervalDays }
        pipelineIdentity = "$((Get-NpiKrbTask -Task 'kerberos-apply').pipelineIdentity)"
        actions = $ordered
    }
    $islandRows = @($island | Sort-Object Account)
    [pscustomobject]@{
        Findings       = $f.ToArray()
        Plan           = $plan
        IslandList     = $islandRows
        HandoffReady   = [bool]($islandRows.Count -and -not @($islandRows | Where-Object { -not $_.ReadyForP46 }).Count)
        Reconciliation = $recon.ToArray()
    }
}

function New-NpiKrbGmsaPlan {
    <#
    .SYNOPSIS
        A one-account Chapter 06 plan that creates a single new gMSA which replaces no existing
        account, such as Chapter 11's smoke-test gMSA (WD-168: every production write goes through
        the approved plan). Same plan format, rules and write path as Test-NpiKerberosIsland's: the
        name standard (WD-159), one DL-gMSA-<app>-Hosts retriever group (WD-160), the service-account
        OU and password interval from ad-standard.json (WD-161), outbound-only unless
        -OutboundOnlyReason says why not (WD-154), the SailPoint request and ServiceNow change
        that approved it, and its tags as the AD description (-Tags, WD-175). Throws instead of planning when any rule fails. Apply it with
        Invoke-NpiKrbPlan (or Invoke-NpiKerberosIslandAction.ps1) -RunAs Pipeline.
    .EXAMPLE
        # The smoke-test gMSA for a test forest, approved by its request and change.
        $plan = New-NpiKrbGmsaPlan -Name 'gmsa-npismoke$' -RetrieverGroupDn 'CN=DL-gMSA-npismoke-Hosts,OU=Groups,DC=corp-test,DC=contoso,DC=example' -AdStandardPath tests/fixtures/deploy/kerberos-test/ad-standard.json -RequestId SP-REQ-0002001 -ChangeRecord CHG-2026-1102-T -Tags 'SystemId=SYS-0900; Owner1=npi.owner@contoso.example; Owner2=npi.backup@contoso.example; Sponsor=iam.sponsor@contoso.example; Environment=test; Tier=R3; EntraTarget=Undecided; Request=SP-REQ-0002001; Change=CHG-2026-1102-T' -TenantId c0ffee00-0000-4000-8000-0000000000e1 -Domain corp-test.contoso.example -Cloud gcc -AsOf '2026-11-02T12:00:00Z' -Workload Service -Hosts APP-TEST-01
        $plan.actions | Format-Table Action, Account, RunBy
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Name,
        [Parameter(Mandatory)][string]$RetrieverGroupDn,
        [Parameter(Mandatory)][string]$AdStandardPath,
        [Parameter(Mandatory)][AllowEmptyString()][string]$RequestId,
        [Parameter(Mandatory)][AllowEmptyString()][string]$ChangeRecord,
        [Parameter(Mandatory)][AllowEmptyString()][string]$Tags,
        [Parameter(Mandatory)][string]$TenantId,
        [Parameter(Mandatory)][string]$Domain,
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][datetime]$AsOf,
        [string]$Workload = 'Service',
        [string]$Hosts = '',
        [string]$OutboundOnlyReason = '',
        [hashtable]$InputHashes = @{}
    )
    if (-not (Test-Path -LiteralPath $AdStandardPath)) { throw "Missing reviewed input $AdStandardPath." }
    # The checks Import-NpiKrbInput makes, on the one file this plan reads.
    $std = Get-Content -LiteralPath $AdStandardPath -Raw | ConvertFrom-Json -AsHashtable
    foreach ($k in 'serviceAccountOu', 'holdingOu') { if ("$($std[$k])" -notmatch '^OU=.+,DC=') { throw "ad-standard.json: $k must be an OU's distinguished name, not '$($std[$k])'." } }
    if (-not "$($std.retrieverGroupPattern)") { throw 'ad-standard.json: retrieverGroupPattern is required (WD-160).' }
    if (($std.passwordIntervalDays -isnot [long] -and $std.passwordIntervalDays -isnot [int]) -or [int]$std.passwordIntervalDays -lt 1) { throw 'ad-standard.json: passwordIntervalDays must be a whole number of days, 1 or more.' }
    $domainDn = ($Domain.Split('.') | ForEach-Object { "DC=$_" }) -join ','
    foreach ($k in 'serviceAccountOu', 'holdingOu') { if (-not "$($std[$k])".EndsWith(",$domainDn", [StringComparison]::OrdinalIgnoreCase)) { throw "ad-standard.json: $k $($std[$k]) isn't in $Domain; use the stage's own file." } }
    $bad = Test-NpiKrbNameStandard -Name $Name -Target 'gMSA'; if ($bad) { throw $bad }
    $bad = Test-NpiKrbRetrieverShape -Retrievers @($RetrieverGroupDn) -Pattern "$($std.retrieverGroupPattern)"; if ($bad) { throw $bad }
    if (-not $RequestId) { throw 'No approved request: pass the SailPoint request (-RequestId) that approved this gMSA.' }
    if (-not $ChangeRecord) { throw 'No change record: pass the ServiceNow change (-ChangeRecord).' }
    $bad = Test-NpiKrbTags -Tags $Tags -RequestId $RequestId -ChangeRecord $ChangeRecord; if ($bad) { throw "Tags: $bad" }
    $call = (Get-NpiKrbCall -Id 'krb-new-gmsa')[0]
    $short = $Name.TrimEnd('$')
    $params = [ordered]@{ Name = $short; DNSHostName = "$short.$Domain"; Path = "$($std.serviceAccountOu)"; PrincipalsAllowedToRetrieveManagedPassword = @($RetrieverGroupDn); KerberosEncryptionType = 'AES256'; ManagedPasswordIntervalInDays = [int]$std.passwordIntervalDays; Description = $Tags }
    $why = "Learn's procedure: create the gMSA for $Workload in $($std.serviceAccountOu)$(if ($Hosts) { ", then install it on $Hosts" })"
    if ($OutboundOnlyReason) { $why += ". Not outbound-only: $OutboundOnlyReason" } else { $params['RestrictToOutboundAuthenticationOnly'] = $true; $why += '. Outbound-only: it replaces no account and holds no SPN (WD-154)' }
    $hashes = [ordered]@{ 'ad-standard.json' = Get-NpiFileHash -Path $AdStandardPath }; foreach ($k in ($InputHashes.Keys | Sort-Object)) { $hashes[$k] = $InputHashes[$k] }
    $action = [pscustomobject][ordered]@{ ActionId = "CreateGmsa:$Name"; Account = $Name; Type = 'gMSA'; Action = 'CreateGmsa'; Write = $true; Call = 'krb-new-gmsa'; Cmdlet = 'New-ADServiceAccount'; RunBy = "$($call.runBy)"
        Params = $params; Before = $null; Precheck = "krb-kds-root-keys: Ready; krb-service-accounts: $Name doesn't exist"; RequestId = $RequestId; ChangeRecord = $ChangeRecord; Controls = @($call.controls); Ksis = @($call.ksis); Reason = $why }
    [pscustomobject][ordered]@{
        planVersion = 2; task = 'kerberos-apply'; generated = $AsOf.ToUniversalTime().ToString('o'); asOf = $AsOf.ToUniversalTime().ToString('yyyy-MM-dd'); cloud = $Cloud; tenantId = $TenantId; domain = $Domain
        registerSha256 = ''; inputs = $hashes; kds = ''; migrationWaitDays = $script:MigrationWaitDays; parallelRunDays = $script:ParallelRunDays
        adStandard = [ordered]@{ serviceAccountOu = "$($std.serviceAccountOu)"; holdingOu = "$($std.holdingOu)"; creatorGroup = "$($std.creatorGroup)"; passwordIntervalDays = [int]$std.passwordIntervalDays }
        pipelineIdentity = "$((Get-NpiKrbTask -Task 'kerberos-apply').pipelineIdentity)"
        actions = @($action)
    }
}

# ----------------------------------------------------------------------------- the reviewed write path

function New-NpiKrbWriter {
    <#
    .SYNOPSIS
        The writer for kerberos-apply: the only object in this chapter that can run New-, Set-,
        Start-, Complete-, Disable- or Move- cmdlets, and only the calls calls-ch06.json declares for it.
    .EXAMPLE
        # A writer over the fake AD, which accepts writes only with -AllowWrite.
        $fake = New-NpiKrbFixtureAdInvoker -EstatePath tests/fixtures/estate.json -KerberosPath tests/fixtures/ch06/ad-kerberos.json -AllowWrite
        $writer = New-NpiKrbWriter -TenantId c0ffee00-0000-4000-8000-000000000001 -Domain corp.contoso.example -AdInvoke $fake.Invoke
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$TenantId, [Parameter(Mandatory)][string]$Domain, [Parameter(Mandatory)][scriptblock]$AdInvoke)
    $decl = Get-NpiKrbTask -Task 'kerberos-apply'
    if ($decl.mode -ne 'write') { throw 'kerberos-apply must be declared as a write task.' }
    [pscustomobject]@{ TenantId = $TenantId; Domain = $Domain; Task = 'kerberos-apply'; Calls = Get-NpiKrbCall -Task 'kerberos-apply'; AdInvoke = $AdInvoke; Evidence = [Collections.Generic.List[object]]::new() }
}

function ConvertTo-NpiKrbHashtable {
    param($Value)
    if ($null -eq $Value) { return @{} }
    if ($Value -is [Collections.IDictionary]) { $h = [ordered]@{}; foreach ($k in $Value.Keys) { $h[$k] = $Value[$k] }; return $h }
    $h = [ordered]@{}; foreach ($p in $Value.PSObject.Properties) { $h[$p.Name] = $p.Value }; $h
}

function Assert-NpiKrbPlannedWrite {
    <#
    .SYNOPSIS
        Throws unless a plan action is a write declared for kerberos-apply, with the declared
        cmdlet, only that call's allowed parameters, the values its rule requires (with -Plan, the
        service-account OU, password interval and holding OU the plan was built with), and the
        SailPoint request that approved it and the ServiceNow change that records it, and on a create the
        account's tags as -Description (WD-175). A Remove-, Uninstall-, Undo-,
        Reset- or Clear- cmdlet always throws. Returns nothing when the action passes.
    .EXAMPLE
        # Check every write in a saved Kerberos plan before anything runs.
        $plan = Get-Content -LiteralPath out/kerberos/kerberos-plan.json -Raw | ConvertFrom-Json
        foreach ($a in @($plan.actions | Where-Object Write)) { Assert-NpiKrbPlannedWrite -Writer $writer -Action $a -Plan $plan }
    #>

    # Every write is a declared kerberos-apply call, with its cmdlet and only its allowed parameters.
    param($Writer, $Action, $Plan)
    if ("$($Action.Cmdlet)" -match $script:NeverSent) { throw "Action $($Action.ActionId): $($Action.Cmdlet) is never run; the old account is never deleted or unlinked by this code." }
    $call = $Writer.Calls | Where-Object { $_.id -eq $Action.Call }
    if (-not $call) { throw "Action $($Action.ActionId): '$($Action.Call)' isn't declared for kerberos-apply." }
    if ($call.method -ne 'WRITE') { throw "Action $($Action.ActionId): '$($Action.Call)' isn't a write." }
    if ($call.cmdlet -ne $Action.Cmdlet) { throw "Action $($Action.ActionId): $($Action.Cmdlet) doesn't match the declared $($call.cmdlet)." }
    $p = ConvertTo-NpiKrbHashtable $Action.Params
    foreach ($k in $p.Keys) { if ($k -notin @($call.allowedParams)) { throw "Action $($Action.ActionId): parameter -$k isn't allowed for $($call.id)." } }
    $std = if ($Plan -and $Plan.PSObject.Properties['adStandard']) { $Plan.adStandard } else { $null }
    $ou = {
        param([string]$Param, [string]$Want)
        if ("$($p[$Param])" -notmatch '^OU=.+,DC=') { throw "Action $($Action.ActionId): -$Param must be an OU's distinguished name." }
        if ($Want -and "$($p[$Param])" -ne $Want) { throw "Action $($Action.ActionId): -$Param $($p[$Param]) isn't the plan's $Want." }
    }
    switch ($call.id) {
        'krb-new-gmsa' {
            if ($p['KerberosEncryptionType'] -ne 'AES256') { throw "Action $($Action.ActionId): a new gMSA is created with KerberosEncryptionType AES256." }
            if (-not @($p['PrincipalsAllowedToRetrieveManagedPassword'] | Where-Object { $_ }).Count) { throw "Action $($Action.ActionId): a gMSA needs its reviewed retrievers." }
            & $ou 'Path' $(if ($std) { "$($std.serviceAccountOu)" })
            if ("$($p['ManagedPasswordIntervalInDays'])" -notmatch '^[1-9][0-9]*$') { throw "Action $($Action.ActionId): a new gMSA is created with -ManagedPasswordIntervalInDays, which can be set only at creation." }
            if ($std -and [int]$p['ManagedPasswordIntervalInDays'] -ne [int]$std.passwordIntervalDays) { throw "Action $($Action.ActionId): -ManagedPasswordIntervalInDays isn't the plan's $($std.passwordIntervalDays)." }
            if ($p.Contains('RestrictToOutboundAuthenticationOnly') -and $p['RestrictToOutboundAuthenticationOnly'] -ne $true) { throw "Action $($Action.ActionId): -RestrictToOutboundAuthenticationOnly is sent only as true; leave it out for inbound authentication." }
        }
        'krb-new-dmsa' {
            if ($p['CreateDelegatedServiceAccount'] -ne $true -or $p['KerberosEncryptionType'] -ne 'AES256') { throw "Action $($Action.ActionId): a dMSA is created with -CreateDelegatedServiceAccount and AES256." }
            & $ou 'Path' $(if ($std) { "$($std.serviceAccountOu)" })
        }
        'krb-set-retrievers' { if (-not @($p['PrincipalsAllowedToRetrieveManagedPassword'] | Where-Object { $_ }).Count) { throw "Action $($Action.ActionId): refusing an empty retriever list." } }
        { $_ -in 'krb-start-migration', 'krb-complete-migration' } { if ("$($p['SupersededAccount'])" -notmatch '^CN=.+,DC=') { throw "Action $($Action.ActionId): -SupersededAccount must be a distinguished name (Learn)." } }
        'krb-disable-superseded' { if ("$($p['Identity'])" -notmatch '^[0-9a-f-]{36}$') { throw "Action $($Action.ActionId): Disable-ADAccount takes the account's objectGUID." } }
        'krb-move-superseded' {
            if ("$($p['Identity'])" -notmatch '^[0-9a-f-]{36}$') { throw "Action $($Action.ActionId): Move-ADObject takes the account's objectGUID." }
            & $ou 'TargetPath' $(if ($std) { "$($std.holdingOu)" })
        }
    }
    $has = { param([string]$n) $Action.PSObject.Properties[$n] -and "$($Action.$n)" }
    if (-not (& $has 'RequestId')) { throw "Action $($Action.ActionId): no approved request: every write carries the SailPoint request (RequestId) that approved it." }
    if (-not (& $has 'ChangeRecord')) { throw "Action $($Action.ActionId): no change record: every write carries its ServiceNow change (ChangeRecord)." }
    # WD-175: a create carries the account's tags, naming the same request and change.
    if ($call.id -in 'krb-new-gmsa', 'krb-new-dmsa') {
        $bad = Test-NpiKrbTags -Tags "$($p['Description'])" -RequestId "$($Action.RequestId)" -ChangeRecord "$($Action.ChangeRecord)"
        if ($bad) { throw "Action $($Action.ActionId): -Description: $bad." }
    }
}

function Invoke-NpiKrbWriterRead {
    param($Writer, [string]$CallId, [hashtable]$Params)
    $call = $Writer.Calls | Where-Object { $_.id -eq $CallId -and $_.method -eq 'READ' }
    if (-not $call) { throw "'$CallId' isn't a declared kerberos-apply read." }
    $shown = ($Params.Keys | Sort-Object | ForEach-Object { "-$_ $(@($Params[$_]) -join ',')" }) -join ' '
    $Writer.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = 'READ'; Target = "$($call.cmdlet) $shown".Trim(); At = [DateTime]::UtcNow.ToString('o') })
    @(& $Writer.AdInvoke $call.cmdlet $Params)
}

function Get-NpiKrbAccountOrNull {
    param($Writer, [string]$Identity)
    try { @(Invoke-NpiKrbWriterRead $Writer 'krb-service-accounts' @{ Identity = $Identity; Properties = @('PrincipalsAllowedToRetrieveManagedPassword', 'msDS-DelegatedMSAState') })[0] }
    catch { if ("$_" -match 'Cannot find an object') { $null } else { throw } }
}

function Get-NpiKrbSupersededObject {
    # The old account as the writer sees it now: Get-ADUser for a user, Get-ADServiceAccount for an MSA (the plan's precheck names which).
    param($Writer, $Action, [string]$Identity)
    $id = if ("$($Action.Precheck)" -like 'krb-superseded-user*') { 'krb-superseded-user' } else { 'krb-service-accounts' }
    @(Invoke-NpiKrbWriterRead $Writer $id @{ Identity = $Identity; Properties = @('Enabled') })[0]
}

function Invoke-NpiKrbPlan {
    <#
    .SYNOPSIS
        Apply a reviewed Kerberos plan. Without -Apply it is a dry run: it checks the plan and runs
        every precheck, and runs nothing. With -Apply it runs only the plan's writes, only if the plan
        file's SHA-256 is the one the reviewer approved, the plan is for this tenant and domain and
        no older than seven days, each write carries its SailPoint request and ServiceNow change, and
        each precheck still holds; after each write it re-reads the target and records whether the
        change took (Verified). -RunAs says who is running it: Pipeline runs only the calls whose
        runBy is pipeline (a person's step is Refused); Person runs the calls whose runBy is person,
        and a pipeline step only with -TestDomain (WD-163).
    .EXAMPLE
        # A dry run of the reviewed plan against the fake AD, as the pipeline; add -Apply to run the writes.
        $sha = (Get-FileHash -Algorithm SHA256 -LiteralPath out/kerberos/kerberos-plan.json).Hash
        $run = Invoke-NpiKrbPlan -PlanPath out/kerberos/kerberos-plan.json -ApprovedSha256 $sha -Writer $writer -AsOf '2026-10-30T12:00:00Z' -RunAs Pipeline
        $run.Results | Format-Table Outcome, RunBy, Action, Account
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ApprovedSha256, [Parameter(Mandatory)]$Writer, [Parameter(Mandatory)][datetime]$AsOf,
        [Parameter(Mandatory)][ValidateSet('Pipeline', 'Person')][string]$RunAs, [switch]$TestDomain, [switch]$Apply)
    $hash = Get-NpiFileHash -Path $PlanPath
    if ($hash -ne $ApprovedSha256.ToLowerInvariant()) { throw "The plan's SHA-256 is $hash, not the approved $ApprovedSha256; refusing to run a plan nobody reviewed." }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
    if ($plan.task -ne 'kerberos-apply') { throw 'Not a Kerberos plan.' }
    if (-not $plan.PSObject.Properties['adStandard'] -or -not $plan.adStandard) { throw 'The plan has no adStandard (planVersion 2): build it again with this version of the module.' }
    if ($plan.tenantId -ne $Writer.TenantId) { throw "The plan is for tenant $($plan.tenantId), not $($Writer.TenantId)." }
    if ($plan.domain -ne $Writer.Domain) { throw "The plan is for domain $($plan.domain), not $($Writer.Domain)." }
    $generated = ConvertTo-NpiKrbDate $plan.generated
    if (($AsOf - $generated).TotalDays -gt $script:MaxPlanAgeDays) { throw "The plan is $([int]($AsOf - $generated).TotalDays) days old; build and review a new one (the limit is $($script:MaxPlanAgeDays))." }
    $holding = "$($plan.adStandard.holdingOu)"

    $results = [Collections.Generic.List[object]]::new()
    foreach ($a in @($plan.actions | Where-Object Write)) {
        Assert-NpiKrbPlannedWrite -Writer $Writer -Action $a -Plan $plan
        $call = $Writer.Calls | Where-Object { $_.id -eq $a.Call }
        $runBy = "$($call.runBy)"
        $p = ConvertTo-NpiKrbHashtable $a.Params
        $outcome = $null; $detail = ''; $verified = $null
        # Who may send it (WD-163): a person's step never runs as the pipeline; a pipeline step runs as a person only in a test domain.
        if ($runBy -eq 'person' -and $RunAs -ne 'Person') { $outcome = 'Refused'; $detail = "runBy person: a person runs $($a.Call) (-RunAs Person); the pipeline never sends it" }
        elseif ($runBy -eq 'pipeline' -and $RunAs -ne 'Pipeline' -and -not $TestDomain) { $outcome = 'Refused'; $detail = "runBy pipeline: $($plan.pipelineIdentity) sends $($a.Call); a person may send it only in a test domain (-TestDomain)" }
        elseif ($runBy -notin 'pipeline', 'person') { throw "Call $($a.Call) declares no runBy (pipeline or person) in calls-ch06.json." }
        if (-not $outcome) {
            switch ($a.Call) {
                { $_ -in 'krb-new-gmsa', 'krb-new-dmsa' } {
                    $kds = Get-NpiKdsRootKeyState -Client ([pscustomobject]@{ Task = 'kerberos-apply'; Calls = $Writer.Calls; AdInvoke = $Writer.AdInvoke; Evidence = $Writer.Evidence }) -Domain $Writer.Domain -AsOf $AsOf
                    if ($kds.State -ne 'Ready') { $outcome = 'Skipped'; $detail = "KDS root key $($kds.State)" }
                    elseif (Get-NpiKrbAccountOrNull $Writer "$($p['Name'])`$") { $outcome = 'Skipped'; $detail = 'Already exists' }
                }
                'krb-set-retrievers' {
                    $now = @(Get-NpiKrbRetrieverList (Get-NpiKrbAccountOrNull $Writer $p['Identity']))
                    if (($now -join '|').ToLowerInvariant() -ne ((@($a.Before) | Sort-Object) -join '|').ToLowerInvariant()) { $outcome = 'Skipped'; $detail = 'The retrievers changed since the plan was reviewed; build a new plan' }
                }
                'krb-start-migration' { if ((Get-NpiKrbDelegatedState (Get-NpiKrbAccountOrNull $Writer $p['Identity'])) -ne 0) { $outcome = 'Skipped'; $detail = 'The migration has already started' } }
                'krb-complete-migration' { if ((Get-NpiKrbDelegatedState (Get-NpiKrbAccountOrNull $Writer $p['Identity'])) -ne 1) { $outcome = 'Skipped'; $detail = 'Not in migration (msDS-DelegatedMSAState isn''t 1)' } }
                'krb-disable-superseded' {
                    $o = Get-NpiKrbSupersededObject $Writer $a $p['Identity']
                    if (-not $o.Enabled) { $outcome = 'Skipped'; $detail = 'Already disabled' }
                }
                'krb-move-superseded' {
                    $o = Get-NpiKrbSupersededObject $Writer $a $p['Identity']
                    # In a dry run the disable before it hasn't been sent, so only -Apply requires the account disabled.
                    if ((Get-NpiKrbParentDn "$($o.DistinguishedName)") -eq $holding) { $outcome = 'Skipped'; $detail = 'Already in the holding OU' }
                    elseif ($Apply -and $o.Enabled) { $outcome = 'Skipped'; $detail = 'Still enabled: the account is disabled before it moves' }
                }
            }
        }
        if (-not $outcome) {
            if (-not $Apply) { $outcome = 'WouldSend' }
            else {
                $Writer.Evidence.Add([pscustomobject]@{ Call = $a.Call; Method = 'WRITE'; Target = "$($a.Cmdlet) $((($p.Keys | ForEach-Object { "-$_ $(@($p[$_]) -join ',')" }) -join ' '))"; At = [DateTime]::UtcNow.ToString('o') })
                $send = [hashtable]@{}; foreach ($k in $p.Keys) { $send[$k] = $p[$k] }
                $null = & $Writer.AdInvoke $a.Cmdlet $send
                # Re-read the target: the change is recorded as verified only when AD shows it.
                switch ($a.Call) {
                    'krb-new-gmsa' { $o = Get-NpiKrbAccountOrNull $Writer "$($p['Name'])`$"; $verified = [bool]($o -and (Get-NpiKrbParentDn "$($o.DistinguishedName)") -eq "$($p['Path'])") }
                    'krb-new-dmsa' { $o = Get-NpiKrbAccountOrNull $Writer "$($p['Name'])`$"; $verified = [bool]($o -and (Get-NpiKrbParentDn "$($o.DistinguishedName)") -eq "$($p['Path'])") }
                    'krb-set-retrievers' { $verified = ((@(Get-NpiKrbRetrieverList (Get-NpiKrbAccountOrNull $Writer $p['Identity'])) -join '|').ToLowerInvariant() -eq ((@($p['PrincipalsAllowedToRetrieveManagedPassword']) | Sort-Object) -join '|').ToLowerInvariant()) }
                    'krb-start-migration' { $verified = (Get-NpiKrbDelegatedState (Get-NpiKrbAccountOrNull $Writer $p['Identity'])) -eq 1 }
                    'krb-complete-migration' { $verified = (Get-NpiKrbDelegatedState (Get-NpiKrbAccountOrNull $Writer $p['Identity'])) -eq 2 }
                    'krb-disable-superseded' { $verified = -not (Get-NpiKrbSupersededObject $Writer $a $p['Identity']).Enabled }
                    'krb-move-superseded' { $o = Get-NpiKrbSupersededObject $Writer $a $p['Identity']; $verified = (-not $o.Enabled) -and (Get-NpiKrbParentDn "$($o.DistinguishedName)") -eq $holding }
                }
                $outcome = if ($verified) { 'Sent' } else { 'Unverified' }
                switch ($a.Action) {
                    'StartDmsaMigration' { $detail = "Record MigrationStartedOn $($AsOf.ToString('yyyy-MM-dd')); complete on or after $($AsOf.AddDays($plan.migrationWaitDays).ToString('yyyy-MM-dd'))" }
                    'CreateGmsa' { $detail = 'Next: install it on the hosts, change the identity, validate, record HostChangedOn' }
                    'CompleteDmsaMigration' { $detail = 'The old account is disabled and kept; never delete it (Learn)' }
                    'DisableSuperseded' { $detail = 'Disabled, not deleted; it moves to the holding OU next' }
                    'MoveSuperseded' { $detail = "Disabled and in $holding; delete it only through the decommission ticket, 90 days after the disable" }
                }
                if (-not $verified) { $detail = "Sent, but the re-read doesn't show the change: check AD before anything else. $detail" }
            }
        }
        $results.Add([pscustomobject][ordered]@{ ActionId = $a.ActionId; Action = $a.Action; Account = $a.Account; Call = $a.Call; Cmdlet = $a.Cmdlet; RunBy = $runBy; RequestId = "$($a.RequestId)"; ChangeRecord = "$($a.ChangeRecord)"
                Controls = @($a.Controls); Ksis = @($a.Ksis); Outcome = $outcome; Verified = $verified; Detail = $detail })
    }
    [pscustomobject]@{ PlanSha256 = $hash; Mode = $(if ($Apply) { 'Apply' } else { 'DryRun' }); RunAs = $RunAs; TestDomain = [bool]$TestDomain; Results = $results.ToArray(); Evidence = $Writer.Evidence.ToArray() }
}

# ----------------------------------------------------------------------------- the run

function Export-NpiKrbRun {
    <#
    .SYNOPSIS
        Writes each entry of -Files into -OutputPath (CSV for a .csv name, JSON otherwise) plus a
        manifest.json with the task's AD rights, every request and each file's SHA-256, and returns
        the manifest file.
    .EXAMPLE
        # Write the findings and island list from Test-NpiKerberosIsland with a manifest.
        Export-NpiKrbRun -OutputPath out/kerberos -Task kerberos-island -Cloud gcc -TenantId $register.Manifest.tenantId -Domain corp.contoso.example -AsOf '2026-10-30' -Evidence $reader.Evidence -Files @{ 'findings.json' = @($r.Findings); 'island-list.csv' = @($r.IslandList) }
    .DESCRIPTION
    #>
    <# Write a run's files and a manifest: task, mode, cloud, tenant, domain, as-of, the AD rights the task holds, every read and write, and each file's SHA-256. #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][hashtable]$Files, [Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId,
        [string]$Domain, [string]$AsOf, [object[]]$Evidence = @(), [string]$Mode = 'Fixture', [hashtable]$Extra = @{})
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) {
        $p = Join-Path $OutputPath $name
        if ($name.EndsWith('.csv')) { [IO.File]::WriteAllText($p, (((@($Files[$name]) | ConvertTo-Csv -NoTypeInformation) -join "`n") + "`n"), [Text.UTF8Encoding]::new($false)) }
        else { Write-NpiJson -Path $p -Value $Files[$name] }
        $hashes[$name] = Get-NpiFileHash -Path $p
    }
    $r = Get-NpiKrbRequiredRight -Task $Task
    $m = [ordered]@{ task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; domain = $Domain; asOf = $AsOf; generated = [DateTime]::UtcNow.ToString('o'); adRights = $r.AdRights
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } }); files = $hashes }
    foreach ($k in $Extra.Keys) { $m[$k] = $Extra[$k] }
    Write-NpiJson -Path (Join-Path $OutputPath 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

# ----------------------------------------------------------------------------- live and fake Active Directory

function New-NpiKrbLiveAdInvoker {
    <#
    .SYNOPSIS
        The live Active Directory invoker: only the cmdlets calls-ch06.json declares for -Task, against
        -Server, with the ActiveDirectory module. Removes, uninstalls, undoes and resets never run.
    .EXAMPLE
        # Live, read only: needs the ActiveDirectory module and a domain account with the task's rights.
        $ad = New-NpiKrbLiveAdInvoker -Server corp.contoso.example -Task kerberos-island
        $reader = New-NpiKrbReader -AdInvoke $ad
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Server, [Parameter(Mandatory)][ValidateSet('kerberos-island', 'kerberos-apply')][string]$Task)
    Import-Module ActiveDirectory -ErrorAction Stop
    $allowed = @((Get-NpiKrbCall -Task $Task) | ForEach-Object { $_.cmdlet } | Sort-Object -Unique)
    $srv = $Server; $never = $script:NeverSent
    {
        param($Cmdlet, [hashtable]$Params)
        if ($Cmdlet -match $never -or $Cmdlet -notin $allowed) { throw "Refusing $Cmdlet" }
        $p = @{} + $Params; $p.Server = $srv
        & $Cmdlet @p
    }.GetNewClosure()
}

function New-NpiKrbFixtureAdInvoker {
    <#
    .SYNOPSIS
        A fake Active Directory for Chapter 06: the fixture estate's accounts plus ad-kerberos.json
        (KDS root keys, domain controllers, hosts, dMSA state). Reads: Get-ADObject (the KDS root keys
        only, and never msKds-RootKeyData), Get-ADServiceAccount, Get-ADUser, Get-ADDomainController,
        Get-ADComputer. Writes only with -AllowWrite: New-ADServiceAccount (in -Path when given),
        Set-ADServiceAccount, Start- and Complete-ADServiceAccountMigration, Disable-ADAccount and
        Move-ADObject. Every call is recorded.
    .EXAMPLE
        # The fake AD, then the cmdlets it received after a run.
        $fake = New-NpiKrbFixtureAdInvoker -EstatePath tests/fixtures/estate.json -KerberosPath tests/fixtures/ch06/ad-kerberos.json
        $fake.Calls | Select-Object Cmdlet
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$EstatePath, [Parameter(Mandatory)][string]$KerberosPath, [switch]$AllowWrite)
    $estate = Get-Content -LiteralPath $EstatePath -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $extra = Get-Content -LiteralPath $KerberosPath -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    foreach ($sa in $estate.ad.serviceAccounts) { if ($extra.serviceAccountState.ContainsKey($sa.SamAccountName)) { foreach ($k in $extra.serviceAccountState[$sa.SamAccountName].Keys) { $sa[$k] = $extra.serviceAccountState[$sa.SamAccountName][$k] } } }
    $state = [pscustomobject]@{ Estate = $estate; Extra = $extra; Calls = [Collections.Generic.List[object]]::new(); AllowWrite = [bool]$AllowWrite; Invoke = $null }
    $s = $state
    $state.Invoke = { param($Cmdlet, [hashtable]$Params) Invoke-NpiKrbFakeAd -State $s -Cmdlet $Cmdlet -Params $Params }.GetNewClosure()
    $state
}

function ConvertTo-NpiKrbFakeObject {
    # Shape a fixture object the way the AD cmdlets return it: Enabled from the UAC disable bit, the rest as stored.
    param([hashtable]$Source)
    $get = { param([string]$k) if ($Source.ContainsKey($k)) { $Source[$k] } else { $null } }
    [pscustomobject][ordered]@{
        SamAccountName       = $Source.SamAccountName
        ObjectGUID           = [guid]$Source.ObjectGUID
        ObjectClass          = $Source.ObjectClass
        DistinguishedName    = $Source.DistinguishedName
        Enabled              = -not ([int64]$Source.UserAccountControl -band 0x2)
        ServicePrincipalName = @(& $get 'ServicePrincipalName')
    }
}

function ConvertTo-NpiKrbFakeAccount {
    param([hashtable]$Source)
    $o = ConvertTo-NpiKrbFakeObject $Source
    $o | Add-Member -NotePropertyName PrincipalsAllowedToRetrieveManagedPassword -NotePropertyValue @($(if ($Source.ContainsKey('PrincipalsAllowedToRetrieveManagedPassword')) { $Source['PrincipalsAllowedToRetrieveManagedPassword'] }) | Where-Object { $_ })
    $o | Add-Member -NotePropertyName 'msDS-DelegatedMSAState' -NotePropertyValue $(if ($Source.ContainsKey('msDS-DelegatedMSAState') -and $null -ne $Source['msDS-DelegatedMSAState']) { [int]$Source['msDS-DelegatedMSAState'] } else { $null })
    $o | Add-Member -NotePropertyName 'msDS-ManagedAccountPrecededByLink' -NotePropertyValue $(if ($Source.ContainsKey('msDS-ManagedAccountPrecededByLink')) { $Source['msDS-ManagedAccountPrecededByLink'] } else { $null })
    $o
}

function Invoke-NpiKrbFakeAd {
    <#
    .SYNOPSIS
        The fake Active Directory's dispatcher: records the cmdlet and parameters in the state's
        Calls, then answers the cmdlet from the fixture state, or throws for a cmdlet it doesn't
        serve and for a write when the state doesn't allow writes. New-NpiKrbFixtureAdInvoker's
        Invoke calls it.
    .EXAMPLE
        # Ask the fake directly for its domain controllers.
        $fake = New-NpiKrbFixtureAdInvoker -EstatePath tests/fixtures/estate.json -KerberosPath tests/fixtures/ch06/ad-kerberos.json
        Invoke-NpiKrbFakeAd -State $fake -Cmdlet Get-ADDomainController -Params @{ Filter = '*' }
    #>
    param($State, [string]$Cmdlet, [hashtable]$Params)
    $State.Calls.Add([pscustomobject]@{ Cmdlet = $Cmdlet; Params = $Params })
    $ad = $State.Estate.ad; $x = $State.Extra
    $dnOf = { param([string]$sam) $ad.serviceAccounts | Where-Object { $_.SamAccountName -eq $sam } }
    $find = {
        param([object[]]$Pool, [string]$Identity)
        $hit = @($Pool | Where-Object { $_.SamAccountName -eq $Identity -or $_.SamAccountName -eq "$Identity`$" -or "$($_.ObjectGUID)" -eq $Identity -or $_.DistinguishedName -eq $Identity })
        if ($hit.Count -ne 1) { throw "Cannot find an object with identity: '$Identity'" }
        $hit[0]
    }
    $kdsReady = { @($x.kdsRootKeys | Where-Object { [datetime]::Parse($_['msKds-UseStartTime'], [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal) -le [DateTime]::UtcNow }).Count -gt 0 }
    $write = { if (-not $State.AllowWrite) { throw "The fake refuses $Cmdlet" } }
    switch ($Cmdlet) {
        'Get-ADObject' {
            $base = "CN=Master Root Keys,CN=Group Key Distribution Service,CN=Services,$($x.configurationDn)"
            if ($Params.SearchBase -ne $base -or $Params.LDAPFilter -ne '(objectClass=msKds-ProvRootKey)') { throw "The fake Get-ADObject serves only the KDS root keys under $base" }
            if (@($Params.Properties) -contains 'msKds-RootKeyData') { throw 'The fake refuses to return msKds-RootKeyData: the check never needs the key itself' }
            return @($x.kdsRootKeys | ForEach-Object {
                    $toFt = { param($t) [datetime]::Parse($t, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal).ToFileTimeUtc() }
                    [pscustomobject]@{ Name = $_.Name; ObjectClass = 'msKds-ProvRootKey'; DistinguishedName = "CN=$($_.Name),$base"; 'msKds-UseStartTime' = (& $toFt $_['msKds-UseStartTime']); 'msKds-CreateTime' = (& $toFt $_['msKds-CreateTime']) }
                })
        }
        'Get-ADServiceAccount' {
            $pool = @($ad.serviceAccounts)
            if ($Params.ContainsKey('Identity')) { return ConvertTo-NpiKrbFakeAccount (& $find $pool $Params.Identity) }
            if ($Params.Filter -ne '*') { throw 'The fake Get-ADServiceAccount supports -Filter * or -Identity only' }
            return @($pool | ForEach-Object { ConvertTo-NpiKrbFakeAccount $_ })
        }
        'Get-ADUser' {
            if (-not $Params.ContainsKey('Identity')) { throw 'The fake Get-ADUser (Chapter 06) supports -Identity only' }
            return ConvertTo-NpiKrbFakeObject (& $find @($ad.objects | Where-Object { $_.ObjectClass -eq 'user' }) $Params.Identity)
        }
        'Get-ADDomainController' {
            if ($Params.Filter -ne '*') { throw 'The fake Get-ADDomainController supports -Filter * only' }
            return @($x.domainControllers | ForEach-Object { [pscustomobject]$_ })
        }
        'Get-ADComputer' {
            $hit = @($x.computers | Where-Object { $_.Name -eq $Params.Identity -or $_.DistinguishedName -eq $Params.Identity })
            if ($hit.Count -ne 1) { throw "Cannot find an object with identity: '$($Params.Identity)'" }
            return [pscustomobject]$hit[0]
        }
        'New-ADServiceAccount' {
            & $write
            if (-not (& $kdsReady)) { throw 'Key does not exist (the fake: no usable KDS root key)' }
            $sam = "$($Params.Name)`$"
            if (@($ad.serviceAccounts | Where-Object { $_.SamAccountName -eq $sam }).Count) { throw "The specified account already exists: $sam" }
            $dmsa = [bool]$Params['CreateDelegatedServiceAccount']
            $class = if ($dmsa) { 'msDS-DelegatedManagedServiceAccount' } else { 'msDS-GroupManagedServiceAccount' }
            # Learn: without -Path a new account goes to the Managed Service Accounts container.
            $parent = if ($Params['Path']) { "$($Params['Path'])" } else { 'CN=Managed Service Accounts,DC=corp,DC=contoso,DC=example' }
            $ad.serviceAccounts = @($ad.serviceAccounts) + @(@{ SamAccountName = $sam; ObjectGUID = "$([guid]::NewGuid())"; ObjectClass = $class; DistinguishedName = "CN=$($Params.Name),$parent"
                    UserAccountControl = 4096; ServicePrincipalName = @(); MemberOf = @(); PrincipalsAllowedToRetrieveManagedPassword = @($Params['PrincipalsAllowedToRetrieveManagedPassword'] | Where-Object { $_ }); 'msDS-DelegatedMSAState' = $(if ($dmsa) { 0 } else { $null })
                    Description = "$($Params['Description'])"; RestrictToOutboundAuthenticationOnly = [bool]$Params['RestrictToOutboundAuthenticationOnly']; ManagedPasswordIntervalInDays = $(if ($Params['ManagedPasswordIntervalInDays']) { [int]$Params['ManagedPasswordIntervalInDays'] } else { 30 }) })
            return
        }
        'Set-ADServiceAccount' {
            & $write
            $o = & $find @($ad.serviceAccounts) $Params.Identity
            foreach ($k in $Params.Keys) { if ($k -notin 'Identity', 'PrincipalsAllowedToRetrieveManagedPassword') { throw "The fake Set-ADServiceAccount doesn't take -$k" } }
            $o['PrincipalsAllowedToRetrieveManagedPassword'] = @($Params['PrincipalsAllowedToRetrieveManagedPassword'])
            return
        }
        'Start-ADServiceAccountMigration' {
            & $write
            $o = & $find @($ad.serviceAccounts) $Params.Identity
            if ($o.ObjectClass -ne 'msDS-DelegatedManagedServiceAccount') { throw 'Start-ADServiceAccountMigration needs a delegated managed service account' }
            $null = & $find @($ad.objects) $Params.SupersededAccount
            $o['msDS-DelegatedMSAState'] = 1; $o['msDS-ManagedAccountPrecededByLink'] = $Params.SupersededAccount
            return
        }
        'Complete-ADServiceAccountMigration' {
            & $write
            $o = & $find @($ad.serviceAccounts) $Params.Identity
            if ([int]$o['msDS-DelegatedMSAState'] -ne 1) { throw 'The migration has not started' }
            $u = & $find @($ad.objects) $Params.SupersededAccount
            # Learn: SPNs copied to the dMSA and removed from the account; the account disabled through the UAC disable bit.
            $o['ServicePrincipalName'] = @($o['ServicePrincipalName']) + @($u['ServicePrincipalName']); $u['ServicePrincipalName'] = @()
            $u.UserAccountControl = [int64]$u.UserAccountControl -bor 0x2
            $o['msDS-DelegatedMSAState'] = 2
            return
        }
        'Disable-ADAccount' {
            & $write
            $o = & $find (@($ad.objects) + @($ad.serviceAccounts)) $Params.Identity
            $o.UserAccountControl = [int64]$o.UserAccountControl -bor 0x2
            return
        }
        'Move-ADObject' {
            & $write
            if ("$($Params.TargetPath)" -notmatch '^(OU|CN)=.+,DC=') { throw "The fake Move-ADObject needs -TargetPath as a container's distinguished name" }
            $o = & $find (@($ad.objects) + @($ad.serviceAccounts)) $Params.Identity
            $o.DistinguishedName = "$(("$($o.DistinguishedName)" -split '(?<!\\),', 2)[0]),$($Params.TargetPath)"
            return
        }
    }
    throw "The fake refuses $Cmdlet"
}

Export-ModuleMember -Function Get-NpiKrbCallList, Get-NpiKrbCall, Get-NpiKrbTask, Get-NpiKrbRequiredRight, New-NpiKrbReader, Invoke-NpiKrbAdRead,
    Import-NpiKrbRegister, Import-NpiKrbMatrixRun, Get-NpiKrbPath, Import-NpiKrbInput, Get-NpiKdsRootKeyState, Get-NpiKrbScope, Read-NpiKrbDomain, Test-NpiKerberosIsland, New-NpiKrbGmsaPlan,
    New-NpiKrbWriter, Assert-NpiKrbPlannedWrite, Invoke-NpiKrbPlan, Export-NpiKrbRun, New-NpiKrbLiveAdInvoker, New-NpiKrbFixtureAdInvoker, Invoke-NpiKrbFakeAd
