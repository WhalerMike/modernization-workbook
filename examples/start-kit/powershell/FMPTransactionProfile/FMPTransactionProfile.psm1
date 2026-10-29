#Requires -Version 5.1
<#
.SYNOPSIS
    Transaction profiles for the Start Kit: for each application proposed to move away from
    its data, the measured synchronous round trips per business transaction, what reduced
    them, and whether the result clears the separation gate (Book 01 Chapter 10, "Profiling
    transactions before separation"; Chapter 07's co-location rule; Chapter 11's gated
    actuation).

.DESCRIPTION
    The team lists the transactions in a catalog (TransactionCatalog.csv): application,
    transaction, the authoritative store, the round-trip time the application sees today,
    the round-trip time it would see after separation, and the network wait the transaction
    can afford. A run with no catalog writes a template to fill in.

    Round trips are measured, not estimated, in one of three ways:
      PacketCapture  ConvertFrom-FMPPacketCapture reads a tshark field export of a capture
                     taken while the transaction ran, and counts each client request that
                     the store answered, plus one per new TCP connection. Protocol-neutral:
                     SQL Server, Oracle, LDAP, HTTP. The kit doesn't capture; a capture is a
                     change on the host, made under the agency's change control.
      SqlDmv         Measure-FMPSqlRoundTrip polls sys.dm_exec_connections with SELECT-only
                     T-SQL while an operator runs the transaction, and counts the network
                     reads on the application's connections. SQL Server only.
      Declared       A figure from another measuring tool (APM, a SQL trace the team already
                     has), entered in the catalog with the tool named. "Estimate" is refused.

    Invoke-FMPTransactionProfile turns the catalog and the measurements into the profiles,
    the per-application separation gate and the findings, under
    <OutputPath>\transaction-profiles. Nothing here writes to any server.

    The arithmetic is Book 09 Chapter 01's: each synchronous round trip pays the propagation
    delay once, so a transaction's network wait after separation is its round trips times
    the target round-trip time, and the round trips it can afford are its budget divided by
    that time.

    Illustrative: unit-tested against fixtures, not proven against a live estate.
#>

. (Join-Path (Split-Path -Parent $PSScriptRoot) 'StartKit.Common.ps1')

# The SQL Server measurement uses the SQL module's SELECT-only query path.
if (-not (Get-Module -Name FMPSqlEstate)) { Import-Module (Join-Path (Split-Path -Parent $PSScriptRoot) 'FMPSqlEstate') }

# Book 01 Chapter 10's reduction techniques, by the names the catalog uses.
$script:FMPTxTechniques = [ordered]@{
    Aggregation       = 'Consolidate fine-grained calls into one aggregated call'
    Asynchronous      = 'Move work off the user''s critical path with asynchronous or event-driven processing'
    Caching           = 'Read-through caching of repeat reads'
    Batching          = 'Batch operations into one call'
    ConnectionPooling = 'Reuse connections (removes repeated setup, not the data round trip)'
    AtomicCalls       = 'Convert a multi-step conversational transaction into one atomic call'
}
$script:FMPTxTechniqueAliases = @{
    aggregate = 'Aggregation'; aggregation = 'Aggregation'; consolidation = 'Aggregation'
    async = 'Asynchronous'; asynchronous = 'Asynchronous'; eventdriven = 'Asynchronous'
    cache = 'Caching'; caching = 'Caching'; readthroughcaching = 'Caching'
    batch = 'Batching'; batching = 'Batching'
    pooling = 'ConnectionPooling'; connectionpooling = 'ConnectionPooling'
    atomic = 'AtomicCalls'; atomiccalls = 'AtomicCalls'; atomiccall = 'AtomicCalls'
}
# Methods that are not measurements. A catalog figure with one of these is ignored.
$script:FMPTxUnmeasured = 'estimate', 'estimated', 'guess', 'assumed', 'unknown', 'tbd'
$script:FMPTxCatalogColumns = @(
    'Application', 'Transaction', 'Store', 'StoreAddress', 'StorePort', 'ClientAddress', 'CurrentRttMs', 'TargetRttMs',
    'BudgetMs', 'Techniques', 'BaselineCapture', 'ReducedCapture', 'CaptureRepetitions', 'BaselineRoundTrips',
    'ReducedRoundTrips', 'DeclaredMethod', 'Owner', 'Notes'
)
$script:FMPTxBook = 'Book 01 Chapter 10'

function ConvertTo-FMPTxNumber {
    # A culture-invariant number, or $null for blank or unparseable text.
    param([AllowNull()]$Value)
    if ($null -eq $Value) { return $null }
    $t = "$Value".Trim()
    if (-not $t) { return $null }
    $d = 0.0
    if ([double]::TryParse($t, [System.Globalization.NumberStyles]::Float, [System.Globalization.CultureInfo]::InvariantCulture, [ref]$d)) { return $d }
    $null
}

function ConvertTo-FMPTxPhase {
    param([AllowNull()][string]$Phase)
    if ($Phase -match '^(?i)base') { return 'Baseline' }
    if ($Phase -match '^(?i)(reduc|after)') { return 'Reduced' }
    $null
}

function ConvertTo-FMPTxAddress {
    # One spelling per address, so 10.0.0.1 and an IPv6 address in long form compare equal.
    param([AllowNull()][string]$Address)
    if (-not $Address) { return $null }
    $ip = $null
    if ([System.Net.IPAddress]::TryParse($Address.Trim(), [ref]$ip)) { return $ip.ToString().ToLowerInvariant() }
    $Address.Trim().ToLowerInvariant()
}

function Get-FMPTxMedian {
    param([object[]]$Values)
    $v = @($Values | Where-Object { $null -ne $_ } | ForEach-Object { [double]$_ } | Sort-Object)
    if (-not $v.Count) { return $null }
    $mid = [math]::Floor($v.Count / 2)
    if ($v.Count % 2) { return $v[$mid] }
    ($v[$mid - 1] + $v[$mid]) / 2
}

function ConvertTo-FMPTxTechnique {
    # Splits a Techniques cell and maps each entry to Book 01's names; unknown ones are kept apart.
    param([AllowNull()][string]$Text)
    $known = @(); $unknown = @()
    foreach ($t in @("$Text" -split '[;,]' | ForEach-Object { $_.Trim() } | Where-Object { $_ })) {
        $k = ($t -replace '[\s\-_]', '').ToLowerInvariant()
        if ($script:FMPTxTechniqueAliases.ContainsKey($k)) { $known += $script:FMPTxTechniqueAliases[$k] } else { $unknown += $t }
    }
    [pscustomobject]@{ Known = @($known | Select-Object -Unique); Unknown = @($unknown) }
}

