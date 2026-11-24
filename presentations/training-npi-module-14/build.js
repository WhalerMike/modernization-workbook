// Non-Person Identity learning path, Module 14: Workload identity across AWS GovCloud (US) and OCI — the module's narrated deck.
// Teaches docs/training/non-person-identity/14-workload-identity-across-aws-govcloud-and-oci.md, Learn-style: objectives, the
// concepts (what AWS, Oracle and Microsoft say; the exports and the join to the record; the checks, VK-NPI-10 and the
// unknowns), "Try it" slides with the real Lab 1 commands and output (the kit's captures, data/kit-captures/npi/13-*, since
// the module runs workbook Chapter 13's Lab 1), Lab 2, the federal requirement and evidence, a two-question check, and the
// summary. Every fact comes from the module page, the implementation guide's Steps 1g, 1h and 4f and workbook Chapter 13
// that the page sends the learner to, or the kit; the deck adds none.
// Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-14/build.js \
//                      presentations/training-npi-module-14/Training_NPI_Module_14.pptx
const TITLE = "Module 14: Workload identity across AWS GovCloud (US) and OCI";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 14: Workload identity across AWS GovCloud (US) and OCI",
});
const { HEX, txt, tag, content, notes, endModule, table, panel, callout, sources, sourceSlide, backup, finish, code, line, objectives, check } = P;
// shared.js names the deck and labels the title slide for the Microsoft Automation path; this path's title slide
// and document title are set here.
P.D.pres.title = `Non-Person Identity learning path — ${TITLE}`;
const title = (sec, t, sub, units) => {
  const s = P.titleSlide(sec, t, sub);
  txt(s, "Units", [
    { text: "NON-PERSON IDENTITY LEARNING PATH", options: { bold: true, color: HEX.slate, fontSize: 12, breakLine: true } },
    ...units.map((u, k) => ({ text: u, options: { color: k % 2 ? HEX.teal : HEX.navy, bold: true, fontSize: 15, breakLine: k < units.length - 1 } })),
  ], { x: 0.8, y: 4.75, w: 11.0, h: 1.65, paraSpaceAfter: 2 });
  return s;
};
const OUT = process.argv[2] || "Training_NPI_Module_14.pptx";
const M = "Training, Non-Person Identity, Module 14";
const CAP = "LAB 1 OUTPUT ON THE KIT'S FIXTURES, -AsOf 2026-11-24";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 14: Workload identity in AWS GovCloud and OCI", "Non-Person Identity learning path · The guide's Steps 1g, 1h and 4f, with workbook Chapter 13",
    ["What the vendors say  ·  The exports and the join  ·  The checks and VK-NPI-10", "Try it: Lab 1  ·  Lab 2  ·  The federal requirement and evidence"]);
  notes(s,
`Welcome to Module 14 of the Non-Person Identity learning path: workload identity across AWS GovCloud and O C I. It teaches the implementation guide's steps for the program's other two clouds, with Chapter 13 of the developer workbook. The program's AWS estate is in AWS GovCloud, and its Oracle Cloud tenancy is in Oracle's US Government Cloud, realm O C 2. In November 2026 the program added both clouds' workload identities to this track. Take this module after Modules 1 and 4.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why an access key is a service account's password");
  tag(s, "Why");
  const l = panel(s, "Key", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "TODAY", "A key nobody in governance sees", [
    "An AWS access key, or an OCI API key, auth token or customer secret key",
    "Long-lived, in a console identity governance never opens",
  ], 13.5);
  const r = panel(s, "Rule", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "THE TRACK'S RULES", "The same as Entra and AD", [
    "Listed, and joined to a record with two owners and a sponsor",
    "Every long-lived credential an exception with a replace-by date",
    "Every trust no wider than its workload needs",
  ], 13.5);
  callout(s, "Dec", Math.max(l, r) + 0.3, 1.2, "FaRoute", HEX.navy, "The program's decision: ",
    "WD-171 extends the track to AWS GovCloud (US) and OCI (OC2); WD-172 names the tags that join each identity to its record.");
  sources(s, "Sources: Module 14, \"Introduction\"; Chapter 13, \"In this chapter\"; decisions WD-171, WD-172.");
  notes(s,
`Why does this matter? A workload in AWS or O C I that holds an access key is a service account with a password that never expires, sitting in a console nobody in identity governance opens. This module brings those identities under the same rules as the rest of the track. Each one is listed and joined to a record with two owners and a sponsor. Every long-lived credential is an exception with a replace-by date. And every trust is no wider than its workload needs. The program decided to extend the track to both clouds, and named the tags that join each identity to its record.`,
  `${M} — Unit "Introduction"; workbook Chapter 13, "In this chapter."`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 14", [
    "Say why an access key, API key, auth token or customer secret key is a long-lived secret, and what the program does with it",
    "Name what the guide's Step 1g and 1h exports read, and what the credential report and list calls leave out",
    "Join an AWS or OCI identity to its record with the SystemId, Owner1, Owner2 and Sponsor tags",
    "Run Chapter 13's checks on fixtures and read the findings, credentials, unjoined identities, a trust and the evidence",
    "Name what's still unknown in GovCloud and OC2, and why the kit assumes no answer",
  ], [
    "Modules 1 and 4",
    "PowerShell 7.1 or later with Pester 5",
    "No AWS account, OCI tenancy or Entra tenant",
  ], 60);
  sources(s, "Sources: Module 14, \"Learning objectives,\" \"Prerequisites.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty minutes with the lab. You'll say why an access key, an API key, an auth token or a customer secret key is a long-lived secret, and what the program does with each one. You'll name what the guide's export steps read, and what AWS's credential report and list calls leave out. You'll join an identity to its record with four tags. You'll run Chapter 13's checks on fixtures and read what they find. And you'll name what's still unknown, and why the kit doesn't assume an answer. Before you start, finish Modules 1 and 4. You need PowerShell 7.1 or later with Pester 5, and no AWS account, O C I tenancy or Entra tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites."`);
}
endModule(SI);

