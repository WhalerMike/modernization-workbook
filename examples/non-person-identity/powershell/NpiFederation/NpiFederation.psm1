#Requires -Version 7.1
<#
    NpiFederation: Chapter 05 of the developer workbook "Building Non-Person Identity".

    Wave conversion in the plan's order (managed identity, then federated credential, then
    certificate). Federated identity credentials held as reviewed JSON, compared with the tenant
    (Graph for app registrations, Resource Manager for user-assigned managed identities), checked
    before cutover against the claims the workload's issuer will present, and exchanged offline
    against a fake token endpoint. Managed identities created or recorded with their role
    assignments. The 30-day parallel run tracked from sign-in evidence, then the legacy account
    disabled, never deleted. Every call is declared in config/calls-ch05.json; writes go only
    through the delegated write path with an approved plan hash and -Apply.

    Shares NpiCore (clouds, host checks, findings, JSON and hashes); keeps its own call list,
    client, fakes and manifest so it doesn't change Chapters 01 and 02.

    Illustrative: tested against fixtures and fakes, not against a production tenant or domain.
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Import-Module (Join-Path $PSScriptRoot '../NpiCore/NpiCore.psm1') -Force -Global

$script:ConfigPath = Join-Path $PSScriptRoot '../../config/calls-ch05.json'
$script:Audience = 'api://AzureADTokenExchange'              # Learn: the recommended (and only accepted) audience for Entra ID
$script:GitHubIssuer = 'https://token.actions.githubusercontent.com'
$script:MaxCredentials = 20                                    # Learn: per application or user-assigned managed identity
$script:MaxLength = 600                                        # Learn: issuer, subject, audience, description
$script:NamePattern = '^[A-Za-z0-9][A-Za-z0-9_-]{2,119}$'      # Learn: 3-120 characters, alphanumeric first, then alphanumeric, dash or underscore
$script:ParallelRunDays = 30                                   # Book 02, Phase 4; plan N3.3
$script:SilenceDays = 7                                        # Design guidance: no new-credential sign-in after a week is a finding
$script:MaxPlanAgeDays = 7                                     # Design guidance, as Chapter 02
$script:AssertionType = 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer'

# ----------------------------------------------------------------------------- the call list

function Get-NpiWifCallList {
    <#
    .SYNOPSIS
        Reads Chapter 05's call list (config/calls-ch05.json unless -Path names another file) and
        returns it as a hashtable with its calls and tasks.
    .EXAMPLE
        # The two tasks: federation (read) and federation-apply (write).
        (Get-NpiWifCallList).tasks.Keys
    #>
    [CmdletBinding()]
    param([string]$Path = $script:ConfigPath)
    Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable
}

function Get-NpiWifTask {
    <#
    .SYNOPSIS
        Returns one task's declaration from config/calls-ch05.json: its mode and the permissions,
        roles and rights it holds. Throws for a task the call list doesn't declare.
    .EXAMPLE
        # 'write': the reviewed write path.
        (Get-NpiWifTask -Task federation-apply).mode
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $t = (Get-NpiWifCallList).tasks
    if (-not $t.ContainsKey($Task)) { throw "Unknown task '$Task'." }
    $t[$Task]
}

function Get-NpiWifRequiredPermission {
    <#
    .SYNOPSIS
        The union of a task's calls: Graph permissions, Azure roles, AD rights and methods.
        Returns an object with Task, GraphPermissions, AzureRoles, AdRights and Methods.
    .EXAMPLE
        # What the read task needs: Application.Read.All and AuditLog.Read.All, among others.
        Get-NpiWifRequiredPermission -Task federation
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Task)
    $null = Get-NpiWifTask -Task $Task
    $calls = @((Get-NpiWifCallList).calls | Where-Object { $_.tasks -contains $Task })
    [pscustomobject]@{
        Task             = $Task
        GraphPermissions = @($calls | Where-Object api -EQ 'graph' | ForEach-Object { $_.permissions } | Sort-Object -Unique)
        AzureRoles       = @($calls | Where-Object api -EQ 'arm' | ForEach-Object { $_.azureRole } | Sort-Object -Unique)
        AdRights         = @($calls | Where-Object api -EQ 'ad' | ForEach-Object { $_.adRight } | Sort-Object -Unique)
        Methods          = @($calls | ForEach-Object { $_.method } | Sort-Object -Unique)
    }
}

# ----------------------------------------------------------------------------- the client

function New-NpiWifClient {
    <#
    .SYNOPSIS
        A client for one Chapter 05 task in one cloud. -Invoke is { param($Method, $Uri, $Body, $Headers) }
        for Graph and Resource Manager; -AdInvoke is { param($Cmdlet, [hashtable]$Params) };
        -TokenEndpoint is a fake from New-NpiWifFakeTokenEndpoint, the only place the token
        exchange test is ever sent.
    .EXAMPLE
        # A read client over the fixture tenant, with the fake token endpoint for the exchange test.
        $fake = New-NpiWifFake -Path tests/fixtures/ch05/tenant.json
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -AsOf ([datetime]'2026-10-30T12:00:00Z')
        $client = New-NpiWifClient -Cloud gcc -Task federation -TenantId c0ffee00-0000-4000-8000-000000000001 -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke -TokenEndpoint $ep
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$Task,
        [Parameter(Mandatory)][string]$TenantId,
        [scriptblock]$Invoke,
        [scriptblock]$AdInvoke,
        $TokenEndpoint
    )
    $decl = Get-NpiWifTask -Task $Task
    [pscustomobject]@{
        Cloud         = Get-NpiCloud -Cloud $Cloud
        Task          = $Task
        Mode          = $decl.mode
        TenantId      = $TenantId
        Calls         = @((Get-NpiWifCallList).calls | Where-Object { $_.tasks -contains $Task })
        Invoke        = $Invoke
        AdInvoke      = $AdInvoke
        TokenEndpoint = $TokenEndpoint
        Evidence      = [Collections.Generic.List[object]]::new()
    }
}

function Get-NpiWifCall {
    param($Client, [string]$CallId)
    $call = @($Client.Calls | Where-Object { $_.id -eq $CallId })
    if (-not $call) { throw "Undeclared call '$CallId' for task '$($Client.Task)'; add it to config/calls-ch05.json with its permission." }
    $call[0]
}

function Resolve-NpiWifUri {
    <#
    .SYNOPSIS
        Builds the full URL for one declared Graph, Resource Manager or sign-in call on the client's
        cloud and returns @{ Call; Uri; Host }. Throws for an undeclared call, an Active Directory call
        or an unbound placeholder; the caller checks the method.
    .EXAMPLE
        $fake = New-NpiWifFake -Path tests/fixtures/ch05/tenant.json
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -AsOf ([datetime]'2026-10-30T12:00:00Z')
        $client = New-NpiWifClient -Cloud gcc -Task federation -TenantId c0ffee00-0000-4000-8000-000000000001 -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke -TokenEndpoint $ep
        # https://graph.microsoft.com/v1.0/applications/0a000000-0000-4000-8000-000000000004/federatedIdentityCredentials
        (Resolve-NpiWifUri -Client $client -CallId 'ch05-application-fics' -Bind @{ id = '0a000000-0000-4000-8000-000000000004' }).Uri
    #>

    # The URL for a declared call, on the cloud's own host; refuses an unbound placeholder.
    param($Client, [string]$CallId, [hashtable]$Bind = @{}, [string]$Query)
    $call = Get-NpiWifCall -Client $Client -CallId $CallId
    if ($call.api -eq 'ad') { throw "'$CallId' is an Active Directory call." }
    $path = $call.path
    foreach ($k in $Bind.Keys) { $path = $path.Replace("{$k}", [string]$Bind[$k]) }
    if ($path -match '\{[A-Za-z]+\}') { throw "Unbound placeholder in $path" }
    switch ($call.api) {
        'graph' { $hostName = $Client.Cloud.Graph; $uri = "$hostName/$($call.version)$path"; if ($Query) { $uri += "?$Query" } }
        'arm' { $hostName = $Client.Cloud.Arm; $uri = "$hostName$path`?api-version=$($call.apiVersion)"; if ($Query) { $uri += "&$Query" } }
        'login' { $hostName = $Client.Cloud.Login; $uri = "$hostName$path" }
        default { throw "Unknown api '$($call.api)' for '$CallId'." }
    }
    [pscustomobject]@{ Call = $call; Uri = $uri; Host = $hostName }
}

function Add-NpiWifEvidence {
    param($Client, [string]$CallId, [string]$Method, [string]$Target)
    $Client.Evidence.Add([pscustomobject]@{ Call = $CallId; Method = $Method; Target = $Target; At = [DateTime]::UtcNow.ToString('o') })
}

function Test-NpiWifNotFound {
    param($ErrorRecord)
    "$($ErrorRecord.Exception.Message)" -match '(^|\D)404(\D|$)'
}

function Invoke-NpiWifGet {
    <#
    .SYNOPSIS
        GET a declared call and follow every page on the cloud's own host. Returns the items of a
        collection, or the object. With -AllowNotFound a 404 returns $null instead of throwing.
    .EXAMPLE
        $fake = New-NpiWifFake -Path tests/fixtures/ch05/tenant.json
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -AsOf ([datetime]'2026-10-30T12:00:00Z')
        $client = New-NpiWifClient -Cloud gcc -Task federation -TenantId c0ffee00-0000-4000-8000-000000000001 -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke -TokenEndpoint $ep
        # The federated credentials on one app registration, every page.
        Invoke-NpiWifGet -Client $client -CallId 'ch05-application-fics' -Bind @{ id = '0a000000-0000-4000-8000-000000000004' }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId, [hashtable]$Bind = @{}, [string]$Query, [switch]$AllowNotFound)
    $r = Resolve-NpiWifUri -Client $Client -CallId $CallId -Bind $Bind -Query $Query
    if ($r.Call.method -ne 'GET') { throw "Refusing $($r.Call.method) for '$CallId' as a read." }
    $items = [Collections.Generic.List[object]]::new()
    $uri = $r.Uri; $single = $null; $isCollection = $false
    while ($uri) {
        Assert-NpiHost -Uri $uri -ExpectedHost $r.Host
        Add-NpiWifEvidence -Client $Client -CallId $CallId -Method 'GET' -Target $uri
        try { $body = & $Client.Invoke 'GET' $uri $null $null }
        catch { if ($AllowNotFound -and (Test-NpiWifNotFound $_)) { return $null }; throw }
        if ($null -eq $body) { throw "No response for $uri" }
        if ($body.ContainsKey('value')) { $isCollection = $true; foreach ($v in @($body['value'])) { if ($null -ne $v) { $items.Add($v) } } }
        else { $single = $body }
        $uri = if ($body.ContainsKey('@odata.nextLink')) { $body['@odata.nextLink'] } elseif ($body.ContainsKey('nextLink')) { $body['nextLink'] } else { $null }
    }
    if ($isCollection) { $items.ToArray() } else { $single }
}