function ConvertTo-FMPTxFileName {
    # A file name from an application name: safe characters only, never a Windows reserved name.
    param([Parameter(Mandatory)][string]$Name)
    $n = ($Name -replace '[^A-Za-z0-9._-]+', '-').Trim('-', '.').ToLowerInvariant()
    if (-not $n) { $n = 'application' }
    if ($n -match '^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$') { $n = "app-$n" }
    if ($n.Length -gt 80) { $n = $n.Substring(0, 80).TrimEnd('-', '.') }
    $n
}

function Test-FMPTxMeasured {
    param([AllowNull()][string]$Method)
    [bool]($Method -and ($script:FMPTxUnmeasured -notcontains $Method.Trim().ToLowerInvariant()))
}

function Get-FMPTransactionCatalog {
    <#
    .SYNOPSIS
        Reads and checks a transaction catalog CSV. Capture paths are resolved against the
        catalog's folder. Each row carries the problems found in it.
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $full = ConvertTo-FMPFullPath -Path $Path
    $dir = Split-Path -Parent $full
    $rows = @(Import-Csv -LiteralPath $full)
    $seen = @{}
    foreach ($r in $rows) {
        $get = { param($n) $p = $r.PSObject.Properties[$n]; if ($p -and $null -ne $p.Value) { "$($p.Value)".Trim() } else { '' } }
        $problems = @()
        $app = & $get 'Application'; $txn = & $get 'Transaction'
        if (-not $app) { $problems += 'Application is blank' }
        if (-not $txn) { $problems += 'Transaction is blank' }
        $key = "$app|$txn".ToLowerInvariant()
        if ($app -and $txn) {
            if ($seen.ContainsKey($key)) { $problems += 'Listed more than once; the first row is used' } else { $seen[$key] = $true }
        }
        $target = ConvertTo-FMPTxNumber (& $get 'TargetRttMs')
        $budget = ConvertTo-FMPTxNumber (& $get 'BudgetMs')
        if ($null -eq $target -or $target -le 0) { $problems += 'TargetRttMs is missing: the round-trip time after separation' }
        if ($null -eq $budget -or $budget -le 0) { $problems += 'BudgetMs is missing: the network wait the transaction can afford' }
        $tech = ConvertTo-FMPTxTechnique (& $get 'Techniques')
        $capture = {
            param($n)
            $v = & $get $n
            if (-not $v) { return $null }
            if ([System.IO.Path]::IsPathRooted($v)) { $v } else { [System.IO.Path]::GetFullPath((Join-Path $dir $v)) }
        }
        $baseCap = & $capture 'BaselineCapture'
        $redCap = & $capture 'ReducedCapture'
        $port = ConvertTo-FMPTxNumber (& $get 'StorePort')
        if (($baseCap -or $redCap) -and (-not (& $get 'StoreAddress') -or -not $port)) { $problems += 'A capture is named but StoreAddress or StorePort is blank' }
        $reps = ConvertTo-FMPTxNumber (& $get 'CaptureRepetitions')
        [pscustomobject]@{
            Application        = $app
            Transaction        = $txn
            Store              = & $get 'Store'
            StoreAddress       = & $get 'StoreAddress'
            StorePort          = if ($port) { [int]$port } else { $null }
            ClientAddress      = & $get 'ClientAddress'
            CurrentRttMs       = ConvertTo-FMPTxNumber (& $get 'CurrentRttMs')
            TargetRttMs        = $target
            BudgetMs           = $budget
            Techniques         = $tech.Known
            UnknownTechniques  = $tech.Unknown
            BaselineCapture    = $baseCap
            ReducedCapture     = $redCap
            CaptureRepetitions = if ($reps -and $reps -ge 1) { [int]$reps } else { 1 }
            BaselineRoundTrips = ConvertTo-FMPTxNumber (& $get 'BaselineRoundTrips')
            ReducedRoundTrips  = ConvertTo-FMPTxNumber (& $get 'ReducedRoundTrips')
            DeclaredMethod     = & $get 'DeclaredMethod'
            Owner              = & $get 'Owner'
            Notes              = & $get 'Notes'
            Duplicate          = [bool]($problems -match 'more than once')
            Problems           = @($problems)
        }
    }
}