// ================================================================== 4 What the vendors say
{
  const s = content(SC, "What AWS, Oracle and Microsoft say");
  tag(s, "What");
  const b = table(s, "Say", 1.45, [2.6, 9.55], ["Topic", "What the vendor says"], [
    ["The target", "AWS: workloads use temporary credentials with IAM roles; where possible, no access keys. Oracle: use instance principals; rotate API keys every 90 days or less"],
    ["AWS GovCloud (US)", "One IAM control plane, no global STS endpoint; no role between a GovCloud and a standard account; root user has no console sign-in"],
    ["Roles Anywhere", "Supported, but not revocation through CRL distribution points: \"import your CRLs instead\""],
    ["OCI principals", "Instance and resource principals act through a dynamic group, which has no permissions until a policy names it"],
    ["OCI credentials", "Three API keys per user; auth tokens and customer secret keys never expire, two of each"],
    ["Microsoft", "Entra accepts workload tokens from AWS, signed with RS256 only; GovCloud to Entra is untested (WD-171)"],
  ], { fontSize: 12, limit: 5.9 });
  line(s, "Rule", "The program's rule: every long-lived credential is an exception with a replacement date (WD-171).", b + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 14, Unit 1; Chapter 13, \"What AWS, Oracle and Microsoft say\"; AWS IAM and GovCloud user guides; Oracle OCI documentation; Microsoft Learn.");
  notes(s,
`Unit 1 is what the vendors say. AWS says to require workloads to use temporary credentials with IAM roles, and where possible not to create access keys at all. Oracle recommends instance principals, and rotating API keys every ninety days or less. AWS GovCloud isn't commercial AWS: it has one IAM control plane and no global S T S endpoint, no role between a GovCloud account and a standard one, and a root user with no console sign-in. IAM Roles Anywhere works there, but it can't fetch revocation lists from a certificate, so AWS says to import your C R Ls instead. In O C I, instance and resource principals act through a dynamic group, which has no permissions until a policy names it. Auth tokens and customer secret keys never expire. And Microsoft Learn says Entra accepts tokens from workloads in AWS, signed with R S two fifty-six only. Whether a GovCloud account's tokens work with Entra hasn't been tested, so the guide uses that path only after a test. The program's rule follows: every long-lived credential is an exception with a replacement date.`,
  `${M} — Unit 1 "What the vendors say, and the program's rule": Chapter 13, "What AWS, Oracle and Microsoft say."`);
}

