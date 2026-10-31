#Requires -Version 5.1
<#
.SYNOPSIS
    The attribute survey and wave lists for the Start Kit: how fully, and how well, Active
    Directory holds the attributes the Attribute-Driven Migration depends on, across every
    domain tree of the forest, and the migration waves those attributes define.

.DESCRIPTION
    Get-FMPAttributeSurvey reads every user in every domain of the forest: the enterprise
    person key (employeeID), employeeNumber, employeeType, department, manager, office and
    city, userPrincipalName and mail, and extensionAttribute1 to 15. It writes, under
    <OutputPath>\AttributeSurvey:
      ad-user-export.csv  one row per user; the export the validation kit's VK-SYNC-01 and
                          VK-SYNC-03 and the HCM correlation tool read (personal data)
      FillRate.csv        per domain and for the forest, how many enabled users hold each
                          attribute
      ValueQuality.csv    one row per value that breaks a rule: key format, duplicate keys,
                          UPNs and mail, stray whitespace, codes not on the code list,
                          display strings in coded slots, managers missing, disabled or
                          without a key
      SlotUsage.csv       extensionAttribute1 to 15: free, in use, or a coded slot
      GcCoverage.csv      for each attribute, whether the schema puts it in the Global
                          Catalog, and where the survey read it from
      AttributeSurvey.json  the counts, for the Start Kit summary

    The Global Catalog holds every domain's users but only the attributes in the partial
    attribute set. Learn's schema reference lists employeeID, employeeType and department
    as not in the Global Catalog by default and manager as in it, and Exchange's schema
    preparation and local changes alter the set. So the survey reads the schema's
    isMemberOfPartialAttributeSet for each attribute at run time, reads the Global Catalog
    (port 3268) once per domain naming context for the attributes it holds, and reads the
    rest from a domain controller of each domain, joined on objectGUID. A domain whose
    read fails is recorded as not collected, never as empty.

    Get-FMPWaveList turns the export into migration waves: from a wave plan (wave-plan.csv:
    WaveId, Attribute, Value), or one wave per value of an attribute (the organization code
    slot by default). Devices and servers join their owner's wave from an ownership list.
    It writes waves.csv (one row per user, device or server in a wave), wave-summary.csv
    and wave-exclusions.csv (each object left out, with the reason) under <OutputPath>\Waves.
    The validation kit reads waves.csv to run its HR checks on one wave.

    Nothing here writes to Active Directory. Every file goes under -OutputPath.

    Illustrative: unit-tested against fixtures, not proven against a live estate.
#>

. (Join-Path (Split-Path -Parent $PSScriptRoot) 'StartKit.Common.ps1')

# Export column -> LDAP attribute. The identity columns (Domain, ObjectGUID, SID, Enabled,
# SamAccountName, DistinguishedName) come with every Get-ADUser read.
$script:FMPSurveyAttributes = [ordered]@{
    UserPrincipalName = 'userPrincipalName'
    Mail              = 'mail'
    EmployeeId        = 'employeeID'
    EmployeeNumber    = 'employeeNumber'
    EmployeeType      = 'employeeType'
    Department        = 'department'
    Manager           = 'manager'
    Office            = 'physicalDeliveryOfficeName'
    City              = 'l'
}
foreach ($i in 1..15) { $script:FMPSurveyAttributes["extensionAttribute$i"] = "extensionAttribute$i" }
# Read for classification, not surveyed.
$script:FMPSurveyControl = @('adminCount', 'servicePrincipalName')

function ConvertTo-FMPDomainDN {
    param([Parameter(Mandatory)][string]$Domain)
    'DC=' + (($Domain.Trim('.') -split '\.') -join ',DC=')
}

function Get-FMPDomainFromDN {
    # The DNS name of the domain an object's distinguished name sits in.
    param([string]$DistinguishedName)
    $dc = @([regex]::Matches("$DistinguishedName", '(?i)(?:^|,)DC=([^,]+)') | ForEach-Object { $_.Groups[1].Value })
    ($dc -join '.').ToLowerInvariant()
}

function Get-FMPPropertyValue {
    param($Object, [string]$Name)
    if ($null -eq $Object) { return $null }
    $p = $Object.PSObject.Properties[$Name]
    if ($p) { $p.Value } else { $null }
}