function ConvertFrom-FMPPacketCapture {
    <#
    .SYNOPSIS
        Counts the round trips in a tshark field export of one capture.
    .DESCRIPTION
        Expects tshark -T fields -E header=y output (tab- or comma-separated) with these
        fields: frame.time_epoch (or frame.time_relative), ip.src or ipv6.src, tcp.srcport,
        ip.dst or ipv6.dst, tcp.dstport, tcp.len; and optionally tcp.stream, tcp.flags.syn
        and tcp.flags.ack.

        Per TCP connection between a client and -ServerAddress:-ServerPort, a round trip is
        a client request (one or more client packets carrying data) followed by data from
        the server. A response split over several packets is one round trip; so is a
        request split over several. Each new connection (a client SYN) adds one more, for
        the TCP handshake, and the SYN to SYN-ACK times give the measured round-trip time.
        TLS and login exchanges are counted as the data turns they are.

        -Repetitions divides the totals when the capture holds the transaction run more
        than once.
    .EXAMPLE
        ConvertFrom-FMPPacketCapture -Path .\open-case.tsv -ServerAddress 10.0.20.15 -ServerPort 1433 -Repetitions 5
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Path,
        [Parameter(Mandatory)][string]$ServerAddress,
        [Parameter(Mandatory)][int]$ServerPort,
        [string]$ClientAddress,
        [ValidateRange(1, 1000)][int]$Repetitions = 1,
        [string]$Application,
        [string]$Transaction,
        [ValidateSet('Baseline', 'Reduced')][string]$Phase = 'Baseline',
        [string]$Store,
        # Writes the measurement under <OutputPath>\transaction-profiles\measurements.
        [string]$OutputPath
    )
    $full = ConvertTo-FMPFullPath -Path $Path
    # Only the file name goes into messages and output, never the folder it was read from.
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { throw "$([System.IO.Path]::GetFileName($full)) was not found." }
    $lines = @([System.IO.File]::ReadAllText($full) -split '\r?\n' | Where-Object { $_.Trim() })
    if ($lines.Count -lt 2) { throw "$([System.IO.Path]::GetFileName($full)) has no packets." }
    $delim = if ($lines[0].Contains("`t")) { "`t" } else { ',' }
    $rows = @(ConvertFrom-Csv -InputObject $lines -Delimiter $delim)
    $headers = @($rows[0].PSObject.Properties.Name)
    $pick = { param([string[]]$names) foreach ($n in $names) { if ($headers -contains $n) { return $n } } $null }
    $colTime = & $pick 'frame.time_epoch', 'frame.time_relative'
    $need = [ordered]@{ time = $colTime; src = (& $pick 'ip.src', 'ipv6.src'); dst = (& $pick 'ip.dst', 'ipv6.dst')
        sport = (& $pick 'tcp.srcport'); dport = (& $pick 'tcp.dstport'); len = (& $pick 'tcp.len') }
    $missing = @($need.Keys | Where-Object { -not $need[$_] })
    if ($missing) {
        throw "$([System.IO.Path]::GetFileName($full)) isn't a tshark field export the kit can read: no column for $($missing -join ', '). Expected frame.time_epoch, ip.src, tcp.srcport, ip.dst, tcp.dstport and tcp.len."
    }
    $val = {
        param($r, [string[]]$names)
        foreach ($n in $names) { $p = $r.PSObject.Properties[$n]; if ($p -and "$($p.Value)".Trim() -ne '') { return "$($p.Value)".Trim() } }
        $null
    }
    $flag = { param($v) [bool]($v -and $v -match '^(?i)(1|true|set)$') }
    $server = ConvertTo-FMPTxAddress $ServerAddress
    $client = ConvertTo-FMPTxAddress $ClientAddress
    $haveSyn = $headers -contains 'tcp.flags.syn'

    $index = 0
    $packets = foreach ($r in $rows) {
        $index++
        $t = ConvertTo-FMPTxNumber (& $val $r @($colTime))
        $src = ConvertTo-FMPTxAddress (& $val $r 'ip.src', 'ipv6.src')
        $dst = ConvertTo-FMPTxAddress (& $val $r 'ip.dst', 'ipv6.dst')
        $sp = ConvertTo-FMPTxNumber (& $val $r 'tcp.srcport')
        $dp = ConvertTo-FMPTxNumber (& $val $r 'tcp.dstport')
        if ($null -eq $t -or $null -eq $sp -or $null -eq $dp) { continue }
        if ($dst -eq $server -and $dp -eq $ServerPort) { $dir = 'c2s'; $peer = $src; $peerPort = $sp }
        elseif ($src -eq $server -and $sp -eq $ServerPort) { $dir = 's2c'; $peer = $dst; $peerPort = $dp }
        else { continue }
        if ($client -and $peer -ne $client) { continue }
        $stream = & $val $r @('tcp.stream')
        [pscustomobject]@{
            Index = $index; Time = $t; Dir = $dir; Key = $(if ($stream) { "s$stream" } else { "${peer}:$peerPort" })
            Len = [int](ConvertTo-FMPTxNumber (& $val $r @('tcp.len')))
            Syn = & $flag (& $val $r @('tcp.flags.syn')); Ack = & $flag (& $val $r @('tcp.flags.ack'))
        }
    }
    $packets = @($packets | Sort-Object Time, Index)
    if (-not $packets.Count) {
        throw "$([System.IO.Path]::GetFileName($full)) has no packets between $(if ($ClientAddress) { $ClientAddress } else { 'any client' }) and ${ServerAddress}:$ServerPort."
    }

    $state = @{}
    $turns = 0; $newConn = 0; $waitMs = 0.0; $rtts = @(); $preopened = 0
    foreach ($p in $packets) {
        if (-not $state.ContainsKey($p.Key)) {
            $state[$p.Key] = @{ Awaiting = $false; LastRequest = 0.0; SynAt = $null }
            if (-not ($p.Syn -and -not $p.Ack)) { $preopened++ }
        }
        $s = $state[$p.Key]
        if ($p.Syn -and -not $p.Ack -and $p.Dir -eq 'c2s') { $newConn++; $s.SynAt = $p.Time }
        elseif ($p.Syn -and $p.Ack -and $p.Dir -eq 's2c' -and $null -ne $s.SynAt) { $rtts += ($p.Time - $s.SynAt) * 1000; $s.SynAt = $null }
        if ($p.Len -le 0) { continue }
        if ($p.Dir -eq 'c2s') { $s.Awaiting = $true; $s.LastRequest = $p.Time }
        elseif ($s.Awaiting) { $turns++; $waitMs += ($p.Time - $s.LastRequest) * 1000; $s.Awaiting = $false }
    }
    $warnings = @()
    if (-not $haveSyn) { $warnings += 'The export has no tcp.flags.syn column, so new connections and their handshakes are not counted.' }
    elseif ($preopened -gt 0) { $warnings += "$preopened connection(s) were already open when the capture began; their setup is not counted, which is right for a pooled connection and an undercount otherwise." }
    if ($turns -eq 0) { $warnings += 'No request was answered in this capture.' }
    $total = $turns + $newConn
    $first = $packets[0].Time
    $measured = if ($colTime -eq 'frame.time_epoch' -and $first -gt 0) {
        [DateTimeOffset]::FromUnixTimeMilliseconds([long]($first * 1000)).UtcDateTime.ToString('o')
    } else { [System.IO.File]::GetLastWriteTimeUtc($full).ToString('o') }
    $m = [pscustomobject][ordered]@{
        Schema                  = 'fmp-start-kit/transaction-measurement/1'
        Application             = $Application
        Transaction             = $Transaction
        Phase                   = ConvertTo-FMPTxPhase $Phase
        Method                  = 'PacketCapture'
        Store                   = $(if ($Store) { $Store } else { "${ServerAddress}:$ServerPort" })
        Source                  = [System.IO.Path]::GetFileName($full)
        MeasuredUtc             = $measured
        Repetitions             = $Repetitions
        RoundTrips              = [math]::Round($total / $Repetitions, 1)
        RoundTripsPerRepetition = @([math]::Round($total / $Repetitions, 1))
        DataTurns               = $turns
        NewConnections          = $newConn
        Connections             = $state.Count
        Packets                 = $packets.Count
        MeasuredRttMs           = $(if ($rtts.Count) { [math]::Round((Get-FMPTxMedian $rtts), 2) } else { $null })
        ServerWaitMsPerRepetition = [math]::Round($waitMs / $Repetitions, 1)
        ElapsedSeconds          = [math]::Round($packets[-1].Time - $first, 3)
        Warnings                = @($warnings)
    }
    if ($OutputPath) { Write-FMPTxMeasurement -OutputPath $OutputPath -Measurement $m -Suffix 'capture' }
    $m
}