// ================================================================== 5 Exports and the join
{
  const s = content(SC, "The exports, and the join to the record");
  tag(s, "How");
  const l = panel(s, "Aws", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "STEP 1G: AWS GOVCLOUD (US)", null, [
    "Credential report: users, passwords, the first two access keys",
    "list-access-keys and service-specific credentials, for the rest",
    "Roles with trust policies; instance profiles; OIDC providers",
    "Roles Anywhere trust anchors, profiles and CRLs",
    "list-user-tags and list-role-tags: ListUsers and ListRoles return no tags",
  ], 12.5);
  const r = panel(s, "Oci", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "STEP 1H: OCI, HOME REGION", null, [
    "Users, with their tags",
    "Each user's API keys, auth tokens and customer secret keys: identifiers, never the secret",
    "Dynamic groups and their matching rules",
    "Policies and their statements",
  ], 12.5);
  callout(s, "Tags", Math.max(l, r) + 0.25, 1.2, "FaIdCard", HEX.navy, "The join (WD-172): ",
    "SystemId, Owner1, Owner2 and Sponsor on every role, workload IAM user, OCI user holding a credential and dynamic group. One key per owner: AWS tag values allow no comma or semicolon.");
  sources(s, "Sources: Module 14, Unit 2; implementation guide, Steps 1g and 1h; Chapter 13, \"The inputs\"; AWS IAM API Reference.");
  notes(s,
`Unit 2 is the exports and the join. Every command in the guide's two export steps is a read. In AWS, the credential report lists every IAM user, its password and its first two access keys. It leaves out service-specific credentials and any key beyond the first two, so the export also lists access keys and service-specific credentials. Then the roles, with their trust policies, the instance profiles, the O I D C providers, and the Roles Anywhere trust anchors, profiles and C R Ls. List users and list roles don't return tags, so the export reads each user's and role's tags too. In O C I, against the tenancy's home region, it reads the users, each user's credentials, which come back as identifiers, never the secret, the dynamic groups and the policies. The join is four tags: system I D, owner one, owner two and sponsor. Each owner gets its own key, because an AWS tag value can't hold a comma or a semicolon. An identity with no tags or record is an orphan: disable first, then a person acts.`,
  `${M} — Unit 2 "The exports and the join to the record": implementation guide, Steps 1g and 1h; Chapter 13, "The inputs," "Start with the vendors' own reads."`);
}

// ================================================================== 6 Checks, VK-NPI-10, unknowns
{
  const s = content(SC, "The checks, VK-NPI-10, and what's still unknown");
  tag(s, "What");
  const b = table(s, "Chk", 1.45, [3.0, 9.15], ["Checks", "What they report"], [
    ["NPI-AWS-01 to -07", "Every active access key and service-specific credential against its exception; two keys; 90 days unused (design guidance); root key"],
    ["NPI-AWS-08 to -16", "Missing tags; OIDC trust with no sub condition; outside account, * or other partition; trust anchor with no imported CRL"],
    ["NPI-OCI-01 to -10", "API keys, auth tokens, secret keys; keys over 90 days; missing tags; dynamic groups matching the tenancy or holding manage all-resources"],
    ["VK-NPI-10", "The validation kit's gate check on the same exports, for G1 and G3; reads files only, never AWS or OCI"],
  ], { fontSize: 12, limit: 4.6 });
  callout(s, "Unk", b + 0.25, 1.35, "FaTriangleExclamation", HEX.amber, "Not yet specified, and the kit assumes no answer: ",
    "GovCloud and Entra federation, either way (untested); Access Analyzer's unused-access findings in GovCloud; instance, resource and OKE workload principals in OC2; the OCI CLI's output field names.");
  sources(s, "Sources: Module 14, Unit 3; Chapter 13, \"What Chapter 13 checks,\" \"Not yet specified\"; implementation guide, validation kit table and Step 4f.");
  notes(s,
`Unit 3 is the checks. N P I A W S oh one to oh seven are the long-lived credentials: every active access key and service-specific credential against its exception, two keys on one user, a key unused for ninety days, which is design guidance, and a root user key. Oh eight to sixteen are owners and trust: missing tags, an O I D C trust with no subject condition, an outside account, a star or another partition as the principal, and a trust anchor with no imported C R L. N P I O C I oh one to ten do the same for O C I, and add dynamic groups that match the whole tenancy or hold manage all-resources. The validation kit's V K N P I ten reads the same exports and reports the gate's criteria. And four things are still unknown, so the kit doesn't assume an answer: whether GovCloud and Entra can federate either way, whether Access Analyzer's unused-access findings run in GovCloud, whether O C 2 offers instance, resource and O K E workload principals, and what field names the O C I command line prints.`,
  `${M} — Unit 3 "The checks, and VK-NPI-10": Chapter 13, "What Chapter 13 checks," "Not yet specified."`);
}
endModule(SC);

