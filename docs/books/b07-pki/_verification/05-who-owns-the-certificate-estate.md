# Verification — Chapter 05, Who Owns the Certificate Estate

Checked October 20, 2026. A new chapter: the source guide (`docs/operational-guides/pki-modernization.md`) has no
ownership section beyond §1.4 Audience and scattered "approved by PKI administrator and security team" gate wording.
Migration-wide roles and the RMF definitions are linked to Book 02 Chapter 06, and endpoint roles to Book 05
Chapter 06, not repeated here.

## Claims log

| # | Claim (short) | Where | Verdict | Source |
|---|---|---|---|---|
| 1 | Enterprise CA default CA admins: local Administrators, Domain Admins, Enterprise Admins | Opening | verified | Learn, Secure, delegate, and audit CA administration (note under Define the CA operating roles) |
| 2 | Roles, decide/do/consult split, matrix, renewal owners, one decider per row | Throughout | restated-as-design | Program model |
| 3 | RMF role definitions (AO, CISO, ISSO, system owner) | Intro | verified (linked to B02 Ch06; publication page opened) | NIST SP 800-37 Rev. 2 |
| 4 | CA admin can bypass lower-privilege CA controls; CA and host admin are high privilege | Decision rights | verified | Learn, Secure, delegate, and audit CA administration |
| 5 | CA uploaded without a CRL URL: revoked certificates still authenticate | Decision rights | verified | Learn, Entra CBA CRL; How to configure CAs for CBA |
| 6 | Six AD CS operating roles; Enrollment Agent certificate is an impersonation capability; template admin is separate | PKI admins | verified | Learn, Secure, delegate, and audit CA administration |
| 7 | Key recovery: certificate manager retrieves, KRA decrypts, different people | PKI admins | verified | Learn, Configure AD CS key archival |
| 8 | AD admins can change certificateUserIds for synced accounts via altSecurityIdentities and Connect | Identity team | verified | Learn, Mapping to certificateUserIds (Roles to update) |
| 9 | Cloud PKI issues only to Intune-enrolled devices via the SCEP profile; SCEP is its only registration authority | Endpoint; renewal table | verified | Learn, Overview of Microsoft Cloud PKI |
| 10 | Intune doesn't manage Windows Server | Endpoint | verified (book-level fact) | Linked to Book 05 Chapter 09 per brief |
| 11 | Federal PKI issues PIV/PIV-I; FCPCA G2 is root and trust anchor; FPKIMA operates top two CAs; not in Microsoft/Mozilla/Apple stores | PIV office | verified | idmanagement.gov, Federal Public Key Infrastructure 101 |
| 12 | MDI template assessments for any AD CS environment; CA assessments need a sensor on AD CS | SecOps | verified | Learn, MDI security posture assessments (Prerequisites) |
| 13 | SC-17(a)/(b) text | CISO/ISSO | verified | NIST SP 800-53 Rev. 5 via NIST OSCAL catalog |
| 14 | CyberArk Certificate Manager (formerly Venafi TLS Protect) is the program's single CLM tool; no second CLM vendor | CLM owner | restated-as-design | Program decision (book brief) |
| 15 | Palo Alto Networks completed CyberArk acquisition Feb 11, 2026 | CLM owner | verified | Palo Alto press release, SEC Form 8-K Ex. 99.1 |
| 16 | SaaS edition now marketed as NGTS; Self-Hosted continues on Trust Protection Foundation | CLM owner | corrected (brief's name is the pre-2026 name; current name added) | paloaltonetworks.com NGTS Certificate Manager page (cyberark.com redirects there) |
| 17 | Self-Hosted discovers, tracks, renews before expiry; supports heterogeneous CAs; roles Master Admin, Server Owner, Certificate Approver, Team Owner | CLM owner; role map | verified | CyberArk docs 26.1, Certificate Manager - Self-Hosted Introduction |
| 18 | Revocation is an authorization/IR decision; separate certificate manager (revokes) from CA admin (CDP, CRL timing, config) | Matrix comment; AD CS ACL | verified | Learn, Operate certificate revocation, CRL publication, and CDP changes |
| 19 | Certificate manager has Issue and Manage Certificates; CA admin needed for CRL scheduling/CDP changes | AD CS ACL | verified | same |
| 20 | One group per role, named accounts, owner/review date, controlled emergency account | AD CS ACL | verified | Learn, Secure, delegate, and audit CA administration |
| 21 | No current Learn procedure for WS2025 role separation; don't apply undocumented registry value | AD CS ACL | verified | same |
| 22 | Intune Administrator can create Cloud PKI CAs; Cloud PKI custom-role permissions (read, create, disable/reenable, revoke leaf) | Intune RBAC | verified | Learn, Configure root and issuing CA; Create a custom role in Intune (Cloud PKI) |
| 23 | Deleting a CA via custom role needs read + disable/reenable + revoke; revoke and delete are permanent | Intune RBAC | verified | Learn, Delete Microsoft Cloud PKI CA |
| 24 | Scope tags on Cloud PKI CAs | Intune RBAC | verified | Learn, Overview of Microsoft Cloud PKI |
| 25 | Configure connector with an Intune Administrator account with an Intune license | Intune RBAC | verified | Learn, Prerequisites for the Certificate Connector (Accounts) |
| 26 | PKI-based trust store assigned to Privileged Authentication Administrator; Authentication Policy Administrator configures bindings, protection level, affinity | Entra roles | verified | Learn, Set up Microsoft Entra CBA (Step 1, Step 3) |
| 27 | Tenant default: single-factor protection, low affinity | Entra roles | verified | same (Step 3) |
| 28 | certificateUserIds: PAA for cloud-only; Hybrid Identity Admin and Connect-only for synced | Entra roles | verified | Learn, Mapping to certificateUserIds |
| 29 | PKI admin can supply the list of issuing CAs | Entra roles | verified | Learn, How to configure CAs for CBA |
| 30 | CyberArk Microsoft CA account needs Read, Issue and Manage Certificates, Request Certificates | CLM roles | verified | CyberArk docs 26.1, Microsoft ADCS CA template |
| 31 | That account is therefore a certificate manager; scope it; treat Master Admins as privileged | CLM roles | restated-as-design | Program inference from #19 and #30 |
| 32 | Connector service account: Read and Enroll on templates; Issue and Manage only for revocation; NDES app pool Read and Enroll | Connector paragraph | verified | Learn, Prerequisites for the Certificate Connector (Accounts) |
| 33 | Code-signing keys held in hardware | Renewal table | restated-as-design | Program policy (no external claim made) |
| 34 | Role map table assignments | Role map | restated-as-design | Program model; role names verified in rows 17, 22, 26, 28 |

## Carry-forward ledger

| Source page § | Went to | Or why not carried |
|---|---|---|
| pki-modernization.md §1.4 Audience (PKI admins, IAM architects, Intune admins, SecOps and compliance, governance leads) | This chapter, The roles (expanded into ten owner roles) | — |
| pki-modernization.md §9 gate wording ("approved by PKI administrator and security team") | This chapter, matrix (template retirement, evidence rows) | Phase detail itself is Chapter 07 and Chapter 08 |
| pki-modernization.md Appendix A "Owner" column (Licensing, PKI Architect, PKI Admin) | Informed the matrix and the renewal table | Checklist itself goes to Appendix A |
| pki-modernization.md §11.1 "Restrict Cloud PKI administration to dedicated roles; PIM" | This chapter, Intune RBAC paragraph and role map (corrected: Intune has no built-in "PKI Administrator" role; uses a custom role with Cloud PKI permissions) | Rest of §11 is Chapter 03 / Chapter 06 |