function Invoke-NpiWifAdRead {
    <#
    .SYNOPSIS
        Runs one declared Active Directory read (a Get-AD* cmdlet named by the call list, never by the
        caller) through the client's AD invoker, records the cmdlet and its parameters in the evidence,
        and returns what the cmdlet returns.
    .EXAMPLE
        $fake = New-NpiWifFake -Path tests/fixtures/ch05/tenant.json
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -AsOf ([datetime]'2026-10-30T12:00:00Z')
        $client = New-NpiWifClient -Cloud gcc -Task federation -TenantId c0ffee00-0000-4000-8000-000000000001 -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke -TokenEndpoint $ep
        # Whether the legacy account is still enabled, and its last logon.
        Invoke-NpiWifAdRead -Client $client -CallId 'ch05-ad-legacy' -Params @{ Identity = 'ad000000-0000-4000-8000-000000000001'; Properties = @('Enabled', 'LastLogonDate') }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$CallId, [hashtable]$Params = @{})
    $call = Get-NpiWifCall -Client $Client -CallId $CallId
    if ($call.api -ne 'ad' -or $call.method -ne 'READ' -or $call.cmdlet -notmatch '^Get-AD[A-Za-z]+$') { throw "Refusing '$CallId': only declared Get-AD* reads run here." }
    if (-not $Client.AdInvoke) { throw 'No Active Directory invoker: pass -AdInvoke (or -Domain for a live run).' }
    $shown = ($Params.Keys | Sort-Object | ForEach-Object { "-$_ $(@($Params[$_]) -join ',')" }) -join ' '
    Add-NpiWifEvidence -Client $Client -CallId $CallId -Method 'READ' -Target "$($call.cmdlet) $shown".Trim()
    & $Client.AdInvoke $call.cmdlet $Params
}

# ----------------------------------------------------------------------------- what the workload presents

function Get-NpiWifPresentedClaims {
    <#
    .SYNOPSIS
        The iss, sub and aud the workload's issuer will put in its token, from the workload record.
        GitHub's subject is derived from Learn's formats (environment, branch, tag) only for the
        name-based subject format; a pull request subject, an immutable subject or any other
        platform needs the subject captured from a test run (capturedSubject). Kubernetes uses
        system:serviceaccount:<namespace>:<name>.
    .EXAMPLE
        # Subject repo:contoso/intranet:environment:production, derived from Learn's format.
        $presented = Get-NpiWifPresentedClaims -Workload @{ platform = 'github'; repository = 'contoso/intranet'; entity = 'environment'; value = 'production'; subjectFormat = 'name-based' }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Workload)
    $w = $Workload
    $has = { param($k) $w.ContainsKey($k) -and "$($w[$k])" -ne '' }
    $out = [ordered]@{ Issuer = $null; Subject = $null; Audience = $script:Audience; Source = $null; Note = $null }
    switch ($w.platform) {
        'github' {
            $out.Issuer = if (& $has 'capturedIssuer') { $w.capturedIssuer } else { $script:GitHubIssuer }
            if (& $has 'capturedSubject') { $out.Subject = $w.capturedSubject; $out.Source = 'captured' }
            elseif (-not (& $has 'subjectFormat') -or $w.subjectFormat -ne 'name-based') { $out.Note = "GitHub subject format '$(if (& $has 'subjectFormat') { $w.subjectFormat } else { 'unrecorded' })' can't be derived; capture the sub claim from a test run (research gaps, row 43)" }
            else {
                switch ($w.entity) {
                    'environment' { $out.Subject = "repo:$($w.repository):environment:$($w.value)" }
                    'branch' { $out.Subject = "repo:$($w.repository):ref:refs/heads/$($w.value)" }
                    'tag' { $out.Subject = "repo:$($w.repository):ref:refs/tags/$($w.value)" }
                    default { $out.Note = "GitHub entity '$($w.entity)' isn't derived: Learn's pages give two formats for a pull request (research gaps, row 42); capture the sub claim from a test run" }
                }
                if ($out.Subject) { $out.Source = 'derived' }
            }
        }
        'kubernetes' {
            $out.Issuer = $w.issuer
            $out.Subject = "system:serviceaccount:$($w.namespace):$($w.serviceAccount)"; $out.Source = 'derived'
        }
        default {
            if (& $has 'capturedIssuer') { $out.Issuer = $w.capturedIssuer }
            if (& $has 'capturedSubject') { $out.Subject = $w.capturedSubject; $out.Source = 'captured' }
            else { $out.Note = "Platform '$($w.platform)': record the issuer and subject captured from a test run" }
        }
    }
    [pscustomobject]$out
}

# ----------------------------------------------------------------------------- the credential checks

function Test-NpiWifCredential {
    <#
    .SYNOPSIS
        The static checks for one federated identity credential: Learn's rules (name, lengths, no
        wildcards, exactly one audience, the recommended audience, issuer and subject that match
        the token exactly) and the program's (no preview flexible credentials). Returns a list of
        @{ Rule; Issue }; empty means it passes.
    .EXAMPLE
        # Empty: the credential passes Learn's rules and matches what the workflow presents.
        $presented = Get-NpiWifPresentedClaims -Workload @{ platform = 'github'; repository = 'contoso/intranet'; entity = 'environment'; value = 'production'; subjectFormat = 'name-based' }
        Test-NpiWifCredential -Credential @{ name = 'github-intranet'; issuer = 'https://token.actions.githubusercontent.com'; subject = 'repo:contoso/intranet:environment:production'; audiences = @('api://AzureADTokenExchange') } -Presented $presented
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Credential, $Presented, [string]$ParentKind = 'application')
    $c = $Credential
    $p = [Collections.Generic.List[object]]::new()
    $add = { param($r, $i) $p.Add([pscustomobject]@{ Rule = $r; Issue = $i }) }
    $get = { param($k) if ($c -is [Collections.IDictionary]) { if ($c.Contains($k)) { $c[$k] } else { $null } } elseif ($c.PSObject.Properties[$k]) { $c.$k } else { $null } }
    $name = "$(& $get 'name')"; $iss = & $get 'issuer'; $sub = & $get 'subject'; $aud = @(& $get 'audiences'); $desc = & $get 'description'
    if ($ParentKind -eq 'systemAssigned') { & $add 'NPI-WIF-05' 'A federated credential on a system-assigned managed identity isn''t supported' }
    if ($null -ne (& $get 'claimsMatchingExpression')) { & $add 'NPI-WIF-05' 'claimsMatchingExpression is a flexible federated credential, a preview feature; not used in production (Design guidance)' }
    if ($name -notmatch $script:NamePattern) { & $add 'NPI-WIF-05' "Name '$name' isn't 3-120 characters of letters, digits, dash or underscore starting with a letter or digit" }
    foreach ($pair in @(@('issuer', $iss), @('subject', $sub), @('description', $desc))) { if ("$($pair[1])".Length -gt $script:MaxLength) { & $add 'NPI-WIF-05' "$($pair[0]) is longer than $($script:MaxLength) characters" } }
    foreach ($v in @($iss, $sub) + $aud) { if ("$v".Contains('*')) { & $add 'NPI-WIF-05' "Wildcards aren't supported in any federated credential value ('$v')"; break } }
    if ($aud.Count -ne 1) { & $add 'NPI-WIF-04' "Exactly one audience is allowed; found $($aud.Count)" }
    elseif ([string]$aud[0] -cne $script:Audience) { & $add 'NPI-WIF-04' "Audience '$($aud[0])' isn't exactly '$($script:Audience)'" }
    if (-not $iss) { & $add 'NPI-WIF-03' 'No issuer' }
    elseif ("$iss" -ne "$iss".Trim()) { & $add 'NPI-WIF-03' 'The issuer has leading or trailing whitespace; Learn: the exchange is blocked' }
    if ($Presented) {
        if ($Presented.Issuer -and $iss -and [string]$iss -cne [string]$Presented.Issuer) { & $add 'NPI-WIF-03' "Issuer '$iss' isn't what the workload's issuer presents ('$($Presented.Issuer)'); the match is exact, a trailing slash included" }
        if (-not $Presented.Subject) { & $add 'NPI-WIF-02' "The subject can't be checked: $($Presented.Note)" }
        elseif ([string]$sub -cne [string]$Presented.Subject) { & $add 'NPI-WIF-02' "Subject '$sub' isn't what the workload's issuer presents ('$($Presented.Subject)'); accepted at creation, it fails only at token exchange" }
    }
    $p.ToArray()
}

function Test-NpiWifOrder {
    <#
    .SYNOPSIS
        The plan's order: a managed identity where the host is in Azure, else a federated credential where it has an OIDC issuer, else a certificate.
        Returns $null when the conversion's target kind fits, or a sentence naming the kind that
        should come first.
    .EXAMPLE
        # A certificate for an Azure-hosted workload: the message says a managed identity comes first.
        Test-NpiWifOrder -Conversion @{ host = @{ azureHosted = $true; oidcIssuer = $false }; target = @{ kind = 'certificate'; credentials = @() } }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Conversion)
    $h = $Conversion.host; $k = $Conversion.target.kind
    $expected = if ($h.azureHosted) { 'managedIdentity' } elseif ($h.oidcIssuer) { 'federatedCredential' } else { 'certificate' }
    if ($k -eq $expected) { return $null }
    # A user-assigned managed identity with a federated credential serves an OIDC workload too; it's never worse than an app registration's credential.
    if ($k -eq 'managedIdentity' -and $expected -eq 'federatedCredential' -and @($Conversion.target.credentials).Count) { return $null }
    "The host allows a $expected, which comes before a $k in the plan's order (managed identity, then federated credential, then certificate)"
}

# ----------------------------------------------------------------------------- the token exchange test