// ================================================================== 7 Try it: run the checks
{
  const s = content(SL, "Try it: run Chapter 13's checks on the fixtures");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Lab 1, step 1, in examples/non-person-identity",
    "$ ./Invoke-NpiCloudWorkload.ps1 -AwsPath tests/fixtures/ch13/aws -OciPath tests/fixtures/ch13/oci `",
    "      -SettingsPath tests/fixtures/ch13/settings.json -ExceptionsPath tests/fixtures/ch13/exceptions.csv `",
    "      -OutputPath out/cloud-workload -AsOf 2026-11-24",
    "As of 2026-11-24; AWS account 111122223333 (aws-us-gov): 7 IAM user(s), 11 role(s), 2 trust anchor(s);",
    "    OCI tenancy (oc2): 5 user(s), 3 dynamic group(s)",
    "Findings: 24 Finding, 11 Warn, 2 Info",
    "Long-lived credentials: 7 AWS, 5 OCI; 2 under a current exception",
    "Not read: nothing",
    "  NPI-AWS-01  svc-app-sync, svc-ci-deploy, svc-legacy-ftp, svc-report-export",
    "  ...",
    "  NPI-OCI-10  hr-oke-workload",
    "Manifest SHA-256: 03f4376a836b0862512bd084731865ac6617ced980c457928f5c1b352b7f6400",
  ], { label: `TRY IT  ·  ${CAP} (WRAPPED; "..." MARKS A CUT)`, pt: 10.5 });
  line(s, "Writes", "It reads files and writes its output folder: no AWS or OCI command, no API call, no key changed.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 14, \"Exercise: Lab 1,\" step 1; Chapter 13, Lab 1, step 1; data/kit-captures/npi/13-1.txt.");
  notes(s,
`Try it. Lab 1 runs in the non-person identity folder, with no account and no tenancy. These are Chapter 13's Lab 1 steps. The fixtures are one fictional GovCloud account and one fictional O C 2 tenancy. Step one runs the checks as of November 24, 2026: seven IAM users, eleven roles and two trust anchors in AWS; five users and three dynamic groups in O C I. Look for two lines. Twenty-four findings, eleven warnings and two information items. And seven AWS and five O C I long-lived credentials, two of them under a current exception. Then one line per rule, and the manifest's hash. The script reads files and writes its output folder: it runs no AWS or O C I command, calls no A P I, and changes no key.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no account or tenancy," step 1; workbook Chapter 13, Lab 1, step 1.`);
}

// ================================================================== 8 Try it: findings
{
  const s = content(SL, "Try it: read the findings");
  tag(s, "How");
  const c = code(s, "Find", 0.6, 1.45, 12.15, [
    "# Step 2: read the findings",
    "$ Get-Content out/cloud-workload/findings.json -Raw | ConvertFrom-Json | Format-Table Rule, Severity, Object",
    "Rule       Severity Object",
    "NPI-AWS-01 Warn     svc-app-sync (IAM user)",
    "NPI-AWS-01 Finding  svc-report-export (IAM user)          ...",
    "NPI-AWS-02 Finding  svc-report-export (IAM user)",
    "NPI-AWS-04 Finding  svc-report-export (IAM user)",
    "NPI-AWS-08 Finding  svc-report-export (IAM user)          ...",
    "NPI-AWS-09 Finding  ci-pipeline-oidc (IAM role)",
    "NPI-AWS-14 Finding  ta-lab-ca (trust anchor)              ...",
    "NPI-OCI-06 Finding  dg-everything (dynamic group)         ...",
    "NPI-OCI-07 Warn     dg-everything (dynamic group)",
    "NPI-OCI-08 Warn     dg-everything (dynamic group)         ...",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS)`, pt: 10.5 });
  line(s, "Rep", "svc-report-export: two active keys, one never used, a console password beside them, one owner tagged.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 14, \"Exercise: Lab 1,\" step 2; Chapter 13, Lab 1, step 2; data/kit-captures/npi/13-2.txt.");
  notes(s,
`Step two reads the findings. Find S V C dash report dash export. It trips four rules: oh one, an active key with no exception, twice, once for each key; oh two, two active keys on one user, one of them never used; oh four, a console password beside the keys; and oh eight, only one owner tagged. Then find D G dash everything, a dynamic group in O C I. It has no tags, no policy names it, and its matching rule names the whole tenancy, so every instance would be a member. Notice the first line: S V C dash app dash sync's key is a warning, not a finding, because it's under a current exception.`,
  `${M} — Unit "Exercise: Lab 1," step 2; workbook Chapter 13, Lab 1, step 2, "What Chapter 13 checks."`);
}

// ================================================================== 9 Try it: credentials
{
  const s = content(SL, "Try it: the long-lived credentials");
  tag(s, "How");
  const c = code(s, "Cred", 0.6, 1.45, 12.15, [
    "# Step 3: read the long-lived credentials",
    "$ Import-Csv out/cloud-workload/credentials.csv | Format-Table Cloud, Identity, Kind, AgeDays, LastUsedOn, Exception",
    "Cloud Identity          Kind                          AgeDays LastUsedOn Exception",
    "aws   svc-app-sync      Access key                    161     2026-11-23 EXC-2026-031",
    "aws   svc-bedrock-batch Service-specific (bedrock)    145",
    "aws   svc-ci-deploy     Access key                    623     2026-11-22",
    "aws   svc-git-mirror    Service-specific (codecommit) 387",
    "aws   svc-legacy-ftp    Access key                    905     2025-12-01",
    "aws   svc-report-export Access key                    83      2026-11-20",
    "aws   svc-report-export Access key                    39",
    "oci   hr-build-push     Auth token                    582",
    "oci   hr-integration    API signing key               295        ...",
    "oci   hr-object-sync    Customer secret key           357",
    "oci   hr-report-reader  API signing key               69                 EXC-2026-044",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS A CUT)`, pt: 10.5 });
  line(s, "Exc", "Two are under exceptions until 2027. Identifiers only: the file never holds a secret.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 14, \"Exercise: Lab 1,\" step 3; Chapter 13, Lab 1, step 3; data/kit-captures/npi/13-3.txt.");
  notes(s,
`Step three reads the long-lived credentials: one row per active access key, service-specific credential, API key, auth token and customer secret key, with its age, its last use for AWS keys, and its exception. Two are under exceptions until 2027: S V C dash app dash sync's access key and H R dash report dash reader's API key. Look at the ages. S V C dash legacy dash F T P's key is more than nine hundred days old, and was last used in December 2025, so it's also a ninety-day unused lead. H R dash build dash push's auth token is five hundred and eighty-two days old, and auth tokens never expire. The file holds identifiers only, never a secret.`,
  `${M} — Unit "Exercise: Lab 1," step 3; workbook Chapter 13, Lab 1, step 3.`);
}

