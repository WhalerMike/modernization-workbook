# Non-Person Identity learning path — Module 14: Workload identity across AWS GovCloud (US) and OCI — narration script (practice copy)

## Slide 1 — Module 14: Workload identity in AWS GovCloud and OCI

Welcome to Module 14 of the Non-Person Identity learning path: workload identity across AWS GovCloud and O C I. It teaches the implementation guide's steps for the program's other two clouds, with Chapter 13 of the developer workbook. The program's AWS estate is in AWS GovCloud, and its Oracle Cloud tenancy is in Oracle's US Government Cloud, realm O C 2. In November 2026 the program added both clouds' workload identities to this track. Take this module after Modules 1 and 4.

## Slide 2 — Why an access key is a service account's password

Why does this matter? A workload in AWS or O C I that holds an access key is a service account with a password that never expires, sitting in a console nobody in identity governance opens. This module brings those identities under the same rules as the rest of the track. Each one is listed and joined to a record with two owners and a sponsor. Every long-lived credential is an exception with a replace-by date. And every trust is no wider than its workload needs. The program decided to extend the track to both clouds, and named the tags that join each identity to its record.

## Slide 3 — What you'll be able to do in Module 14

Here's what you'll be able to do by the end of this module, which takes about sixty minutes with the lab. You'll say why an access key, an API key, an auth token or a customer secret key is a long-lived secret, and what the program does with each one. You'll name what the guide's export steps read, and what AWS's credential report and list calls leave out. You'll join an identity to its record with four tags. You'll run Chapter 13's checks on fixtures and read what they find. And you'll name what's still unknown, and why the kit doesn't assume an answer. Before you start, finish Modules 1 and 4. You need PowerShell 7.1 or later with Pester 5, and no AWS account, O C I tenancy or Entra tenant.

## Slide 4 — What AWS, Oracle and Microsoft say

Unit 1 is what the vendors say. AWS says to require workloads to use temporary credentials with IAM roles, and where possible not to create access keys at all. Oracle recommends instance principals, and rotating API keys every ninety days or less. AWS GovCloud isn't commercial AWS: it has one IAM control plane and no global S T S endpoint, no role between a GovCloud account and a standard one, and a root user with no console sign-in. IAM Roles Anywhere works there, but it can't fetch revocation lists from a certificate, so AWS says to import your C R Ls instead. In O C I, instance and resource principals act through a dynamic group, which has no permissions until a policy names it. Auth tokens and customer secret keys never expire. And Microsoft Learn says Entra accepts tokens from workloads in AWS, signed with R S two fifty-six only. Whether a GovCloud account's tokens work with Entra hasn't been tested, so the guide uses that path only after a test. The program's rule follows: every long-lived credential is an exception with a replacement date.

## Slide 5 — The exports, and the join to the record

Unit 2 is the exports and the join. Every command in the guide's two export steps is a read. In AWS, the credential report lists every IAM user, its password and its first two access keys. It leaves out service-specific credentials and any key beyond the first two, so the export also lists access keys and service-specific credentials. Then the roles, with their trust policies, the instance profiles, the O I D C providers, and the Roles Anywhere trust anchors, profiles and C R Ls. List users and list roles don't return tags, so the export reads each user's and role's tags too. In O C I, against the tenancy's home region, it reads the users, each user's credentials, which come back as identifiers, never the secret, the dynamic groups and the policies. The join is four tags: system I D, owner one, owner two and sponsor. Each owner gets its own key, because an AWS tag value can't hold a comma or a semicolon. An identity with no tags or record is an orphan: disable first, then a person acts.

## Slide 6 — The checks, VK-NPI-10, and what's still unknown

Unit 3 is the checks. N P I A W S oh one to oh seven are the long-lived credentials: every active access key and service-specific credential against its exception, two keys on one user, a key unused for ninety days, which is design guidance, and a root user key. Oh eight to sixteen are owners and trust: missing tags, an O I D C trust with no subject condition, an outside account, a star or another partition as the principal, and a trust anchor with no imported C R L. N P I O C I oh one to ten do the same for O C I, and add dynamic groups that match the whole tenancy or hold manage all-resources. The validation kit's V K N P I ten reads the same exports and reports the gate's criteria. And four things are still unknown, so the kit doesn't assume an answer: whether GovCloud and Entra can federate either way, whether Access Analyzer's unused-access findings run in GovCloud, whether O C 2 offers instance, resource and O K E workload principals, and what field names the O C I command line prints.

## Slide 7 — Try it: run Chapter 13's checks on the fixtures

Try it. Lab 1 runs in the non-person identity folder, with no account and no tenancy. These are Chapter 13's Lab 1 steps. The fixtures are one fictional GovCloud account and one fictional O C 2 tenancy. Step one runs the checks as of November 24, 2026: seven IAM users, eleven roles and two trust anchors in AWS; five users and three dynamic groups in O C I. Look for two lines. Twenty-four findings, eleven warnings and two information items. And seven AWS and five O C I long-lived credentials, two of them under a current exception. Then one line per rule, and the manifest's hash. The script reads files and writes its output folder: it runs no AWS or O C I command, calls no A P I, and changes no key.

## Slide 8 — Try it: read the findings

