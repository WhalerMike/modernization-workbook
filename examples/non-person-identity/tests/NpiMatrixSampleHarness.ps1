<#
    Chapter 03's harness for Learn's own decision tables, pinned unmodified in
    examples/third_party/entra-service-account-choice-pages. The tables exist only inside the
    Learn pages, so the harness reads them from the pinned page source at test time and evaluates
    them as published: no edits, no extra rows. Each test in NpiMatrix.Tests.ps1's sample block
    pins one thing a table decides or leaves to you.
#>

$script:ChoiceRoot = Join-Path $PSScriptRoot '../../third_party/entra-service-account-choice-pages'
$script:ChoicePages = @{
    OnPremises    = Join-Path $script:ChoiceRoot 'service-accounts-on-premises.md'
    Cloud         = Join-Path $script:ChoiceRoot 'secure-service-accounts.md'
    WorkloadIdFaq = Join-Path $script:ChoiceRoot 'workload-identities-faqs.md'
}

function ConvertFrom-LearnCell {
    param([string]$Text)
    $t = $Text -replace '&nbsp;', ' ' -replace '<br\s*/?>', ' ' -replace '\*\*', ''
    ($t -replace '\s+', ' ').Trim()
}

function Get-LearnChoiceTable {
    <# The first Markdown table in a pinned page, as objects keyed by its header row. #>
    param([Parameter(Mandatory)][ValidateSet('OnPremises', 'Cloud', 'WorkloadIdFaq')][string]$Page)
    $lines = Get-Content -LiteralPath $script:ChoicePages[$Page]
    $start = -1
    for ($i = 0; $i -lt $lines.Count - 1; $i++) { if ($lines[$i] -match '^\s*\|' -and $lines[$i + 1] -match '^\s*\|\s*:?-') { $start = $i; break } }
    if ($start -lt 0) { throw "No table in the pinned $Page page." }
    $split = { param($l) $c = @($l.Trim() -split '\|'); if ($c[0] -eq '') { $c = $c[1..($c.Count - 1)] }; @($c | ForEach-Object { ConvertFrom-LearnCell $_ }) }
    $head = @(& $split $lines[$start] | Where-Object { $_ })
    $rows = [Collections.Generic.List[object]]::new()
    for ($i = $start + 2; $i -lt $lines.Count -and $lines[$i] -match '^\s*\|'; $i++) {
        $cells = @(& $split $lines[$i])
        $o = [ordered]@{}
        for ($k = 0; $k -lt $head.Count; $k++) { $o[$head[$k]] = if ($k -lt $cells.Count) { $cells[$k] } else { '' } }
        $rows.Add([pscustomobject]$o)
    }
    [pscustomobject]@{ Columns = $head; Rows = $rows.ToArray() }
}

function Invoke-LearnOnPremisesChoice {
    <#
    .SYNOPSIS
        Learn's "Choose the right type of service account" table, evaluated as published: a column
        is admissible when every criterion that applies to the app says "Yes"; the first admissible
        column in the page's order (gMSA, sMSA, computer account, user account) is the choice.
    #>
    param([int]$Servers = 1, [switch]$LoadBalancer, [string]$WindowsServer, [switch]$RestrictToOneServer)
    $t = Get-LearnChoiceTable -Page OnPremises
    $applies = @()
    $applies += if ($Servers -le 1) { 'App runs on a single server' } else { 'App runs on multiple servers' }
    if ($LoadBalancer) { $applies += 'App runs behind a load balancer' }
    if ($WindowsServer) { $applies += "App runs on Windows Server $WindowsServer" }
    if ($RestrictToOneServer) { $applies += 'Requirement to restrict service account to single server' }
    $rows = @($t.Rows | Where-Object { $_.Criterion -in $applies })
    if ($rows.Count -ne $applies.Count) { throw "The table has no row for: $(@($applies | Where-Object { $_ -notin $rows.Criterion }) -join ', ')" }
    $accounts = @($t.Columns | Select-Object -Skip 1)
    $admissible = @($accounts | Where-Object { $c = $_; -not @($rows | Where-Object { $_.$c -notmatch '^Yes' }).Count })
    [pscustomobject]@{ Choice = $(if ($admissible) { $admissible[0] } else { $null }); Admissible = $admissible; Columns = $accounts; Cells = $rows }
}

function Invoke-LearnCloudChoice {
    <#
    .SYNOPSIS
        Learn's cloud service account table, evaluated as published: the column marked "Recommended"
        for the hosting row, else the first "Yes".
    #>
    param([Parameter(Mandatory)][ValidateSet('Azure', 'NotAzure', 'MultiTenant')][string]$Hosting)
    $t = Get-LearnChoiceTable -Page Cloud
    $label = @{ Azure = 'Service is hosted in Azure.'; NotAzure = 'Service is not hosted in Azure.'; MultiTenant = 'Service is multi-tenant' }[$Hosting]
    $row = @($t.Rows | Where-Object { $_.'Service hosting' -eq $label })
    if ($row.Count -ne 1) { throw "No row '$label' in the pinned table." }
    $accounts = @($t.Columns | Select-Object -Skip 1)
    $rec = @($accounts | Where-Object { $row[0].$_ -match '^Yes.*Recommended' })
    $yes = @($accounts | Where-Object { $row[0].$_ -match '^Yes' })
    [pscustomobject]@{ Choice = $(if ($rec) { $rec[0] } elseif ($yes) { $yes[0] } else { $null }); Cell = $(if ($rec) { $row[0].($rec[0]) } else { '' }); Columns = $accounts; Row = $row[0] }
}

function Get-LearnWorkloadIdFeature {
    <# The Free and Premium capability table from Learn's Workload ID FAQ, without its section rows. #>
    $t = Get-LearnChoiceTable -Page WorkloadIdFaq
    @($t.Rows | Where-Object { $_.Free -or $_.Premium } | ForEach-Object { [pscustomobject]@{ Capability = $_.Capabilities; Free = ($_.Free -eq 'Yes'); Premium = ($_.Premium -eq 'Yes') } })
}