// ================================================================== 10 Try it: unjoined and one trust
{
  const s = content(SL, "Try it: who isn't joined, and one OIDC trust");
  tag(s, "How");
  const c = code(s, "Join", 0.6, 1.45, 12.15, [
    "# Step 4: read who isn't joined to a record, and one trust",
    "$ Get-Content out/cloud-workload/identities.json -Raw | ConvertFrom-Json | Where-Object Joined -EQ 'no' | ...",
    "Cloud Type         Name              WorkloadKind",
    "aws   IamUser      svc-legacy-ftp    IAM user (long-lived credentials)",
    "aws   IamUser      svc-report-export IAM user (long-lived credentials)",
    "aws   IamRole      app-etl-lambda    Lambda execution role",
    "aws   IamRole      legacy-open-role  Anyone",
    "oci   OciUser      hr-build-push     OCI user (long-lived credentials)",
    "oci   OciUser      hr-object-sync    OCI user (long-lived credentials)",
    "oci   DynamicGroup dg-everything     Instance principal",
    "$ (Get-Content out/cloud-workload/trust.json -Raw | ConvertFrom-Json | Where-Object Object -EQ 'ci-pipeline-oidc').Principals | ...",
    "type       : Federated",
    "kind       : OIDC federation",
    "conditions : {StringEquals token.actions.githubusercontent.com:aud = sts.amazonaws.com}",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS)`, pt: 10 });
  line(s, "Sub", "Only an aud condition, no sub: any repository's workflow could present a token for this role (NPI-AWS-09).", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 14, \"Exercise: Lab 1,\" step 4; Chapter 13, Lab 1, step 4; AWS, \"Create a role for OpenID Connect federation\"; data/kit-captures/npi/13-4.txt.");
  notes(s,
`Step four reads who isn't joined to a record. Seven identities: two IAM users holding keys, a Lambda execution role, a role anyone can assume, two O C I users holding credentials, and the dynamic group. Each is an orphan lead under the guide's orphan rule. Then it reads one trust: C I dash pipeline dash O I D C trusts GitHub's token issuer with only an audience condition. AWS's examples limit the token's subject claim to the one repository. Without it, workflows from repositories outside your control could assume the role. That's N P I A W S oh nine.`,
  `${M} — Unit "Exercise: Lab 1," step 4; workbook Chapter 13, Lab 1, step 4; "What AWS, Oracle and Microsoft say" (trust policies).`);
}

// ================================================================== 11 Try it: without the optional files
{
  const s = content(SL, "Try it: run without the two optional files");
  tag(s, "How");
  const c = code(s, "Min", 0.6, 1.45, 12.15, [
    "# Step 5: an export made before Step 1g added the tag and CRL reads",
    "$ Copy-Item -Recurse tests/fixtures/ch13/aws out/aws-min",
    "$ Remove-Item out/aws-min/iam-tags.json, out/aws-min/roles-anywhere-crls.json",
    "$ ./Invoke-NpiCloudWorkload.ps1 -AwsPath out/aws-min -SettingsPath tests/fixtures/ch13/settings.json `",
    "      -OutputPath out/cloud-workload-min -AsOf 2026-11-24",
    "Findings: 11 Finding, 9 Warn, 1 Info",
    "Long-lived credentials: 7 AWS, 0 OCI; 0 under a current exception",
    "Not read: aws/iam-tags.json, aws/roles-anywhere-crls.json",
    "  NPI-AWS-08  AWS account 111122223333",
    "  NPI-AWS-14  ta-program-pki, ta-lab-ca",
    "  ...",
  ], { label: `TRY IT  ·  ${CAP} (TRIMMED: "..." MARKS CUTS)`, pt: 10.5 });
  line(s, "Warn", "A missing file is a Warn, never a Pass. svc-app-sync's key is a Finding again: no exception list was given.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 14, \"Exercise: Lab 1,\" step 5; Chapter 13, Lab 1, step 5; decision WD-172; data/kit-captures/npi/13-5.txt.");
  notes(s,
`Step five runs on an export made before the guide's export step added the tag and C R L reads, so it doesn't have them. The kit still runs, and says what it couldn't check. The manifest's not-read line names both files. N P I A W S oh eight becomes one warning for the whole account, instead of a finding for each identity. And oh fourteen warns for each trust anchor, because it can't tell whether a C R L was imported. A missing file is a warning, never a pass. Notice too that S V C dash app dash sync's key is back to a finding, because this run was given no exception list.`,
  `${M} — Unit "Exercise: Lab 1," step 5; workbook Chapter 13, Lab 1, step 5.`);
}