function ConvertTo-NpiWifBase64Url {
    param([byte[]]$Bytes)
    [Convert]::ToBase64String($Bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function ConvertFrom-NpiWifBase64Url {
    <#
    .SYNOPSIS
        Decodes a base64url string (the encoding of a JWT's header and claims) and returns the UTF-8
        text.
    .EXAMPLE
        # {"typ":"JWT"}
        ConvertFrom-NpiWifBase64Url 'eyJ0eXAiOiJKV1QifQ'
    #>
    param([string]$Text)
    $s = $Text.Replace('-', '+').Replace('_', '/'); switch ($s.Length % 4) { 2 { $s += '==' } 3 { $s += '=' } }
    [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($s))
}

function New-NpiWifTestAssertion {
    <#
    .SYNOPSIS
        An unsigned test assertion with the claims the workload's issuer will present. For the fake
        token endpoint only: it has no valid signature, and Microsoft Entra ID would refuse it.
    .EXAMPLE
        # Three dot-separated parts; the third says it isn't signed.
        $presented = Get-NpiWifPresentedClaims -Workload @{ platform = 'github'; repository = 'contoso/intranet'; entity = 'environment'; value = 'production'; subjectFormat = 'name-based' }
        New-NpiWifTestAssertion -Presented $presented -AsOf ([datetime]'2026-10-30T12:00:00Z')
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Presented, [Parameter(Mandatory)][datetime]$AsOf)
    $epoch = [DateTimeOffset]::new($AsOf.ToUniversalTime()).ToUnixTimeSeconds()
    $head = [ordered]@{ alg = 'RS256'; typ = 'JWT'; kid = 'fixture-only' }
    $body = [ordered]@{ iss = $Presented.Issuer; sub = $Presented.Subject; aud = $Presented.Audience; iat = $epoch; nbf = $epoch; exp = $epoch + 300 }
    $enc = { param($o) ConvertTo-NpiWifBase64Url ([Text.Encoding]::UTF8.GetBytes(($o | ConvertTo-Json -Compress))) }
    "$(& $enc $head).$(& $enc $body).not-signed-fixture-only"
}

function New-NpiWifFakeTokenEndpoint {
    <#
    .SYNOPSIS
        A fake Microsoft identity platform token endpoint for the client credentials request with a
        federated credential. It decodes the assertion and matches it as Learn describes: issuer,
        subject and audience exactly and case-sensitively, an issuer with leading or trailing
        whitespace blocked, an expired assertion refused. It checks no signature and no issuer
        keys. -Credentials is @{ ClientId; Name; Id; Issuer; Subject; Audiences }.
    .EXAMPLE
        # A fake endpoint that knows one federated credential.
        $cred = [pscustomobject]@{ ClientId = 'c1'; Name = 'n'; Id = 'i'; Issuer = 'https://contoso.example'; Subject = 's'; Audiences = @('api://AzureADTokenExchange') }
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -AsOf ([datetime]'2026-10-30T12:00:00Z') -Credentials @($cred)
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [object[]]$Credentials = @(), [datetime]$AsOf = [datetime]::UtcNow)
    $c = Get-NpiCloud -Cloud $Cloud
    $state = [pscustomobject]@{ IsFake = $true; Url = "$($c.Login)/$TenantId/oauth2/v2.0/token"; Credentials = [Collections.Generic.List[object]]::new(); Calls = [Collections.Generic.List[object]]::new(); AsOf = $AsOf; Invoke = $null }
    foreach ($x in $Credentials) { $state.Credentials.Add($x) }
    $s = $state
    $state.Invoke = {
        param([string]$Uri, [hashtable]$Form)
        $s.Calls.Add([pscustomobject]@{ Uri = $Uri; Keys = @($Form.Keys | Sort-Object) })
        $fail = { param($code, $msg) @{ status = 400; error = $code; error_description = $msg } }
        if ($Uri -ne $s.Url) { return (& $fail 'invalid_request' "The fake serves only $($s.Url)") }
        if ($Form.grant_type -ne 'client_credentials') { return (& $fail 'unsupported_grant_type' 'grant_type must be client_credentials') }
        if ($Form.client_assertion_type -ne 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer') { return (& $fail 'invalid_request' 'client_assertion_type must be urn:ietf:params:oauth:client-assertion-type:jwt-bearer') }
        if ("$($Form.scope)" -notmatch '/\.default$') { return (& $fail 'invalid_scope' 'scope must be a resource identifier suffixed with /.default') }
        $parts = "$($Form.client_assertion)".Split('.')
        if ($parts.Count -ne 3) { return (& $fail 'invalid_request' 'client_assertion is not a JWT') }
        $claims = ConvertFrom-NpiWifBase64Url $parts[1] | ConvertFrom-Json -AsHashtable
        if ("$($claims.iss)" -ne "$($claims.iss)".Trim()) { return (& $fail 'invalid_client' 'The issuer claim has leading or trailing whitespace; the exchange is blocked') }
        $now = [DateTimeOffset]::new($s.AsOf.ToUniversalTime()).ToUnixTimeSeconds()
        if ([int64]$claims.exp -le $now) { return (& $fail 'invalid_client' 'The assertion has expired') }
        $mine = @($s.Credentials | Where-Object { $_.ClientId -eq $Form.client_id })
        if (-not $mine) { return (& $fail 'unauthorized_client' "No application or managed identity with client ID $($Form.client_id) in the fake") }
        $hit = @($mine | Where-Object { [string]$_.Issuer -ceq [string]$claims.iss -and [string]$_.Subject -ceq [string]$claims.sub -and @($_.Audiences) -ccontains [string]$claims.aud })
        if (-not $hit) { return (& $fail 'invalid_client' 'AADSTS70021: No matching federated identity record found for presented assertion.') }
        @{ status = 200; token_type = 'Bearer'; expires_in = 3599; access_token = 'fake-access-token'; matchedCredential = $hit[0].Name }
    }.GetNewClosure()
    $state
}

function Test-NpiWifTokenExchange {
    <#
    .SYNOPSIS
        The client credentials request with a federated credential (Learn's third case), sent
        only to the fake token endpoint on the client: the code refuses to send an assertion
        anywhere else. Passes only if the named credential is the one that matched.
    .EXAMPLE
        # Passed is True: the fake endpoint matches the credential named 'n'.
        $cred = [pscustomobject]@{ ClientId = 'c1'; Name = 'n'; Id = 'i'; Issuer = 'https://contoso.example'; Subject = 's'; Audiences = @('api://AzureADTokenExchange') }
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -AsOf ([datetime]'2026-10-30T12:00:00Z') -Credentials @($cred)
        $client = New-NpiWifClient -Cloud gcc -Task federation -TenantId c0ffee00-0000-4000-8000-000000000001 -TokenEndpoint $ep
        $presented = [pscustomobject]@{ Issuer = 'https://contoso.example'; Subject = 's'; Audience = 'api://AzureADTokenExchange'; Note = $null }
        Test-NpiWifTokenExchange -Client $client -ClientId 'c1' -Presented $presented -CredentialName 'n' -AsOf ([datetime]'2026-10-30T12:00:00Z')
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Client, [Parameter(Mandatory)][string]$ClientId, [Parameter(Mandatory)]$Presented, [Parameter(Mandatory)][string]$CredentialName, [Parameter(Mandatory)][datetime]$AsOf, [string]$Scope)
    $ep = $Client.TokenEndpoint
    if (-not $ep -or -not ($ep.PSObject.Properties['IsFake'] -and $ep.IsFake)) { throw 'The token exchange test runs only against the fake token endpoint; a real exchange runs inside the workload (Lab 2).' }
    $r = Resolve-NpiWifUri -Client $Client -CallId 'ch05-token-exchange-test' -Bind @{ tenantId = $Client.TenantId }
    Assert-NpiHost -Uri $r.Uri -ExpectedHost $Client.Cloud.Login
    if (-not $Scope) { $Scope = "$($Client.Cloud.Graph)/.default" }
    if (-not $Presented.Issuer -or -not $Presented.Subject) {
        return [pscustomobject]@{ Credential = $CredentialName; ClientId = $ClientId; Passed = $false; Error = "Not run: $($Presented.Note)"; Matched = $null }
    }
    $form = [ordered]@{ client_id = $ClientId; scope = $Scope; client_assertion_type = $script:AssertionType; client_assertion = (New-NpiWifTestAssertion -Presented $Presented -AsOf $AsOf); grant_type = 'client_credentials' }
    Add-NpiWifEvidence -Client $Client -CallId 'ch05-token-exchange-test' -Method 'POST' -Target "$($r.Uri) (fake; client_id $ClientId)"
    $resp = & $ep.Invoke $r.Uri ([hashtable]$form)
    $ok = $resp.status -eq 200 -and $resp.matchedCredential -eq $CredentialName
    $err = if ($resp.status -ne 200) { "$($resp.error): $($resp.error_description)" } elseif (-not $ok) { "Matched '$($resp.matchedCredential)', not '$CredentialName'" } else { '' }
    [pscustomobject]@{ Credential = $CredentialName; ClientId = $ClientId; Passed = $ok; Error = $err; Matched = $(if ($resp.status -eq 200) { $resp.matchedCredential } else { $null }) }
}

# ----------------------------------------------------------------------------- inputs

function Import-NpiWifConversions {
    <#
    .SYNOPSIS
        The reviewed conversion file, with its SHA-256.
        Returns @{ Data; Conversions; Sha256 } and throws if two conversions share an ID.
    .EXAMPLE
        # The fixture's reviewed conversions.
        Import-NpiWifConversions -Path tests/fixtures/ch05/conversions.json
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $data = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $ids = @($data.conversions | ForEach-Object { $_.id })
    if (@($ids | Sort-Object -Unique).Count -ne $ids.Count) { throw 'Conversion IDs must be unique.' }
    [pscustomobject]@{ Data = $data; Conversions = @($data.conversions); Sha256 = Get-NpiFileHash -Path $Path }
}

function Import-NpiWifCutoverLog {
    <#
    .SYNOPSIS
        Reads the cutover log CSV and returns @{ Rows; Sha256 }, with Rows keyed by ConversionId.
    .EXAMPLE
        # Each conversion's cutover date and disable approval, if recorded.
        Import-NpiWifCutoverLog -Path tests/fixtures/ch05/cutover-log.csv
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path)
    $rows = @(Import-Csv -LiteralPath $Path)
    $map = @{}
    foreach ($r in $rows) { $map[$r.ConversionId] = $r }
    [pscustomobject]@{ Rows = $map; Sha256 = Get-NpiFileHash -Path $Path }
}

function Format-NpiWifTime {
    <#
    .SYNOPSIS
        Returns a time as an ISO 8601 UTC string (yyyy-MM-ddTHH:mm:ssZ), whether JSON parsing turned it
        into a DateTime or left a string. $null or an empty value returns $null.
    .EXAMPLE
        # 2026-10-30T12:00:00Z
        Format-NpiWifTime '2026-10-30T12:00:00Z'
    #>

    # A sign-in time as ISO 8601 UTC, whether JSON parsing turned it into a DateTime or left a string.
    param($Value)
    if ($null -eq $Value -or "$Value" -eq '') { return $null }
    $d = if ($Value -is [datetime]) { $Value.ToUniversalTime() } else { [datetime]::Parse("$Value", [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal) }
    $d.ToString('yyyy-MM-ddTHH:mm:ssZ', [Globalization.CultureInfo]::InvariantCulture)
}

function ConvertTo-NpiWifDate {
    <#
    .SYNOPSIS
        Parses a date or date-time string as UTC (a value with no offset is taken as UTC) and returns a
        DateTime. An empty string returns $null.
    .EXAMPLE
        # Midnight UTC on 1 October 2026, as the cutover log records a date.
        ConvertTo-NpiWifDate '2026-10-01'
    #>
    param([string]$Text)
    if (-not $Text) { return $null }
    [datetime]::Parse($Text, [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal -bor [Globalization.DateTimeStyles]::AssumeUniversal)
}

# ----------------------------------------------------------------------------- the plan

function Get-NpiWifParentCredentials {
    # The credentials on a parent (app registration or user-assigned identity), normalized.
    param($Client, $Target, [bool]$IdentityExists)
    if ($Target.kind -eq 'federatedCredential') {
        @(Invoke-NpiWifGet -Client $Client -CallId 'ch05-application-fics' -Bind @{ id = $Target.applicationObjectId } | ForEach-Object {
                [pscustomobject]@{ Id = $_.id; Name = $_.name; Issuer = $_.issuer; Subject = $_.subject; Audiences = @($_.audiences) } })
    } elseif ($Target.kind -eq 'managedIdentity' -and $Target.identityType -eq 'userAssigned' -and $IdentityExists) {
        @(Invoke-NpiWifGet -Client $Client -CallId 'ch05-uami-fics' -Bind @{ resourceId = $Target.resourceId } | ForEach-Object {
                [pscustomobject]@{ Id = $_.id; Name = $_.name; Issuer = $_.properties.issuer; Subject = $_.properties.subject; Audiences = @($_.properties.audiences) } })
    } else { @() }
}

function New-NpiWifPlan {
    <#
    .SYNOPSIS
        Read the tenant for each reviewed conversion and build the plan: the order check, the
        credential checks against what the workload presents, the token exchange test against the
        fake endpoint, the diff (create, no change, review, unmanaged), managed identities created
        or recorded with their role assignments, and the parallel run from sign-in evidence. The
        plan only describes writes; nothing here sends one.
    .EXAMPLE
        # The plan for the fixture tenant, with the read client.
        $fake = New-NpiWifFake -Path tests/fixtures/ch05/tenant.json
        $ep = New-NpiWifFakeTokenEndpoint -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -AsOf ([datetime]'2026-10-30T12:00:00Z')
        $client = New-NpiWifClient -Cloud gcc -Task federation -TenantId c0ffee00-0000-4000-8000-000000000001 -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke -TokenEndpoint $ep
        $conv = Import-NpiWifConversions -Path tests/fixtures/ch05/conversions.json
        $cut = Import-NpiWifCutoverLog -Path tests/fixtures/ch05/cutover-log.csv
        $r = New-NpiWifPlan -Client $client -Conversions $conv -CutoverLog $cut -AsOf ([datetime]'2026-10-30T12:00:00Z')
    #>
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Client,
        [Parameter(Mandatory)]$Conversions,
        [Parameter(Mandatory)]$CutoverLog,
        [Parameter(Mandatory)][datetime]$AsOf
    )
    if ($Client.Mode -ne 'read') { throw 'Build the plan with the read task, federation.' }
    $graph = $Client.Cloud.Graph; $arm = $Client.Cloud.Arm
    $actions = [Collections.Generic.List[object]]::new()
    $findings = [Collections.Generic.List[object]]::new()
    $records = [Collections.Generic.List[object]]::new()
    $tests = [Collections.Generic.List[object]]::new()
    $finding = { param($rule, $sev, $key, $obj, $issue) $findings.Add((New-NpiFinding -Rule $rule -Severity $sev -ObjectKey $key -Object $obj -Issue $issue)) }
    $act = { param([hashtable]$h) $base = [ordered]@{ ConversionId = $null; Action = $null; Write = $false; Name = $null; Call = $null; Method = $null; Target = $null; Body = $null; Presented = $null; Precheck = $null; Reason = $null }; foreach ($k in $h.Keys) { $base[$k] = $h[$k] }; $actions.Add([pscustomobject]$base) }

    foreach ($cv in $Conversions.Conversions) {
        $id = $cv.id; $t = $cv.target
        $rec = [ordered]@{ ConversionId = $id; Wave = $cv.wave; Risk = $cv.risk; Owner = $cv.owner; Legacy = $cv.legacy.name; LegacyKind = $cv.legacy.kind; TargetKind = $t.kind; Identity = $null; RoleAssignments = @(); CutoverGate = 'Ready'; CutoverGateReason = ''; ParallelRun = $null }
        $blocked = $false

        $order = Test-NpiWifOrder -Conversion $cv
        if ($order) { & $finding 'NPI-WIF-01' 'Finding' $id $cv.legacy.name $order; $blocked = $true; & $act @{ ConversionId = $id; Action = 'Blocked'; Name = $t.kind; Reason = $order } }

        # The parent: an app registration, or a managed identity.
        $clientId = $null; $identityExists = $false; $parentKind = 'application'; $principalId = $null
        if ($t.kind -in 'federatedCredential', 'certificate') {
            $app = Invoke-NpiWifGet -Client $Client -CallId 'ch05-application' -Bind @{ id = $t.applicationObjectId } -Query '$select=id,appId,displayName,passwordCredentials,keyCredentials'
            $clientId = $app.appId
            $rec.Identity = [ordered]@{ Kind = 'AppRegistration'; ObjectId = $app.id; AppId = $app.appId; DisplayName = $app.displayName }
        } elseif ($t.identityType -eq 'userAssigned') {
            $parentKind = 'userAssigned'
            $mi = Invoke-NpiWifGet -Client $Client -CallId 'ch05-uami' -Bind @{ resourceId = $t.resourceId } -AllowNotFound
            if ($mi) {
                $identityExists = $true; $clientId = $mi.properties.clientId; $principalId = $mi.properties.principalId
                $rec.Identity = [ordered]@{ Kind = 'UserAssignedManagedIdentity'; ResourceId = $t.resourceId; ClientId = $clientId; PrincipalId = $principalId; Location = $mi.location }
                & $act @{ ConversionId = $id; Action = 'IdentityExists'; Name = $mi.name; Target = $t.resourceId; Reason = 'Recorded: the identity exists; the PUT is never sent to an existing identity' }
            } elseif ($t.createIfMissing -and -not $blocked) {
                $clientId = "pending:$($t.resourceId)"
                $rec.Identity = [ordered]@{ Kind = 'UserAssignedManagedIdentity'; ResourceId = $t.resourceId; ClientId = $null; PrincipalId = $null; Location = $t.location; Pending = $true }
                & $act @{ ConversionId = $id; Action = 'CreateIdentity'; Write = $true; Name = ($t.resourceId -split '/')[-1]; Call = 'ch05-uami-create'; Method = 'PUT'; Target = "$arm$($t.resourceId)?api-version=2024-11-30"; Body = [ordered]@{ location = $t.location; tags = [ordered]@{ conversion = $id } }; Precheck = 'ch05-uami: still not found'; Reason = "Create the user-assigned managed identity for $($cv.legacy.name)" }
                $rec.CutoverGate = 'NotReady'; $rec.CutoverGateReason = 'Create the identity, assign it to the host and grant its roles first'
            } else {
                $rec.CutoverGate = 'NotReady'; $rec.CutoverGateReason = 'The user-assigned identity doesn''t exist and the file doesn''t ask to create it'
            }
        } else {
            $parentKind = 'systemAssigned'
            $sp = Invoke-NpiWifGet -Client $Client -CallId 'ch05-service-principal' -Bind @{ id = $t.servicePrincipalId } -Query '$select=id,appId,displayName,servicePrincipalType,accountEnabled' -AllowNotFound
            if ($sp) {
                $clientId = $sp.appId; $principalId = $sp.id; $identityExists = $true
                $rec.Identity = [ordered]@{ Kind = 'SystemAssignedManagedIdentity'; ServicePrincipalId = $sp.id; ClientId = $sp.appId; DisplayName = $sp.displayName }
                & $act @{ ConversionId = $id; Action = 'IdentityExists'; Name = $sp.displayName; Target = $sp.id; Reason = 'Recorded: the host''s system-assigned identity' }
            } else {
                & $act @{ ConversionId = $id; Action = 'AwaitHost'; Name = $t.servicePrincipalId; Reason = 'Turn on the system-assigned identity in the host''s own deployment, then run again' }
                $rec.CutoverGate = 'NotReady'; $rec.CutoverGateReason = 'No system-assigned identity yet'
            }
        }
        if ($principalId -and $t.kind -eq 'managedIdentity') {
            # The subscription comes from the identity's own resource ID, or the host's for a system-assigned identity.
            $rid = if ($t.ContainsKey('resourceId')) { $t.resourceId } elseif ($t.ContainsKey('hostResourceId')) { $t.hostResourceId } else { '' }
            $sub = ([regex]::Match("$rid", '^/subscriptions/([0-9a-f-]{36})/')).Groups[1].Value
            if ($sub) {
                $ra = @(Invoke-NpiWifGet -Client $Client -CallId 'ch05-role-assignments' -Bind @{ subscriptionId = $sub } -Query "`$filter=assignedTo('$principalId')")
                $rec.RoleAssignments = @($ra | ForEach-Object { [ordered]@{ Scope = $_.properties.scope; RoleDefinitionId = ($_.properties.roleDefinitionId -split '/')[-1] } })
            } else { $rec.RoleAssignments = @('not read: give the target a resourceId or hostResourceId') }
        }

        if ($t.kind -eq 'certificate' -and -not $blocked) {
            & $act @{ ConversionId = $id; Action = 'HandOffChapter04'; Name = $rec.Identity.DisplayName; Reason = 'Neither a managed identity nor a federated credential fits the host: a certificate from the vault, capped and rotated under Chapter 04' }
            $rec.CutoverGate = 'NotReady'; $rec.CutoverGateReason = 'Certificate issued and rotated under Chapter 04'
        }

        # The federated credentials: checks, the exchange test, the diff.
        $desired = @($t.credentials)
        if ($desired.Count) {
            $existing = @(Get-NpiWifParentCredentials -Client $Client -Target $t -IdentityExists $identityExists)
            $desiredNames = @($desired | ForEach-Object { $_.name })
            $after = @($existing | Where-Object { $_.Name -notin $desiredNames }) + @($desired | ForEach-Object { [pscustomobject]@{ Id = $null; Name = $_.name; Issuer = $_.issuer; Subject = $_.subject; Audiences = @($_.audiences) } })
            if ($after.Count -gt $script:MaxCredentials) { & $finding 'NPI-WIF-06' 'Finding' $id $cv.legacy.name "$($after.Count) federated credentials on one parent; the limit is $($script:MaxCredentials)"; $blocked = $true }
            $dupes = @($after | Group-Object { "$($_.Issuer)|$($_.Subject)" } -CaseSensitive | Where-Object Count -GT 1)
            foreach ($d in $dupes) { & $finding 'NPI-WIF-06' 'Finding' "$id/$($d.Group[0].Name)" $cv.legacy.name "Issuer and subject '$($d.Name)' appear $($d.Count) times on one parent; the pair must be unique" }

            $endpointCreds = @($after | ForEach-Object { [pscustomobject]@{ ClientId = $clientId; Name = $_.Name; Id = $_.Id; Issuer = $_.Issuer; Subject = $_.Subject; Audiences = $_.Audiences } })
            foreach ($ec in $endpointCreds) { $Client.TokenEndpoint.Credentials.Add($ec) }

            foreach ($d in $desired) {
                $key = "$id/$($d.name)"
                $presented = Get-NpiWifPresentedClaims -Workload $d.workload
                $problems = @(Test-NpiWifCredential -Credential $d -Presented $presented -ParentKind $parentKind)
                foreach ($pr in $problems) { & $finding $pr.Rule 'Finding' $key $cv.legacy.name $pr.Issue }
                $test = Test-NpiWifTokenExchange -Client $Client -ClientId $clientId -Presented $presented -CredentialName $d.name -AsOf $AsOf
                $tests.Add([pscustomobject][ordered]@{ ConversionId = $id; Credential = $d.name; ClientId = $clientId; Issuer = $presented.Issuer; Subject = $presented.Subject; SubjectSource = $presented.Source; Passed = $test.Passed; Error = $test.Error })
                if (-not $test.Passed) { & $finding 'NPI-WIF-08' 'Finding' $key $cv.legacy.name "Token exchange test failed: $($test.Error)" }
                $clean = (-not $problems) -and $test.Passed -and -not $blocked
                if (-not $clean) { $rec.CutoverGate = 'Blocked'; $rec.CutoverGateReason = 'A federated credential fails its checks or its token exchange test' }
                $have = @($existing | Where-Object Name -EQ $d.name)
                $presentedOut = [ordered]@{ issuer = $presented.Issuer; subject = $presented.Subject; audience = $presented.Audience }
                if ($have) {
                    $same = ([string]$have[0].Issuer -ceq [string]$d.issuer) -and ([string]$have[0].Subject -ceq [string]$d.subject) -and ((@($have[0].Audiences) -join '|') -ceq (@($d.audiences) -join '|'))
                    if ($same) { & $act @{ ConversionId = $id; Action = 'NoChange'; Name = $d.name; Target = $have[0].Id; Reason = $(if ($clean) { 'In the tenant as reviewed' } else { 'In the tenant as reviewed, but it fails its checks: fix it with a new credential and its own parallel run' }) } }
                    else { & $act @{ ConversionId = $id; Action = 'ReviewChange'; Name = $d.name; Target = $have[0].Id; Reason = 'In the tenant with other values; credentials aren''t changed in place: add one under a new name and run it in parallel (Design guidance)' } }
                    continue
                }
                if (-not $clean) { & $act @{ ConversionId = $id; Action = 'Blocked'; Name = $d.name; Presented = $presentedOut; Reason = (@($problems | ForEach-Object Issue) + @($(if (-not $test.Passed) { "Exchange test: $($test.Error)" })) -join '; ') }; continue }
                if ($t.kind -eq 'federatedCredential') {
                    $body = [ordered]@{ name = $d.name; issuer = $d.issuer; subject = $d.subject; audiences = @($d.audiences) }
                    if ($d.ContainsKey('description') -and $d.description) { $body.description = $d.description }
                    & $act @{ ConversionId = $id; Action = 'CreateCredential'; Write = $true; Name = $d.name; Call = 'ch05-fic-create'; Method = 'POST'; Target = "$graph/v1.0/applications/$($t.applicationObjectId)/federatedIdentityCredentials"; Body = $body; Presented = $presentedOut; Precheck = 'ch05-application-fics: name and issuer-subject pair still absent, under the limit'; Reason = "Exchange test passed against the fake; matches $($presented.Source) claims" }
                } else {
                    $body = [ordered]@{ properties = [ordered]@{ issuer = $d.issuer; subject = $d.subject; audiences = @($d.audiences) } }
                    & $act @{ ConversionId = $id; Action = 'CreateCredential'; Write = $true; Name = $d.name; Call = 'ch05-uami-fic-create'; Method = 'PUT'; Target = "$arm$($t.resourceId)/federatedIdentityCredentials/$($d.name)?api-version=2024-11-30"; Body = $body; Presented = $presentedOut; Precheck = 'ch05-uami-fics: name and issuer-subject pair still absent; sent after the identity exists, one at a time'; Reason = "Exchange test passed against the fake; matches $($presented.Source) claims" }
                }
                if ($rec.CutoverGate -eq 'Ready') { $rec.CutoverGate = 'NotReady'; $rec.CutoverGateReason = 'Create the federated credentials, then run again' }
            }
            foreach ($u in @($existing | Where-Object { $_.Name -notin $desiredNames })) {
                & $finding 'NPI-WIF-07' 'Warn' "$id/$($u.Name)" $cv.legacy.name "A federated credential in the tenant that the reviewed file doesn't hold (issuer '$($u.Issuer)', subject '$($u.Subject)'); add it to the file or retire it through review. This code never deletes"
                & $act @{ ConversionId = $id; Action = 'Unmanaged'; Name = $u.Name; Target = $u.Id; Reason = 'Not in the reviewed file; reported, never deleted' }
            }
        }
        if ($blocked -and $rec.CutoverGate -ne 'Blocked') { $rec.CutoverGate = 'Blocked'; $rec.CutoverGateReason = 'The conversion fails the order or limit checks' }

        # The parallel run.
        $cut = if ($CutoverLog.Rows.ContainsKey($id)) { $CutoverLog.Rows[$id] } else { $null }
        $pr = [ordered]@{ Status = 'AwaitingCutover'; CutoverOn = $null; Day = $null; WindowEnds = $null; NewSignIns = 0; NewFailures = 0; LastNewSignIn = $null; LegacyInUse = $false; LegacyDetail = ''; DisableApprovedBy = $null; DisabledOn = $null }
        if (-not $cut -or -not $cut.CutoverOn) {
            $pr.Status = 'AwaitingCutover'
            & $act @{ ConversionId = $id; Action = 'AwaitingCutover'; Name = $cv.legacy.name; Reason = $(if ($rec.CutoverGate -eq 'Ready') { 'Ready for cutover: record CutoverOn when the workload switches' } else { "Not ready for cutover: $($rec.CutoverGateReason)" }) }
        } else {
            $cutOn = ConvertTo-NpiWifDate $cut.CutoverOn
            $pr.CutoverOn = $cutOn.ToString('yyyy-MM-dd'); $pr.Day = [int][math]::Floor(($AsOf - $cutOn).TotalDays); $pr.WindowEnds = $cutOn.AddDays($script:ParallelRunDays).ToString('yyyy-MM-dd')
            $pr.DisableApprovedBy = $cut.DisableApprovedBy; $pr.DisabledOn = $cut.DisabledOn
            if ($rec.CutoverGate -eq 'Blocked') { & $finding 'NPI-WIF-09' 'Finding' $id $cv.legacy.name 'Cut over while a credential fails its checks or exchange test' }
            if ($clientId -and $clientId -notlike 'pending:*') {
                $evt = if ($t.kind -eq 'managedIdentity') { 'managedIdentity' } else { 'servicePrincipal' }
                $q = "`$filter=createdDateTime ge $($cutOn.ToString('yyyy-MM-ddTHH:mm:ssZ')) and appId eq '$clientId' and signInEventTypes/any(t: t eq '$evt')"
                $signIns = @(Invoke-NpiWifGet -Client $Client -CallId 'ch05-signins' -Query $q)
                $newIds = @($desired | ForEach-Object { $n = $_.name; @(Get-NpiWifParentCredentials -Client $Client -Target $t -IdentityExists $identityExists | Where-Object Name -EQ $n | ForEach-Object Id) })
                $isNew = { param($si) if ($t.kind -eq 'managedIdentity' -and -not $desired.Count) { $si.clientCredentialType -eq 'managedIdentity' } else { $si.clientCredentialType -eq 'federatedIdentityCredential' -and $si.federatedCredentialId -in $newIds } }
                $new = @($signIns | Where-Object { & $isNew $_ })
                $pr.NewSignIns = @($new | Where-Object { $_.status.errorCode -eq 0 }).Count
                $pr.NewFailures = @($new | Where-Object { $_.status.errorCode -ne 0 }).Count
                $pr.LastNewSignIn = $new | ForEach-Object { Format-NpiWifTime $_.createdDateTime } | Sort-Object -Descending | Select-Object -First 1
                if ($cv.legacy.kind -eq 'appSecret') {
                    $old = @($signIns | Where-Object { $_.clientCredentialType -eq 'clientSecret' -and $_.status.errorCode -eq 0 })
                    if ($old) { $pr.LegacyInUse = $true; $pr.LegacyDetail = "$($old.Count) client secret sign-in(s) since cutover, last $(@($old | ForEach-Object { Format-NpiWifTime $_.createdDateTime } | Sort-Object -Descending)[0])" }
                }
            }
            if ($cv.legacy.kind -eq 'adAccount') {
                $u = Invoke-NpiWifAdRead -Client $Client -CallId 'ch05-ad-legacy' -Params @{ Identity = $cv.legacy.objectId; Properties = @('Enabled', 'LastLogonDate') }
                $last = if ($u.LastLogonDate) { [datetime]$u.LastLogonDate } else { $null }
                if ($last -and $last -gt $cutOn.AddDays(1)) { $pr.LegacyInUse = $true; $pr.LegacyDetail = "LastLogonDate $($last.ToString('yyyy-MM-dd')) is after cutover (a lead: confirm on the domain controllers)" }
                if (-not $u.Enabled -and -not $pr.DisabledOn) { $pr.DisabledOn = 'disabled, date not recorded' }
            }
            $rec.ParallelRun = $null
            if ($pr.DisabledOn) { $pr.Status = 'Converted'; & $act @{ ConversionId = $id; Action = 'Converted'; Name = $cv.legacy.name; Reason = "Legacy disabled ($($pr.DisabledOn)); record the target, the date and the disabled object's ID in the record" } }
            elseif ($pr.LegacyInUse) { $pr.Status = 'LegacyStillInUse'; & $finding 'NPI-WIF-09' 'Finding' $id $cv.legacy.name "The legacy credential is still in use: $($pr.LegacyDetail)"; & $act @{ ConversionId = $id; Action = 'LegacyStillInUse'; Name = $cv.legacy.name; Reason = "$($pr.LegacyDetail); the 30 days aren't clean until the workload stops using it" } }
            elseif ($pr.NewFailures) { $pr.Status = 'NewCredentialFailing'; & $finding 'NPI-WIF-09' 'Finding' $id $cv.legacy.name "$($pr.NewFailures) failed sign-in(s) on the new credential since cutover"; & $act @{ ConversionId = $id; Action = 'NewCredentialFailing'; Name = $cv.legacy.name; Reason = 'Failed sign-ins on the new credential; fix before the window can close' } }
            elseif (-not $pr.NewSignIns -and $pr.Day -ge $script:SilenceDays) { $pr.Status = 'NoSignInsOnNewCredential'; & $finding 'NPI-WIF-09' 'Finding' $id $cv.legacy.name "No sign-in on the new credential in $($pr.Day) days since cutover"; & $act @{ ConversionId = $id; Action = 'NoSignInsOnNewCredential'; Name = $cv.legacy.name; Reason = 'No evidence the workload uses the new credential' } }
            elseif ($pr.Day -lt $script:ParallelRunDays) { $pr.Status = 'ParallelRunning'; & $act @{ ConversionId = $id; Action = 'ParallelRunning'; Name = $cv.legacy.name; Reason = "Day $($pr.Day) of $($script:ParallelRunDays); the window ends $($pr.WindowEnds); $($pr.NewSignIns) sign-in(s) on the new credential" } }
            elseif (-not $pr.DisableApprovedBy) { $pr.Status = 'AwaitingOwnerApproval'; & $act @{ ConversionId = $id; Action = 'AwaitingOwnerApproval'; Name = $cv.legacy.name; Reason = 'A clean 30 days: the application owner approves the disable in the cutover log' } }
            else {
                $pr.Status = 'ReadyToDisableLegacy'
                if ($cv.legacy.kind -eq 'adAccount') {
                    & $act @{ ConversionId = $id; Action = 'DisableLegacy'; Write = $true; Name = $cv.legacy.name; Call = 'ch05-ad-disable'; Method = 'WRITE'; Target = "Disable-ADAccount -Identity $($cv.legacy.objectId)"; Precheck = 'ch05-ad-legacy: still enabled'; Reason = "A clean $($pr.Day)-day parallel run with $($pr.NewSignIns) sign-in(s) on the new identity; approved by $($pr.DisableApprovedBy). Disable, never delete" }
                } else {
                    & $act @{ ConversionId = $id; Action = 'RemoveSecretByOwner'; Name = $cv.legacy.name; Reason = "The new credential has carried production traffic for $($pr.Day) days: the owner removes secret $($cv.legacy.keyId) through Chapter 04's reviewed change. This code doesn't remove credentials" }
                }
            }
        }
        $rec.ParallelRun = $pr
        $records.Add([pscustomobject]$rec)
    }

    [pscustomobject]@{
        Plan     = [pscustomobject][ordered]@{
            planVersion = 1; task = 'federation-apply'; generated = $AsOf.ToString('o'); asOf = $AsOf.ToString('yyyy-MM-dd'); cloud = $Client.Cloud.Name; tenantId = $Client.TenantId
            conversionsSha256 = $Conversions.Sha256; cutoverLogSha256 = $CutoverLog.Sha256; parallelRunDays = $script:ParallelRunDays
            actions = $actions.ToArray()
        }
        Findings = $findings.ToArray()
        Records  = $records.ToArray()
        Tests    = $tests.ToArray()
    }
}

# ----------------------------------------------------------------------------- the reviewed write path

function Assert-NpiWifPlannedWrite {
    <#
    .SYNOPSIS
        Every write must be a declared federation-apply call with its method, its target on the cloud's host, and only the body it allows.
        A federated credential's body goes through Test-NpiWifCredential again. Throws with the reason;
        returns nothing when the write is allowed.
    .EXAMPLE
        # $r is New-NpiWifPlan's result; check its first write with a federation-apply client.
        $fake = New-NpiWifFake -Path tests/fixtures/ch05/tenant.json -AllowWrite
        $writer = New-NpiWifClient -Cloud gcc -Task federation-apply -TenantId c0ffee00-0000-4000-8000-000000000001 -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke
        Assert-NpiWifPlannedWrite -Client $writer -Action @($r.Plan.actions | Where-Object Write)[0]
    #>
    param($Client, $Action)
    $call = @($Client.Calls | Where-Object { $_.id -eq $Action.Call })
    if (-not $call) { throw "Action $($Action.ConversionId)/$($Action.Name): '$($Action.Call)' isn't declared for federation-apply." }
    $call = $call[0]
    if ($call.method -ne $Action.Method) { throw "Action $($Action.ConversionId)/$($Action.Name): $($Action.Method) doesn't match the declared $($call.method)." }
    if ($Action.Method -eq 'DELETE') { throw 'DELETE is never sent: conversion disables, it doesn''t delete.' }
    $g = [regex]::Escape($Client.Cloud.Graph); $a = [regex]::Escape($Client.Cloud.Arm)
    $uami = '/subscriptions/[0-9a-f-]{36}/resourceGroups/[A-Za-z0-9._()-]+/providers/Microsoft\.ManagedIdentity/userAssignedIdentities/[A-Za-z0-9_-]+'
    $b = $Action.Body
    $keys = if ($null -eq $b) { @() } elseif ($b -is [Collections.IDictionary]) { @($b.Keys) } else { @($b.PSObject.Properties.Name) }
    $val = { param($o, $k) if ($o -is [Collections.IDictionary]) { $o[$k] } else { $o.$k } }
    switch ($call.id) {
        'ch05-fic-create' {
            if ($Action.Target -notmatch "^$g/v1\.0/applications/[0-9a-f-]{36}/federatedIdentityCredentials$") { throw "Unexpected target $($Action.Target)" }
            $extra = @($keys | Where-Object { $_ -notin 'name', 'issuer', 'subject', 'audiences', 'description' }); if ($extra) { throw "Body property not allowed: $($extra -join ', ')" }
        }
        'ch05-uami-fic-create' {
            if ($Action.Target -notmatch "^$a$uami/federatedIdentityCredentials/[A-Za-z0-9_-]+\?api-version=2024-11-30$") { throw "Unexpected target $($Action.Target)" }
            if (($keys -join ',') -ne 'properties') { throw 'The only body allowed is { properties: { issuer, subject, audiences } }.' }
            $inner = & $val $b 'properties'; $ik = if ($inner -is [Collections.IDictionary]) { @($inner.Keys) } else { @($inner.PSObject.Properties.Name) }
            $extra = @($ik | Where-Object { $_ -notin 'issuer', 'subject', 'audiences' }); if ($extra) { throw "Body property not allowed: $($extra -join ', ')" }
        }
        'ch05-uami-create' {
            if ($Action.Target -notmatch "^$a$uami\?api-version=2024-11-30$") { throw "Unexpected target $($Action.Target)" }
            $extra = @($keys | Where-Object { $_ -notin 'location', 'tags' }); if ($extra) { throw "Body property not allowed: $($extra -join ', ')" }
        }
        'ch05-ad-disable' { if ($Action.Target -notmatch '^Disable-ADAccount -Identity [0-9a-f-]{36}$') { throw "Unexpected target $($Action.Target)" } }
        default { throw "No rule for $($call.id)." }
    }
    if ($call.id -in 'ch05-fic-create', 'ch05-uami-fic-create') {
        # The same checks again, on the body that will be sent: a hand-edited plan can't create a credential the plan would have blocked.
        $cred = if ($call.id -eq 'ch05-fic-create') { $b } else { $p2 = & $val $b 'properties'; [ordered]@{ name = $Action.Name; issuer = (& $val $p2 'issuer'); subject = (& $val $p2 'subject'); audiences = @(& $val $p2 'audiences') } }
        $pres = $Action.Presented; $presObj = if ($pres) { [pscustomobject]@{ Issuer = (& $val $pres 'issuer'); Subject = (& $val $pres 'subject'); Audience = (& $val $pres 'audience'); Note = 'no presented claims in the plan' } } else { [pscustomobject]@{ Issuer = $null; Subject = $null; Audience = $null; Note = 'no presented claims in the plan' } }
        $problems = @(Test-NpiWifCredential -Credential $cred -Presented $presObj)
        if ($problems) { throw "Action $($Action.ConversionId)/$($Action.Name): $(@($problems | ForEach-Object Issue) -join '; ')" }
    }
}

function Invoke-NpiWifPlan {
    <#
    .SYNOPSIS
        Apply a reviewed plan. Without -Apply it is a dry run: every check and precheck, nothing
        sent. With -Apply it sends the plan's writes in order, one at a time, only if the plan
        file's SHA-256 is the approved one, the plan is for this tenant and cloud and no older
        than seven days, and each precheck still holds.
    .EXAMPLE
        # A dry run of a reviewed plan against the fake; add -Apply to send the writes.
        $fake = New-NpiWifFake -Path tests/fixtures/ch05/tenant.json -AllowWrite
        $writer = New-NpiWifClient -Cloud gcc -Task federation-apply -TenantId c0ffee00-0000-4000-8000-000000000001 -Invoke $fake.Invoke -AdInvoke $fake.AdInvoke
        Invoke-NpiWifPlan -PlanPath out/federation/plan.json -ApprovedSha256 (Get-NpiFileHash -Path out/federation/plan.json) `
            -Client $writer -AsOf ([datetime]'2026-10-30T12:00:00Z')
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$PlanPath, [Parameter(Mandatory)][string]$ApprovedSha256, [Parameter(Mandatory)]$Client, [Parameter(Mandatory)][datetime]$AsOf, [switch]$Apply)
    if ($Client.Mode -ne 'write') { throw 'Apply with the write task, federation-apply.' }
    $hash = Get-NpiFileHash -Path $PlanPath
    if ($hash -ne $ApprovedSha256.ToLowerInvariant()) { throw "The plan's SHA-256 is $hash, not the approved $ApprovedSha256; refusing to run a plan nobody reviewed." }
    $plan = Get-Content -LiteralPath $PlanPath -Raw | ConvertFrom-Json -Depth 50
    if ($plan.task -ne 'federation-apply') { throw 'Not a federation plan.' }
    if ($plan.tenantId -ne $Client.TenantId) { throw "The plan is for tenant $($plan.tenantId), not $($Client.TenantId)." }
    if ($plan.cloud -ne $Client.Cloud.Name) { throw "The plan is for cloud $($plan.cloud), not $($Client.Cloud.Name)." }
    $generated = ConvertTo-NpiWifDate (Format-NpiWifTime $plan.generated)
    if (($AsOf - $generated).TotalDays -gt $script:MaxPlanAgeDays) { throw "The plan is $([int]($AsOf - $generated).TotalDays) days old; build and review a new one (the limit is $($script:MaxPlanAgeDays))." }

    $results = [Collections.Generic.List[object]]::new()
    $pendingIdentities = @{}
    foreach ($a in @($plan.actions | Where-Object Write)) {
        Assert-NpiWifPlannedWrite -Client $Client -Action $a
        $outcome = $null; $detail = ''
        switch ($a.Call) {
            'ch05-uami-create' {
                $rid = ($a.Target -replace '^https://[^/]+', '') -replace '\?api-version=.*$', ''
                $mi = Invoke-NpiWifGet -Client $Client -CallId 'ch05-uami' -Bind @{ resourceId = $rid } -AllowNotFound
                if ($mi) { $outcome = 'Skipped'; $detail = 'The identity exists already; the PUT is never sent to an existing identity' } else { $pendingIdentities[$rid.ToLowerInvariant()] = $true }
            }
            'ch05-uami-fic-create' {
                $rid = ($a.Target -replace '^https://[^/]+', '') -replace '/federatedIdentityCredentials/.*$', ''
                $mi = Invoke-NpiWifGet -Client $Client -CallId 'ch05-uami' -Bind @{ resourceId = $rid } -AllowNotFound
                if (-not $mi -and -not $pendingIdentities.ContainsKey($rid.ToLowerInvariant())) { $outcome = 'Skipped'; $detail = 'The parent identity doesn''t exist and isn''t created in this plan' }
                elseif ($mi) {
                    $have = @(Invoke-NpiWifGet -Client $Client -CallId 'ch05-uami-fics' -Bind @{ resourceId = $rid })
                    $p = $a.Body.properties
                    if (@($have | Where-Object { $_.name -eq $a.Name -or ($_.properties.issuer -ceq $p.issuer -and $_.properties.subject -ceq $p.subject) }).Count) { $outcome = 'Skipped'; $detail = 'A credential with this name or issuer and subject exists already' }
                    elseif ($have.Count -ge $script:MaxCredentials) { $outcome = 'Skipped'; $detail = "The identity holds $($have.Count) credentials already" }
                }
            }
            'ch05-fic-create' {
                $appId = ([regex]::Match($a.Target, '/applications/([0-9a-f-]{36})/')).Groups[1].Value
                $have = @(Invoke-NpiWifGet -Client $Client -CallId 'ch05-application-fics' -Bind @{ id = $appId })
                if (@($have | Where-Object { $_.name -eq $a.Body.name -or ($_.issuer -ceq $a.Body.issuer -and $_.subject -ceq $a.Body.subject) }).Count) { $outcome = 'Skipped'; $detail = 'A credential with this name or issuer and subject exists already' }
                elseif ($have.Count -ge $script:MaxCredentials) { $outcome = 'Skipped'; $detail = "The application holds $($have.Count) credentials already" }
            }
            'ch05-ad-disable' {
                $guid = ($a.Target -split ' ')[-1]
                $u = Invoke-NpiWifAdRead -Client $Client -CallId 'ch05-ad-legacy' -Params @{ Identity = $guid; Properties = @('Enabled') }
                if (-not $u.Enabled) { $outcome = 'Skipped'; $detail = 'Already disabled' }
            }
        }
        if (-not $outcome) {
            if (-not $Apply) { $outcome = 'WouldSend' }
            else {
                Add-NpiWifEvidence -Client $Client -CallId $a.Call -Method $a.Method -Target $a.Target
                if ($a.Call -eq 'ch05-ad-disable') { $null = & $Client.AdInvoke 'Disable-ADAccount' @{ Identity = ($a.Target -split ' ')[-1] } }
                else {
                    $hostName = if ($a.Call -eq 'ch05-fic-create') { $Client.Cloud.Graph } else { $Client.Cloud.Arm }
                    Assert-NpiHost -Uri $a.Target -ExpectedHost $hostName
                    $body = $a.Body | ConvertTo-Json -Depth 10 | ConvertFrom-Json -AsHashtable
                    $null = & $Client.Invoke $a.Method $a.Target $body $null
                }
                $outcome = 'Sent'
                if ($a.Action -eq 'DisableLegacy') { $detail = "Record DisabledOn $($AsOf.ToString('yyyy-MM-dd')) in the cutover log; rollback is Enable-ADAccount and the application's old configuration" }
                elseif ($a.Action -eq 'CreateCredential') { $detail = 'Wait for the credential to propagate before the first real exchange (Learn: AADSTS70021 for a few minutes); retry token requests' }
            }
        }
        $results.Add([pscustomobject]@{ ConversionId = $a.ConversionId; Action = $a.Action; Name = $a.Name; Method = $a.Method; Target = $a.Target; Outcome = $outcome; Detail = $detail })
    }
    [pscustomobject]@{ PlanSha256 = $hash; Mode = $(if ($Apply) { 'Apply' } else { 'DryRun' }); Results = $results.ToArray(); Evidence = $Client.Evidence.ToArray() }
}

# ----------------------------------------------------------------------------- live invoker

function New-NpiWifLiveInvoker {
    <#
    .SYNOPSIS
        The live invoker: Graph through Invoke-MgGraphRequest, Resource Manager through
        Invoke-AzRestMethod. Refuses a session in another cloud or tenant, refuses anything but GET
        unless -AllowWrite, and never sends DELETE.
    .EXAMPLE
        # After Connect-MgGraph and Connect-AzAccount to the same GCC tenant; GET only.
        $invoke = New-NpiWifLiveInvoker -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001
        $client = New-NpiWifClient -Cloud gcc -Task federation -TenantId c0ffee00-0000-4000-8000-000000000001 -Invoke $invoke
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Cloud, [Parameter(Mandatory)][string]$TenantId, [switch]$SkipAzure, [switch]$AllowWrite)
    $c = Get-NpiCloud -Cloud $Cloud
    $mg = Get-MgContext
    if (-not $mg) { throw 'Not signed in to Microsoft Graph.' }
    if ($mg.Environment -ne $c.GraphEnvironment) { throw "Graph session is in '$($mg.Environment)', not '$($c.GraphEnvironment)'." }
    if ($mg.TenantId -ne $TenantId) { throw "Graph session is signed in to tenant '$($mg.TenantId)', not '$TenantId'." }
    if (-not $SkipAzure) {
        $az = Get-AzContext
        if (-not $az) { throw 'Not signed in to Azure.' }
        if ($az.Environment.Name -ne $c.AzureEnvironment) { throw "Azure session is in '$($az.Environment.Name)', not '$($c.AzureEnvironment)'." }
        if ($az.Tenant.Id -ne $TenantId) { throw "Azure session is signed in to tenant '$($az.Tenant.Id)', not '$TenantId'." }
    }
    $graph = $c.Graph; $write = [bool]$AllowWrite
    {
        param($Method, $Uri, $Body, $Headers)
        if ($Method -eq 'DELETE') { throw 'Refusing DELETE' }
        if ($Method -ne 'GET' -and -not $write) { throw "Refusing $Method" }
        if ($Uri.StartsWith("$graph/")) {
            $p = @{ Method = $Method; Uri = $Uri; OutputType = 'Hashtable' }
            if ($Headers) { $p.Headers = $Headers }
            if ($null -ne $Body) { $p.Body = ($Body | ConvertTo-Json -Depth 10 -Compress); $p.ContentType = 'application/json' }
            $resp = Invoke-MgGraphRequest @p
            if ($null -eq $resp) { @{} } else { $resp }
        } else {
            $p = @{ Method = $Method; Uri = $Uri }
            if ($null -ne $Body) { $p.Payload = ($Body | ConvertTo-Json -Depth 10 -Compress) }
            $resp = Invoke-AzRestMethod @p
            if ($resp.StatusCode -ge 400) { throw "Resource Manager returned $($resp.StatusCode) for $Uri" }
            if ($resp.Content) { $resp.Content | ConvertFrom-Json -AsHashtable -Depth 50 } else { @{} }
        }
    }.GetNewClosure()
}

# ----------------------------------------------------------------------------- the fakes

function New-NpiWifFake {
    <#
    .SYNOPSIS
        A fake Microsoft Graph, Resource Manager and Active Directory for Chapter 05, served from
        tests/fixtures/ch05/tenant.json. GET only unless -AllowWrite. It enforces the creation rules
        Learn documents (exactly one audience, the name rules, a unique issuer and subject, 20 per
        parent, an existing parent identity) and nothing else: a wrong subject or audience is
        accepted at creation, as Learn says the service accepts it.
    .EXAMPLE
        # The fixture tenant; pass $fake.Invoke and $fake.AdInvoke to New-NpiWifClient.
        $fake = New-NpiWifFake -Path tests/fixtures/ch05/tenant.json -PageSize 2
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$Path, [string]$Cloud = 'gcc', [int]$PageSize = 2, [switch]$AllowWrite)
    $t = Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json -AsHashtable -Depth 50
    $c = Get-NpiCloud -Cloud $Cloud
    $state = [pscustomobject]@{ Estate = $t; Calls = [Collections.Generic.List[object]]::new(); PageSize = $PageSize; Graph = $c.Graph; Arm = $c.Arm; AllowWrite = [bool]$AllowWrite; Seq = 0; Invoke = $null; AdInvoke = $null }
    $s = $state
    $state.Invoke = { param($Method, $Uri, $Body, $Headers) Invoke-NpiWifFakeHttp -State $s -Method $Method -Uri $Uri -Body $Body -Headers $Headers }.GetNewClosure()
    $state.AdInvoke = { param($Cmdlet, [hashtable]$Params) Invoke-NpiWifFakeAd -State $s -Cmdlet $Cmdlet -Params $Params }.GetNewClosure()
    $state
}

function New-NpiWifFakeId {
    param($State, [string]$Prefix)
    $State.Seq++
    '{0}000000-0000-4000-8000-{1:d12}' -f $Prefix, (900 + $State.Seq)
}

function Test-NpiWifFakeCreate {
    # Learn's documented creation errors, for both parents.
    param([string]$Name, [string]$Issuer, [string]$Subject, $Audiences, [object[]]$Existing)
    if (-not $Name -or -not $Issuer -or -not $Subject -or $null -eq $Audiences) { throw '400 Bad Request: all federated identity credential properties are mandatory' }
    if (@($Audiences).Count -ne 1) { throw '400 Bad Request: Federated identity credentials must have exactly one audience.' }
    if ($Name -notmatch $script:NamePattern) { throw "400 Bad Request: Federated Identity Credential name '$Name' is invalid." }
    if (@($Existing | Where-Object { $_.name -eq $Name }).Count) { throw "409 Conflict: a federated identity credential named '$Name' exists" }
    if (@($Existing | Where-Object { $_.issuer -ceq $Issuer -and $_.subject -ceq $Subject }).Count) { throw '400 Bad Request: Issuer and subject combination already exists.' }
    if (@($Existing).Count -ge $script:MaxCredentials) { throw "400 Bad Request: no more than $($script:MaxCredentials) federated identity credentials" }
}

function Invoke-NpiWifFakeHttp {
    <#
    .SYNOPSIS
        The fake's HTTP handler, called through New-NpiWifFake's Invoke scriptblock. It records the
        call, serves the Graph and Resource Manager routes Chapter 05 uses from the fixture tenant in
        pages, and creates a credential or identity only when the state allows writes, with Learn's
        creation errors. Returns the response body; throws for a route it doesn't know.
    .EXAMPLE
        # Usually called through $fake.Invoke; called directly here for one app registration.
        $fake = New-NpiWifFake -Path tests/fixtures/ch05/tenant.json
        Invoke-NpiWifFakeHttp -State $fake -Method GET -Uri 'https://graph.microsoft.com/v1.0/applications/0a000000-0000-4000-8000-000000000004'
    #>
    param($State, [string]$Method, [string]$Uri, $Body, $Headers)
    $State.Calls.Add([pscustomobject]@{ Method = $Method; Uri = $Uri; Body = $Body })
    $u = [Uri]$Uri
    $path = [Uri]::UnescapeDataString($u.AbsolutePath)
    $q = @{}
    foreach ($pair in $u.Query.TrimStart('?').Split('&', [StringSplitOptions]::RemoveEmptyEntries)) { $kv = $pair.Split('=', 2); $q[[Uri]::UnescapeDataString($kv[0])] = if ($kv.Count -gt 1) { [Uri]::UnescapeDataString($kv[1].Replace('+', ' ')) } else { '' } }
    $base = "$($u.Scheme)://$($u.Host)"
    $g = $State.Estate.graph; $az = $State.Estate.azure
    $page = {
        param([object[]]$All)
        $skip = if ($q.ContainsKey('$skiptoken')) { [int]$q['$skiptoken'] } else { 0 }
        $resp = @{ value = @($All | Select-Object -Skip $skip -First $State.PageSize) }
        if ($skip + $State.PageSize -lt @($All).Count) {
            $rest = ($q.GetEnumerator() | Where-Object Key -NE '$skiptoken' | Sort-Object Key | ForEach-Object { "$($_.Key)=$([Uri]::EscapeDataString($_.Value))" }) -join '&'
            $link = "$base$($u.AbsolutePath)?" + $(if ($rest) { "$rest&" } else { '' }) + "`$skiptoken=$($skip + $State.PageSize)"
            if ($base -eq $State.Arm) { $resp['nextLink'] = $link } else { $resp['@odata.nextLink'] = $link }
        }
        $resp
    }
    $writeOk = { if (-not $State.AllowWrite) { throw "The fake refuses $Method" } }
    if ($base -eq $State.Graph) {
        $path = $path.TrimEnd('/')
        if ($path -notmatch '^/(v1\.0|beta)/') { throw "400 Bad Request: the fake serves /v1.0 and /beta only, not $path" }
        if ($Method -eq 'GET') {
            switch -Regex ($path) {
                '^/v1\.0/applications/([0-9a-f-]{36})$' {
                    $a = @($g.applications | Where-Object id -EQ $Matches[1]); if (-not $a) { throw "404 application $($Matches[1])" }; return $a[0]
                }
                '^/v1\.0/applications/([0-9a-f-]{36})/federatedIdentityCredentials$' {
                    $id = $Matches[1]; return & $page @($(if ($g.federatedIdentityCredentials.ContainsKey($id)) { $g.federatedIdentityCredentials[$id] }))
                }
                '^/v1\.0/servicePrincipals/([0-9a-f-]{36})$' {
                    $sp = @($g.servicePrincipals | Where-Object id -EQ $Matches[1]); if (-not $sp) { throw "404 servicePrincipal $($Matches[1])" }; return $sp[0]
                }
                '^/beta/auditLogs/signIns$' {
                    $f = "$($q['$filter'])"
                    if ($f -notmatch "^createdDateTime ge (\S+) and appId eq '([0-9a-f-]{36})' and signInEventTypes/any\(t: t eq '(servicePrincipal|managedIdentity)'\)$") { throw "The fake supports only the time, appId and signInEventTypes filter, not: $f" }
                    $from = [datetime]::Parse($Matches[1], [Globalization.CultureInfo]::InvariantCulture, [Globalization.DateTimeStyles]::AdjustToUniversal); $app = $Matches[2]; $evt = $Matches[3]
                    $rows = @($g.signIns | Where-Object { $_.appId -eq $app -and @($_.signInEventTypes) -contains $evt -and (ConvertTo-NpiWifDate (Format-NpiWifTime $_.createdDateTime)) -ge $from })
                    return & $page $rows
                }
            }
            throw "The fake has no Graph route for GET $path"
        }
        & $writeOk
        if ($Method -eq 'POST' -and $path -match '^/v1\.0/applications/([0-9a-f-]{36})/federatedIdentityCredentials$') {
            $id = $Matches[1]
            if (-not @($g.applications | Where-Object id -EQ $id)) { throw "404 application $id" }
            if (-not $g.federatedIdentityCredentials.ContainsKey($id)) { $g.federatedIdentityCredentials[$id] = @() }
            $existing = @($g.federatedIdentityCredentials[$id])
            Test-NpiWifFakeCreate -Name $Body.name -Issuer $Body.issuer -Subject $Body.subject -Audiences $Body.audiences -Existing $existing
            $new = [ordered]@{ id = (New-NpiWifFakeId $State 'fc'); name = $Body.name; issuer = $Body.issuer; subject = $Body.subject; audiences = @($Body.audiences); description = $(if ($Body.ContainsKey('description')) { $Body.description } else { $null }) }
            $g.federatedIdentityCredentials[$id] = $existing + @([hashtable]$new)
            return [hashtable]$new
        }
        throw "The fake has no Graph route for $Method $path"
    }
    if ($base -eq $State.Arm) {
        $rx = '^(/subscriptions/[^/]+/resourceGroups/[^/]+/providers/Microsoft\.ManagedIdentity/userAssignedIdentities/[^/]+)(/federatedIdentityCredentials(/[^/]+)?)?$'
        if ($path -match '^/subscriptions/([^/]+)/providers/Microsoft\.Authorization/roleAssignments$') {
            if ($Method -ne 'GET') { throw "The fake refuses $Method to role assignments" }
            if ($q['api-version'] -ne '2022-04-01') { throw "Unexpected api-version $($q['api-version'])" }
            if ("$($q['$filter'])" -notmatch "^assignedTo\('([0-9a-f-]{36})'\)$") { throw "The fake supports only assignedTo('{objectId}')" }
            $p = $Matches[1]; return & $page @($az.roleAssignments | Where-Object { $_.properties.principalId -eq $p })
        }
        if ($path -notmatch $rx) { throw "The fake has no Resource Manager route for $path" }
        $rid = $Matches[1]; $sub = $Matches[2]; $ficName = if ($Matches.ContainsKey(3) -and $Matches[3]) { $Matches[3].TrimStart('/') } else { $null }
        if ($q['api-version'] -ne '2024-11-30') { throw "400 Bad Request: the fake serves api-version 2024-11-30, not $($q['api-version'])" }
        $key = @($az.userAssignedIdentities.Keys | Where-Object { $_ -ieq $rid })
        $mi = if ($key) { $az.userAssignedIdentities[$key[0]] } else { $null }
        if ($Method -eq 'GET') {
            if (-not $mi) { throw "404 The user-assigned identity $rid doesn't exist." }
            if (-not $sub) { return @{ id = $rid; name = $mi.name; type = 'Microsoft.ManagedIdentity/userAssignedIdentities'; location = $mi.location; properties = $mi.properties } }
            if (-not $ficName) { return & $page @($mi.federatedIdentityCredentials) }
            $f = @($mi.federatedIdentityCredentials | Where-Object name -EQ $ficName); if (-not $f) { throw "404 federated identity credential $ficName" }; return $f[0]
        }
        & $writeOk
        if ($Method -ne 'PUT') { throw "The fake refuses $Method to Resource Manager" }
        if (-not $sub) {
            if (-not $Body -or -not $Body.ContainsKey('location')) { throw '400 Bad Request: location is required' }
            if ($mi) { $mi.location = $Body.location; return @{ id = $rid; name = $mi.name; location = $mi.location; properties = $mi.properties } }
            $name = ($rid -split '/')[-1]
            $n = [ordered]@{ name = $name; location = $Body.location; properties = [ordered]@{ clientId = (New-NpiWifFakeId $State '1c'); principalId = (New-NpiWifFakeId $State '5c'); tenantId = $State.Estate.tenantId }; federatedIdentityCredentials = @() }
            $az.userAssignedIdentities[$rid] = [hashtable]$n
            return @{ id = $rid; name = $name; type = 'Microsoft.ManagedIdentity/userAssignedIdentities'; location = $n.location; properties = $n.properties }
        }
        if (-not $ficName) { throw "The fake has no route for PUT $path" }
        if (-not $mi) { throw "404 The parent user-assigned identity doesn't exist." }
        $p = $Body.properties
        Test-NpiWifFakeCreate -Name $ficName -Issuer $p.issuer -Subject $p.subject -Audiences $p.audiences -Existing @($mi.federatedIdentityCredentials | ForEach-Object { @{ name = $_.name; issuer = $_.properties.issuer; subject = $_.properties.subject } })
        $new = @{ id = "$rid/federatedIdentityCredentials/$ficName"; name = $ficName; type = 'Microsoft.ManagedIdentity/userAssignedIdentities/federatedIdentityCredentials'; properties = @{ issuer = $p.issuer; subject = $p.subject; audiences = @($p.audiences) } }
        $mi.federatedIdentityCredentials = @($mi.federatedIdentityCredentials) + @($new)
        return $new
    }
    throw "The fake refuses host $base"
}

