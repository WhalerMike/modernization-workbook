# Building Non-Person Identity, Chapter 13 — Workload Identity Across AWS GovCloud and OCI — narration script (practice copy)

## Slide 1 — Chapter 13: Workload Identity Across AWS GovCloud and OCI

Welcome to the Federal Modernization Workbook's developer workbook, Building Non-Person Identity. This is Chapter 13: workload identity across AWS GovCloud and Oracle Cloud Infrastructure, or O C I. A workload in AWS or O C I that holds an access key is a service account with a password that never expires, in a console nobody in identity governance opens. This chapter reads both clouds' exports with the same rules as the rest of the track. We'll see what AWS, Oracle and Microsoft say, what the kit adds to the vendors' own reads, the inputs, the code and its checks, what's still open, the evidence, two labs and the dangers. One note before we begin: the code is illustrative, tested against fixtures.

## Slide 2 — An access key is a password that never expires

Why does this chapter exist? Because a workload in AWS or O C I that holds a long-lived key is a service account with a password that never expires, in a console nobody in identity governance opens. Both vendors point the same way. AWS says to require workloads to use temporary credentials with IAM roles and, where possible, not to create access keys at all. Oracle recommends instance principals, and rotating API keys every ninety days or less. The program makes every long-lived credential an exception with a replacement date. This chapter adds no new rule. It reads the guide's exports, checks the rules the guide sets, and never touches either cloud.

## Slide 3 — What AWS says, and what GovCloud changes

Here's what AWS says. The IAM credential report lists every user, with its console password, its first two access keys and its signing certificates. It leaves out service-specific credentials, such as CodeCommit passwords, and any key beyond the first two, so those need their own list calls. The role and user lists return no tags, so the guide runs the tag reads too. GovCloud changes a few things. There's no global S T S endpoint, and no role between a GovCloud and a standard account. Roles Anywhere works, but revocation through the certificate's CRL address doesn't: AWS says to import your CRLs instead, and it doesn't check an imported CRL's expiry. And trust policies should never name everyone, and an O I D C role should limit the token's subject.

## Slide 4 — What Oracle and Microsoft say

Oracle's side. A user can hold three API signing keys, and auth tokens and customer secret keys never expire, two of each per user. The list commands return each credential's identifier, never the secret. An instance principal's certificates are created and rotated by O C I, but anyone who can sign in to the instance acts with its rights; a function uses a resource principal. Both are authorized through a dynamic group, which has no permissions until a policy names it. In a policy, manage means every permission. The program's tenancy is in the O C two realm, so every IAM call goes to the home region. And Microsoft Learn says Entra accepts tokens from workloads in AWS, only from issuers that sign with R S two fifty-six. Whether GovCloud's tokens work with Entra hasn't been tested, so the guide uses that path only after a test.

## Slide 5 — The vendors' own reads, and what the kit adds

AWS and Oracle each give a way to list what exists. AWS gives the credential report, but it leaves out roles, keys beyond two and service-specific credentials, and it names no key, so the kit reads the key lists too and joins each key to a report column by creation date. That join is the kit's own design. The role list comes with trust policies, and the kit reads every principal and condition into one file. AWS's Access Analyzer can report unused access, for a charge, but the pages read don't say whether it runs in GovCloud, so the kit reports keys unused for ninety days from the credential report. On Oracle's side the kit makes one list of every credential with its age, and joins policies to dynamic groups.

## Slide 6 — The inputs: the guide's Step 1g and 1h exports

The guide's export steps write the files; the kit only reads them. On the AWS side: the credential report, every access key and service-specific credential, the roles with their trust policies, instance profiles, O I D C providers, and the Roles Anywhere trust anchors and profiles. Two more files are optional to the kit: the tags, and the imported CRLs. On the O C I side: users, their credentials, dynamic groups and policies. You supply a settings file, and optionally the exception list. The tag keys are the program's: system I D, two owners and a sponsor, one key each, because AWS tags allow no comma. One thing isn't yet specified: the O C I command line's output field names, so the kit matches a field however it's spelled.

## Slide 7 — The code: one read-only task, cloud-workload

So what does the code add? One script and one module, running one read-only task. A config file declares the export commands an operator runs, every one a generate, get or list, and the module runs none of them. A test fails if the code ever calls the AWS or O C I command line, or makes a web request. Every run writes a folder: findings, identities, trust, a credentials list with identifiers only, never a secret, the evidence rows, and a manifest with each input's hash and any optional file it couldn't read. The validation kit's check, V K N P I ten, reads the same folder for the guide's gates; this kit gives the full findings behind it. And it changes nothing: the findings say what to do, and a person does it.

## Slide 8 — The checks: NPI-AWS-01 to -16, NPI-OCI-01 to -10

Twenty-six checks in five groups. AWS long-lived credentials, N P I A W S oh one to oh seven: every active key with its age and last use, two keys on one user, a key unused for ninety days, which is design guidance, a password beside a key, service-specific credentials, certificates and a root key. Owners and trust, oh eight to thirteen: missing tags, O I D C trusts with no subject condition, outside accounts, everyone as principal, another partition. Then trust anchors with no imported CRL. On O C I, N P I O C I oh one to ten: every API key, keys past ninety days, tokens and secret keys that never expire, missing tags, and dynamic groups that reach the whole tenancy. A user with no long-lived credential is treated as a person, or unknown, and skipped by the owner checks: design guidance.

## Slide 9 — Not yet specified: six open questions