// ================================================================== 12 Try it: evidence and tests
{
  const s = content(SL, "Try it: the evidence, the tests, then clean up");
  tag(s, "How");
  const c = code(s, "Ev", 0.6, 1.45, 12.15, [
    "# Step 6: read the evidence",
    "$ (Get-Content out/cloud-workload/evidence.json -Raw | ConvertFrom-Json).rows | Format-Table step, control, evidence, ...",
    "step                control evidence        ksi",
    "inventory           AC-2    identities.json KSI-IAM-APM, KSI-IAM-JIT, KSI-IAM-SNU, KSI-IAM-SUS",
    "inventory           CM-8    identities.json KSI-PIY-GIV",
    "inventory           IA-4    identities.json KSI-IAM-ELP, KSI-IAM-JIT",
    "credentials         IA-5    credentials.csv KSI-IAM-APM",
    "certificates        IA-5(2) trust.json      KSI-IAM-APM, KSI-IAM-ELP, KSI-IAM-SNU, KSI-SVC-ASM",
    "certificates        SC-17   trust.json      KSI-SVC-ASM",
    "trust-and-privilege AC-6    trust.json      KSI-IAM-ELP, KSI-IAM-JIT",
    "lifecycle           AC-2(3) findings.json   KSI-IAM-AAM, KSI-IAM-JIT, KSI-IAM-SUS",
    "# Step 7: run the tests              # Step 8: clean up",
    "$ Invoke-Pester -Path tests-ch13/NpiCloudWorkload.Tests.ps1",
    "Tests Passed: 34, Failed: 0           $ Remove-Item -Recurse -Force out",
  ], { label: `TRY IT  ·  ${CAP} (ONE COMMAND TRIMMED; STEPS 7 AND 8 SIDE BY SIDE)`, pt: 10.5 });
  line(s, "Ev", "Each row names the file that provides the evidence, with its SHA-256 in the manifest.", c + 0.2, 0.45, 13.5);
  sources(s, "Sources: Module 14, \"Exercise: Lab 1,\" steps 6 to 8; Chapter 13, Lab 1, steps 6 and 7; data/kit-captures/npi/13-6.txt to 13-8.txt.");
  notes(s,
`Step six reads the evidence: one row per step and control, with the K S Is aligned with it and the file that provides the evidence. The inventory rows are A C two, C M eight and I A four, from the identities file. The credentials row is I A five. The certificates rows are I A five enhancement two and S C seventeen, from the trust file, as is A C six for trust and privilege. And the lifecycle row is A C two enhancement three, from the findings. Match each row to the requirement table in the module's introduction. Step seven runs the tests: thirty-four pass. Step eight cleans up by removing the output folder.`,
  `${M} — Unit "Exercise: Lab 1," steps 6 to 8; workbook Chapter 13, Lab 1, steps 6 and 7.`);
}