function Write-FMPTxMeasurement {
    # Writes one measurement under <OutputPath>\transaction-profiles\measurements.
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)]$Measurement, [string]$Suffix)
    $root = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $dir = Initialize-FMPPath -Path (Join-Path (Join-Path $root 'transaction-profiles') 'measurements')
    $name = '{0}--{1}--{2}' -f (ConvertTo-FMPTxFileName "$($Measurement.Application)"), (ConvertTo-FMPTxFileName "$($Measurement.Transaction)"), "$($Measurement.Phase)".ToLowerInvariant()
    if ($Suffix) { $name += "--$Suffix" }
    $path = Join-Path $dir "$name.json"
    Write-FMPJson -InputObject $Measurement -Path $path -Depth 5
    $path
}

function Test-FMPTxWindowOpen {
    # True while the measurement window is open: until -DurationSeconds pass, or until the
    # operator presses a key. A host with no console falls back to 60 seconds.
    param([Parameter(Mandatory)][System.Diagnostics.Stopwatch]$Stopwatch, [double]$DurationSeconds)
    if ($DurationSeconds -gt 0) { return $Stopwatch.Elapsed.TotalSeconds -lt $DurationSeconds }
    try {
        if ([Console]::KeyAvailable) { $null = [Console]::ReadKey($true); return $false }
        $true
    } catch {
        $Stopwatch.Elapsed.TotalSeconds -lt 60
    }
}

function Measure-FMPSqlRoundTrip {
    <#
    .SYNOPSIS
        Measures one transaction's round trips to a SQL Server instance from the server's own
        connection counters, while an operator runs the transaction. SELECT-only.
    .DESCRIPTION
        For each repetition: snapshot sys.dm_exec_connections, let the operator run the
        transaction once in the application, keep polling until they press a key (or until
        -DurationSeconds pass), then snapshot again. The round trips in a repetition are the
        network reads SQL Server made on the application's connections in that window, plus
        one per connection the application opened in it, for the TCP handshake.

        The application's connections are picked out by -HostName, -ProgramName, -LoginName
        and -ClientAddress (all that are given must match); at least one is required. Run it
        when no one else is using the application from the same host, or the count includes
        their work too.

        num_reads counts network reads, so a request larger than the packet size counts more
        than once and the figure is an upper bound on requests. A connection that closes
        between two polls loses its last reads, so the figure is a lower bound for an
        application that doesn't pool connections; the measurement says when that happened.
        A packet capture has neither limit.

        Needs VIEW SERVER STATE (SQL Server 2022 and later: VIEW SERVER PERFORMANCE STATE).
        Writes the measurement under <OutputPath>\transaction-profiles\measurements.
    .EXAMPLE
        Measure-FMPSqlRoundTrip -OutputPath D:\Assessment\profiles -ServerName sql01 -InstanceName HR -Application Payroll -Transaction 'Submit timesheet' -HostName APP07 -ProgramName 'Payroll Client'
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [Parameter(Mandatory)][string]$ServerName,
        [string]$InstanceName,
        [int]$Port,
        [switch]$TrustServerCertificate,
        [Parameter(Mandatory)][string]$Application,
        [Parameter(Mandatory)][string]$Transaction,
        [ValidateSet('Baseline', 'Reduced')][string]$Phase = 'Baseline',
        [string]$HostName,
        [string]$ProgramName,
        [string]$LoginName,
        [string]$ClientAddress,
        [ValidateRange(1, 100)][int]$Repetitions = 3,
        # 0 (the default) waits for a key press after each run of the transaction.
        [double]$DurationSeconds = 0,
        [ValidateRange(1, 10000)][int]$IntervalMilliseconds = 250,
        [string]$Store,
        [datetime]$AsOf = (Get-Date)
    )
    if (-not ($HostName -or $ProgramName -or $LoginName -or $ClientAddress)) {
        throw 'Name the application''s sessions with -HostName, -ProgramName, -LoginName or -ClientAddress; without one, every session on the instance would be counted.'
    }
    $cs = Get-FMPSqlConnectionString -ServerName $ServerName -InstanceName $InstanceName -Port $Port -TrustServerCertificate:$TrustServerCertificate
    $clientIp = ConvertTo-FMPTxAddress $ClientAddress
    $match = {
        param($c)
        (-not $HostName -or "$($c.host_name)" -eq $HostName) -and
        (-not $ProgramName -or "$($c.program_name)" -eq $ProgramName) -and
        (-not $LoginName -or "$($c.login_name)" -eq $LoginName) -and
        (-not $clientIp -or (ConvertTo-FMPTxAddress "$($c.client_net_address)") -eq $clientIp)
    }
    $windows = @()
    for ($rep = 1; $rep -le $Repetitions; $rep++) {
        if ($DurationSeconds -le 0) {
            $null = Read-Host "Repetition $rep of ${Repetitions}: press Enter, run '$Transaction' once in $Application, then press any key when it has finished"
        } else {
            Write-Host "Repetition $rep of ${Repetitions}: run '$Transaction' once in $Application now ($DurationSeconds seconds)."
        }
        $conns = @{}
        $sample = 0
        $take = {
            $snap = Get-FMPSqlSessionCounter -ConnectionString $cs
            $sample++
            if ($sample -eq 1) { $windowStart = $snap.ServerTime }
            foreach ($c in @($snap.Connections | Where-Object { & $match $_ })) {
                $id = "$($c.connection_id)"
                $reads = [long](ConvertTo-FMPTxNumber $c.num_reads)
                $writes = [long](ConvertTo-FMPTxNumber $c.num_writes)
                if (-not $conns.ContainsKey($id)) {
                    $isNew = $null -ne $windowStart -and $null -ne $c.connect_time -and ([datetime]$c.connect_time) -ge ([datetime]$windowStart)
                    $conns[$id] = @{ New = $isNew; BaseReads = $(if ($isNew) { 0 } else { $reads }); BaseWrites = $(if ($isNew) { 0 } else { $writes }) }
                }
                $conns[$id].Reads = $reads; $conns[$id].Writes = $writes; $conns[$id].Seen = $sample
            }
        }
        $windowStart = $null
        . $take
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        while (Test-FMPTxWindowOpen -Stopwatch $sw -DurationSeconds $DurationSeconds) {
            [System.Threading.Thread]::Sleep($IntervalMilliseconds)
            . $take
        }
        . $take
        $reads = 0; $writes = 0; $new = 0; $closed = 0
        foreach ($v in $conns.Values) {
            $reads += [math]::Max(0, $v.Reads - $v.BaseReads); $writes += [math]::Max(0, $v.Writes - $v.BaseWrites)
            if ($v.New) { $new++ }
            if ($v.Seen -lt $sample) { $closed++ }
        }
        $windows += [pscustomobject]@{ Repetition = $rep; Samples = $sample; Connections = $conns.Count; NewConnections = $new; ClosedDuringWindow = $closed
            NetworkReads = $reads; NetworkWrites = $writes; RoundTrips = $reads + $new; Seconds = [math]::Round($sw.Elapsed.TotalSeconds, 1) }
    }
    $warnings = @()
    foreach ($w in $windows | Where-Object Connections -eq 0) { $warnings += "Repetition $($w.Repetition) saw no matching connection; check the filter." }
    $closedTotal = ($windows | Measure-Object -Property ClosedDuringWindow -Sum).Sum
    if ($closedTotal -gt 0) { $warnings += "$closedTotal connection(s) closed between polls, so their last reads were not counted and the figure is a lower bound. Confirm it with a packet capture." }
    $counts = @($windows | ForEach-Object { $_.RoundTrips })
    $median = Get-FMPTxMedian $counts
    $spread = ($counts | Measure-Object -Maximum -Minimum)
    if ($median -gt 0 -and ($spread.Maximum - $spread.Minimum) / $median -gt 0.2) {
        $warnings += "The repetitions disagree by more than 20% ($($spread.Minimum) to $($spread.Maximum)); something else may have used the same connections."
    }
    $filter = [ordered]@{ HostName = $HostName; ProgramName = $ProgramName; LoginName = $LoginName; ClientAddress = $ClientAddress }
    $m = [pscustomobject][ordered]@{
        Schema                  = 'fmp-start-kit/transaction-measurement/1'
        Application             = $Application
        Transaction             = $Transaction
        Phase                   = $Phase
        Method                  = 'SqlDmv'
        Store                   = $(if ($Store) { $Store } elseif ($InstanceName) { "$ServerName\$InstanceName" } else { $ServerName })
        Source                  = 'sys.dm_exec_connections'
        MeasuredUtc             = $AsOf.ToUniversalTime().ToString('o')
        Repetitions             = $Repetitions
        RoundTrips              = $median
        RoundTripsPerRepetition = $counts
        NewConnections          = Get-FMPTxMedian @($windows | ForEach-Object { $_.NewConnections })
        MeasuredRttMs           = $null
        Filter                  = $filter
        Windows                 = $windows
        Warnings                = @($warnings)
    }
    $null = Write-FMPTxMeasurement -OutputPath $OutputPath -Measurement $m -Suffix ('sqldmv-' + $AsOf.ToUniversalTime().ToString('yyyyMMddHHmmss'))
    $m
}