function Invoke-NpiWifFakeAd {
    <#
    .SYNOPSIS
        The fake Active Directory handler, called through New-NpiWifFake's AdInvoke scriptblock. It
        records the call, returns SamAccountName, ObjectGUID, Enabled and LastLogonDate for one fixture
        account on Get-ADUser, and runs Disable-ADAccount only when the state allows writes.
    .EXAMPLE
        # Usually called through $fake.AdInvoke; called directly here for the legacy account.
        $fake = New-NpiWifFake -Path tests/fixtures/ch05/tenant.json
        Invoke-NpiWifFakeAd -State $fake -Cmdlet Get-ADUser -Params @{ Identity = 'svc-hrsync' }
    #>
    param($State, [string]$Cmdlet, [hashtable]$Params)
    $State.Calls.Add([pscustomobject]@{ Method = $Cmdlet; Uri = "-Identity $($Params.Identity)"; Body = $null })
    $o = @($State.Estate.ad.objects | Where-Object { $_.ObjectGUID -eq $Params.Identity -or $_.SamAccountName -eq $Params.Identity })
    if ($o.Count -ne 1) { throw "Cannot find an object with identity: '$($Params.Identity)'" }
    switch ($Cmdlet) {
        'Get-ADUser' { return [pscustomobject]@{ SamAccountName = $o[0].SamAccountName; ObjectGUID = [guid]$o[0].ObjectGUID; Enabled = [bool]$o[0].Enabled; LastLogonDate = $(if ($o[0].LastLogonDate) { ConvertTo-NpiWifDate (Format-NpiWifTime $o[0].LastLogonDate) }) } }
        'Disable-ADAccount' { if (-not $State.AllowWrite) { throw 'The fake refuses Disable-ADAccount' }; $o[0].Enabled = $false; return }
    }
    throw "The fake refuses $Cmdlet"
}