// ================================================================== 13 Lab 2
{
  const s = content(SL, "Lab 2: a test account's and tenancy's exports");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "One AWS GovCloud (US) account and one OCI tenancy that aren't production; read roles for IAM and Roles Anywhere, and for OCI IAM; the AWS and OCI CLIs in PowerShell 7"],
    ["1", "Write the settings and an empty exception list, outside the repository"],
    ["2 and 3", "Run the guide's Step 1g commands in the account, tag and CRL reads included, and Step 1h's in the tenancy's home region"],
    ["4 and 5", "Run the checks on the exports; read the findings and the manifest: no request made, the fourteen export commands listed"],
  ], { fontSize: 12.5, limit: 5.0 });
  callout(s, "Fld", b + 0.3, 1.1, "FaTriangleExclamation", HEX.amber, "Not run by anyone yet: ",
    "if every OCI user shows no credentials while the console shows keys, the CLI's field names differ from what the kit reads; record them.");
  sources(s, "Sources: Module 14, \"Exercise: Lab 2\"; Chapter 13, \"Lab 2: test account and tenancy.\"");
  notes(s,
`Lab 2 runs the same checks on a real account's and tenancy's exports. Nobody has run it yet, so no step's output has been seen. Use one AWS GovCloud account and one O C I tenancy that aren't production, with read access to IAM and Roles Anywhere in the account, and to IAM in the tenancy. Write the settings and an empty exception list, in a folder outside the repository. Run the guide's AWS export commands, the tag and C R L reads included, then the O C I ones against the tenancy's home region. Then run the checks, and read the findings and the manifest: it records no request, because the kit called nothing, and lists the fourteen export commands. If every O C I user shows no credentials while the console shows keys, the command line's field names differ from those the kit reads. Record what they are. Keep the exports with the run's evidence, never in the repository.`,
  `${M} — Unit "Exercise: Lab 2, your test account and tenancy"; workbook Chapter 13, "Lab 2: test account and tenancy."`);
}
endModule(SL);

// ================================================================== 14 Federal requirement
{
  const s = content(SS, "The federal requirement and the evidence the ISSO keeps");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.2, 3.2, 2.6, 3.15], ["What the output shows", "Requirement it supports", "KSIs", "Evidence the ISSO keeps"], [
    ["Every identity, joined or not", "AC-2; CM-8; IA-4", "KSI-IAM-SNU; KSI-PIY-GIV; KSI-IAM-ELP, IAM-JIT", "identities.json and the exports, by SHA-256"],
    ["Every long-lived credential", "IA-5 Authenticator Management", "KSI-IAM-APM", "credentials.csv and its exception records"],
    ["Trust anchors and CRLs", "IA-5(2); SC-17", "KSI-IAM-APM, SVC-ASM", "trust.json and the CRL import record"],
    ["Trust and reach", "AC-6 Least Privilege", "KSI-IAM-ELP, IAM-JIT", "trust.json and each justification"],
    ["Orphan leads", "AC-2(3) Disable Accounts", "KSI-IAM-AAM, IAM-JIT, IAM-SUS", "findings.json and the ticket"],
  ], { fontSize: 12, limit: 5.4 });
  line(s, "Ass", "A row provides evidence for a control; the assessor decides. KSIs are FedRAMP 20x indicators for cloud providers.", b + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 14, \"Introduction\" (the federal requirement); NIST SP 800-53; FedRAMP 20x KSIs; Chapter 13, \"Federal requirements and evidence.\"");
  notes(s,
`The federal requirement. Chapter 13 writes one evidence row per step and control, and these are the rows this module's lab produces. The identities file supports A C two, Account Management, C M eight, System Component Inventory, and I A four, Identifier Management, in NIST SP 800-53. The credentials file supports I A five, Authenticator Management, with the exception records it names. The trust anchors and their C R Ls support I A five enhancement two and S C seventeen, the public key controls. The trust and reach of every role and dynamic group support A C six, Least Privilege, with the owner's justification for each finding kept. And the orphan leads support A C two enhancement three, Disable Accounts, with the orphan or decommission ticket. K S Is are FedRAMP twenty X indicators for cloud service providers. A row provides evidence for a control; the assessor decides.`,
  `${M} — Unit "Introduction" (the federal requirement); workbook Chapter 13 — "Federal requirements and evidence."`);
}