Six things are still open, and the kit doesn't assume an answer to any of them. First, AWS GovCloud and Entra, in either direction. AWS documents GovCloud's outbound federation across its own partitions, but no page read walks through Entra and GovCloud trusting each other, so the guide uses either path only after a test. Second, whether Access Analyzer's unused-access findings run in GovCloud; the kit's ninety-day check doesn't depend on it. Third, whether instance principals, resource principals and O K E workload identity are available in O C two. Fourth, the O C I command line's output field names. Fifth, which credential report column belongs to which key. And sixth, whether the O C I user list returns users in every identity domain.

## Slide 10 — Who runs it, and the evidence it leaves

Who's involved? The cloud engineers who run the exports in each account and the tenancy, the identity engineers who own the findings, and the I S S O, who reads the evidence. Each output supports a NIST control. The identity list supports account management, inventory and identifier management. The credentials list supports authenticator management, and the trust anchors and their CRLs support public key authentication. Trust and reach support least privilege, and the orphan leads support disabling accounts. The passing tests support testing changes. Each row names the fed-ramp twenty X K S I's aligned with it, re-read from FedRAMP on November twentieth. Two cautions: a row provides evidence for a control, and the assessor decides. And K S I's are indicators for cloud providers; the agency lines its evidence up with theirs.

## Slide 11 — Lab 1: run the checks on the fixtures

Lab 1 needs PowerShell 7 with Pester, and no account or tenancy. The fixtures are one fictional GovCloud account and one fictional O C two tenancy. Seven IAM users, one of them a person and one the root user; eleven roles and a service-linked one; three O I D C providers and two trust anchors. On the O C I side, five users, three dynamic groups and three policies. Each is built to trip one or more rules, and two credentials are under a recorded exception. Step 1 runs the checks. The summary says twenty-four findings, eleven warnings and two for information; seven long-lived credentials in AWS and five in O C I; and nothing left unread. Then one line per rule, and the manifest's hash.

## Slide 12 — Lab 1: the findings and the long-lived credentials

Step 2 reads the findings. Look for the user called svc report export. It has two active keys, one of them never used, a console password beside them, and only one owner tagged. Then the dynamic group called dg everything: no tags, no policy names it, and its rule matches the whole tenancy. Step 3 reads the long-lived credentials, one row per active key, service-specific credential, API key, auth token and secret key, with its age, last use for AWS keys, and exception. The oldest AWS key is nine hundred and five days old and was last used almost a year ago. Two credentials are under exceptions until 2027: svc app sync's key, and hr report reader's API key.

## Slide 13 — Lab 1: who isn't joined, and one OIDC trust

Step 4 reads who isn't joined to a record. Seven identities: two AWS users and two roles, one of them a role anyone can assume, two O C I users, and the dynamic group from before. Then one trust. The role called ci pipeline oidc trusts GitHub's token issuer, but its only condition is on the token's audience, not its subject. So any repository's workflow could present a token for it. That's N P I A W S oh nine, and it's exactly what AWS's own examples guard against by limiting the subject claim to one repository.

## Slide 14 — Lab 1: without the optional files, evidence, tests

Step 5 runs without the two optional files, as an export made before the guide added the tag and CRL reads would be. The kit still runs, and says what it couldn't check: the two files are listed as not read, there's one owner warning for the whole account instead of a finding per identity, and a CRL warning for each trust anchor. With no exception list given, svc app sync's key is back to a finding. Step 6 reads the evidence: one row per step and control, with its K S I's and the hash of the file behind it. Step 7 runs the tests: thirty-four pass. They sit in their own folder, so the counts in the other chapters' labs don't change.

## Slide 15 — Lab 2: a test account and a test tenancy

Lab 2 uses one GovCloud account and one O C I tenancy that aren't production, with a role or user that can read IAM in each, and the two command lines signed in. Nobody has run it yet, so no step's output has been seen. Write the settings and an empty exception list, in a folder outside the repository. Export the AWS account with the guide's commands, tags and CRLs included. Export the tenancy against its home region; the policy list reads only one compartment, so add each child compartment's policies, or a group will show as unnamed. Run the checks. If every O C I user shows no credentials while the console shows keys, the field names differ, so record them. Finally, the manifest should show no requests at all, and the fourteen export commands.

## Slide 16 — Dangers, and the guard for each

Each danger has a guard. A key beyond the report's first two, or a CodeCommit password, would stay out of every review, so the key lists are required inputs. If the tag export is skipped, every role looks fine, so the kit warns and the manifest lists the missing file. An O I D C role that trusts a whole issuer can be assumed by any workload that issuer signs for. A revoked certificate can keep working through Roles Anywhere, because GovCloud can't fetch CRLs from the certificate, so put CRL imports on the certificate calendar. O C I tokens and secret keys never expire. A dynamic group that matches the whole tenancy gives its rights to everyone who can sign in to any instance. A new command line version could change field names. And exports belong with the evidence, never in the repository.

## Slide 17 — Done when: the chapter's checklist

Here's what done looks like. The guide's exports, tags and CRLs included, run in every GovCloud account, and in the tenancy's home region. Every role, workload user, O C I user with a credential, and dynamic group carries a system I D, two owners and a sponsor, or is in an orphan ticket. Every long-lived credential has an exception with a replacement date, or a ticket to replace it. No O C I key is older than ninety days, and no root access key is active. Every O I D C trust names its workload, and every outside or open principal is removed or justified. Every trust anchor has an imported CRL. No dynamic group reaches the whole tenancy without a reason. And each run's evidence and manifest are filed with the change record.