# ----------------------------------------------------------------------------- the run

function Export-NpiWifRun {
    <#
    .SYNOPSIS
        Write a run's files and a manifest: task, mode, cloud, tenant, as-of, the task's permissions, every request, and a SHA-256 per file.
        Returns the manifest.json file.
    .EXAMPLE
        # $r is New-NpiWifPlan's result and $client its read client.
        Export-NpiWifRun -OutputPath out/federation -Task federation -Cloud gcc -TenantId c0ffee00-0000-4000-8000-000000000001 -AsOf 2026-10-30 `
            -Evidence $client.Evidence.ToArray() -Files @{ 'plan.json' = $r.Plan; 'findings.json' = @($r.Findings) }
    #>
    [CmdletBinding()]
    param([Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][string]$Task, [Parameter(Mandatory)][hashtable]$Files, [Parameter(Mandatory)][string]$Cloud,
        [Parameter(Mandatory)][string]$TenantId, [string]$AsOf, [object[]]$Evidence = @(), [string]$Mode = 'Fixture', [hashtable]$Extra = @{})
    $OutputPath = $ExecutionContext.SessionState.Path.GetUnresolvedProviderPathFromPSPath($OutputPath)
    New-Item -ItemType Directory -Force -Path $OutputPath | Out-Null
    $hashes = [ordered]@{}
    foreach ($name in ($Files.Keys | Sort-Object)) { $p = Join-Path $OutputPath $name; Write-NpiJson -Path $p -Value $Files[$name]; $hashes[$name] = Get-NpiFileHash -Path $p }
    $perm = Get-NpiWifRequiredPermission -Task $Task
    $m = [ordered]@{
        task = $Task; mode = $Mode; cloud = $Cloud; tenantId = $TenantId; asOf = $AsOf; generated = [DateTime]::UtcNow.ToString('o')
        graphPermissions = $perm.GraphPermissions; azureRoles = $perm.AzureRoles; adRights = $perm.AdRights
        requests = @($Evidence | ForEach-Object { [ordered]@{ call = $_.Call; method = $_.Method; target = $_.Target; at = $_.At } })
        files = $hashes
    }
    foreach ($k in $Extra.Keys) { $m[$k] = $Extra[$k] }
    Write-NpiJson -Path (Join-Path $OutputPath 'manifest.json') -Value $m
    Get-Item -LiteralPath (Join-Path $OutputPath 'manifest.json')
}

Export-ModuleMember -Function Get-NpiWifCallList, Get-NpiWifTask, Get-NpiWifRequiredPermission, New-NpiWifClient, Resolve-NpiWifUri, Invoke-NpiWifGet, Invoke-NpiWifAdRead,
    Get-NpiWifPresentedClaims, Test-NpiWifCredential, Test-NpiWifOrder, New-NpiWifTestAssertion, New-NpiWifFakeTokenEndpoint, Test-NpiWifTokenExchange,
    Import-NpiWifConversions, Import-NpiWifCutoverLog, New-NpiWifPlan, Assert-NpiWifPlannedWrite, Invoke-NpiWifPlan, New-NpiWifLiveInvoker,
    New-NpiWifFake, Invoke-NpiWifFakeHttp, Invoke-NpiWifFakeAd, Export-NpiWifRun, ConvertFrom-NpiWifBase64Url, Format-NpiWifTime, ConvertTo-NpiWifDate