// ================================================================== 15 Check
{
  const s = check(SS, "Check yourself: two questions on AWS and OCI", [
    { q: "How does the program join an IAM role to its record?", options: ["a. By its ARN in the CMDB", "b. Four tags: SystemId, Owner1, Owner2 and Sponsor, one key per owner", "c. One Owners tag listing both owners, separated by commas"] },
    { q: "Step 1g's export has no iam-tags.json. What does the kit do?", options: ["a. Passes every role, since none is missing a tag", "b. Runs, lists the file as not read, and raises one NPI-AWS-08 Warn", "c. Calls list-role-tags itself"] },
  ], "1 b: AWS tag values allow no comma. 2 b: a missing file is a Warn, never a Pass; the kit never calls AWS.");
  sources(s, "Sources: Module 14, \"Knowledge check,\" questions 2 and 5, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: how does the program join an IAM role to its record? The answer is b: four tags, system I D, owner one, owner two and sponsor, with one key per owner, because an AWS tag value can't hold a comma. Second: the AWS export has no tags file. What does the kit do? The answer is b: it runs, lists the file as not read, and raises one warning for the account. A missing file is a warning, never a pass, and the kit never calls AWS itself. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 5; "Check your answers."`);
}

// ================================================================== 16 Summary
{
  const s = content(SS, "Summary: the other clouds, under the same rules");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU RAN", null, [
    "Chapter 13's checks on a fictional GovCloud account and OC2 tenancy",
    "The findings, the long-lived credentials and their exceptions",
    "Who isn't joined, and an OIDC trust with no sub condition",
    "A run without the optional files, the evidence and the tests",
  ], 13);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "The learning path's index", [
    "Back to the learning path",
    "Or workbook Chapter 13, for Lab 2 and its dangers",
  ], 13);
  callout(s, "Keep", Math.max(l, r) + 0.3, 1.2, "FaFileShield", HEX.teal, "The rule: ",
    "every AWS and OCI workload identity listed, joined by four tags, its long-lived credentials exceptions with a date, its trusts named down to the workload, its unknowns kept as unknowns.");
  sources(s, "Sources: Module 14, \"Summary\"; workbook Chapter 13, \"Checklist.\"");
  notes(s,
`To sum up. The program's AWS GovCloud and O C I workload identities follow the track's rules. Every one is listed from read-only exports and joined to a record by four tags. Its long-lived credentials are exceptions with a date. Its trusts are named down to the workload. And its unknowns stay unknowns until the program tests them. Chapter 13 checks the exports on every run, V K N P I ten reports the gate's criteria, and the evidence names the control each row supports. Next, go back to the learning path's index, or on to Chapter 13 for Lab 2 and its dangers.`,
  `${M} — Unit "Summary"; workbook Chapter 13, "Checklist."`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 14 deck", [
  "Module page: docs/training/non-person-identity/14-workload-identity-across-aws-govcloud-and-oci.md (Non-Person Identity learning path, Module 14): Introduction and its requirement table, objectives, prerequisites, Units 1 to 3, Lab 1, Lab 2, knowledge check and summary.",
  "What the module links: Non-Person Identity: An Implementation Guide, Steps 1g, 1h and 4f, the orphan rule and the validation kit table (VK-NPI-10); decisions WD-171 and WD-172; and through Chapter 13, AWS's IAM, GovCloud and Roles Anywhere documentation, Oracle's OCI documentation and Microsoft Learn's workload identity federation pages. NIST SP 800-53; FedRAMP 20x KSIs.",
  "Workbook Chapter 13, Workload Identity Across AWS GovCloud (US) and OCI: \"What AWS, Oracle and Microsoft say,\" \"The inputs,\" \"What Chapter 13 checks,\" Lab 1, Lab 2 (not run by anyone), \"Not yet specified,\" \"Federal requirements and evidence.\" Kit: examples/non-person-identity (Invoke-NpiCloudWorkload.ps1, powershell/NpiCloudWorkload, tests/fixtures/ch13).",
  "Lab output: the kit's captures, data/kit-captures/npi/13-1.txt to 13-8.txt (scripts/kit_captures.py), on fictional fixtures with -AsOf 2026-11-24; trimmed, wrapped and reflowed where the slides say so.",
]);

finish(OUT);
