#Requires -Version 7.1
<#
    NpiKerberosIsland: Chapter 06 of the developer workbook "Building Non-Person Identity".

    The Kerberos-only workloads in Chapter 01's register: MSAs upgraded to gMSAs; traditional
    accounts, IIS application pools and scheduled tasks moved to a gMSA or a dMSA (Windows Server
    2025's delegated MSA migration); the KDS root key checked read-only; the principals allowed to
    retrieve each managed password held as reviewed data; the Kerberos accounts that stay recorded
    with an SPN owner and an end date within the program's D08, and exported for the program's SPN
    retirement (P4.6); and every gMSA and dMSA reconciled with the program's provisional end state
    (D11) before AD is retired at G5.

    Its own call list is config/calls-ch06.json (same schema as calls.json). Reads run only declared
    Get-AD* cmdlets. Writes are a reviewed plan applied only by Invoke-NpiKrbPlan -Apply through a
    separate writer whose calls are declared for kerberos-apply; nothing removes, uninstalls, undoes
    or resets, and the old account is never deleted.

    Illustrative: tested against fixtures and a fake Active Directory, not a production domain.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiCore/NpiCore.psm1') -Force -Global

$script:CallsPath = Join-Path $PSScriptRoot '../../config/calls-ch06.json'
# Learn: domain controllers wait up to 10 hours after a root key's effective time before gMSA passwords are generated.
$script:KdsReplicationHours = 10
# Learn: wait at least two ticket lifetimes (14 days) before completing a dMSA migration; four (28 days) is recommended.
# Design guidance: the code holds Learn's recommendation, not its minimum.
$script:MigrationWaitDays = 28
$script:LearnMinimumMigrationDays = 14
# Book 02, Chapter 10, Phase 4: old and new credentials run in parallel for 30 days before the legacy account is disabled.
$script:ParallelRunDays = 30
$script:MaxPlanAgeDays = 7
$script:ManagedTypes = @('gMSA', 'dMSA')
$script:Dispositions = @('Convert', 'Island', 'WorkloadIdentity', 'Retire')
$script:Workloads = @('Service', 'IisAppPool', 'ScheduledTask')
$script:NeverSent = '^(Remove|Uninstall|Undo|Reset|Clear)-'

function ConvertTo-NpiKrbDate {
    param([string]$Text)
    if (-not $Text) { return $null }
    [datetime]::Parse($Text, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

# ----------------------------------------------------------------------------- the call list

function Get-NpiKrbCallList {
    [CmdletBinding()]
    param([string]$Path = $script:CallsPath)
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiKrbCall {
    [CmdletBinding()]
    param([string]$Task, [string]$Id)
    $calls = @((Get-NpiKrbCallList).calls)
    if ($Task) { $calls = @($calls | Where-Object { $_.tasks -contains $Task }) }
    if ($Id) { $calls = @($calls | Where-Object { $_.id -eq $Id }) }
    , $calls
}

function Get-NpiKrbTask {
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $t = (Get-NpiKrbCallList).tasks
    if (-not $t.ContainsKey($Task)) { throw "Unknown task '$Task' in calls-ch06.json." }
    $t[$Task]
}

function Get-NpiKrbRequiredRight {
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
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][scriptblock]$AdInvoke, [string]$Task = 'kerberos-island')
    $decl = Get-NpiKrbTask -Task $Task
    if ($decl.mode -ne 'read') { throw "Task '$Task' writes; use New-NpiKrbWriter, never a reader." }
    [pscustomobject]@{ Task = $Task; Calls = Get-NpiKrbCall -Task $Task; AdInvoke = $AdInvoke; Evidence = [Collections.Generic.List[object]]::new() }
}

function Invoke-NpiKrbAdRead {
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

function Import-NpiKrbInput {
    <#
    .SYNOPSIS
        The three reviewed inputs: kerberos-dispositions.csv, password-retrievers.json and
        end-state.json, each with its SHA-256. A missing input throws: there is no default end state.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$InputPath)
    $files = [ordered]@{
        dispositions = Join-Path $InputPath 'kerberos-dispositions.csv'
        retrievers   = Join-Path $InputPath 'password-retrievers.json'
        endState     = Join-Path $InputPath 'end-state.json'
    }
    foreach ($k in $files.Keys) { if (-not (Test-Path -LiteralPath $files[$k])) { throw "Missing reviewed input $($files[$k])." } }
    $end = Get-Content -LiteralPath $files.endState -Raw | ConvertFrom-Json -AsHashtable
    if ($end.d11.decision -notin 'AdRetired', 'KerberosIsland') { throw "end-state.json: d11.decision must be AdRetired or KerberosIsland, not '$($end.d11.decision)'." }
    if ($end.d11.decision -eq 'KerberosIsland' -and -not $end.d11.islandEndOfLife) { throw 'end-state.json: a Kerberos island needs d11.islandEndOfLife.' }
    if (-not $end.g5.date) { throw 'end-state.json: g5.date is required.' }
    $ret = (Get-Content -LiteralPath $files.retrievers -Raw | ConvertFrom-Json -AsHashtable).accounts
    $hashes = [ordered]@{}; foreach ($k in $files.Keys) { $hashes[(Split-Path $files[$k] -Leaf)] = Get-NpiFileHash -Path $files[$k] }
    [pscustomobject]@{ Dispositions = @(Import-Csv -LiteralPath $files.dispositions); Retrievers = $ret; EndState = $end; Hashes = $hashes }
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
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Reader, [Parameter(Mandatory)][object[]]$Rows, [Parameter(Mandatory)][object[]]$Dispositions, [Parameter(Mandatory)][string]$Domain, [Parameter(Mandatory)][datetime]$AsOf)
    $kds = Get-NpiKdsRootKeyState -Client $Reader -Domain $Domain -AsOf $AsOf
    $msas = @{}
    foreach ($m in @(Invoke-NpiKrbAdRead -Client $Reader -CallId 'krb-service-accounts' -Params @{ Filter = '*'; Properties = @('PrincipalsAllowedToRetrieveManagedPassword', 'msDS-DelegatedMSAState', 'msDS-ManagedAccountPrecededByLink') })) { $msas[$m.SamAccountName] = $m }
    $scope = Get-NpiKrbScope -Rows $Rows
    $users = @{}
    $dmsaRows = @($Dispositions | Where-Object { $_.Disposition -eq 'Convert' -and $_.Target -eq 'dMSA' })
    foreach ($d in $dmsaRows) {
        $row = @($scope | Where-Object { $_.Name -eq $d.SamAccountName -and $_.Type -eq 'Traditional' })
        if ($row.Count -eq 1) { $users[$d.SamAccountName] = @(Invoke-NpiKrbAdRead -Client $Reader -CallId 'krb-superseded-user' -Params @{ Identity = $row[0].ObjectId; Properties = @('Enabled') })[0] }
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

function Test-NpiKerberosIsland {
    <#
    .SYNOPSIS
        Check the Kerberos accounts against the reviewed dispositions and build the plan, the island
        list for the program's SPN retirement (P4.6) and the reconciliation of every gMSA and dMSA
        with the provisional end state (D11). Returns @{ Findings; Plan; IslandList; Reconciliation }.
        Findings NPI-KRB-01 to NPI-KRB-09, each with a stable ID (rule:account). Nothing here writes.
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
    $coveredBy = @{}; foreach ($d in $Inputs.Dispositions) { if ($d.Disposition -eq 'Convert' -and $d.NewAccount) { $coveredBy[$d.NewAccount] = $d } }
    $end = $Inputs.EndState
    $d08 = ConvertTo-NpiKrbDate "$($end.d08.kerberosEndDate)"
    $g5 = ConvertTo-NpiKrbDate "$($end.g5.date)"
    $islandEol = ConvertTo-NpiKrbDate "$($end.d11.islandEndOfLife)"
    $kdsReady = $Domain.Kds.State -eq 'Ready'
    $ws2025Dc = @($Domain.DomainControllers | Where-Object { Test-NpiWs2025 $_.OperatingSystem }).Count -gt 0
    $add = {
        param([hashtable]$a)
        $base = [ordered]@{ ActionId = ''; Account = ''; Type = ''; Action = ''; Write = $false; Call = ''; Cmdlet = ''; Params = $null; Before = $null; Precheck = ''; Reason = '' }
        foreach ($k in $a.Keys) { $base[$k] = $a[$k] }
        if (-not $base.ActionId) { $base.ActionId = "$($base.Action):$($base.Account)" }
        $actions.Add([pscustomobject]$base)
    }
    $label = { param($r) "$($r.Name) ($($r.Type))" }

    if ($Domain.Kds.State -eq 'Missing') { $f.Add((New-NpiFinding 'NPI-KRB-01' 'Finding' 'forest' 'KDS root key' 'No KDS root key in the forest: no gMSA or dMSA can be created. Creating one is a one-time, reviewed change by a Domain Admin (Learn), not this code''s')) }
    elseif ($Domain.Kds.State -eq 'Replicating') { $f.Add((New-NpiFinding 'NPI-KRB-01' 'Warn' 'forest' 'KDS root key' "The root key became usable at $($Domain.Kds.EarliestUsable), less than $($script:KdsReplicationHours) hours ago; creations wait for replication (Learn)")) }

    # A stay-on-Kerberos entry: an SPN owner and an end date within D08 (N3.6).
    $stay = {
        param([string]$Name, [string]$Type, [string]$Source, [string]$Spns, $d, [string]$Status)
        $owner = "$($d.SpnOwnerUpn)"; $endDate = ConvertTo-NpiKrbDate "$($d.EndDate)"
        $key = $Source
        if (-not $owner) { $f.Add((New-NpiFinding 'NPI-KRB-05' 'Finding' $key "$Name ($Type)" 'Stays on Kerberos with no SPN owner: name the person who answers for its SPNs in kerberos-dispositions.csv')) }
        $within = $false
        if (-not $endDate) { $f.Add((New-NpiFinding 'NPI-KRB-06' 'Finding' $key "$Name ($Type)" 'Stays on Kerberos with no end date')) }
        elseif (-not $d08) { $f.Add((New-NpiFinding 'NPI-KRB-06' 'Warn' $key "$Name ($Type)" 'The program''s D08 end date isn''t set yet: the island list can''t be handed to the SPN retirement (P4.6)')) }
        elseif ($endDate -gt $d08) { $f.Add((New-NpiFinding 'NPI-KRB-06' 'Finding' $key "$Name ($Type)" "End date $($endDate.ToString('yyyy-MM-dd')) is after D08's $($d08.ToString('yyyy-MM-dd'))")) }
        else { $within = $true }
        $island.Add([pscustomobject][ordered]@{ Account = $Name; Type = $Type; Source = $Source; Spns = $Spns; SpnOwnerUpn = $owner; EndDate = "$($d.EndDate)"; WithinD08 = $within; Status = $Status; ReadyForP46 = [bool]($owner -and $within) })
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
        if (-not $d -and $coveredBy.ContainsKey($r.Name)) { continue }   # the dMSA or gMSA a conversion row names
        if (-not $d -or $d.Disposition -notin $script:Dispositions) {
            $why = if ($d) { "Unknown disposition '$($d.Disposition)'" } else { 'No row in kerberos-dispositions.csv' }
            $f.Add((New-NpiFinding 'NPI-KRB-02' 'Finding' $r.Name $lbl "$why`: every Kerberos account is converted, kept on the island with an end date, moved to a workload identity or retired"))
            & $add @{ Account = $r.Name; Type = $r.Type; Action = 'AwaitDisposition'; Reason = $why }
            continue
        }
        if ($d.Workload -and $d.Workload -notin $script:Workloads) { $f.Add((New-NpiFinding 'NPI-KRB-02' 'Finding' $r.Name $lbl "Unknown workload '$($d.Workload)'; use Service, IisAppPool or ScheduledTask")) }

        switch ($d.Disposition) {
            'Island' { & $stay $r.Name $r.Type $r.Name "$($r.Spns)" $d 'Island'; & $add @{ Account = $r.Name; Type = $r.Type; Action = 'Island'; Reason = "Stays on Kerberos until $($d.EndDate), SPN owner $(if ($d.SpnOwnerUpn) { $d.SpnOwnerUpn } else { 'none' })" } }
            'WorkloadIdentity' {
                if (-not $d.Reference) { $f.Add((New-NpiFinding 'NPI-KRB-02' 'Finding' $r.Name $lbl 'WorkloadIdentity needs a Reference to the workload identity that replaces it (Chapter 05)')) }
                & $add @{ Account = $r.Name; Type = $r.Type; Action = 'MovesToWorkloadIdentity'; Reason = "To $($d.Reference) by $($d.EndDate), with Chapter 05's token exchange test and 30-day parallel run" }
            }
            'Retire' { & $add @{ Account = $r.Name; Type = $r.Type; Action = 'RetireThroughDecommission'; Reason = 'Retire through the reviewed decommission process. This code disables at most; it never deletes' } }
            'Convert' {
                $new = "$($d.NewAccount)"; $blocked = [Collections.Generic.List[string]]::new()
                if ($r.Type -in $script:ManagedTypes) { $blocked.Add("it's already a $($r.Type); keep it on the island, or move it to a workload identity") }
                if ($d.Target -notin $script:ManagedTypes) { $blocked.Add("unknown target '$($d.Target)'; use gMSA or dMSA") }
                if ($new -notmatch '^[A-Za-z0-9-]{1,15}\$$') { $blocked.Add("NewAccount '$new' must be a SAM account name ending in `$, 15 characters or fewer before it") }
                if (@($Inputs.Dispositions | Where-Object { $_.NewAccount -eq $new }).Count -gt 1) { $blocked.Add("$new is named by more than one account; each service account needs its own (Learn: one dMSA per service account)") }
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
                if ($blocked.Count) {
                    $f.Add((New-NpiFinding 'NPI-KRB-04' 'Finding' $r.Name $lbl "$($d.Target) can't be used: $($blocked -join '; ')"))
                    & $add @{ Account = $r.Name; Type = $r.Type; Action = 'Blocked'; Reason = ($blocked -join '; ') }
                    & $stay $r.Name $r.Type $r.Name "$($r.Spns)" $d 'Blocked: still on its own account'
                    continue
                }
                & $stay $new $d.Target $r.Name "$($r.Spns)" $d "Planned: $($r.Name) moves to it"
                $newAcct = if ($Domain.ManagedAccounts.ContainsKey($new)) { $Domain.ManagedAccounts[$new] } else { $null }
                $name = $new.TrimEnd('$')
                $common = @{ Account = $r.Name; Type = $r.Type }
                if (-not $newAcct) {
                    if (-not $kdsReady) { & $add ($common + @{ Action = 'Blocked'; Reason = "KDS root key $($Domain.Kds.State): no $($d.Target) can be created yet" }); continue }
                    if ($d.Target -eq 'gMSA') {
                        & $add ($common + @{ Action = 'CreateGmsa'; Write = $true; Call = 'krb-new-gmsa'; Cmdlet = 'New-ADServiceAccount'
                                Params = [ordered]@{ Name = $name; DNSHostName = "$name.$DomainName"; PrincipalsAllowedToRetrieveManagedPassword = $want; KerberosEncryptionType = 'AES256' }
                                Precheck = "krb-kds-root-keys: Ready; krb-service-accounts: $new doesn't exist"; Reason = "Learn's procedure: create the gMSA for $($d.Workload), then install it on $($d.Hosts) and change the identity there" })
                    } else {
                        & $add ($common + @{ Action = 'CreateDmsa'; Write = $true; Call = 'krb-new-dmsa'; Cmdlet = 'New-ADServiceAccount'
                                Params = [ordered]@{ Name = $name; DNSHostName = "$name.$DomainName"; CreateDelegatedServiceAccount = $true; KerberosEncryptionType = 'AES256' }
                                Precheck = "krb-kds-root-keys: Ready; krb-service-accounts: $new doesn't exist"; Reason = 'Learn''s procedure, step 1: create the dMSA; the migration starts in the next reviewed plan' })
                    }
                    continue
                }
                if ($d.Target -eq 'dMSA') {
                    $state = Get-NpiKrbDelegatedState $newAcct
                    $user = if ($Domain.Users.ContainsKey($r.Name)) { $Domain.Users[$r.Name] } else { $null }
                    $dn = if ($user) { "$($user.DistinguishedName)" } else { '' }
                    $started = ConvertTo-NpiKrbDate "$($d.MigrationStartedOn)"
                    switch ($state) {
                        0 { & $add ($common + @{ Action = 'StartDmsaMigration'; Write = $true; Call = 'krb-start-migration'; Cmdlet = 'Start-ADServiceAccountMigration'; Params = [ordered]@{ Identity = $new; SupersededAccount = $dn }; Precheck = "krb-service-accounts: $new msDS-DelegatedMSAState still 0"; Reason = "Links $($r.Name) to $new; record MigrationStartedOn, then wait $($script:MigrationWaitDays) days before completing" }) }
                        1 {
                            if (-not $started) { & $add ($common + @{ Action = 'AwaitMigrationWindow'; Reason = "$new is in migration but MigrationStartedOn isn't recorded: record it before the plan can complete the migration" }) }
                            elseif (($AsOf - $started).TotalDays -lt $script:MigrationWaitDays) { & $add ($common + @{ Action = 'AwaitMigrationWindow'; Reason = "Started $($d.MigrationStartedOn); complete on or after $($started.AddDays($script:MigrationWaitDays).ToString('yyyy-MM-dd')) (four ticket lifetimes, Learn's recommendation)" }) }
                            else { & $add ($common + @{ Action = 'CompleteDmsaMigration'; Write = $true; Call = 'krb-complete-migration'; Cmdlet = 'Complete-ADServiceAccountMigration'; Params = [ordered]@{ Identity = $new; SupersededAccount = $dn }; Precheck = "krb-service-accounts: $new msDS-DelegatedMSAState still 1"; Reason = "Started $($d.MigrationStartedOn), $([int]($AsOf - $started).TotalDays) days ago. Disables $($r.Name) and moves its SPNs to $new (Learn); $($r.Name) is kept, never deleted" }) }
                        }
                        2 { & $add ($common + @{ Action = 'MigrationComplete'; Reason = "$($r.Name) is superseded and disabled; keep it: the service and the dMSA link to it (Learn)" }) }
                        default { & $add ($common + @{ Action = 'Blocked'; Reason = "$new has msDS-DelegatedMSAState $state, which this plan doesn't handle" }) }
                    }
                    continue
                }
                $changed = ConvertTo-NpiKrbDate "$($d.HostChangedOn)"
                if (-not $changed) { & $add ($common + @{ Action = 'AwaitHostChange'; Reason = "On $($d.Hosts): Install-ADServiceAccount $new, change the $($d.Workload) identity to $new with a blank password, validate, then record HostChangedOn (Learn)" }) }
                elseif (($AsOf - $changed).TotalDays -lt $script:ParallelRunDays) { & $add ($common + @{ Action = 'AwaitParallelRun'; Reason = "Changed $($d.HostChangedOn); disable $($r.Name) on or after $($changed.AddDays($script:ParallelRunDays).ToString('yyyy-MM-dd')) if the run is clean" }) }
                elseif ($r.Enabled -eq $true) { & $add ($common + @{ Action = 'DisableSuperseded'; Write = $true; Call = 'krb-disable-superseded'; Cmdlet = 'Disable-ADAccount'; Params = [ordered]@{ Identity = "$($r.ObjectId)" }; Precheck = "$(if ($r.Type -eq 'Traditional') { 'krb-superseded-user' } else { 'krb-service-accounts' }): $($r.Name) still enabled"; Reason = "$($script:ParallelRunDays) days on $new since $($d.HostChangedOn): disable $($r.Name), never delete it" }) }
                else { & $add ($common + @{ Action = 'Superseded'; Reason = "$($r.Name) is disabled; retire it through the reviewed decommission process" }) }
            }
        }
    }

    # Retrievers as reviewed data, for every gMSA and dMSA that exists (a dMSA in migration learns its hosts: checked after completion).
    foreach ($name in ($Domain.ManagedAccounts.Keys | Sort-Object)) {
        $a = $Domain.ManagedAccounts[$name]
        if ($a.ObjectClass -notin 'msDS-GroupManagedServiceAccount', 'msDS-DelegatedManagedServiceAccount') { continue }
        $row = if ($byName.ContainsKey($name)) { $byName[$name] } else { $null }
        if ($row -and $row.Handoff -eq 'DataPlatform') { continue }
        if ($a.ObjectClass -eq 'msDS-DelegatedManagedServiceAccount' -and (Get-NpiKrbDelegatedState $a) -eq 1) { continue }
        $have = @(Get-NpiKrbRetrieverList $a)
        $lbl = "$name ($(if ($a.ObjectClass -eq 'msDS-GroupManagedServiceAccount') { 'gMSA' } else { 'dMSA' }))"
        if (-not $Inputs.Retrievers -or -not $Inputs.Retrievers.ContainsKey($name)) { $f.Add((New-NpiFinding 'NPI-KRB-03' 'Finding' $name $lbl 'No reviewed PrincipalsAllowedToRetrieveManagedPassword in password-retrievers.json')); continue }
        $want = @($Inputs.Retrievers[$name] | Sort-Object)
        if (-not $want.Count) { $f.Add((New-NpiFinding 'NPI-KRB-03' 'Finding' $name $lbl 'The reviewed retriever list is empty: no host could run the service; refusing to plan it')); continue }
        if ((($have | ForEach-Object { $_.ToLowerInvariant() }) -join '|') -ne (($want | ForEach-Object { $_.ToLowerInvariant() }) -join '|')) {
            $f.Add((New-NpiFinding 'NPI-KRB-03' 'Finding' $name $lbl "Retrievers in AD ($($have -join '; ')) differ from the reviewed list ($($want -join '; '))"))
            & $add @{ ActionId = "SetRetrievers:$name"; Account = $name; Type = $lbl.Split('(')[1].TrimEnd(')'); Action = 'SetRetrievers'; Write = $true; Call = 'krb-set-retrievers'; Cmdlet = 'Set-ADServiceAccount'
                Params = [ordered]@{ Identity = $name; PrincipalsAllowedToRetrieveManagedPassword = $want }; Before = $have; Precheck = "krb-service-accounts: $name retrievers still as read"; Reason = 'Set to the reviewed list' }
        }
    }

    # N7.3: every gMSA and dMSA, existing or planned, against the provisional end state (D11).
    $managed = [Collections.Generic.List[object]]::new()
    foreach ($r in @($scope | Where-Object { $_.Type -in $script:ManagedTypes } | Sort-Object Name)) { $managed.Add([pscustomobject]@{ Name = $r.Name; Type = $r.Type; Planned = $false; Handoff = $r.Handoff }) }
    foreach ($d in @($Inputs.Dispositions | Where-Object { $_.Disposition -eq 'Convert' } | Sort-Object NewAccount)) {
        if ($byName.ContainsKey($d.NewAccount) -or -not $byName.ContainsKey($d.SamAccountName)) { continue }
        if (@($actions | Where-Object { $_.Account -eq $d.SamAccountName -and $_.Action -eq 'Blocked' }).Count) { continue }
        $managed.Add([pscustomobject]@{ Name = $d.NewAccount; Type = $d.Target; Planned = $true; Handoff = '' })
    }
    foreach ($m in $managed) {
        $lbl = "$($m.Name) ($($m.Type))"
        if ($m.Handoff -eq 'DataPlatform') { $recon.Add([pscustomobject][ordered]@{ Account = $m.Name; Type = $m.Type; Planned = $m.Planned; Destination = 'HandedOff'; EndDate = ''; Reference = ''; Outcome = 'HandedOff'; Reason = 'The Data Platform plan reconciles SQL Server''s accounts' }); continue }
        $d = if ($disp.ContainsKey($m.Name)) { $disp[$m.Name] } elseif ($coveredBy.ContainsKey($m.Name)) { $coveredBy[$m.Name] } else { $null }
        $dest = if (-not $d) { '' } elseif ($d.Disposition -eq 'Convert') { 'Island' } else { "$($d.Disposition)" }
        $endDate = if ($d) { ConvertTo-NpiKrbDate "$($d.EndDate)" } else { $null }
        $problem = $null
        if (-not $d -or $dest -notin 'Island', 'WorkloadIdentity', 'Retire') { $problem = 'no destination: it would lose its credential when the last domain controller is demoted' }
        elseif (-not $endDate) { $problem = "no end date for $dest" }
        elseif ($dest -in 'WorkloadIdentity', 'Retire' -and $endDate -gt $g5) { $problem = "$dest by $($d.EndDate), after G5 ($($end.g5.date))" }
        elseif ($dest -eq 'WorkloadIdentity' -and -not $d.Reference) { $problem = 'no workload identity named' }
        elseif ($dest -eq 'Island' -and $end.d11.decision -eq 'AdRetired' -and $endDate -gt $g5) { $problem = "D11 retires AD at G5 ($($end.g5.date)); this account stays on Kerberos until $($d.EndDate) and loses its credential at domain controller demotion" }
        elseif ($dest -eq 'Island' -and $end.d11.decision -eq 'KerberosIsland' -and $endDate -gt $islandEol) { $problem = "its end date $($d.EndDate) is after the island's end of life ($($end.d11.islandEndOfLife))" }
        if ($problem) { $f.Add((New-NpiFinding 'NPI-KRB-07' 'Finding' $m.Name $lbl "Not reconciled with the provisional end state (D11 $($end.d11.decision)): $problem")) }
        $recon.Add([pscustomobject][ordered]@{ Account = $m.Name; Type = $m.Type; Planned = $m.Planned; Destination = $(if ($dest) { $dest } else { 'None' }); EndDate = $(if ($d) { "$($d.EndDate)" } else { '' }); Reference = $(if ($d) { "$($d.Reference)" } else { '' })
                Outcome = $(if ($problem) { 'Unreconciled' } elseif ($dest -eq 'WorkloadIdentity') { 'MovesToWorkloadIdentity' } elseif ($dest -eq 'Retire') { 'Retires' } else { 'OnIslandList' }); Reason = $(if ($problem) { $problem } else { '' }) })
    }

    $ordered = @($actions | Sort-Object Account, ActionId)
    $plan = [pscustomobject][ordered]@{
        planVersion = 1; task = 'kerberos-apply'; generated = $AsOf.ToString('o'); asOf = $AsOf.ToString('yyyy-MM-dd'); cloud = $Cloud; tenantId = $TenantId; domain = $DomainName
        registerSha256 = $RegisterSha256; inputs = $Inputs.Hashes; kds = $Domain.Kds.State; migrationWaitDays = $script:MigrationWaitDays; parallelRunDays = $script:ParallelRunDays
        actions = $ordered
    }
    $islandRows = @($island | Sort-Object Account)
    [pscustomobject]@{
        Findings       = $f.ToArray()
        Plan           = $plan
        IslandList     = $islandRows
        HandoffReady   = [bool]($d08 -and $islandRows.Count -and -not @($islandRows | Where-Object { -not $_.ReadyForP46 }).Count)
        Reconciliation = $recon.ToArray()
    }
}

# ----------------------------------------------------------------------------- the reviewed write path

function New-NpiKrbWriter {
    <#
    .SYNOPSIS
        The writer for kerberos-apply: the only object in this chapter that can run New-, Set-,
        Start-, Complete- or Disable- cmdlets, and only the calls calls-ch06.json declares for it.
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
    # Every write is a declared kerberos-apply call, with its cmdlet and only its allowed parameters.
    param($Writer, $Action)
    if ("$($Action.Cmdlet)" -match $script:NeverSent) { throw "Action $($Action.ActionId): $($Action.Cmdlet) is never run; the old account is never deleted or unlinked by this code." }
    $call = $Writer.Calls | Where-Object { $_.id -eq $Action.Call }
    if (-not $call) { throw "Action $($Action.ActionId): '$($Action.Call)' isn't declared for kerberos-apply." }
    if ($call.method -ne 'WRITE') { throw "Action $($Action.ActionId): '$($Action.Call)' isn't a write." }
    if ($call.cmdlet -ne $Action.Cmdlet) { throw "Action $($Action.ActionId): $($Action.Cmdlet) doesn't match the declared $($call.cmdlet)." }
    $p = ConvertTo-NpiKrbHashtable $Action.Params
    foreach ($k in $p.Keys) { if ($k -notin @($call.allowedParams)) { throw "Action $($Action.ActionId): parameter -$k isn't allowed for $($call.id)." } }
    switch ($call.id) {
        'krb-new-gmsa' {
            if ($p['KerberosEncryptionType'] -ne 'AES256') { throw "Action $($Action.ActionId): a new gMSA is created with KerberosEncryptionType AES256." }
            if (-not @($p['PrincipalsAllowedToRetrieveManagedPassword'] | Where-Object { $_ }).Count) { throw "Action $($Action.ActionId): a gMSA needs its reviewed retrievers." }
        }
        'krb-new-dmsa' {
            if ($p['CreateDelegatedServiceAccount'] -ne $true -or $p['KerberosEncryptionType'] -ne 'AES256') { throw "Action $($Action.ActionId): a dMSA is created with -CreateDelegatedServiceAccount and AES256." }
        }
        'krb-set-retrievers' { if (-not @($p['PrincipalsAllowedToRetrieveManagedPassword'] | Where-Object { $_ }).Count) { throw "Action $($Action.ActionId): refusing an empty retriever list." } }
        { $_ -in 'krb-start-migration', 'krb-complete-migration' } { if ("$($p['SupersededAccount'])" -notmatch '^CN=.+,DC=') { throw "Action $($Action.ActionId): -SupersededAccount must be a distinguished name (Learn)." } }
        'krb-disable-superseded' { if ("$($p['Identity'])" -notmatch '^[0-9a-f-]{36}$') { throw "Action $($Action.ActionId): Disable-ADAccount takes the account's objectGUID." } }
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

function Invoke-NpiKrbPlan {
    <#
    .SYNOPSIS
        Apply a reviewed Kerberos plan. Without -Apply it is a dry run: it checks the plan and runs
        every precheck, and runs nothing. With -Apply it runs only the plan's writes, only if the plan
        file's SHA-256 is the one the reviewer approved, the plan is for this tenant and domain and
        no older than seven days, and each precheck still holds.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ApprovedSha256, [Parameter(Mandatory)]$Writer, [Parameter(Mandatory)][datetime]$AsOf, [switch]$Apply)
    $hash = Get-NpiFileHash -Path $PlanPath
    if ($hash -ne $ApprovedSha256.ToLowerInvariant()) { throw "The plan's SHA-256 is $hash, not the approved $ApprovedSha256; refusing to run a plan nobody reviewed." }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json
    if ($plan.task -ne 'kerberos-apply') { throw 'Not a Kerberos plan.' }
    if ($plan.tenantId -ne $Writer.TenantId) { throw "The plan is for tenant $($plan.tenantId), not $($Writer.TenantId)." }
    if ($plan.domain -ne $Writer.Domain) { throw "The plan is for domain $($plan.domain), not $($Writer.Domain)." }
    $generated = ConvertTo-NpiKrbDate $plan.generated
    if (($AsOf - $generated).TotalDays -gt $script:MaxPlanAgeDays) { throw "The plan is $([int]($AsOf - $generated).TotalDays) days old; build and review a new one (the limit is $($script:MaxPlanAgeDays))." }

    $results = [Collections.Generic.List[object]]::new()
    foreach ($a in @($plan.actions | Where-Object Write)) {
        Assert-NpiKrbPlannedWrite -Writer $Writer -Action $a
        $p = ConvertTo-NpiKrbHashtable $a.Params
        $outcome = $null; $detail = ''
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
                $id = if ($a.Precheck -like 'krb-superseded-user*') { 'krb-superseded-user' } else { 'krb-service-accounts' }
                $o = @(Invoke-NpiKrbWriterRead $Writer $id @{ Identity = $p['Identity']; Properties = @('Enabled') })[0]
                if (-not $o.Enabled) { $outcome = 'Skipped'; $detail = 'Already disabled' }
            }
        }
        if (-not $outcome) {
            if (-not $Apply) { $outcome = 'WouldSend' }
            else {
                $Writer.Evidence.Add([pscustomobject]@{ Call = $a.Call; Method = 'WRITE'; Target = "$($a.Cmdlet) $((($p.Keys | ForEach-Object { "-$_ $(@($p[$_]) -join ',')" }) -join ' '))"; At = [DateTime]::UtcNow.ToString('o') })
                $call = [hashtable]@{}; foreach ($k in $p.Keys) { $call[$k] = $p[$k] }
                $null = & $Writer.AdInvoke $a.Cmdlet $call
                $outcome = 'Sent'
                switch ($a.Action) {
                    'StartDmsaMigration' { $detail = "Record MigrationStartedOn $($AsOf.ToString('yyyy-MM-dd')); complete on or after $($AsOf.AddDays($plan.migrationWaitDays).ToString('yyyy-MM-dd'))" }
                    'CreateGmsa' { $detail = 'Next: install it on the hosts, change the identity, validate, record HostChangedOn' }
                    'CompleteDmsaMigration' { $detail = 'The old account is disabled and kept; never delete it (Learn)' }
                    'DisableSuperseded' { $detail = 'Disabled, not deleted; retire it through the decommission process' }
                }
            }
        }
        $results.Add([pscustomobject]@{ ActionId = $a.ActionId; Action = $a.Action; Account = $a.Account; Cmdlet = $a.Cmdlet; Outcome = $outcome; Detail = $detail })
    }
    [pscustomobject]@{ PlanSha256 = $hash; Mode = $(if ($Apply) { 'Apply' } else { 'DryRun' }); Results = $results.ToArray(); Evidence = $Writer.Evidence.ToArray() }
}

# ----------------------------------------------------------------------------- the run

function Export-NpiKrbRun {
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
        Get-ADComputer. Writes only with -AllowWrite: New-ADServiceAccount, Set-ADServiceAccount,
        Start- and Complete-ADServiceAccountMigration, Disable-ADAccount. Every call is recorded.
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
            $ad.serviceAccounts = @($ad.serviceAccounts) + @(@{ SamAccountName = $sam; ObjectGUID = "$([guid]::NewGuid())"; ObjectClass = $class; DistinguishedName = "CN=$($Params.Name),CN=Managed Service Accounts,DC=corp,DC=contoso,DC=example"
                    UserAccountControl = 4096; ServicePrincipalName = @(); MemberOf = @(); PrincipalsAllowedToRetrieveManagedPassword = @($Params['PrincipalsAllowedToRetrieveManagedPassword'] | Where-Object { $_ }); 'msDS-DelegatedMSAState' = $(if ($dmsa) { 0 } else { $null }) })
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
    }
    throw "The fake refuses $Cmdlet"
}

Export-ModuleMember -Function Get-NpiKrbCallList, Get-NpiKrbCall, Get-NpiKrbTask, Get-NpiKrbRequiredRight, New-NpiKrbReader, Invoke-NpiKrbAdRead,
    Import-NpiKrbRegister, Import-NpiKrbInput, Get-NpiKdsRootKeyState, Get-NpiKrbScope, Read-NpiKrbDomain, Test-NpiKerberosIsland,
    New-NpiKrbWriter, Assert-NpiKrbPlannedWrite, Invoke-NpiKrbPlan, Export-NpiKrbRun, New-NpiKrbLiveAdInvoker, New-NpiKrbFixtureAdInvoker, Invoke-NpiKrbFakeAd