function Get-FMPGlobalCatalogAttributeSet {
    <#
    .SYNOPSIS
        For each LDAP attribute, whether the schema defines it and puts it in the Global
        Catalog's partial attribute set.
    .EXAMPLE
        Get-FMPGlobalCatalogAttributeSet -Attribute employeeID, employeeType, department, manager -Forest contoso.example

        Shows which of these attributes a Global Catalog read returns in this forest.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string[]]$Attribute,
        [string]$Forest
    )
    $server = @{}
    if ($Forest) { $server.Server = $Forest }
    $schemaNC = (Get-ADRootDSE @server).schemaNamingContext
    $filter = '(&(objectClass=attributeSchema)(|' + (($Attribute | ForEach-Object { "(lDAPDisplayName=$_)" }) -join '') + '))'
    $found = @{}
    foreach ($o in @(Get-ADObject -SearchBase $schemaNC -LDAPFilter $filter -Properties lDAPDisplayName, isMemberOfPartialAttributeSet @server)) {
        $found["$($o.lDAPDisplayName)".ToLowerInvariant()] = [bool]$o.isMemberOfPartialAttributeSet
    }
    foreach ($a in $Attribute) {
        $k = $a.ToLowerInvariant()
        [pscustomobject]@{
            Attribute       = $a
            InSchema        = $found.ContainsKey($k)
            InGlobalCatalog = $found.ContainsKey($k) -and $found[$k]
        }
    }
}

function Read-FMPCodeList {
    # code-lists.csv: Attribute (an export column such as extensionAttribute10 or EmployeeType), Code.
    param([string]$Path)
    $lists = @{}
    if (-not $Path) { return $lists }
    if (-not (Test-Path -LiteralPath $Path)) { throw "Code list not found: $Path" }
    foreach ($r in @(Import-Csv -LiteralPath $Path)) {
        $a = "$($r.Attribute)".Trim()
        if (-not $a) { continue }
        if (-not $lists.ContainsKey($a)) { $lists[$a] = @{} }
        $lists[$a]["$($r.Code)".Trim()] = $true
    }
    $lists
}