Step two reads the findings. Find S V C dash report dash export. It trips four rules: oh one, an active key with no exception, twice, once for each key; oh two, two active keys on one user, one of them never used; oh four, a console password beside the keys; and oh eight, only one owner tagged. Then find D G dash everything, a dynamic group in O C I. It has no tags, no policy names it, and its matching rule names the whole tenancy, so every instance would be a member. Notice the first line: S V C dash app dash sync's key is a warning, not a finding, because it's under a current exception.

## Slide 9 — Try it: the long-lived credentials

Step three reads the long-lived credentials: one row per active access key, service-specific credential, API key, auth token and customer secret key, with its age, its last use for AWS keys, and its exception. Two are under exceptions until 2027: S V C dash app dash sync's access key and H R dash report dash reader's API key. Look at the ages. S V C dash legacy dash F T P's key is more than nine hundred days old, and was last used in December 2025, so it's also a ninety-day unused lead. H R dash build dash push's auth token is five hundred and eighty-two days old, and auth tokens never expire. The file holds identifiers only, never a secret.

## Slide 10 — Try it: who isn't joined, and one OIDC trust

Step four reads who isn't joined to a record. Seven identities: two IAM users holding keys, a Lambda execution role, a role anyone can assume, two O C I users holding credentials, and the dynamic group. Each is an orphan lead under the guide's orphan rule. Then it reads one trust: C I dash pipeline dash O I D C trusts GitHub's token issuer with only an audience condition. AWS's examples limit the token's subject claim to the one repository. Without it, workflows from repositories outside your control could assume the role. That's N P I A W S oh nine.

## Slide 11 — Try it: run without the two optional files

Step five runs on an export made before the guide's export step added the tag and C R L reads, so it doesn't have them. The kit still runs, and says what it couldn't check. The manifest's not-read line names both files. N P I A W S oh eight becomes one warning for the whole account, instead of a finding for each identity. And oh fourteen warns for each trust anchor, because it can't tell whether a C R L was imported. A missing file is a warning, never a pass. Notice too that S V C dash app dash sync's key is back to a finding, because this run was given no exception list.

## Slide 12 — Try it: the evidence, the tests, then clean up

Step six reads the evidence: one row per step and control, with the K S Is aligned with it and the file that provides the evidence. The inventory rows are A C two, C M eight and I A four, from the identities file. The credentials row is I A five. The certificates rows are I A five enhancement two and S C seventeen, from the trust file, as is A C six for trust and privilege. And the lifecycle row is A C two enhancement three, from the findings. Match each row to the requirement table in the module's introduction. Step seven runs the tests: thirty-four pass. Step eight cleans up by removing the output folder.

## Slide 13 — Lab 2: a test account's and tenancy's exports

Lab 2 runs the same checks on a real account's and tenancy's exports. Nobody has run it yet, so no step's output has been seen. Use one AWS GovCloud account and one O C I tenancy that aren't production, with read access to IAM and Roles Anywhere in the account, and to IAM in the tenancy. Write the settings and an empty exception list, in a folder outside the repository. Run the guide's AWS export commands, the tag and C R L reads included, then the O C I ones against the tenancy's home region. Then run the checks, and read the findings and the manifest: it records no request, because the kit called nothing, and lists the fourteen export commands. If every O C I user shows no credentials while the console shows keys, the command line's field names differ from those the kit reads. Record what they are. Keep the exports with the run's evidence, never in the repository.

## Slide 14 — The federal requirement and the evidence the ISSO keeps

The federal requirement. Chapter 13 writes one evidence row per step and control, and these are the rows this module's lab produces. The identities file supports A C two, Account Management, C M eight, System Component Inventory, and I A four, Identifier Management, in NIST SP 800-53. The credentials file supports I A five, Authenticator Management, with the exception records it names. The trust anchors and their C R Ls support I A five enhancement two and S C seventeen, the public key controls. The trust and reach of every role and dynamic group support A C six, Least Privilege, with the owner's justification for each finding kept. And the orphan leads support A C two enhancement three, Disable Accounts, with the orphan or decommission ticket. K S Is are FedRAMP twenty X indicators for cloud service providers. A row provides evidence for a control; the assessor decides.

## Slide 15 — Check yourself: two questions on AWS and OCI

Check yourself with two questions. First: how does the program join an IAM role to its record? The answer is b: four tags, system I D, owner one, owner two and sponsor, with one key per owner, because an AWS tag value can't hold a comma. Second: the AWS export has no tags file. What does the kit do? The answer is b: it runs, lists the file as not read, and raises one warning for the account. A missing file is a warning, never a pass, and the kit never calls AWS itself. The module page has three more questions, each linked to the section that answers it.

## Slide 16 — Summary: the other clouds, under the same rules

To sum up. The program's AWS GovCloud and O C I workload identities follow the track's rules. Every one is listed from read-only exports and joined to a record by four tags. Its long-lived credentials are exceptions with a date. Its trusts are named down to the workload. And its unknowns stay unknowns until the program tests them. Chapter 13 checks the exports on every run, V K N P I ten reports the gate's criteria, and the evidence names the control each row supports. Next, go back to the learning path's index, or on to Chapter 13 for Lab 2 and its dangers.