function Measure-FMPTcpRoundTrip {
    <#
    .SYNOPSIS
        The round-trip time to a TCP port, from TCP connection setup: the median of -Count
        connects, each closed at once without sending anything. Run it from where the
        application runs (today's figure) or will run (the target figure).
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$ComputerName,
        [Parameter(Mandatory)][int]$Port,
        [ValidateRange(1, 50)][int]$Count = 5,
        [int]$TimeoutMilliseconds = 2000
    )
    $samples = @(); $failures = 0
    for ($i = 0; $i -lt $Count; $i++) {
        $tcp = [System.Net.Sockets.TcpClient]::new()
        try {
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            $task = $tcp.ConnectAsync($ComputerName, $Port)
            if ($task.Wait($TimeoutMilliseconds) -and $tcp.Connected) { $samples += $sw.Elapsed.TotalMilliseconds } else { $failures++ }
        } catch { $failures++ }
        finally { $tcp.Dispose() }
    }
    [pscustomobject]@{
        ComputerName = $ComputerName; Port = $Port; Samples = $samples.Count; Failures = $failures
        MedianMs = $(if ($samples.Count) { [math]::Round((Get-FMPTxMedian $samples), 2) } else { $null })
        MinMs = $(if ($samples.Count) { [math]::Round(($samples | Measure-Object -Minimum).Minimum, 2) } else { $null })
    }
}

function Select-FMPTxMeasurement {
    # The measurement used for one transaction and phase: measured methods only, newest first.
    param([object[]]$Measurements, [string]$Application, [string]$Transaction, [string]$Phase)
    @($Measurements | Where-Object {
            "$($_.Application)" -eq $Application -and "$($_.Transaction)" -eq $Transaction -and $_.Phase -eq $Phase -and
            (Test-FMPTxMeasured $_.Method) -and $null -ne (ConvertTo-FMPTxNumber $_.RoundTrips)
        } | Sort-Object { "$($_.MeasuredUtc)" } -Descending)[0]
}