function Get-FMPAttributeSurvey {
    <#
    .SYNOPSIS
        Fill rate and value quality of the migration's attributes across every domain tree,
        with the user export the other attribute tools read.
    .PARAMETER GlobalCatalog
        A Global Catalog server to read; by default one is discovered in the forest root.
    .PARAMETER KeyPattern
        A regular expression every enterprise person key must match, such as '^MP\d{7}$'.
    .PARAMETER CodeListPath
        code-lists.csv (Attribute, Code): the values each coded column may hold.
    .PARAMETER CodedSlots
        The extension attributes the slot register gives to codes (Book 03's program
        attribute map: organization code, worker type, position category).
    .PARAMETER UpnSuffix
        The UPN suffixes that are routable in the tenant; any other suffix is a finding.
    .OUTPUTS
        AttributeSurvey\ad-user-export.csv, FillRate.csv, ValueQuality.csv, SlotUsage.csv,
        GcCoverage.csv, AttributeSurvey.json
    .EXAMPLE
        Get-FMPAttributeSurvey -OutputPath D:\Assessment\run1 -KeyPattern '^MP\d{7}$' -UpnSuffix contoso.example `
            -CodeListPath D:\Inputs\code-lists.csv
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$Forest,
        [string[]]$Domain,
        [string]$GlobalCatalog,
        [string]$KeyPattern,
        [string]$CodeListPath,
        [string[]]$CodedSlots = @('extensionAttribute10', 'extensionAttribute11', 'extensionAttribute12'),
        [string[]]$UpnSuffix = @(),
        [datetime]$AsOf = (Get-Date)
    )
    Assert-FMPCommand -Name 'Get-ADUser' -Module 'ActiveDirectory'
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    $outDir = Initialize-FMPPath -Path (Join-Path $OutputPath 'AttributeSurvey')
    $codeLists = Read-FMPCodeList -Path $CodeListPath

    $server = @{}
    if ($Forest) { $server.Server = $Forest }
    $adForest = Get-ADForest @server
    if (-not $Domain) { $Domain = @($adForest.Domains) }

    $ldap = @($script:FMPSurveyAttributes.Values)
    $coverage = @(Get-FMPGlobalCatalogAttributeSet -Attribute ($ldap + $script:FMPSurveyControl) -Forest $adForest.RootDomain)
    $inGc = @($coverage | Where-Object InGlobalCatalog | ForEach-Object Attribute)
    $notGc = @($coverage | Where-Object { $_.InSchema -and -not $_.InGlobalCatalog } | ForEach-Object Attribute)
    $inSchema = @($coverage | Where-Object InSchema | ForEach-Object Attribute)

    if (-not $GlobalCatalog) {
        try { $GlobalCatalog = @((Get-ADDomainController -Discover -Service GlobalCatalog -DomainName $adForest.RootDomain -ErrorAction Stop).HostName)[0] }
        catch { $GlobalCatalog = $null }
    }

    $records = [System.Collections.Generic.List[object]]::new()
    $readFrom = @{}   # domain -> @{ GC = bool; DC = bool }
    foreach ($d in $Domain) {
        $dn = ConvertTo-FMPDomainDN -Domain $d
        $byGuid = [ordered]@{}
        $gcOk = $false
        if ($GlobalCatalog -and $inGc.Count -gt 0) {
            try {
                # A subtree search of a parent domain on the Global Catalog also returns its
                # child domains' users; keep only this domain's.
                foreach ($u in @(Get-ADUser -Server "$($GlobalCatalog):3268" -SearchBase $dn -Filter * -Properties $inGc -ErrorAction Stop)) {
                    if ((Get-FMPDomainFromDN $u.DistinguishedName) -ne $d.ToLowerInvariant()) { continue }
                    $byGuid["$($u.ObjectGUID)"] = @{ GC = $u; DC = $null }
                }
                $gcOk = $true
            } catch {
                Write-Warning "Global Catalog read failed for ${d}: $($_.Exception.Message). Reading it from a domain controller instead."
            }
        }
        $dcProps = if ($gcOk) { $notGc } else { $inSchema }
        $dcOk = $false
        try {
            if ($dcProps.Count -gt 0 -or -not $gcOk) {
                foreach ($u in @(Get-ADUser -Server $d -Filter * -Properties $dcProps -ErrorAction Stop)) {
                    $k = "$($u.ObjectGUID)"
                    if ($byGuid.Contains($k)) { $byGuid[$k].DC = $u } else { $byGuid[$k] = @{ GC = $null; DC = $u } }
                }
            }
            $dcOk = $true
        } catch {
            Write-Warning "Domain controller read failed for ${d}: $($_.Exception.Message)"
        }
        $readFrom[$d] = @{ GC = $gcOk; DC = $dcOk }

        foreach ($k in $byGuid.Keys) {
            $pair = $byGuid[$k]
            $base = if ($pair.GC) { $pair.GC } else { $pair.DC }
            $read = {
                param($attr)
                $v = $null
                if ($pair.GC -and $inGc -contains $attr) { $v = Get-FMPPropertyValue $pair.GC $attr }
                elseif ($pair.DC) { $v = Get-FMPPropertyValue $pair.DC $attr }
                $v
            }
            $row = [ordered]@{
                Domain            = $d
                ObjectGUID        = "$($base.ObjectGUID)"
                SID               = "$($base.SID)"
                SamAccountName    = "$($base.SamAccountName)"
                Enabled           = [bool]$base.Enabled
            }
            foreach ($col in $script:FMPSurveyAttributes.Keys) {
                $v = & $read $script:FMPSurveyAttributes[$col]
                $row[$col] = if ($null -eq $v) { '' } else { "$v" }
            }
            $row.ManagerEmployeeId = ''
            $row.AdminCount = [int](& $read 'adminCount')
            $row.HasSpn = @(& $read 'servicePrincipalName' | Where-Object { $_ }).Count -gt 0
            $row.DistinguishedName = "$($base.DistinguishedName)"
            $records.Add([pscustomobject]$row)
        }
    }

    # Managers, resolved within the forest by distinguished name.
    $byDn = @{}
    foreach ($r in $records) { $byDn[$r.DistinguishedName.ToLowerInvariant()] = $r }
    foreach ($r in $records) {
        if ($r.Manager -and $byDn.ContainsKey($r.Manager.ToLowerInvariant())) { $r.ManagerEmployeeId = $byDn[$r.Manager.ToLowerInvariant()].EmployeeId.Trim() }
    }
    Write-FMPCsv -InputObject $records -Path (Join-Path $outDir 'ad-user-export.csv')

    # Where each attribute came from, per domain.
    $sourceOf = {
        param($d, $attr)
        if ($inSchema -notcontains $attr) { return 'not in schema' }
        $rf = $readFrom[$d]
        if ($rf.GC -and $inGc -contains $attr) { return 'Global Catalog' }
        if ($rf.DC) { return 'Domain controller' }
        'not collected'
    }
    $coverageRows = foreach ($c in $coverage) {
        $sources = @($Domain | ForEach-Object { & $sourceOf $_ $c.Attribute } | Sort-Object -Unique)
        [pscustomobject]@{ Attribute = $c.Attribute; InSchema = $c.InSchema; InGlobalCatalog = $c.InGlobalCatalog; ReadFrom = $sources -join '; ' }
    }
    Write-FMPCsv -InputObject @($coverageRows) -Path (Join-Path $outDir 'GcCoverage.csv')

    # The population every rate measures: enabled users that aren't service accounts.
    $population = @($records | Where-Object { $_.Enabled -and -not $_.HasSpn })
    $fill = [System.Collections.Generic.List[object]]::new()
    foreach ($scope in @($Domain) + '(forest)') {
        $rows = if ($scope -eq '(forest)') { $population } else { @($population | Where-Object Domain -eq $scope) }
        foreach ($col in $script:FMPSurveyAttributes.Keys) {
            $attr = $script:FMPSurveyAttributes[$col]
            $domains = if ($scope -eq '(forest)') { @($Domain) } else { @($scope) }
            $missing = @($domains | Where-Object { (& $sourceOf $_ $attr) -in @('not collected', 'not in schema') })
            if ($missing.Count -eq $domains.Count) {
                $fill.Add([pscustomobject]@{ Domain = $scope; Attribute = $col; Population = $rows.Count; Populated = 'not collected'; FillPercent = 'not collected' })
                continue
            }
            $n = @($rows | Where-Object { "$($_.$col)".Trim() }).Count
            $pct = if ($rows.Count) { [math]::Round(100 * $n / $rows.Count, 1) } else { 0 }
            $note = if ($missing.Count) { " (not collected in $($missing -join ', '))" } else { '' }
            $fill.Add([pscustomobject]@{ Domain = $scope; Attribute = $col; Population = $rows.Count; Populated = $n; FillPercent = "$pct$note" })
        }
    }
    Write-FMPCsv -InputObject $fill -Path (Join-Path $outDir 'FillRate.csv')

    # Value quality.
    $quality = [System.Collections.Generic.List[object]]::new()
    $flag = {
        param($r, $col, $rule, $detail)
        $quality.Add([pscustomobject]@{ Domain = $r.Domain; SamAccountName = $r.SamAccountName; UserPrincipalName = $r.UserPrincipalName; Attribute = $col; Rule = $rule; Value = "$($r.$col)"; Detail = $detail })
    }
    foreach ($pairs in @(@('EmployeeId', 'DuplicateKey'), @('UserPrincipalName', 'DuplicateUpn'), @('Mail', 'DuplicateMail'))) {
        $col = $pairs[0]
        $dupes = @($records | Where-Object { "$($_.$col)".Trim() } | Group-Object { "$($_.$col)".Trim().ToUpperInvariant() } | Where-Object Count -gt 1)
        foreach ($g in $dupes) {
            foreach ($r in $g.Group) { & $flag $r $col $pairs[1] ('Held by {0} accounts across the forest' -f $g.Count) }
        }
    }
    $checked = @('EmployeeId', 'EmployeeType', 'Department', 'UserPrincipalName', 'Mail') + $CodedSlots
    foreach ($r in $population) {
        foreach ($col in $checked) {
            $v = "$($r.$col)"
            if ($v -and $v -ne $v.Trim()) { & $flag $r $col 'Whitespace' 'Leading or trailing whitespace' }
        }
        $key = $r.EmployeeId.Trim()
        if ($key -and $KeyPattern -and $key -notmatch $KeyPattern) { & $flag $r 'EmployeeId' 'KeyFormat' "Doesn't match $KeyPattern" }
        foreach ($col in $codeLists.Keys) {
            if (-not $r.PSObject.Properties[$col]) { continue }
            $v = "$($r.$col)".Trim()
            if ($v -and -not $codeLists[$col].ContainsKey($v)) { & $flag $r $col 'CodeNotInList' 'Not on the code list' }
        }
        foreach ($col in $CodedSlots) {
            $v = "$($r.$col)".Trim()
            if ($v -match '\s') { & $flag $r $col 'DisplayStringInCodeSlot' 'A coded slot holds text with spaces: a display string, not a code' }
        }
        if ($r.Manager) {
            $m = $null
            if ($byDn.ContainsKey($r.Manager.ToLowerInvariant())) { $m = $byDn[$r.Manager.ToLowerInvariant()] }
            if (-not $m) { & $flag $r 'Manager' 'ManagerNotFound' 'The manager DN matches no user in the surveyed domains' }
            elseif ($m.ObjectGUID -eq $r.ObjectGUID) { & $flag $r 'Manager' 'ManagerIsSelf' 'The account is its own manager' }
            elseif (-not $m.Enabled) { & $flag $r 'Manager' 'ManagerDisabled' "The manager's account ($($m.SamAccountName)) is disabled" }
            elseif (-not $m.EmployeeId.Trim()) { & $flag $r 'Manager' 'ManagerHasNoKey' "The manager ($($m.SamAccountName)) has no employeeID, so the HR manager link can't be built" }
        }
        if ($UpnSuffix.Count -and $r.UserPrincipalName) {
            $suffix = ($r.UserPrincipalName -split '@')[-1]
            if (@($UpnSuffix | Where-Object { $_ -ieq $suffix }).Count -eq 0) { & $flag $r 'UserPrincipalName' 'UpnSuffixNotListed' "Suffix $suffix isn't one of the tenant's routable suffixes" }
        }
    }
    Write-FMPCsv -InputObject $quality -Path (Join-Path $outDir 'ValueQuality.csv')

    # extensionAttribute1 to 15: who's using what, across every account.
    $slots = foreach ($i in 1..15) {
        $col = "extensionAttribute$i"
        $held = @($records | Where-Object { "$($_.$col)".Trim() })
        $collected = @($Domain | Where-Object { (& $sourceOf $_ $col) -notin @('not collected', 'not in schema') })
        $status = if ($inSchema -notcontains $col) { 'not in schema' }
                  elseif ($collected.Count -eq 0) { 'not collected' }
                  elseif ($CodedSlots -contains $col) { 'Coded' }
                  elseif ($held.Count -eq 0) { 'Free' }
                  else { 'InUse' }
        [pscustomobject]@{
            Slot           = $col
            Status         = $status
            Accounts       = $held.Count
            EnabledUsers   = @($held | Where-Object { $_.Enabled -and -not $_.HasSpn }).Count
            DistinctValues = @($held | ForEach-Object { "$($_.$col)".Trim() } | Sort-Object -Unique).Count
            Domains        = @($held | ForEach-Object Domain | Sort-Object -Unique).Count
        }
    }
    Write-FMPCsv -InputObject @($slots) -Path (Join-Path $outDir 'SlotUsage.csv')

    $forestKey = @($fill | Where-Object { $_.Domain -eq '(forest)' -and $_.Attribute -eq 'EmployeeId' })[0]
    $summary = [ordered]@{
        Schema             = 'fmp-start-kit/attribute-survey/1'
        KitVersion         = $script:FMPKitVersion
        GeneratedUtc       = $AsOf.ToUniversalTime().ToString('o')
        Forest             = $adForest.Name
        GlobalCatalog      = $GlobalCatalog
        Domains            = @($Domain).Count
        DomainsNotCollected = @($Domain | Where-Object { -not $readFrom[$_].GC -and -not $readFrom[$_].DC })
        Users              = $records.Count
        EnabledUsers       = @($records | Where-Object Enabled).Count
        Population         = $population.Count
        KeyFillPercent     = $forestKey.FillPercent
        DuplicateKeys      = @($quality | Where-Object Rule -eq 'DuplicateKey' | ForEach-Object { $_.Value.Trim().ToUpperInvariant() } | Sort-Object -Unique).Count
        QualityFindings    = $quality.Count
        FindingsByRule     = Get-FMPRuleCount -Rows $quality
        FreeSlots          = @($slots | Where-Object Status -eq 'Free' | ForEach-Object Slot)
        NotInGlobalCatalog = @($notGc)
    }
    Write-FMPJson -InputObject $summary -Path (Join-Path $outDir 'AttributeSurvey.json') -Depth 4
    [pscustomobject]$summary
}

function Get-FMPRuleCount {
    param($Rows, [string]$Property = 'Rule')
    $map = [ordered]@{}
    foreach ($g in @($Rows | Group-Object $Property | Sort-Object Name)) { $map[$g.Name] = $g.Count }
    $map
}

function Get-FMPWaveList {
    <#
    .SYNOPSIS
        Migration waves from the attribute survey's export: users by attribute value,
        devices and servers with their owners, and everything left out with the reason.
    .PARAMETER WavePlanPath
        wave-plan.csv: WaveId, Attribute (an export column), Value. Several rows with one
        WaveId are alternatives. Without a plan, each value of -GroupBy is one wave.
    .PARAMETER OwnershipPath
        asset-ownership.csv: AssetName, AssetType (Device or Server), and OwnerEmployeeId or
        OwnerUserPrincipalName. An asset with several owners has several rows.
    .PARAMETER IncludePrivileged
        Keep accounts with adminCount set. By default they're excluded for review, because
        adminCount stays set after an account leaves a protected group.
    .OUTPUTS
        Waves\waves.csv, wave-summary.csv, wave-exclusions.csv, WaveSummary.json
    .EXAMPLE
        Get-FMPWaveList -OutputPath D:\Assessment\run1 -WavePlanPath D:\Inputs\wave-plan.csv -OwnershipPath D:\Inputs\asset-ownership.csv

        Reads D:\Assessment\run1\AttributeSurvey\ad-user-export.csv, which Get-FMPAttributeSurvey
        wrote, and places users and their devices in the planned waves.
    .EXAMPLE
        Get-FMPWaveList -OutputPath D:\Assessment\run1 -GroupBy City

        With no wave plan: one candidate wave per value of the City column.
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$OutputPath,
        [string]$SurveyPath,
        [string]$WavePlanPath,
        [string]$GroupBy = 'extensionAttribute10',
        [string]$OwnershipPath,
        [string]$DoNotSyncAttribute = 'extensionAttribute15',
        [string]$DoNotSyncValue = 'DoNotSync',
        [switch]$IncludePrivileged,
        [datetime]$AsOf = (Get-Date)
    )
    $null = Resolve-FMPOutputRoot -OutputPath $OutputPath
    if (-not $SurveyPath) { $SurveyPath = Join-Path (Join-Path $OutputPath 'AttributeSurvey') 'ad-user-export.csv' }
    if (-not (Test-Path -LiteralPath $SurveyPath)) { throw "No attribute survey export at $SurveyPath. Run Get-FMPAttributeSurvey first." }
    $users = @(Import-Csv -LiteralPath $SurveyPath)
    $outDir = Initialize-FMPPath -Path (Join-Path $OutputPath 'Waves')

    # The plan: wave -> list of (attribute, value). Without one, one wave per value of -GroupBy.
    $plan = [ordered]@{}
    if ($WavePlanPath) {
        if (-not (Test-Path -LiteralPath $WavePlanPath)) { throw "Wave plan not found: $WavePlanPath" }
        foreach ($r in @(Import-Csv -LiteralPath $WavePlanPath)) {
            $w = "$($r.WaveId)".Trim()
            if (-not $w) { continue }
            if (-not $plan.Contains($w)) { $plan[$w] = [System.Collections.Generic.List[object]]::new() }
            $plan[$w].Add([pscustomobject]@{ Attribute = "$($r.Attribute)".Trim(); Value = "$($r.Value)".Trim() })
        }
    } else {
        foreach ($v in @($users | ForEach-Object { "$($_.$GroupBy)".Trim() } | Where-Object { $_ } | Sort-Object -Unique)) {
            $plan[$v] = [System.Collections.Generic.List[object]]::new()
            $plan[$v].Add([pscustomobject]@{ Attribute = $GroupBy; Value = $v })
        }
    }
    $planAttributes = @($plan.Values | ForEach-Object { $_ } | ForEach-Object Attribute | Sort-Object -Unique)

    $keyCount = @{}
    foreach ($u in $users) {
        $k = "$($u.EmployeeId)".Trim().ToUpperInvariant()
        if ($k) { $keyCount[$k] = 1 + [int]$keyCount[$k] }
    }

    $members = [System.Collections.Generic.List[object]]::new()
    $excluded = [System.Collections.Generic.List[object]]::new()
    $userWave = @{}     # ObjectGUID -> wave; absent when the user is excluded
    $userReason = @{}   # ObjectGUID -> reason
    $exclude = {
        param($type, $name, $u, $reason, $detail)
        $excluded.Add([pscustomobject]@{
                ObjectType = $type; Name = $name
                UserPrincipalName = if ($u) { $u.UserPrincipalName } else { '' }
                EmployeeId = if ($u) { $u.EmployeeId } else { '' }
                Domain = if ($u) { $u.Domain } else { '' }
                Reason = $reason; Detail = $detail
            })
    }
    foreach ($u in $users) {
        $key = "$($u.EmployeeId)".Trim()
        $reason = $null; $detail = ''
        if ($u.Enabled -ne 'True') { $reason = 'Disabled' }
        elseif ($u.HasSpn -eq 'True') { $reason = 'ServiceAccount'; $detail = 'Has a service principal name: the non-person track moves it' }
        elseif (-not $IncludePrivileged -and "$($u.AdminCount)" -eq '1') { $reason = 'Privileged'; $detail = 'adminCount is set: confirm current privilege, then place it by hand' }
        elseif ($DoNotSyncAttribute -and "$($u.$DoNotSyncAttribute)".Trim() -eq $DoNotSyncValue) { $reason = 'DoNotSync'; $detail = "$DoNotSyncAttribute is $DoNotSyncValue" }
        elseif (-not $key) { $reason = 'NoKey'; $detail = 'No employeeID: not correlated to an HR record' }
        elseif ($keyCount[$key.ToUpperInvariant()] -gt 1) { $reason = 'DuplicateKey'; $detail = 'The employeeID is held by more than one account' }
        if (-not $reason) {
            $hits = @(foreach ($w in $plan.Keys) {
                    foreach ($c in $plan[$w]) {
                        if ($u.PSObject.Properties[$c.Attribute] -and "$($u.($c.Attribute))".Trim() -ieq $c.Value) { [pscustomobject]@{ Wave = $w; On = "$($c.Attribute)=$($c.Value)" }; break }
                    }
                })
            if ($hits.Count -eq 0) {
                $blank = @($planAttributes | Where-Object { -not "$($u.$_)".Trim() })
                if ($blank.Count -eq $planAttributes.Count) { $reason = 'NoWaveValue'; $detail = "Empty: $($planAttributes -join ', ')" }
                else { $reason = 'NotInPlan'; $detail = (@($planAttributes | ForEach-Object { "$_=$($u.$_)" }) -join '; ') }
            } elseif ($hits.Count -gt 1) {
                $reason = 'MoreThanOneWave'; $detail = (@($hits | ForEach-Object { "$($_.Wave) ($($_.On))" }) -join '; ')
            } else {
                $userWave[$u.ObjectGUID] = $hits[0].Wave
                $members.Add([pscustomobject]@{ WaveId = $hits[0].Wave; ObjectType = 'User'; Name = $u.SamAccountName; UserPrincipalName = $u.UserPrincipalName; EmployeeId = $key; Domain = $u.Domain; MatchedOn = $hits[0].On })
                continue
            }
        }
        $userReason[$u.ObjectGUID] = $reason
        & $exclude 'User' $u.SamAccountName $u $reason $detail
    }

    # Devices and servers follow their owners.
    if ($OwnershipPath) {
        if (-not (Test-Path -LiteralPath $OwnershipPath)) { throw "Ownership list not found: $OwnershipPath" }
        $byKey = @{}; $byUpn = @{}
        foreach ($u in $users) {
            $k = "$($u.EmployeeId)".Trim().ToUpperInvariant()
            if ($k -and -not $byKey.ContainsKey($k)) { $byKey[$k] = $u }
            if ($u.UserPrincipalName) { $byUpn[$u.UserPrincipalName.ToLowerInvariant()] = $u }
        }
        $assets = [ordered]@{}
        foreach ($r in @(Import-Csv -LiteralPath $OwnershipPath)) {
            $name = "$($r.AssetName)".Trim()
            if (-not $name) { continue }
            $id = "$($r.AssetType)|$name".ToLowerInvariant()
            if (-not $assets.Contains($id)) { $assets[$id] = @{ Name = $name; Type = "$($r.AssetType)".Trim(); Owners = [System.Collections.Generic.List[object]]::new() } }
            $assets[$id].Owners.Add($r)
        }
        foreach ($a in $assets.Values) {
            $waves = @{}; $notes = @()
            foreach ($o in $a.Owners) {
                $ref = "$(Get-FMPPropertyValue $o 'OwnerEmployeeId')".Trim()
                $u = $null
                if ($ref) { $u = $byKey[$ref.ToUpperInvariant()] }
                else {
                    $ref = "$(Get-FMPPropertyValue $o 'OwnerUserPrincipalName')".Trim()
                    if ($ref) { $u = $byUpn[$ref.ToLowerInvariant()] }
                }
                if (-not $u) { $notes += "$ref (not found)"; continue }
                if ($userWave.ContainsKey($u.ObjectGUID)) { $waves[$userWave[$u.ObjectGUID]] = $u }
                else { $notes += "$ref ($($userReason[$u.ObjectGUID]))" }
            }
            if ($waves.Count -eq 1) {
                $w = @($waves.Keys)[0]; $owner = $waves[$w]
                $members.Add([pscustomobject]@{ WaveId = $w; ObjectType = $a.Type; Name = $a.Name; UserPrincipalName = $owner.UserPrincipalName; EmployeeId = $owner.EmployeeId; Domain = ''; MatchedOn = "owner $($owner.SamAccountName)" })
            } elseif ($waves.Count -gt 1) {
                & $exclude $a.Type $a.Name $null 'OwnersInMoreThanOneWave' (@($waves.Keys | Sort-Object) -join '; ')
            } elseif (@($notes | Where-Object { $_ -match '\(not found\)$' }).Count -eq $notes.Count) {
                & $exclude $a.Type $a.Name $null 'OwnerNotFound' ($notes -join '; ')
            } else {
                & $exclude $a.Type $a.Name $null 'OwnerExcluded' ($notes -join '; ')
            }
        }
    }

    Write-FMPCsv -InputObject $members -Path (Join-Path $outDir 'waves.csv')
    Write-FMPCsv -InputObject $excluded -Path (Join-Path $outDir 'wave-exclusions.csv')
    $waveRows = foreach ($w in $plan.Keys) {
        $in = @($members | Where-Object WaveId -eq $w)
        [pscustomobject]@{
            WaveId     = $w
            Definition = (@($plan[$w] | ForEach-Object { "$($_.Attribute)=$($_.Value)" }) -join ' or ')
            Users      = @($in | Where-Object ObjectType -eq 'User').Count
            Devices    = @($in | Where-Object ObjectType -eq 'Device').Count
            Servers    = @($in | Where-Object ObjectType -eq 'Server').Count
        }
    }
    Write-FMPCsv -InputObject @($waveRows) -Path (Join-Path $outDir 'wave-summary.csv')
    $summary = [ordered]@{
        Schema       = 'fmp-start-kit/waves/1'
        KitVersion   = $script:FMPKitVersion
        GeneratedUtc = $AsOf.ToUniversalTime().ToString('o')
        Source       = if ($WavePlanPath) { 'wave plan' } else { "one wave per $GroupBy value" }
        Waves        = @($waveRows).Count
        Users        = @($members | Where-Object ObjectType -eq 'User').Count
        Assets       = @($members | Where-Object ObjectType -ne 'User').Count
        Excluded     = $excluded.Count
        ExcludedByReason = Get-FMPRuleCount -Rows $excluded -Property Reason
    }
    Write-FMPJson -InputObject $summary -Path (Join-Path $outDir 'WaveSummary.json') -Depth 4
    [pscustomobject]$summary
}

Export-ModuleMember -Function @('Get-FMPGlobalCatalogAttributeSet', 'Get-FMPAttributeSurvey', 'Get-FMPWaveList')
