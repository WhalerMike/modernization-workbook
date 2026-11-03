// Non-Person Identity learning path, Module 4: Set the credential rules — the module's narrated deck.
// Teaches docs/training/non-person-identity/04-credential-rules.md, Learn-style: objectives, the concepts, three
// "Try it" slides with the real Lab 1 commands and output (run November 3, 2026 in a scratch copy of
// examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it), Lab 2, the federal
// requirement and evidence, a two-question check, and the summary. Every fact comes from the module page, the path's
// verification log, the guide's Step 3 and workbook Chapter 04 that the page sends the learner to, or the kit; the
// deck adds none. Helpers: ../training-ms-automation-module-1/shared.js.
// Build (Git Bash):  source /c/tmp/deckenv.sh && FIT=1 node presentations/training-npi-module-4/build.js \
//                      presentations/training-npi-module-4/Training_NPI_Module_4.pptx
const TITLE = "Module 4: Set the credential rules";
const P = require("../training-ms-automation-module-1/shared.js")({
  title: TITLE,
  footer: "Federal Modernization Workbook  ·  Non-Person Identity learning path, Module 4: Set the credential rules",
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
const OUT = process.argv[2] || "Training_NPI_Module_4.pptx";
const M = "Training, Non-Person Identity, Module 4";

const SI = "Introduction";
const SC = "Concepts";
const SL = "Lab";
const SS = "Check and summary";

// ================================================================== 1 Title
{
  const s = title(SI, "Module 4: Set the credential rules", "Non-Person Identity learning path · Gate G3 Credential rules, with workbook Chapter 04",
    ["The program's rules  ·  App management policies  ·  The policy plan  ·  Rotation", "The write path  ·  Try it: Lab 1  ·  Lab 2  ·  Evidence"]);
  notes(s,
`Welcome to Module 4 of the Non-Person Identity learning path: set the credential rules. Module 3 decided where each identity ends up. This module sets the rules for the credentials they hold on the way: what the tenant will refuse, and how a certificate is renewed and replaced without anyone having to remember. It's Gate 3, Credential rules, with Chapter 4 of the developer workbook, on app management policies and certificate rotation. You'll compare a tenant's policy with a reviewed file, plan a rotation from renewal to removal, and approve each write by its hash. The code runs on your laptop, against a fictional tenant and key vault. It's illustrative: tested against fixtures, not run against a live tenant.`,
  `${M} — Unit "Introduction"; learning path index.`);
}

// ================================================================== 2 Why
{
  const s = content(SI, "Why the tenant enforces part, and code does the rest");
  tag(s, "Why");
  const l = panel(s, "Rules", 0.6, 1.45, 6.0, null, HEX.red, HEX.redTint, "THE PROGRAM'S RULES", "Short, and design guidance", [
    "No long-lived secrets",
    "Managed identities first, then federated credentials, then certificates",
    "Every certificate in a vault and on a rotation calendar",
  ], 13.5);
  const r = panel(s, "Gap", 6.85, 1.45, 5.9, null, HEX.amber, HEX.amberTint, "WHAT THE TENANT CAN'T DO", "Close the loop", [
    "A policy can block new secrets and cap new certificates at 180 days",
    "Key Vault can renew a certificate",
    "But Entra ID renews nothing on the app registration",
  ], 13.5);
  callout(s, "Point", Math.max(l, r) + 0.3, 0.95, "FaKey", HEX.red, "This module: ",
    "compare the policy with the tenant, and plan a rotation from renewal to removal, each write approved by its hash.");
  sources(s, "Sources: the guide, Step 3 (design guidance); Learn, Tutorial: Configure certificate autorotation in Key Vault; Configure restrictions on how applications can be configured.");
  notes(s,
`Why does this need code? The program's credential rules are short. No long-lived secrets. Managed identities first, then federated credentials, then certificates. And every certificate in a vault and on a rotation calendar. Those rules are the program's design guidance. The tenant can enforce part of that itself, with an application management policy that blocks new secrets and caps new certificates at a hundred eighty days. The rest needs code. Key Vault can renew a certificate on a schedule, but Entra I D renews nothing on the app registration. Somebody has to put the new certificate on the app, and take the old one off. So in this module you compare the policy with the tenant, and you plan a rotation from renewal to removal, with each write approved by its hash.`,
  `${M} — Unit "Introduction"; the guide — Step 3.`);
}

// ================================================================== 3 Objectives
{
  const s = objectives(SI, "What you'll be able to do in Module 4", [
    "Describe the tenant default policy and an app management policy, and how an exception overrides the default",
    "Explain why the policy plan never drops or loosens a restriction the tenant already holds",
    "Name the steps of a rotation, from the owner's approval to removing the old certificate",
    "Run both plans on the fixtures, dry-run them, and see a hash nobody approved refused",
  ], [
    "Module 1: both plans read its register",
    "Module 3: secrets aren't rotated, they're replaced by the target Module 3 decides",
    "Lab 1: PowerShell 7.1+ with Pester 5, and a clone; no tenant",
  ], 65);
  sources(s, "Sources: Module 4, \"Learning objectives,\" \"Prerequisites\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Here's what you'll be able to do by the end of this module, which takes about sixty-five minutes with the lab. You'll describe the tenant default policy and an app management policy, and how an exception overrides the default. You'll explain why the policy plan never drops or loosens a restriction the tenant already holds. You'll name the steps of a rotation, from the owner's approval to removing the old certificate. And you'll run both plans on the fixtures, dry-run them, and see the write path refuse a hash nobody approved. Before you start, finish Module 1, because both plans read its register, and Module 3, because a secret isn't rotated: it's replaced by the target Module 3 decides. Lab 1 needs PowerShell 7.1 or later with Pester 5, and a clone. No tenant.`,
  `${M} — Unit "Learning objectives," "Prerequisites"; learning path index — "What you need for the labs."`);
}
endModule(SI);

// ================================================================== 4 The rules in the guide
{
  const s = content(SC, "The rules in the guide: Step 3's eight steps");
  tag(s, "What");
  const b = table(s, "Step3", 1.45, [3.3, 8.85], ["Step 3", "What it says"], [
    ["1 The policy", "Block new password secrets and symmetric keys, cap new certificates at 180 days, for apps created after the effective date"],
    ["2 Two rotation numbers", "Existing workloads rotated at least yearly while being fixed; every new registration under the 180-day cap"],
    ["3 SCuBA", "MS.AAD.5.5v1 to 5.7v1 are SHOULD policies, not BOD 25-01 required configurations"],
    ["4, 5 Vault and directory", "Keys in Key Vault or an HSM; a renewed certificate in the vault doesn't change the app registration"],
    ["6 Secrets by exception", "Approved by the identity governance office and the CISO, at most six months, never renewed automatically"],
    ["7, 8 AD and federation", "A gMSA's password changes every 30 days by default; a new federated credential is a credential change"],
  ], { fontSize: 12, limit: 5.6 });
  sources(s, "Sources: the guide, Step 3; CISA ScubaGear MS.AAD.5.5v1-5.7v1; Learn, Key Vault certificate autorotation; Rotate certificates (SQL Server on Arc); Secure gMSAs.");
  notes(s,
`Unit 1 is the guide's Step 3, eight steps. Note three of them. First, the policy's effective date. The restrictions bind every app created after a date you choose, so new registrations follow the rule while the old ones are fixed later. Second, the two rotation numbers. An existing workload moves onto a certificate and is rotated at least yearly while it's being fixed, and every new registration starts under the hundred eighty day cap. Third, closing the loop between vault and directory: a renewed certificate in Key Vault doesn't by itself change the credential on the app registration, which is why Microsoft Learn's procedure for rotating certificates on SQL Server enabled by Azure Arc uploads the new one as a separate step. The other steps map the policy to three policies in CISA's Scuba Gear baseline, which are should policies, not required configurations; keep secrets by exception only; and cover a group managed account's password, which Microsoft Learn's group managed service account documentation says Windows changes every thirty days by default, and new federated credentials.`,
  `${M} — Unit 1 "The rules in the guide"; the guide — Step 3.`);
}

// ================================================================== 5 Two kinds of policy
{
  const s = content(SC, "Two kinds of policy, and how an exception overrides");
  tag(s, "What");
  const l = panel(s, "Default", 0.6, 1.45, 6.0, null, HEX.navy, HEX.navyTint, "TENANT DEFAULT POLICY", "Always exists, disabled by default", [
    "Separate restrictions for application objects and for service principal objects",
    "The program sets the same restrictions on both",
    "Applies to apps created after a chosen date",
  ], 13);
  const r = panel(s, "App", 6.85, 1.45, 5.9, null, HEX.teal, HEX.tealTint, "APP MANAGEMENT POLICY", "One per app: the exception", [
    "Overrides the default for the restrictions it defines",
    "One it doesn't define falls back to the default",
    "Here, a documented, time-limited exception with a record number and an end date",
  ], 13);
  callout(s, "Tokens", Math.max(l, r) + 0.3, 0.95, "FaShieldHalved", HEX.navy, "Neither blocks tokens ",
    "for an existing app: only the create or update that breaks the policy is refused. No Workload ID Premium needed.");
  sources(s, "Sources: Learn, Microsoft Entra application management policies API overview; Configure restrictions on how applications can be configured; Workload ID FAQ.");
  notes(s,
`Unit 2 reads the rules the code holds. Microsoft Learn's application management policies A P I overview describes two kinds of policy. The tenant default policy always exists, is disabled by default, and holds separate restrictions for application objects and for service principal objects. The program sets the same restrictions on both. An app management policy is assigned to one app, and an app takes only one. It overrides the default for the restrictions it defines, and anything it doesn't define falls back to the default. The program's design guidance uses it for an exception: documented, time-limited, with a record number and an end date. Two facts to remember. Neither kind blocks tokens for an existing app; only the create or update that breaks the policy is refused. And Microsoft Learn's Workload I D F A Q lists app management policies in both the free edition and Workload I D Premium, so this module needs no Premium.`,
  `${M} — Unit 2 "The policy and the rotation as code": workbook Chapter 04, "The rules the code holds"; Knowledge check answers 1 and 5.`);
}

// ================================================================== 6 The policy plan
{
  const s = content(SC, "The policy: read, compare, plan; NPI-POL-01 to -06");
  tag(s, "What");
  const b = table(s, "Diff", 1.45, [2.6, 5.75, 3.8], ["Change", "Meaning", "In the PATCH body"], [
    ["Add, Change", "The tenant lacks the program's restriction, or holds a weaker one", "The program's"],
    ["KeepStricter", "The tenant already holds it, from an earlier date or a shorter lifetime", "The tenant's, unchanged"],
    ["KeepExisting", "A restriction the reviewed file doesn't name", "The tenant's, unchanged"],
  ], { fontSize: 12.5, limit: 3.5 });
  const t = table(s, "Pol", b + 0.25, [1.9, 1.2, 9.05], ["Rule", "Severity", "What it flags"], [
    ["NPI-POL-01", "Finding", "A default restriction the tenant doesn't hold yet"],
    ["NPI-POL-02, 05", "Warn, Info", "A policy not in the reviewed file (never changed or deleted); a restriction kept as the tenant has it"],
    ["NPI-POL-03, 04", "Finding", "An expired exception still assigned; an exception that can't be assigned"],
    ["NPI-POL-06", "Finding", "An app registration without the full app instance property lock"],
  ], { fontSize: 12, limit: 6.5 });
  sources(s, "Sources: the kit's design (examples/non-person-identity, NpiCredentialPolicy); Learn, Update tenantAppManagementPolicy; app instance property lock.");
  notes(s,
`The policy check reads the default policy, every app management policy, and each app registration, and compares the default with the reviewed file, restriction by restriction, on both objects. Add or Change means the tenant lacks the program's restriction or holds a weaker one, so the program's goes in. Keep Stricter means the tenant already holds something stronger, and Keep Existing means a restriction the file doesn't name. Both stay as the tenant has them. The body is merged, so the PATCH never drops a restriction and never loosens one. The findings, N P I P O L oh one to oh six, flag a restriction the tenant doesn't hold yet, a policy outside the reviewed file, an expired or unassignable exception, and an app registration without the full app instance property lock, which stops anyone adding a credential to its service principals.`,
  `${M} — Unit 2: workbook Chapter 04, "The policy: read, compare, plan"; Knowledge check answer 2.`);
}

// ================================================================== 7 Rotation
{
  const s = content(SC, "Rotation: from the owner's approval to removal");
  tag(s, "What");
  const w = 2.3, gap = 0.16;
  const steps = [
    ["1 REQUEST", "Raised 60 days before expiry"],
    ["2 APPROVE", "An owner who is an enabled member"],
    ["3 RENEW", "Key Vault makes the next version from its own policy"],
    ["4 ATTACH", "The new certificate beside the old one"],
    ["5 VERIFY, REMOVE", "The owner records it works; 7 days later, the old one goes"],
  ];
  let bottom = 0;
  steps.forEach(([lab, t], k) => {
    bottom = Math.max(bottom, panel(s, `R${k + 1}`, 0.6 + k * (w + gap), 1.45, w, 1.6, [HEX.navy, HEX.teal, HEX.navy, HEX.teal, HEX.amber][k],
      [HEX.navyTint, HEX.tealTint, HEX.navyTint, HEX.tealTint, HEX.amberTint][k], lab, null, [t], 12.5));
  });
  const t = table(s, "Rot", bottom + 0.25, [1.9, 1.2, 9.05], ["Rule", "Severity", "What it flags"], [
    ["NPI-ROT-01 to 03", "Finding", "Due with no owner's approval; no Key Vault binding; expired with no replacement"],
    ["NPI-ROT-04, 05", "Warn, Finding", "An approval refused; a lifetime longer than the app's cap"],
    ["NPI-ROT-06, 07", "Info", "A client secret: replace, don't rotate; a new certificate awaiting verification"],
  ], { fontSize: 12, limit: 6.5 });
  sources(s, "Sources: the program's design guidance (rotation); Learn, Tutorial: Configure certificate autorotation in Key Vault; Certificate creation methods; keyCredential.");
  notes(s,
`Rotation, in the program's design, is raised automatically before expiry and approved by the owner, so the app never depends on someone remembering. The code joins Key Vault and Entra I D in five steps. A request is raised sixty days before expiry. An owner who is an enabled member approves. Key Vault makes the next version from its own policy, as Microsoft Learn's Key Vault certificate creation documentation describes. The new certificate is added to the app beside the old one. And once the owner records that the workload signs in with it, and seven days have passed, the old one is removed. The findings, N P I R O T oh one to oh seven, flag a rotation due with no approval, a certificate with no vault binding, one expired with no replacement, a refused approval, a lifetime over the cap, and a client secret, which isn't rotated at all: it's reported for replacement.`,
  `${M} — Unit 2: workbook Chapter 04, "The rules the code holds," "Rotation: the plan"; Knowledge check answers 3 and 4.`);
}

// ================================================================== 8 Write path
{
  const s = content(SC, "The separate write path: the bodies it allows");
  tag(s, "What");
  const b = table(s, "Bodies", 1.45, [3.3, 8.85], ["Write", "What the write path allows"], [
    ["Default policy PATCH", "Only isEnabled true and the two restriction sets; re-checked just before the write, it never loosens or drops one"],
    ["Policy create, assignment", "A name and a description; an assignment naming a policy on this cloud's host"],
    ["Lock", "Exactly {\"isEnabled\": true, \"allProperties\": true}"],
    ["Attach, remove", "Keeps every planned keyId and adds exactly one certificate; a removal drops only the old one"],
    ["Key Vault create", "An empty body: the rotation never changes a certificate policy. DELETE and PUT are never sent"],
  ], { fontSize: 12, limit: 5.0 });
  callout(s, "Pre", b + 0.3, 0.95, "FaUserShield", HEX.teal, "Before each write ",
    "it re-reads the target and skips the write if a precheck no longer holds. A live run is a person, never an app.");
  sources(s, "Sources: the kit's design (examples/non-person-identity, Invoke-NpiCredentialAction.ps1); Learn, Update application; Update tenantAppManagementPolicy.");
  notes(s,
`This is the kit's design. One script can write in this chapter, and it refuses to run unless the plan's hash is the approved one, the plan is for this tenant, cloud and task and no more than seven days old, and each write is a declared call. Then it checks every body. The default policy PATCH may set only the enabled flag and the two restriction sets, and, checked again against the policy read just before the write, it never loosens or drops a live restriction. The lock body is exact. An attach keeps every certificate the app has and adds exactly one; a removal drops only the old one. The Key Vault create body is empty, so the rotation never changes a certificate policy. Delete and put are never sent. Before each write it re-reads the target, and skips the write if anything changed. And a live run is a person signed in, never an app.`,
  `${M} — Unit 2: workbook Chapter 04, "The separate write path."`);
}
endModule(SC);

// ================================================================== 9 Try it: permissions and policy
{
  const s = content(SL, "Try it: the permissions, and the policy diff");
  tag(s, "How");
  const c = code(s, "Lab", 0.6, 1.45, 12.15, [
    "# Steps 1 to 4 (step 1 makes Module 1's register; step 2: 19 passed, 32 not run)",
    "app-policy : Application.Read.All, Policy.Read.All",
    "policy-apply : Application.Read.All, Application.ReadWrite.All, Policy.Read.All, Policy.ReadWrite.ApplicationConfiguration",
    "rotation : Application.Read.All, User.Read.All, Key Vault Reader",
    "rotation-apply : Application.Read.All, Application.ReadWrite.All, Key Vault Certificates Officer, Key Vault Reader",
    "$ ./Invoke-NpiCredentialPolicy.ps1 -Cloud gcc -RegisterRun out/inventory -FixturePath tests/fixtures/ch04/tenant.json \\",
    "    -OutputPath out/policy",
    "Policy: tenant default disabled; 1 app management policies; 7 app registrations",
    "Diff: 6 Add, 1 Change, 1 KeepExisting",
    "Findings: 12 Finding, 1 Warn, 1 Info",
    "Policy plan: 10 actions, 8 of them writes (1 AssignAppPolicy, 1 CreateAppPolicy, 5 LockApp, 1 PatchDefaultPolicy);",
    "  nothing sent",
    "Plan SHA-256: 2d4c419a05b7792470e59a5969f94f1b6452cba079a47595336c4d451cbfa809",
    "# Step 5 (excerpt): applicationRestrictions customPasswordAddition KeepExisting (not in the reviewed file)",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (WRAPPED)", pt: 10.5 });
  line(s, "Diff", "Step 5: eight rows. Three restrictions are added on both objects, P180D for certificates, for apps created after 2026-11-15.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 1 to 5; examples/non-person-identity: Invoke-NpiCredentialPolicy.ps1, tests/fixtures/ch04 (fictional).");
  notes(s,
`Try it. Step one makes Module 1's register, and step two sends Microsoft's samples to the fakes: nineteen pass, and the thirty-two not run are the code's own tests. Step three lists what each of the four tasks needs. The two reading tasks hold only read permissions and Key Vault Reader. The two write tasks add Application dot ReadWrite dot All, the policy write permission, and Key Vault Certificates Officer. Step four compares the policy and builds its plan. The tenant's default is disabled. The diff is six adds, one change and one keep existing. The plan has ten actions, and eight write: patch the default, create and assign one exception, and lock five apps. Nothing is sent. Step five reads the diff: three restrictions added on both objects, for apps created after November fifteenth, and the tenant's own custom password restriction kept, in the PATCH body.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 1 to 5.`);
}

// ================================================================== 10 Try it: policy write path
{
  const s = content(SL, "Try it: dry-run, apply, and a hash nobody approved");
  tag(s, "How");
  const c = code(s, "Run", 0.6, 1.45, 12.15, [
    "# Step 6: $sha = (Get-FileHash out/policy/policy-plan.json -Algorithm SHA256).Hash.ToLower(), then:",
    "$ ./Invoke-NpiCredentialAction.ps1 -Cloud gcc -PlanPath out/policy/policy-plan.json -ApprovedSha256 $sha ... -OutputPath out/policy-dryrun",
    "DryRun: 8 WouldSend",
    "  WouldSend PatchDefaultPolicy   PATCH https://graph.microsoft.com/v1.0/policies/defaultAppManagementPolicy",
    "  WouldSend CreateAppPolicy      POST  https://graph.microsoft.com/v1.0/policies/appManagementPolicies",
    "  WouldSend AssignAppPolicy      POST  https://graph.microsoft.com/v1.0/applications/0a000000-.../appManagementPolicies/$ref",
    "  WouldSend LockApp              PATCH https://graph.microsoft.com/v1.0/applications/0a000000-0000-4000-8000-000000000001",
    "  ... four more LockApp PATCHes",
    "# the same with -Apply, then with -ApprovedSha256 ('0' * 64)",
    "Apply: 8 Sent",
    "The plan's SHA-256 is 2d4c419a..., not the approved 0000...; refusing to run a plan nobody reviewed.",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (TRIMMED: \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Note", "Without -Apply, the write path stops after the prechecks and reports WouldSend; -Apply in Lab 1 changes only the fake.", c + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" step 6; workbook Chapter 04, \"Illustrative code\"; examples/non-person-identity/Invoke-NpiCredentialAction.ps1.");
  notes(s,
`Step six runs the policy plan three times. First, with the plan's own hash and no Apply switch, it's a dry run: the write path runs its prechecks and reports eight writes it would send. One PATCH of the default policy, a policy create and its assignment, and five lock PATCHes, one per app. Then the same command with Apply sends all eight to the fake. In Lab 1, Apply changes only the fake, in memory. Then you run the plan with a hash of all zeros, which nobody approved, and it refuses to run a plan nobody reviewed. Pasted line by line, as the lab means, the shell carries on after that refusal. That's the pattern for every write in this path: a plan, a reviewed hash, a dry run, then Apply.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," step 6; verification log, "Found during the re-run."`);
}

// ================================================================== 11 Try it: rotation
{
  const s = content(SL, "Try it: build, read and run the rotation plan");
  tag(s, "How");
  const c = code(s, "Rot", 0.6, 1.45, 12.15, [
    "# Step 7: ./Invoke-NpiRotation.ps1 -Cloud gcc -RegisterRun out/inventory -InputPath tests/fixtures/ch04/inputs ...",
    "Rotation: 7 app registrations read; 7 steps",
    "Findings: 2 Finding, 0 Warn, 3 Info; 0 requests for owners",
    "Rotation plan: 3 writes (1 AttachNewCertificate, 1 RemoveOldCertificate, 1 RenewInKeyVault); nothing sent",
    "# Step 8: (Get-Content out/rotation/rotation-plan.json -Raw | ConvertFrom-Json).actions | Format-Table Action, Name, Write",
    "AttachNewCertificate Deploy Bot       True     ReplaceSecret        Mail Automation False",
    "RemoveOldCertificate HR Connector     True     ReplaceSecret        Payroll Export  False",
    "ReplaceSecret        Legacy Reports  False     RenewInKeyVault      Vendor Portal    True",
    "NoKeyVaultBinding    Legacy Reports  False",
    "# Step 9: dry-run, then -Apply",
    "DryRun: 3 WouldSend ... RenewInKeyVault POST https://kv-npi-contoso.vault.azure.net/certificates/vendor-portal/create...",
    "Apply: 3 Sent",
  ], { label: "TRY IT  ·  LAB 1 OUTPUT, RUN NOVEMBER 3, 2026 (STEP 8 IN TWO COLUMNS; \"...\" MARKS CUTS)", pt: 10.5 });
  line(s, "Tests", "Step 10: Invoke-Pester -Path tests prints 513 passed, 0 failed. Then Remove-Item -Recurse -Force out.", c + 0.25, 0.45, 13.5);
  sources(s, "Sources: Module 4, \"Exercise: Lab 1,\" steps 7 to 10; examples/non-person-identity: Invoke-NpiRotation.ps1, tests/fixtures/ch04 (fictional).");
  notes(s,
`Step seven builds the rotation plan. It reads seven app registrations and writes seven steps: two findings, three information items, and three writes. Nothing is sent. Step eight reads the plan. Vendor Portal's certificate is due within sixty days and an owner approved, so it's renewed in Key Vault. HR Connector's new certificate was verified, and the seven-day overlap has passed, so the old one is removed. Deploy Bot gets its new certificate attached. Three apps still hold secrets: Legacy Reports, Mail Automation and Payroll Export. Those are replaced, not rotated. Step nine dry-runs the plan, three writes it would send, then applies it to the fake. For Vendor Portal, Key Vault created the next version, and the next plan attaches it, after a new review. Step ten runs every test: five hundred thirteen pass.`,
  `${M} — Unit "Exercise: Lab 1, fixtures, no tenant," steps 7 to 10.`);
}

// ================================================================== 12 Lab 2
{
  const s = content(SL, "Lab 2: the policy and one rotation in a test tenant");
  tag(s, "How");
  const b = table(s, "Lab2", 1.45, [2.3, 9.85], ["Step", "What you do"], [
    ["You need", "A worldwide or GCC test tenant and a test key vault using Azure RBAC, never production, with fictional people; Module 1's Lab 2 run"],
    ["The policy", "Apply it from a test copy of the reviewed file; check the tenant refuses a new client secret and a 12-month certificate"],
    ["One rotation", "Raise, approve, renew, attach, verify and remove it for one test app"],
    ["Signed in as", "A person with Cloud Application Administrator and Key Vault Certificates Officer on the test vault"],
    ["Back it out", "Step 8: a person's PATCH of the default policy back to default-policy-before.json; delete the test policy, apps, certificate and out folders"],
  ], { fontSize: 12.5, limit: 5.2 });
  callout(s, "NotRun", b + 0.3, 0.85, "FaTriangleExclamation", HEX.amber, "Not run by the authors: ",
    "follow the workbook's Chapter 04, Lab 2. The code never loosens a policy, so the back-out is a person's PATCH.");
  sources(s, "Sources: Module 4, \"Exercise: Lab 2, your test tenant\"; learning path index, \"What you need for the labs.\"");
  notes(s,
`Lab 2 runs both plans in your own test tenant, worldwide or G C C, with a test key vault that uses Azure role-based access, never production, with fictional people, and with Module 1's Lab 2 already run. Apply the policy from a test copy of the reviewed file, then check that the tenant really refuses a new client secret and a twelve-month certificate. Those refusals are evidence. Then carry one test app through a whole rotation: raise it, approve it, renew, attach, verify, and remove. Sign in as a person with Cloud Application Administrator and Key Vault Certificates Officer on the test vault. To back it out, step eight is a person's PATCH of the default policy back to the copy saved before, because this code never loosens a policy. Then delete the test objects and the output. The authors haven't run Lab 2.`,
  `${M} — Unit "Exercise: Lab 2, your test tenant"; learning path index — "What you need for the labs."`);
}
endModule(SL);

// ================================================================== 13 Federal requirement
{
  const s = content(SS, "The federal requirement and evidence for Gate G3");
  tag(s, "Who");
  const b = table(s, "Req", 1.45, [3.9, 3.2, 5.05], ["Requirement", "KSI", "Evidence"], [
    ["CM-6; SCuBA MS.AAD.5.5v1, 5.6v1, 5.7v1", "KSI-SVC-ACM, KSI-MLA-EVC", "default-policy-before.json, policy-diff.json; the reviewed policy file"],
    ["IA-5 Authenticator Management", "KSI-IAM-SNU", "policy-findings.json, NPI-POL-01 to -06"],
    ["IA-5(2); SC-12; SC-17", "KSI-SVC-ASM, KSI-IAM-SNU", "rotation-plan.json; certificate-bindings.csv; NPI-ROT-01 to -07"],
    ["CM-3; CM-5", "KSI-CMT-LMC, KSI-CMT-RVP; KSI-IAM-JIT", "Each plan's approved SHA-256; each dry-run and apply folder"],
    ["AC-6 Least Privilege", "KSI-IAM-ELP, KSI-IAM-JIT", "Get-NpiCh04RequiredPermission for each task"],
  ], { fontSize: 11.5, limit: 5.3 });
  line(s, "KSI", "The SCuBA policies are SHOULD policies, mapped through CM-6. The KSI mapping is the program's (design guidance).", b + 0.25, 0.7, 13.5);
  sources(s, "Sources: Module 4, \"Introduction\" (the federal requirement); the guide, Validate (G3 Credential rules).");
  notes(s,
`The federal requirement. Gate 3 meets NIST special publication eight hundred fifty-three I A five, enhancement two, S C twelve and S C seventeen, and the policies M S dot A A D five point five to five point seven in CISA's Scuba Gear baseline. Those three are should policies, not required configurations. The module's table maps the evidence. For configuration settings and the Scuba policies, the default policy as it was before, the diff, and the reviewed file. For authenticator management, the policy findings. For the certificates themselves, the rotation plan, the Key Vault bindings and the rotation findings. For change control, each plan's approved hash and the dry-run and apply folders. And for least privilege, each task's permission list. K S I's are FedRAMP twenty X indicators for providers, and which file supports which is the program's mapping.`,
  `${M} — Unit "Introduction" (the federal requirement); the guide — Validate (G3 Credential rules).`);
}

// ================================================================== 14 Check
{
  const s = check(SS, "Check yourself: two questions on credentials", [
    { q: "The tenant already holds a restriction the reviewed file doesn't name. What does the plan do?", options: ["a. Drops it from the PATCH body", "b. Sets it to disabled", "c. Keeps it as the tenant has it (KeepExisting)"] },
    { q: "Key Vault renewed a certificate on its own. What's still missing?", options: ["a. Nothing: Entra ID picks it up", "b. Adding it to the app registration, with the owner's approval, and removing the old one after the overlap", "c. A new client secret"] },
  ], "1 c: the PATCH never drops or loosens a live restriction. 2 b: Entra ID renews nothing on the app registration.");
  sources(s, "Sources: Module 4, \"Knowledge check,\" questions 2 and 3, and \"Check your answers.\"");
  notes(s,
`Check yourself with two questions. First: the tenant already holds a restriction the reviewed file doesn't name. What does the plan do? The answer is c. It keeps it as the tenant has it, Keep Existing. The PATCH never drops or loosens a live restriction, and you saw that in step five, with the tenant's custom password restriction. Second: Key Vault renewed a certificate on its own. What's still missing? The answer is b. The new certificate has to be added to the app registration, with the owner's approval, and the old one removed after the overlap, because Entra I D renews nothing on the app registration. The module page has three more questions, each linked to the section that answers it.`,
  `${M} — Unit "Knowledge check," questions 2 and 3; "Check your answers."`);
}

// ================================================================== 15 Summary
{
  const s = content(SS, "Summary, and next: Module 5, cut the privilege");
  tag(s, "How");
  const l = panel(s, "Did", 0.6, 1.45, 7.0, null, HEX.navy, HEX.navyTint, "IN THIS MODULE YOU", null, [
    "Compared a fictional tenant's default policy with the reviewed file",
    "Applied a plan that adds the program's restrictions and locks five apps",
    "Carried three certificates through renewal, attach and removal on the fakes",
  ], 13.5);
  const r = panel(s, "Next", 7.85, 1.45, 4.9, null, HEX.teal, HEX.tealTint, "NEXT", "Module 5: Cut the privilege of service principals", [
    "Broad permissions and roles",
  ], 13.5);
  callout(s, "Keep", Math.max(l, r) + 0.3, 0.95, "FaFileShield", HEX.teal, "The evidence an ISSO keeps: ",
    "the policy before, the diff, both plans and their hashes, the findings, the run folders, Lab 2's refusals and ScubaGear.");
  sources(s, "Sources: Module 4, \"Summary\"; Module 5.");
  notes(s,
`To sum up. You compared a fictional tenant's default policy with the reviewed file, applied a plan that adds the program's restrictions and locks five apps, and carried three certificates through renewal, attach and removal, on the fakes. The evidence an ISSO keeps for Gate 3 from this module is the default policy as it was before, the diff, both plans with their approved hashes, the findings, and the dry-run and apply folders with their manifests, all dated. From Lab 2, add the tenant's refusals and the Scuba Gear result for the three policies. Before you ship, work through the chapter's checklist. Next is Module 5: cut the privilege of service principals, starting with the broad permissions and roles they hold.`,
  `${M} — Unit "Summary"; Module 5.`);
}
endModule(SS);

// ================================================================== Backup
backup();
sourceSlide("Sources: Module 4 deck", [
  "Module page: docs/training/non-person-identity/04-credential-rules.md (Non-Person Identity learning path, Module 4): Introduction and its requirement table, objectives, prerequisites, Units 1 and 2, Lab 1, Lab 2, knowledge check and summary. The learning path index: what you need for the labs.",
  "What the module links for the design and rules: Non-Person Identity: An Implementation Guide, Step 3 (steps 1 to 8, Validate G3); workbook Chapter 04, \"The rules the code holds,\" \"The policy: read, compare, plan,\" \"Rotation: the plan,\" \"The separate write path.\"",
  "Kit: examples/non-person-identity (Invoke-NpiCredentialPolicy.ps1, Invoke-NpiRotation.ps1, Invoke-NpiCredentialAction.ps1; powershell/NpiCredentialPolicy; config/app-management-policy.json; tests/fixtures/ch04). Fictional tenant and key vault. Illustrative: tested against fixtures, not run against a live tenant.",
  "Lab output: run November 3, 2026 with PowerShell 7 and Pester 5 in a scratch copy of examples/non-person-identity, with examples/third_party and examples/drift-pipeline beside it; long commands are wrapped and output trimmed where the slides say so. Verification: docs/training/non-person-identity/_verification/learning-path.md. Lab 2 not run by the authors.",
]);

finish(OUT);
