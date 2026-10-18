# Book 01 — The Authentication Inheritance Problem

**Why SQL Server’s Windows Authentication was good engineering, and why it must now end**

## What Windows Authentication actually is

SQL Server in Windows Authentication mode delegates authentication entirely to the Windows security subsystem. It does not implement its own password verification, its own cryptographic challenge-response, or its own session token model. When a client opens a connection with Integrated Security=True, the driver passes control to the Security Support Provider Interface — SSPI.

The SSPI layer examines the available authentication protocols and determines whether Kerberos is negotiable for the target server. If it is, SSPI requests a Kerberos service ticket from the Key Distribution Center — the domain controller’s Kerberos service — scoped to the SQL Server’s Service Principal Name. That ticket is presented to the SQL Server engine.

The engine validates the ticket’s cryptographic signature using the session key derived from the service account’s credentials, extracts the Kerberos principal, and maps it to a SQL Server login. No password has traversed the network. No credential has been stored in any application configuration file. The authentication is mutual: the client proves its identity to the server, and the server to the client, both through the shared authority of the domain’s KDC. This is genuinely good security architecture, and it is important to say so plainly before explaining why it must be replaced.

![A Windows-integrated connection: SSPI negotiates Kerberos when the SPN resolves, and silently falls back to NTLM when it doesn't.](../../images/sql-server/diagrams/svg/book-01-ch01-kerberos-sspi-ntlm-fallback.svg){fig-alt="Sequence diagram between client, domain controller and SQL Server: the client requests a service ticket for the SQL Server SPN and presents it to the engine; if the SPN is missing, Negotiate falls back to an NTLM challenge-response."}

The SPN must be registered against the service account running the SQL Server engine process. The format for a SQL Server instance is MSSQLSvc/hostname.domain.com:port, and the registration binds the service account’s long-term key — its password hash in the AD domain — to the service name, so the KDC can generate a valid ticket when a client requests one.

Without a correctly registered SPN, the KDC cannot issue a service ticket for the SQL Server endpoint. The SSPI layer on the client, having failed to negotiate Kerberos, silently falls back to the next available protocol. In most Windows environments, that next protocol is NTLM.

This silent fallback is the first and most consequential fault in the inheritance. It is invisible at the application layer, it produces no error in the SQL Server error log under default configuration, and it means that environments which believe with complete confidence that they are running Kerberos for their SQL Server connections are, in a significant fraction of those connections, running NTLM. The fraction can be measured, but it cannot be known without measurement, and most federal environments have not measured it.

## The NTLM fallback

NTLM is not a failure state that was tolerated by accident. In the early history of Windows networking, NTLM was the primary authentication protocol for all Windows workgroup and domain connections. When Kerberos was introduced in Windows 2000 as the preferred domain protocol, NTLM was retained as a compatibility fallback for scenarios where Kerberos was not negotiable — cross-domain connections without trust, connections from non-domain-joined clients, connections to servers the KDC could not locate.

SQL Server inherited this behavior without modification: SSPI negotiates the best available protocol, Kerberos first and NTLM second. For most workloads in most federal environments of the early 2000s and 2010s, this was perfectly adequate. NTLM provided authentication that was sufficient for the threat model of a perimeter-defended network where every client and server was a domain member.

The problem with NTLM is not that it was wrong for its time. The problem is that it does not scale to a modern zero-trust posture, and that posture is now a requirement of this program’s FedRAMP-Moderate boundary, not an aspiration.

NTLM is a challenge-response protocol that embeds the entire authentication exchange within the connection negotiation itself. The server sends a challenge; the client responds with a hash of its credential and the challenge; the server validates the response. There is no token issued at the conclusion of this exchange, and no session assertion that can be presented to a third party for validation.

There is, therefore, no mechanism by which a Conditional Access policy engine — which lives in the Azure identity plane, outside the SQL Server connection path entirely — can observe the NTLM exchange, evaluate it against policy conditions such as device compliance or sign-in risk, and either permit or deny it. NTLM authentication succeeds or fails at the protocol layer, between client and server, and produces no artifact the Azure identity plane can observe, record, or control.

## The service account

The SQL Server engine process runs under a service account. That account is the identity the engine presents when it makes network connections — when it accesses file shares, communicates with other instances via linked servers, or forwards log data to a monitoring sink. In federal environments, that account has historically taken one of three forms.

The first is a domain service account: a named Active Directory user with a non-expiring password, typically named something like svc-sqlengine-prod, with a password set at installation and changed infrequently or not at all. The second is a Group Managed Service Account (gMSA): a domain account whose password is managed automatically by Active Directory, rotated every 30 days, and never known to any human. The gMSA pattern is strictly better than the named account from a credential-hygiene perspective, but it is still AD-anchored — when the domain is removed from the architecture, the gMSA loses its governance foundation.

The third form is the NT SERVICE\MSSQLSERVER virtual account, a Windows-local account that uses the computer’s domain account for network authentication. This pattern is also AD-anchored, because it is the domain-joined computer account that provides the Kerberos credential for network connections.

In every one of these patterns, Active Directory is the identity authority for the engine process. The engine’s ability to authenticate to any network resource depends on AD. When the directory modernization program removes AD as the authoritative identity source, the service account pattern loses its foundation, and the engine must acquire a new identity in Microsoft Entra ID — on SQL Server 2025, the system-assigned managed identity that hybrid management provides for the host; on SQL Server 2022, an app registration whose certificate is kept in Azure Key Vault. That transition is the subject of Book 04.

## The sa account

Alongside Windows Authentication, SQL Server has always supported a second mode: SQL Authentication, which uses credentials stored in SQL Server’s own master database rather than in Active Directory. The sa account — system administrator — is the built-in SQL Authentication login present on every instance at installation.

In a well-governed environment, sa is disabled, renamed, or both; its password is long and random; and it is never used for routine operations. In practice, many federal environments carry active sa accounts as emergency-access mechanisms, often with passwords set at installation and never rotated, on the logic that if AD becomes unavailable, sa provides a path back into the instance.

This is understandable logic, but it produces a serious posture problem. SQL Authentication, unlike Windows Authentication, produces no Entra ID sign-in events. A connection using SQL Authentication is invisible to the Azure identity plane: there is no Conditional Access policy that can intercept it, no Defender for Identity signal, no sign-in risk assessment. SQL Authentication is a completely opaque path from the perspective of the modern identity plane, and the sa account, if active, is the most dangerous entry point on the instance.

## Why this was correct

The full picture — Kerberos negotiation via SSPI, SPN registration against the service account, NTLM fallback, domain service accounts and gMSAs, SQL Authentication as a local fallback — is a coherent and defensible architecture.

In a fully domain-joined world with a working KDC, correctly registered SPNs, and a client population consisting entirely of domain members, Windows Authentication was centrally managed through Active Directory, non-repudiable at the Kerberos ticket level, and resistant to credential theft in the network path. It required no infrastructure beyond the domain controller that already existed for every other authentication purpose in the environment.

It was not a security compromise. It was the application of the existing, well-understood Windows security substrate to the SQL Server authentication problem, and for the world that substrate was designed for, it was the right answer. The problem is not the design. The problem is that the world it was designed for — every client domain-joined, every server domain-joined, the perimeter as the security boundary, no cloud identity plane — no longer exists and cannot be made to exist again.

## Why the inheritance must end

Three drivers require replacing Windows Authentication for SQL Server.

![Three drivers end the inheritance, and their dependencies set the order of the series.](../../images/sql-server/diagrams/svg/book-01-ch02-three-drivers-and-order.svg){fig-alt="Three drivers, NTLM elimination, zero trust and service-account identity, impose an order: assess and consolidate, enable Arc, migrate logins, then eliminate NTLM."}

### Driver One — NTLM elimination

Microsoft formally deprecated NTLM in June 2024 and is disabling it by default — not removing it — across successive Windows releases, from enhanced auditing in Windows Server 2025 / Windows 11 24H2, to the BlockNTLMv1SSO enforcement default arriving via Windows Update in October 2026, to network NTLM off by default in the next major Windows Server release. Microsoft has not published a fixed calendar date for that final step. The program sets its own dates ahead of it: NTLMv1 is blocked in Phase B (targeted 2026-Q3), and network NTLM is blocked estate-wide at the program's 2027-04-01 backstop — a planning anchor, not a vendor deadline.

Any SQL Server connection that relies on NTLM — because an SPN is missing, because the client cannot negotiate Kerberos, because the connection crosses a trust boundary, or because the host has already been migrated to a non-domain-joined state — will face increasing friction as Microsoft tightens defaults, and will fail once NTLM is blocked at the Local Security Authority layer.

### Driver Two — Zero-trust requirement

The zero-trust posture mandated for this program’s FedRAMP-Moderate boundary by OMB M-22-09 cannot be implemented without the Azure identity plane in the authentication path for SQL Server connections.

Conditional Access policies enforce device compliance, network-location restrictions, MFA completion, and sign-in risk thresholds by intercepting the token issuance request that occurs when a principal authenticates to Entra ID. If the authentication protocol is Kerberos or NTLM, there is no token issuance request. The authentication completes entirely within the Windows security subsystem, and the Azure identity plane is not in the path at any point.

A database administrator connecting to a production SQL Server from an unmanaged personal device, from a network outside the program’s named locations, or with an elevated sign-in risk signal cannot be blocked by a Conditional Access policy if the authentication protocol is Kerberos or NTLM. The policy has no visibility and no leverage point.

Entra ID authentication for SQL Server changes this entirely. When a principal authenticates using an Entra ID-issued OAuth 2.0 access token, the token issuance request passes through the Entra ID authentication service, which evaluates all applicable Conditional Access policies before the token is issued. If a policy requires MFA and the principal has not completed it, the token is denied and the connection never opens. If a policy requires a compliant device and the client is not registered or is out of compliance, the token is denied. If the sign-in risk level is elevated, the token is denied or a remediation challenge is triggered. In every case, the Conditional Access policy has real enforcement leverage, because the token it controls is the credential SQL Server accepts.

### Driver Three — Service-account credential problem

When Active Directory is removed as the authoritative identity source, the AD service accounts and gMSAs that currently authorize the SQL Server engine process for network access lose their governance foundation. They are objects in a directory that no longer exists as an authoritative identity source. The engine must acquire a new identity before that removal occurs.

For an on-premises instance, both of those Entra identities arrive through Azure Arc. The Connected Machine agent provides the server's system-assigned managed identity — the only credential-free, cloud-native identity available to an on-premises server in this architecture, which SQL Server 2025 uses directly — and on SQL Server 2022 the Arc agent uses that identity to retrieve the app registration's certificate from Key Vault and install it on the host. Arc deployment is therefore not an optional enhancement for SQL Server hosts; it is a prerequisite for the service-account migration the engine requires before the directory modernization can complete.

The sequencing implication follows directly from the dependency structure of these three drivers. You assess and consolidate the estate first, so effort is spent only on instances that survive; then Arc enablement; then the login migration; then NTLM elimination. That order is the architecture of this series.

## What Book 01 establishes

SQL Server Windows Authentication delegates entirely to the Windows security subsystem: Kerberos via SSPI when an SPN is registered, silent NTLM fallback when it is not. The engine process and the sa account are both anchored to authorities — Active Directory and master respectively — that the Federal Modernization Program removes or renders invisible to the Azure identity plane. None of this was a mistake. It was correct engineering for a fully domain-joined world that no longer exists.

---

*Cleaned extraction for project use. No internal branding or document identifiers.*