function Get-FMPTransactionProfile {
    <#
    .SYNOPSIS
        One profile per catalog transaction: the measured round trips before and after
        reduction, what they cost at the target round-trip time, and the gate result.
    .DESCRIPTION
        Status and gate:
          Incomplete         the catalog row lacks a target round-trip time or a budget  Blocked
          NotProfiled        no measured baseline                                         Blocked
          NotReduced         baseline over budget, no measurement after reduction         Blocked
          ReducedOverBudget  measured after reduction, still over budget                  Blocked
          Reduced            measured after reduction, within budget                      Pass
          WithinBudget       baseline already within budget; nothing to reduce            Pass
    #>
    [CmdletBinding()]
    param([object[]]$Catalog = @(), [object[]]$Measurements = @())
    foreach ($c in @($Catalog | Where-Object { $_.Application -and $_.Transaction -and -not $_.Duplicate })) {
        $base = Select-FMPTxMeasurement $Measurements $c.Application $c.Transaction 'Baseline'
        $red = Select-FMPTxMeasurement $Measurements $c.Application $c.Transaction 'Reduced'
        $baseRt = if ($base) { [double](ConvertTo-FMPTxNumber $base.RoundTrips) } else { $null }
        $redRt = if ($red) { [double](ConvertTo-FMPTxNumber $red.RoundTrips) } else { $null }
        $rtt = $c.CurrentRttMs; $rttSource = if ($null -ne $rtt) { 'catalog' } else { $null }
        if ($null -eq $rtt) {
            $m = @(@($base, $red) | Where-Object { $_ -and $null -ne $_.MeasuredRttMs })[0]
            if ($m) { $rtt = [double]$m.MeasuredRttMs; $rttSource = "$($m.Method) handshake" }
        }
        $target = $c.TargetRttMs; $budget = $c.BudgetMs
        $complete = $null -ne $target -and $target -gt 0 -and $null -ne $budget -and $budget -gt 0
        $allowed = if ($complete) { [math]::Floor($budget / $target) } else { $null }
        $cost = { param($n) if ($null -ne $n -and $complete) { [math]::Round($n * $target, 1) } else { $null } }
        $used = if ($null -ne $redRt) { $redRt } else { $baseRt }
        if (-not $complete) { $status = 'Incomplete'; $reason = (@($c.Problems | Where-Object { $_ -match 'RttMs|BudgetMs' }) -join '; ') }
        elseif ($null -eq $baseRt) { $status = 'NotProfiled'; $reason = 'No measured baseline' }
        elseif ($null -ne $redRt) {
            if ($redRt -le $allowed) { $status = 'Reduced'; $reason = "Reduced from $baseRt to $redRt round trips; $allowed fit the budget" }
            else { $status = 'ReducedOverBudget'; $reason = "Reduced from $baseRt to $redRt round trips; only $allowed fit the budget" }
        } elseif ($baseRt -le $allowed) { $status = 'WithinBudget'; $reason = "$baseRt round trips already fit the budget of $allowed; nothing to reduce" }
        else { $status = 'NotReduced'; $reason = "$baseRt round trips; $allowed fit the budget" }
        [pscustomobject][ordered]@{
            Application            = $c.Application
            Transaction            = $c.Transaction
            Store                  = $c.Store
            Owner                  = $c.Owner
            Status                 = $status
            Gate                   = $(if ($status -in 'Reduced', 'WithinBudget') { 'Pass' } else { 'Blocked' })
            Reason                 = $reason
            BaselineRoundTrips     = $baseRt
            BaselineMethod         = $(if ($base) { $base.Method } else { $null })
            BaselineSource         = $(if ($base) { $base.Source } else { $null })
            ReducedRoundTrips      = $redRt
            ReducedMethod          = $(if ($red) { $red.Method } else { $null })
            ReducedSource          = $(if ($red) { $red.Source } else { $null })
            Techniques             = @($c.Techniques)
            CurrentRttMs           = $rtt
            CurrentRttSource       = $rttSource
            TargetRttMs            = $target
            BudgetMs               = $budget
            RoundTripsAllowed      = $allowed
            RoundTripsToRemove     = $(if ($null -ne $used -and $null -ne $allowed) { [math]::Max(0, [math]::Ceiling($used - $allowed)) } else { $null })
            WaitTodayMs            = $(if ($null -ne $used -and $null -ne $rtt) { [math]::Round($used * $rtt, 1) } else { $null })
            BaselineWaitAtTargetMs = & $cost $baseRt
            ReducedWaitAtTargetMs  = & $cost $redRt
            AddedBySeparationMs    = $(if ($null -ne $used -and $null -ne $rtt -and $complete) { [math]::Round($used * ($target - $rtt), 1) } else { $null })
        }
    }
}

function Test-FMPSeparationGate {
    <#
    .SYNOPSIS
        Book 01 Chapter 11's "profiled and reduced" check, per application: it passes only
        when every listed transaction passes.
    #>
    [CmdletBinding()]
    param([object[]]$Profiles = @())
    foreach ($g in @($Profiles | Group-Object -Property Application | Sort-Object Name)) {
        $blocked = @($g.Group | Where-Object Gate -ne 'Pass')
        [pscustomobject][ordered]@{
            Application         = $g.Name
            Gate                = $(if ($blocked.Count) { 'Blocked' } else { 'Pass' })
            Transactions        = $g.Count
            Passing             = $g.Count - $blocked.Count
            Blocked             = $blocked.Count
            BlockedTransactions = (@($blocked | ForEach-Object { "$($_.Transaction) ($($_.Status))" }) -join '; ')
            MostRoundTripsToRemove = @($g.Group | ForEach-Object { $_.RoundTripsToRemove } | Where-Object { $null -ne $_ } | Sort-Object -Descending)[0]
        }
    }
}

function Get-FMPTransactionFinding {
    <#
    .SYNOPSIS
        What the profiles show that a reviewer must act on before approving a separation.
    #>
    [CmdletBinding()]
    param([object[]]$Profiles = @(), [object[]]$Catalog = @(), [object[]]$Measurements = @(), [object[]]$Errors = @())
    $f = {
        param($sev, $app, $txn, $finding, $detail)
        [pscustomobject][ordered]@{ Severity = $sev; Application = $app; Transaction = $txn; Finding = $finding; Detail = $detail; Reference = $script:FMPTxBook }
    }
    foreach ($p in $Profiles) {
        switch ($p.Status) {
            'NotProfiled' { & $f 'High' $p.Application $p.Transaction 'No measured baseline' 'The application may not leave its data until this transaction''s round trips are measured.' }
            'NotReduced' { & $f 'Medium' $p.Application $p.Transaction 'Over budget, not yet reduced' "Remove $($p.RoundTripsToRemove) round trips (from $($p.BaselineRoundTrips) to $($p.RoundTripsAllowed) or fewer), then measure again." }
            'ReducedOverBudget' { & $f 'High' $p.Application $p.Transaction 'Still over budget after reduction' "$($p.ReducedRoundTrips) round trips at $($p.TargetRttMs) ms is $($p.ReducedWaitAtTargetMs) ms against a budget of $($p.BudgetMs) ms; remove $($p.RoundTripsToRemove) more." }
            'Incomplete' { & $f 'Medium' $p.Application $p.Transaction 'Catalog row incomplete' $p.Reason }
        }
        $tech = @($p.Techniques)
        if ($tech.Count -eq 1 -and $tech[0] -eq 'ConnectionPooling') {
            & $f 'Medium' $p.Application $p.Transaction 'Connection pooling is the only technique' 'Pooling removes connection setup, not the data round trips; it can''t reduce a transaction below the requests it makes.'
        }
        if ($null -ne $p.ReducedRoundTrips -and $p.ReducedRoundTrips -lt $p.BaselineRoundTrips -and $tech.Count -eq 0) {
            & $f 'Low' $p.Application $p.Transaction 'Reduction not explained' 'Record which techniques removed the round trips, so the plan reviewer can judge whether they hold under load.'
        }
        if ($p.BaselineMethod -and $p.ReducedMethod -and $p.BaselineMethod -ne $p.ReducedMethod) {
            & $f 'Low' $p.Application $p.Transaction 'Before and after measured differently' "Baseline by $($p.BaselineMethod), after reduction by $($p.ReducedMethod); the two counts may not be comparable."
        }
        if ($null -eq $p.CurrentRttMs -and $p.Status -ne 'Incomplete') {
            & $f 'Info' $p.Application $p.Transaction 'Today''s round-trip time unknown' 'Add CurrentRttMs to the catalog (Measure-FMPTcpRoundTrip from the application host) to show what separation adds.'
        }
    }
    foreach ($c in $Catalog) {
        foreach ($u in @($c.UnknownTechniques)) { & $f 'Low' $c.Application $c.Transaction 'Unknown technique' "'$u' isn't one of Book 01's techniques: $($script:FMPTxTechniques.Keys -join ', ')." }
        if ($c.Duplicate) { & $f 'Low' $c.Application $c.Transaction 'Listed twice in the catalog' 'The first row is used.' }
        if (($null -ne $c.BaselineRoundTrips -or $null -ne $c.ReducedRoundTrips) -and -not (Test-FMPTxMeasured $c.DeclaredMethod)) {
            $how = if ($c.DeclaredMethod) { "'$($c.DeclaredMethod)'" } else { 'no method' }
            & $f 'Medium' $c.Application $c.Transaction 'Round trips entered without a measurement' "The catalog gives a figure with $how; it is ignored. Name the tool that measured it in DeclaredMethod, or measure it."
        }
    }
    foreach ($m in $Measurements) {
        foreach ($w in @($m.Warnings)) { & $f 'Low' $m.Application $m.Transaction "Measurement caveat ($($m.Method), $($m.Phase))" $w }
    }
    foreach ($e in $Errors) { & $f 'Medium' $e.Application $e.Transaction $(if ($e.Application) { 'Capture not read' } else { 'Measurement file not read' }) $e.Error }
}

