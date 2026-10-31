<#
.SYNOPSIS
    PIV and CAC binding: VK-PIV-01. Read-only.
    Sources: Attribute-Driven Migration implementation guide, Gate 6; Book 03, Chapter 09
    (binding the PIV certificate); Book 07, Chapter 06 (username bindings and affinity).
#>

# Microsoft Learn, "Microsoft Entra certificate-based authentication technical concepts",
# username binding policy: PrincipalName, RFC822Name, IssuerAndSubject and Subject are low
# affinity; SKI, SHA1PublicKey and IssuerAndSerialNumber are high affinity. A value's type is its
# X509:<...> prefix (case-sensitive). IssuerAndSerialNumber is X509:<I>...<SR>...; IssuerAndSubject
# is X509:<I>...<S>...
$script:VkHighAffinityPattern = '^X509:(<SKI>|<SHA1-PUKEY>|<I>.*<SR>)'
$script:VkCertUserSelect = 'id,userPrincipalName,accountEnabled,onPremisesSyncEnabled,authorizationInfo'

function Get-VkBindingType {
    # The mapping type of one certificateUserIds value, never the value itself.
    param([string]$Value)
    if ($Value -cmatch '^X509:<SKI>') { return 'SKI' }
    if ($Value -cmatch '^X509:<SHA1-PUKEY>') { return 'SHA1PublicKey' }
    if ($Value -cmatch '^X509:<I>.*<SR>') { return 'IssuerAndSerialNumber' }
    if ($Value -cmatch '^X509:<I>.*<S>') { return 'IssuerAndSubject' }
    if ($Value -cmatch '^X509:<S>') { return 'Subject' }
    if ($Value -cmatch '^X509:<PN>') { return 'PrincipalName' }
    if ($Value -cmatch '^X509:<RFC822>') { return 'RFC822Name' }
    'Unrecognized'
}

function Invoke-VkPiv01 {
    <#
    .SYNOPSIS
        Implements VK-PIV-01: PIV binding coverage. Fails on pilot card holders
        (pilot-card-holders.csv) not found or with no certificateUserIds value, and, when
        RequiredAffinity is High, holders with only low-affinity values. Reports accounts, never values.
    .EXAMPLE
        # From the kit folder: against the fictional "fail" fixture tenant (no sign-in).
        $ctx = Get-VkRunContext -FixturePath .\tests\fixtures\fail -AsOf '2026-10-29T00:00:00Z'
        Invoke-VkPiv01 -Context $ctx
    .DESCRIPTION
    #>
    <#
    VK-PIV-01. Binding coverage for the pilot card holders in pilot-card-holders.csv
    (UserPrincipalName or Id): each holder's certificateUserIds, read one user at a time with
    $select=authorizationInfo (User.Read.All). Reports holders not found, holders with no value,
    and holders with only low-affinity values when RequiredAffinity is High (the program's
    production position). Rows name the account and the binding types, never a value. The kit
    can't tell whether a value belongs to a current card; the card management system can.
    NotApplicable when the list isn't supplied.
    #>
    [CmdletBinding()] param([Parameter(Mandatory)]$Context)
    Invoke-VkCheckBody 'VK-PIV-01' $Context {
        param($Context)
        $holders = Read-VkInputCsv -Context $Context -Option 'PivCardHoldersFile'
        if ($null -eq $holders) { return Get-VkNotApplicable "No pilot card holder list ($($Context.Options['PivCardHoldersFile'])) supplied" }
        $high = "$($Context.Options['RequiredAffinity'])" -eq 'High'
        $n = 0
        $rows = foreach ($h in $holders) {
            $key = "$(Get-VkValue $h 'UserPrincipalName' '')".Trim()
            if (-not $key) { $key = "$(Get-VkValue $h 'Id' '')".Trim() }
            if (-not $key) { continue }
            $n++
            $u = Get-VkData -Context $Context -Name 'certificateUsers' -Key $key -Single -Optional -Advanced -Uri "/v1.0/users/$([uri]::EscapeDataString($key))?`$select=$script:VkCertUserSelect"
            if ($null -eq $u) {
                ConvertTo-VkFinding -Severity Finding -Object $key -Issue 'Pilot card holder not found in the tenant, or not readable'
                continue
            }
            $synced = (Get-VkValue $u 'onPremisesSyncEnabled' $false) -eq $true
            $values = @(Get-VkValue (Get-VkValue $u 'authorizationInfo') 'certificateUserIds' @() | Where-Object { -not (Test-VkBlank $_) })
            $types = @($values | ForEach-Object { Get-VkBindingType "$_" })
            $highCount = @($values | Where-Object { "$_" -cmatch $script:VkHighAffinityPattern }).Count
            $data = [ordered]@{ Synced = $synced; Values = $values.Count; HighAffinity = $highCount; Types = @($types | Sort-Object -Unique) }
            $writer = 'the card management system'
            if ($synced) { $writer = 'altSecurityIdentities in AD (only Entra Connect updates certificateUserIds for synced users)' }
            if ($values.Count -eq 0) {
                ConvertTo-VkFinding -Severity Finding -Object $u.userPrincipalName -ObjectId $u.id -Issue "No certificateUserIds value; the binding comes from $writer" -Data $data
            } elseif ($highCount -eq 0) {
                $sev = 'Info'
                if ($high) { $sev = 'Finding' }
                ConvertTo-VkFinding -Severity $sev -Object $u.userPrincipalName -ObjectId $u.id -Issue 'Only low-affinity binding values: sign-in fails once high affinity is required' -Data $data
            }
            if (@($types | Where-Object { $_ -eq 'Unrecognized' }).Count -gt 0) {
                ConvertTo-VkFinding -Severity Warn -Object $u.userPrincipalName -ObjectId $u.id -Issue 'A value matches no supported X509 pattern (the prefixes are case-sensitive)' -Data $data
            }
        }
        Get-VkOutcome -Rows @($rows) -Message ('{0} pilot card holder(s); required affinity {1}; values reported by type only' -f $n, $Context.Options['RequiredAffinity'])
    }
}