function Read-FMPTxMeasurementFile {
    # Measurement JSON files under the given folders. Other JSON is skipped; a file that
    # isn't JSON comes back as a ReadError, so it is reported rather than dropped.
    param([string[]]$Path = @())
    foreach ($p in $Path) {
        if (-not $p -or -not (Test-Path -LiteralPath $p)) { continue }
        foreach ($file in @(Get-ChildItem -LiteralPath $p -Recurse -File -Filter '*.json')) {
            try { $m = [System.IO.File]::ReadAllText($file.FullName) | ConvertFrom-Json }
            catch { [pscustomobject]@{ ReadError = "$($file.Name) is not valid JSON." }; continue }
            if ($m.Schema -eq 'fmp-start-kit/transaction-measurement/1') {
                $m.Phase = ConvertTo-FMPTxPhase "$($m.Phase)"
                # PowerShell 7 turns ISO dates into DateTime; keep one spelling.
                if ($m.MeasuredUtc -is [datetime]) { $m.MeasuredUtc = $m.MeasuredUtc.ToUniversalTime().ToString('o') }
                $m
            }
        }
    }
}

function Invoke-FMPTransactionProfile {
    <#
    .SYNOPSIS
        Builds the transaction profiles and the separation gate. Read-only; writes only under
        -OutputPath.
    .DESCRIPTION
        Reads the catalog, every measurement file under -MeasurementPath, the captures the
        catalog names, and any figures it declares, and writes, under
        <OutputPath>\transaction-profiles:
          TransactionProfiles.csv     one row per transaction: counts, costs, status, gate
          SeparationGate.csv          one row per application: Pass only if every transaction passes
          Measurements.csv            every measurement used or considered
          TransactionFindings.csv     what blocks a separation, and measurement caveats
          TransactionProfiles.json    all of the above, with the catalog
          TransactionSummary.json     the counts
          applications\<name>.json    one file per application, for its plan review
          measurements\*.json         the measurements read from the captures
        With no catalog it writes TransactionCatalog.template.csv to fill in, and a summary
        that says so.
    .EXAMPLE
        Invoke-FMPTransactionProfile -OutputPath D:\Assessment\run1 -CatalogPath D:\Profiles\TransactionCatalog.csv -MeasurementPath D:\Profiles
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$CatalogPath,
        [string[]]$MeasurementPath = @(),
        [datetime]$AsOf = (Get-Date)
    )
    $root = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $tp = Initialize-FMPPath -Path (Join-Path $root 'transaction-profiles')
    if (-not $CatalogPath -or -not (Test-Path -LiteralPath $CatalogPath)) {
        $example = [ordered]@{}
        foreach ($k in $script:FMPTxCatalogColumns) { $example[$k] = '' }
        $example.Application = 'Payroll (example: replace or delete this row)'; $example.Transaction = 'Submit timesheet'
        $example.Store = 'sql01\HR'; $example.StoreAddress = '10.0.20.15'; $example.StorePort = '1433'; $example.ClientAddress = '10.0.30.40'
        $example.CurrentRttMs = '0.5'; $example.TargetRttMs = '30'; $example.BudgetMs = '300'; $example.Techniques = 'Aggregation;Caching'
        $example.BaselineCapture = 'captures\payroll-submit-baseline.tsv'; $example.CaptureRepetitions = '5'
        Write-FMPCsv -InputObject @([pscustomobject]$example) -Path (Join-Path $tp 'TransactionCatalog.template.csv')
        $summary = [ordered]@{ Status = 'NoCatalog'; Applications = 0; Transactions = 0; Measurements = 0; ApplicationsPassing = 0; ApplicationsBlocked = 0
            ByStatus = [ordered]@{}; FindingsBySeverity = [ordered]@{}
            Note = 'No transaction catalog was given. Fill in TransactionCatalog.template.csv for each application proposed to move away from its data, and run again with -CatalogPath.' }
        Write-FMPJson -InputObject $summary -Path (Join-Path $tp 'TransactionSummary.json') -Depth 4
        Write-Verbose 'Transaction profiles: no catalog; template written.'
        return [pscustomobject]@{ Profiles = @(); Gate = @(); Findings = @(); Summary = $summary }
    }

    $catalog = @(Get-FMPTransactionCatalog -Path $CatalogPath)
    $read = @(Read-FMPTxMeasurementFile -Path (@($MeasurementPath) + (Join-Path $tp 'measurements')))
    $measurements = @($read | Where-Object { -not $_.PSObject.Properties['ReadError'] })
    $errors = @($read | Where-Object { $_.PSObject.Properties['ReadError'] } | ForEach-Object { [pscustomobject]@{ Application = $null; Transaction = $null; Error = $_.ReadError } })
    foreach ($c in @($catalog | Where-Object { -not $_.Duplicate -and $_.StoreAddress -and $_.StorePort })) {
        foreach ($phase in 'Baseline', 'Reduced') {
            $cap = $c."${phase}Capture"
            if (-not $cap) { continue }
            try {
                $measurements += ConvertFrom-FMPPacketCapture -Path $cap -ServerAddress $c.StoreAddress -ServerPort $c.StorePort -ClientAddress $c.ClientAddress `
                    -Repetitions $c.CaptureRepetitions -Application $c.Application -Transaction $c.Transaction -Phase $phase -Store $c.Store -OutputPath $root
            } catch {
                $errors += [pscustomobject]@{ Application = $c.Application; Transaction = $c.Transaction; Error = "${phase}: $($_.Exception.Message)" }
            }
        }
    }
    foreach ($c in @($catalog | Where-Object { -not $_.Duplicate })) {
        foreach ($phase in 'Baseline', 'Reduced') {
            $n = $c."${phase}RoundTrips"
            if ($null -eq $n) { continue }
            $measurements += [pscustomobject][ordered]@{
                Schema = 'fmp-start-kit/transaction-measurement/1'; Application = $c.Application; Transaction = $c.Transaction; Phase = $phase
                Method = $(if ($c.DeclaredMethod) { $c.DeclaredMethod } else { 'Undeclared' }); Store = $c.Store; Source = 'catalog'
                MeasuredUtc = $AsOf.ToUniversalTime().ToString('o'); Repetitions = $null; RoundTrips = $n; RoundTripsPerRepetition = @($n)
                MeasuredRttMs = $null; Warnings = @()
            }
        }
    }
    # A capture read by an earlier run into the same folder is the same measurement.
    $measurements = @($measurements | Group-Object { '{0}|{1}|{2}|{3}|{4}|{5}' -f $_.Application, $_.Transaction, $_.Phase, $_.Method, $_.Source, $_.MeasuredUtc } | ForEach-Object { $_.Group[0] })
    $profiles = @(Get-FMPTransactionProfile -Catalog $catalog -Measurements $measurements)
    $gate = @(Test-FMPSeparationGate -Profiles $profiles)
    $findings = @(Get-FMPTransactionFinding -Profiles $profiles -Catalog $catalog -Measurements $measurements -Errors $errors)
    $summary = [ordered]@{
        Status              = 'Read'
        Applications        = $gate.Count
        Transactions        = $profiles.Count
        Measurements        = $measurements.Count
        ApplicationsPassing = @($gate | Where-Object Gate -eq 'Pass').Count
        ApplicationsBlocked = @($gate | Where-Object Gate -ne 'Pass').Count
        ByStatus            = Get-FMPTxCountTable -Rows $profiles -Property Status
        FindingsBySeverity  = Get-FMPTxCountTable -Rows $findings -Property Severity
    }
    $flat = {
        param($Rows)
        foreach ($r in @($Rows)) {
            $o = [ordered]@{}
            foreach ($p in $r.PSObject.Properties) {
                if ($p.Name -in 'Windows', 'Filter') { continue }
                $o[$p.Name] = $(if ($p.Value -is [array]) { @($p.Value) -join ';' } else { $p.Value })
            }
            [pscustomobject]$o
        }
    }
    Write-FMPCsv -InputObject @(& $flat $profiles) -Path (Join-Path $tp 'TransactionProfiles.csv')
    Write-FMPCsv -InputObject $gate -Path (Join-Path $tp 'SeparationGate.csv')
    Write-FMPCsv -InputObject @(& $flat ($measurements | Sort-Object Application, Transaction, Phase)) -Path (Join-Path $tp 'Measurements.csv')
    Write-FMPCsv -InputObject $findings -Path (Join-Path $tp 'TransactionFindings.csv')
    $meta = [ordered]@{
        Schema = 'fmp-start-kit/transaction-profiles/1'; KitVersion = $script:FMPKitVersion; GeneratedUtc = $AsOf.ToUniversalTime().ToString('o')
        Catalog = [System.IO.Path]::GetFileName($CatalogPath); Techniques = $script:FMPTxTechniques
        Rule = 'Network wait after separation = round trips x target round-trip time; it must not exceed the budget (Book 01 Chapter 07 and Chapter 10; Book 09 Chapter 01).'
    }
    $doc = [ordered]@{ Metadata = $meta; Summary = $summary; Gate = $gate; Profiles = $profiles; Measurements = $measurements; Findings = $findings
        Catalog = @($catalog | Select-Object * -ExcludeProperty BaselineCapture, ReducedCapture) }
    Write-FMPJson -InputObject $doc -Path (Join-Path $tp 'TransactionProfiles.json') -Depth 6
    Write-FMPJson -InputObject $summary -Path (Join-Path $tp 'TransactionSummary.json') -Depth 4
    $appDir = Initialize-FMPPath -Path (Join-Path $tp 'applications')
    $used = @{}
    foreach ($g in $gate) {
        $name = ConvertTo-FMPTxFileName $g.Application
        $n = $name; $i = 2
        while ($used.ContainsKey($n)) { $n = "$name-$i"; $i++ }
        $used[$n] = $true
        $app = [ordered]@{ Metadata = $meta; Gate = $g
            Profiles = @($profiles | Where-Object Application -eq $g.Application)
            Measurements = @($measurements | Where-Object Application -eq $g.Application)
            Findings = @($findings | Where-Object Application -eq $g.Application) }
        Write-FMPJson -InputObject $app -Path (Join-Path $appDir "$n.json") -Depth 6
    }
    Write-Verbose "Transaction profiles: $($summary.Transactions) transactions in $($summary.Applications) applications; $($summary.ApplicationsPassing) clear the gate."
    [pscustomobject]@{ Profiles = $profiles; Gate = $gate; Findings = $findings; Measurements = $measurements; Summary = $summary }
}

function Get-FMPTxCountTable {
    param([object[]]$Rows, [string]$Property)
    $o = [ordered]@{}
    foreach ($g in (@($Rows) | Group-Object -Property $Property | Sort-Object Name)) { $o["$($g.Name)"] = $g.Count }
    $o
}

Export-ModuleMember -Function @(
    'Get-FMPTransactionCatalog', 'ConvertFrom-FMPPacketCapture', 'Measure-FMPSqlRoundTrip', 'Measure-FMPTcpRoundTrip',
    'Get-FMPTransactionProfile', 'Test-FMPSeparationGate', 'Get-FMPTransactionFinding', 'Invoke-FMPTransactionProfile'
)
