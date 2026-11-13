// Building Provider Notices, Chapter 07 — The Weekly Digest and Evidence: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/provider-notices/07-the-weekly-digest-and-evidence.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js. The chapter is a draft, and the tour says so.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-pn-07-weekly-digest-evidence/build.js
require("../_build/devwb.js")({
  workbook: "pn", chapter: 7, dir: __dirname,
  base: "DW_PN_07_Weekly_Digest_Evidence",
  title: "The Weekly Digest and Evidence",
  map: "Why both come from the runs · what the guide asks · the digest · the record and the chain · the stage check · who · two labs · evidence · dangers",
  slides: [
    {
      say: `Welcome to the Federal Modernization Workbook's developer workbook, Building Provider Notices. This is Chapter 7: the weekly digest, and evidence. The digest is for the people who act; the evidence is for the people who check. Both come from the same runs, so neither can drift from what was actually read. We'll start from what the implementation guide asks the security officer to keep, then read the digest's five sections, the evidence record, the chain and the stage check, and walk two labs, the evidence and the dangers. Two notes before we begin. This chapter is a draft, awaiting the owner's review. And the code is illustrative, tested against fixtures.`,
      detail: `The digest and the evidence chain behind the guide's G7 Digest and evidence. You start with what the guide's evidence table asks the ISSO to keep. Then you read the digest's five sections, the evidence record, the chain and the stage check that the runbook's go/no-go uses. Lab 1 builds a week of runs from the fixtures, writes the digest, records three runs, checks the chain, shows the stage check naming the steps still missing, and changes a recorded file to watch the check fail. Lab 2 runs the same against a test environment's run folders. Status: the chapter is a draft (status: draft), awaiting the owner's review.`,
      cite: [],
      ref: "Opening; “In this chapter”",
    },
    {
      part: "Why", title: "Why the digest and the evidence share the runs",
      body: [
        { lead: "The digest is for the people who act; the evidence is for the people who check. Both come from the same runs, so neither can drift from what was read." },
        { cols: [[{ bullets: [
          "Write the weekly digest from a collection and the routing state",
          "Record every run as evidence the ISSO can verify with a hash",
          "Say which of a stage's steps have a passing record",
        ], label: "By the end of the chapter you can", color: "navy", pt: 14.5 }], [{ bullets: [
          "Developers who maintain the kit",
          "The ISSO who owns G7",
          "The owners who read the digest",
          "Run Chapter 06's Lab 1 first",
        ], label: "Who it's for", color: "teal", pt: 14.5 }]] },
      ],
      sources: "Sources: Chapter 07, opening, “In this chapter,” “Goal and audience.”",
      say: `Why put the digest and the evidence in one chapter? Because they serve two different audiences from the same runs. The digest is for the people who act on notices. The evidence is for the people who check that the work happened. If both come from the same run folders, neither can drift from what the kit actually read. By the end of this chapter you can write the weekly digest from a collection and the routing state, record every run as evidence the security officer can verify with a hash, and say which of a stage's steps have a passing record.`,
      detail: `Goal: by the end of this chapter you can write the weekly digest from a collection and the routing state, record every run as evidence the ISSO can verify with a hash, and say which of a stage's steps have a passing record. Audience: developers who maintain the kit, the ISSO who owns G7, and the owners who read the digest. You should have run Chapter 06's Lab 1.`,
      cite: [],
      ref: "Opening; “Goal and audience”",
    },
    {
      part: "Why", title: "What the guide asks the ISSO to keep",
      body: [
        { table: { head: ["Kept", "What it is"], w: [3.4, 8.75], rows: [
          ["From each provider", "The raw output, the notices and the manifest: Azure, Microsoft 365, Oracle Cloud Infrastructure, AWS, Google Cloud"],
          ["From routing", "The task payloads, the routing table and the state"],
          ["From the week and the runbook", "The digests, preflight results and evidence records, with records.csv and SHA256SUMS"],
        ] }, pt: 13 },
        { cols: [[{ bullets: [
          "Mapped to SA-9, SI-5, CM-3, CM-4, CP-2, RA-3, CA-7, AU-9 and SR-8",
          "And to the KSIs FedRAMP lists for them",
        ], label: "Requirements", color: "navy", pt: 14 }], [{ bullets: [
          "The kit's records **support** those controls",
          "The assessor decides them",
        ], label: "Claim language", color: "amber", pt: 14 }]] },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5 OSCAL catalog 5.2.0; FedRAMP, Key Security Indicators. Chapter 07, “What the guide asks for.”",
      say: `Start from what the implementation guide's evidence section asks for, gate by gate. From each provider, Azure, Microsoft 365, Oracle Cloud Infrastructure, AWS and Google Cloud, the raw output, the notices and the manifest. From routing, the payloads, the routing table and the state. And the digests, preflight results and evidence records, with an index and a file of hashes. The guide maps them to NIST controls for external services, advisories, change control, contingency planning, risk assessment, monitoring and audit protection, and to the indicators FedRAMP lists for them. The kit's records support those controls; the assessor decides them.`,
      detail: `The guide's Evidence section lists, gate by gate, what the ISSO keeps: each provider's raw output, the notices and the manifest; the task payloads, routing table and state; the digests, preflight results and evidence records with records.csv and SHA256SUMS. It maps them to SA-9, SI-5, CM-3, CM-4, CP-2, RA-3, CA-7, AU-9 and SR-8, and to the KSIs FedRAMP lists for them. It says the kit's records support those controls, and the assessor decides them. Book 15's Chapter 14 (Compliance Automation and Day-2 Operations) says who reads the digest and what they do with it.`,
      cite: ["pn07-oscal", "pn07-ksi"],
      ref: "“Start with the guide's evidence table” — “What the guide asks for”",
    },
    {
      part: "What", title: "What the guide leaves to you, and the verdict",
      body: [
        { table: { head: ["The guide names", "Why naming isn't enough", "What the kit adds"], w: [3.2, 3.6, 5.35], rows: [
          ["“The digest goes to the owners”", "Owners read a page, not a JSON file", "digest.md in five sections; digest.csv with each notice's route and owner"],
          ["“Every run is in the evidence”", "A folder can be changed after the fact", "Each run checked against its manifest, copied under runs/, recorded with every file's SHA-256"],
          ["Controls and KSIs per gate", "Someone has to say which run supports which", "Each record names its steps and their controls and KSIs, from config/requirements.json"],
          ["Records kept over time", "A record removed from the middle goes unnoticed", "Each record holds the SHA-256 of the record before it"],
          ["A go/no-go", "Which steps still lack evidence?", "-Check -Stage lists every step the stage needs, pass or fail"],
        ] }, pt: 11.5 },
        { lead: "Verdict: keep the guide's table as the list; build the digest and the chain, because a list of files isn't evidence until someone can check it." },
      ],
      sources: "Sources: examples/provider-notices tests/DigestEvidence.Tests.ps1. Chapter 07, “What it leaves to you,” “The verdict.”",
      say: `Naming the evidence isn't the same as having it. Owners read a page, not a JSON file, so the kit writes the digest as a readable page and a spreadsheet. A folder of files can be changed after the fact, so each run is checked against its manifest, copied, and recorded with every file's hash. Someone has to say which run supports which control, so each record names its steps. A record removed from the middle would go unnoticed, so each record holds the hash of the one before it. And a go/no-go needs to know which steps still lack evidence.`,
      detail: `Each row is pinned by a test in tests/DigestEvidence.Tests.ps1. "The digest goes to the owners": owners read a page, not a JSON file; digest.md in five sections, and digest.csv with each notice's route and owner. "Every run is in the evidence": a folder of files can be changed after the fact; each run folder checked against its manifest, copied under runs/, and recorded with every file's SHA-256. A list of controls and KSIs per gate: someone has to say which run supports which; each record names its steps and their controls and KSIs, from config/requirements.json. Records kept over time: a record removed from the middle goes unnoticed; each record holds the SHA-256 of the record before it. A go/no-go: which steps still lack evidence? -Check -Stage lists every step the stage needs, pass or fail. The verdict: keep the guide's table as the list. Build the digest and the chain, because a list of files isn't evidence until someone can check it.`,
      cite: [],
      ref: "“What it leaves to you”; “The verdict”",
    },
    {
      part: "What", title: "The digest: five sections for the owners",
      body: [
        { lead: "Invoke-PnDigest.ps1 (New-PnDigest) reads a collection and the routing state, and writes digest.md, digest.csv and a manifest." },
        { steps: [
          { title: "Open notices by provider", text: "Counted by kind and action required" },
          { title: "Action required", text: "Soonest due first, with the assignment group the routing named (or digest when no task)" },
          { title: "Maintenance and changes starting in the next 30 days", text: "With their windows and regions" },
          { title: "New in the last 7 days", text: "By first-seen time in the state" },
          { title: "Closed or no longer listed in the last 7 days", text: "Including notices the provider stopped listing" },
        ], pt: 13.5 },
        { callout: "the window lengths are parameters (-Days, -UpcomingDays) and come from the settings' digest block in the scheduled run.", label: "Windows: ", icon: "FaTableList", color: "teal" },
      ],
      sources: "Sources: examples/provider-notices (Invoke-PnDigest.ps1, New-PnDigest). Chapter 07, “The code,” “The digest.”",
      say: `The digest reads a collection and the routing state, and writes a page, a spreadsheet and a manifest. The page has five sections. Open notices by provider, counted by kind and by whether action is required. Action required, soonest due first, each with the assignment group the routing named. Maintenance and changes starting in the next thirty days. What's new in the last seven days, by when the kit first saw it. And what closed, or stopped being listed, in the last seven days. The two windows are parameters, set in the scheduled run's settings.`,
      detail: `Invoke-PnDigest.ps1 (New-PnDigest) reads a collection and the routing state and writes digest.md, digest.csv and a manifest: 1 Open notices by provider, counted by kind and action required. 2 Action required, soonest due first, with the assignment group the routing named (or digest when no task). 3 Maintenance and changes starting in the next 30 days. 4 New in the last 7 days, by first-seen time in the state. 5 Closed or no longer listed in the last 7 days, including notices the provider stopped listing. The window lengths are parameters (-Days, -UpcomingDays) and come from the settings' digest block in the scheduled run. Book 15's Chapter 14 says who reads the digest and what they do with it.`,
      cite: [],
      ref: "“The code” — “The digest”",
    },
    {
      part: "What", title: "The evidence record: one run, every file hashed",
      body: [
        { lead: "Invoke-PnEvidence.ps1 (Write-PnEvidence) records one run folder." },
        { steps: [
          { title: "Re-hash", text: "Every file the run's manifest lists" },
          { title: "Copy", text: "The folder to runs/<NNNN>-<task>" },
          { title: "Write records/<NNNN>-<task>.json", text: "Time, environment, mode, change record, the command, the result (Pass only if every file matches its manifest), the steps with their controls and KSIs, the claim language, every file's SHA-256, and the previous record's SHA-256" },
          { title: "Index and sums", text: "Append records.csv; rewrite SHA256SUMS, one “sha256  path” line per file, which sha256sum -c can check" },
        ], pt: 13.5 },
      ],
      sources: "Sources: examples/provider-notices (Invoke-PnEvidence.ps1, Write-PnEvidence). Chapter 07, “The evidence record.”",
      say: `Now the evidence record. Recording a run folder does four things. It re-hashes every file the run's own manifest lists. It copies the folder into the evidence store. It writes a record with the time, the environment, the mode, the change record, the command, and the result, which is a pass only if every file matches its manifest. The record names the steps it covers, with their controls and indicators, the claim language, every file's hash, and the hash of the record before it. Then it appends the index and rewrites a sums file that a standard checksum tool can check.`,
      detail: `Invoke-PnEvidence.ps1 (Write-PnEvidence) records one run folder: it re-hashes every file its manifest lists, copies the folder to runs/<NNNN>-<task>, and writes records/<NNNN>-<task>.json with the time, environment, mode, change record, the command, the result (Pass only if every file matches its manifest), the steps it covers with their controls and KSIs, the claim language, every file's SHA-256 and the previous record's SHA-256. It appends records.csv and rewrites SHA256SUMS, one sha256  path line per file, which sha256sum -c can check. Each record carries the claim sentence: KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them.`,
      cite: [],
      ref: "“The evidence record”",
    },
    {
      part: "What", title: "Which run covers which step, and the chain",
      body: [
        { table: { head: ["Run", "Steps it covers"], w: [6.4, 5.75], rows: [
          ["A collection", "COL-<PROVIDER> for each provider read, NORMALIZE"],
          ["A routing run", "ROUTE, and CONTINGENCY if a payload asks for a plan review"],
          ["A digest", "DIGEST"],
          ["The runbook's pre-flight, scheduled run, alert plan, rollback", "PRE, RUN, ALERTS, RB"],
          ["Every record", "EVIDENCE"],
        ] }, pt: 13 },
        { cols: [[{ callout: "every file the sums list names still matches.", label: "SHA256SUMS: ", icon: "FaHashtag", color: "navy" }], [{ callout: "each record holds the previous record's hash, so a record removed from the middle breaks it.", label: "The chain: ", icon: "FaFingerprint", color: "teal" }]] },
      ],
      sources: "Sources: examples/provider-notices (config/requirements.json, Invoke-PnEvidence.ps1). Chapter 07, “The evidence record”; “What it leaves to you.”",
      say: `Each kind of run covers named steps. A collection covers one collect step for each provider it read, plus normalizing. A routing run covers routing, and the contingency step if a payload asked for a plan review. A digest covers the digest step. The runbook in Chapter 8 adds pre-flight, the scheduled run, the alert plan and rollback. And every record covers the evidence step itself. Two things make the folder checkable: the sums file, which says every file still matches, and the chain, where each record holds the previous record's hash, so a removed record breaks it.`,
      detail: `Steps per run: a collection, COL-<PROVIDER> for each provider read, NORMALIZE; a routing run, ROUTE, and CONTINGENCY if a payload asks for a plan review; a digest, DIGEST; the runbook's pre-flight, scheduled run, alert plan, rollback, PRE, RUN, ALERTS, RB; every record, EVIDENCE. Each record names its steps and their controls and KSIs, from config/requirements.json. SHA256SUMS: one sha256  path line per file, which sha256sum -c can check. The chain: each record holds the SHA-256 of the record before it, so a record removed from the middle is caught.`,
      cite: [],
      ref: "“The evidence record”; “What it leaves to you”",
    },
    {
      part: "What", title: "The check, and the stage check for a go/no-go",
      body: [
        { table: { head: ["Command", "What it checks"], w: [4.8, 7.35], rows: [
          ["-Check", "SHA256SUMS against every file, and walks the chain"],
          ["-Check -Stage test", "Adds a row for each step the stage needs: PRE, RUN, ROUTE and DIGEST"],
          ["-Check -Stage production", "The same, plus ALERTS"],
          ["Any failing row", "Exits 1"],
        ] }, pt: 13.5 },
        { bullets: [
          "tests/DigestEvidence.Tests.ps1: the digest's sections and counts; the record's fields and claim language; the chain; a changed file; a removed record; a failed run; a stage's missing steps; the requirements catalog itself",
        ], label: "The tests", color: "navy", pt: 13.5 },
      ],
      sources: "Sources: examples/provider-notices (Invoke-PnEvidence.ps1 -Check, tests/DigestEvidence.Tests.ps1). Chapter 07, “The evidence record,” “The tests.”",
      say: `Then there's the check. On its own, it verifies the sums file against every file and walks the chain. With a stage, it adds a row for each step that stage needs. A test stage needs pre-flight, the scheduled run, routing and the digest; production adds the alert plan. Any failing row exits with an error, which is exactly what the runbook's go or no-go reads. The tests cover the digest's sections and counts, the record's fields and claim language, the chain, a changed file, a removed record, a failed run, a stage's missing steps, and the requirements catalog itself.`,
      detail: `-Check verifies SHA256SUMS against every file and walks the chain; -Check -Stage test (or production) adds a row for each step the stage needs: test needs PRE, RUN, ROUTE and DIGEST, and production adds ALERTS. Any failing row exits 1. The tests: tests/DigestEvidence.Tests.ps1: the digest's sections and counts, the record's fields and claim language, the chain, a changed file, a removed record, a failed run, a stage's missing steps, and the requirements catalog itself.`,
      cite: [],
      ref: "“The evidence record”; “The tests”",
    },
    {
      part: "Who", title: "Who reads the digest, who keeps the evidence",
      body: [
        { cards: [
          { title: "Owners", text: "Read the digest each week and act on their rows; get it as a page, not a file of JSON", color: "navy" },
          { title: "ISSO", text: "Owns G7; files each week's digest, keeps the records and runs the go/no-go check", color: "teal" },
          { title: "Developers", text: "Maintain the digest, the record and the chain, with their tests", color: "amber" },
        ], pt: 13.5 },
        { callout: "the evidence chain protects files from undetected change; it doesn't decide a control. Keep the evidence folder on agency storage, with the access the ISSO sets.", label: "Illustrative code: ", icon: "FaFileShield", color: "red" },
      ],
      sources: "Sources: Chapter 07, “Goal and audience,” the “Illustrative code” callout, “Federal requirements and evidence.”",
      say: `Who's involved? The owners read the digest each week and act on their rows. The security officer owns this gate: files each week's digest, keeps the records, and runs the go or no-go check. Developers maintain the digest, the record and the chain. One caution matters here more than anywhere. The evidence chain protects files from undetected change. It doesn't decide a control. Keep the evidence folder on agency storage, with the access the security officer sets.`,
      detail: `Audience: developers who maintain the kit, the ISSO who owns G7, and the owners who read the digest. Evidence owners: the owners, with the ISSO filing each week's digest; the ISSO for records, the unchanged folder and the stage check at the go/no-go. Illustrative code: Lab 1 records fictional runs. The evidence chain protects files from undetected change; it doesn't decide a control. Keep the evidence folder on agency storage with the access the ISSO sets.`,
      cite: [],
      ref: "“Goal and audience”; the “Illustrative code” callout",
    },
    {
      part: "How", title: "Lab 1: a week of runs, then the digest",
      body: [
        { terminal: "07-1", lines: "1,12-15,31,42-45" },
        { terminal: "07-2" },
      ],
      sources: "Sources: examples/provider-notices (fictional fixtures). Chapter 07, “Lab 1: fixtures, no tenant,” steps 1–2.",
      say: `Lab 1 needs PowerShell 7 with Pester, in the kit's folder. Step 1 makes a week of runs: Chapter 6's two collections and two routings, in one go. Day one routes twelve creates; the second week makes one create, four updates and one close. Step 2 writes the digest for the second week. Sixteen open notices, eight needing action, five starting in the next thirty days, two new, and four closed or no longer listed. It writes the page, the spreadsheet and a manifest.`,
      detail: `You need PowerShell 7.1 or later with Pester 5. Work in examples/provider-notices. Step 1, make a week of runs: Chapter 06's two collections and routings, in one go (Invoke-PnCollect.ps1 on day1 and day2, Invoke-PnRoute.ps1 on each with out/state.json). The slide shows the commands and the routing summaries; the collection tables and payload lists are left out. Step 2, write the digest for the second week: ./Invoke-PnDigest.ps1 -NoticesPath out/day2/notices.json -StatePath out/state.json -OutputPath out/digest -AsOf 2026-11-16T12:00:00Z. Digest: 16 open, 8 need action, 5 starting in the next 30 days, 2 new, 4 closed or no longer listed. Written to out/digest: digest.md, digest.csv, manifest.json.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–2",
    },
    {
      part: "How", title: "Lab 1: read the digest's action-required table",
      body: [
        { terminal: "07-3", lines: "8-14,18-19,21,23-27" },
      ],
      sources: "Sources: examples/provider-notices (fictional fixtures). Chapter 07, “Lab 1: fixtures, no tenant,” step 3.",
      say: `Step 3 reads the digest as the owners will. The first table counts open notices by provider and kind: Azure, Microsoft 365, Oracle Cloud Infrastructure, AWS, and Google Cloud, which has nothing open this week. Then the action-required table, soonest due first, each with the team the routing named. An Oracle Cloud certificate bundle to replace by December 15, a Microsoft 365 retirement of basic authentication for SMTP client submission, the Azure retirement from Chapter 1. And at the bottom, the two with no date, shown as not stated.`,
      detail: `Step 3, read it as the owners will: Get-Content out/digest/digest.md. Look at the action-required table: soonest first, each with its owner, and the two with no date at the bottom as not stated. Open notices by provider: Azure 5 open, 2 action required; Microsoft 365 5, 3; Oracle Cloud Infrastructure 3, 1; AWS 3, 2; Google Cloud 0. Action required (the slide shows the two tables without their headings, and leaves out the two AWS rows, whose notice IDs are very long): 2026-12-01 AWS EC2 instance retirement; 2026-12-15 Oracle Cloud Infrastructure change, replace the certificate bundle on load balancers; 2027-01-15 AWS Lambda planned lifecycle event; 2027-01-31 Microsoft 365 retirement of Basic authentication for SMTP AUTH client submission; 2027-02-28 Microsoft 365 change, register apps for the new mail sender policy; 2027-09-30 Azure retirement of Basic SKU public IP addresses; not stated: the Azure security advisory and an updated Microsoft 365 change. All fictional.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” step 3",
    },
    {
      part: "How", title: "Lab 1: upcoming, new, and closed this week",
      body: [
        { terminal: "07-3", lines: "29-36,39-49,51" },
      ],
      sources: "Sources: examples/provider-notices (fictional fixtures). Chapter 07, “Lab 1: fixtures, no tenant,” step 3.",
      say: `The rest of the digest looks ahead and back. Maintenance and changes starting in the next thirty days: an AWS database window, two Azure maintenance windows, and the rescheduled Oracle Cloud database maintenance in Ashburn. New in the last seven days: an Azure maintenance and a Microsoft 365 change. And closed or no longer listed: the AWS security notification and other notices the providers closed, plus the Azure incident that's simply no longer listed. The last line says the digest is neutral by design: what providers published and the routing the agency set. File it with the run's evidence.`,
      detail: `Maintenance and changes starting in the next 30 days: 2026-11-23 AWS RDS maintenance, us-east-1; 2026-11-24 Azure Virtual Machines in East US 2; 2026-11-28 Azure SQL Database in Central US; 2026-11-29 Oracle Cloud Infrastructure, rescheduled maintenance for Base Database Service in US East (Ashburn), us-ashburn-1; 2026-12-01 AWS EC2 instance retirement (left out of the slide). New in the last 7 days: Azure maintenance, Azure SQL Database in Central US (azure:NW1T-2UV); Microsoft 365 change, register your apps for the new mail sender policy (m365:MC900005). Closed or no longer listed in the last 7 days: AWS IAM security notification, Google Cloud Cloud SQL incident and a Microsoft 365 email delay incident, each closed by the provider; the Azure Virtual Machines incident, no longer listed by the provider. "Neutral by design: this digest holds what providers published and the routing the agency set. File it with the run's evidence."`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” step 3",
    },
    {
      part: "How", title: "Lab 1: record three runs as evidence",
      body: [
        { terminal: "07-4" },
      ],
      sources: "Sources: examples/provider-notices (fictional fixtures; config/requirements.json). Chapter 07, “Lab 1: fixtures, no tenant,” step 4.",
      say: `Step 4 records three runs as evidence: the second week's collection, its routing, and the digest. Each prints its record number, a pass, the steps it covers, and the controls and indicators those steps support. The collection covers all five providers and normalizing. The digest covers the digest step, and adds risk assessment. Notice the routing run: it adds the contingency step, and contingency planning among its controls, because one of its payloads asked for a contingency plan review.`,
      detail: `Step 4, record three runs as evidence: ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -RunPath out/day2 (then out/day2-route, then out/digest) -AsOf 2026-11-16T12:00:00Z. Record 1: Pass (COL-AZURE, COL-M365, COL-OCI, COL-AWS, COL-GOOGLE, NORMALIZE, EVIDENCE); controls AU-9, CA-7, SA-9, SI-5; KSIs KSI-MLA-EVC, KSI-MLA-OSM, KSI-SCR-MIT, KSI-SCR-MON. Record 2: Pass (ROUTE, CONTINGENCY, EVIDENCE); controls AU-9, CA-7, CM-3, CM-4, CP-2, SI-5; KSIs KSI-CMT-LMC, KSI-CMT-RVP, KSI-MLA-EVC, KSI-MLA-OSM, KSI-RPL-ARP, KSI-SCR-MON. Record 3: Pass (DIGEST, EVIDENCE); controls AU-9, CA-7, RA-3, SA-9, SI-5. Each prints its steps, controls and KSIs. The routing run adds CONTINGENCY and CP-2, because a payload asked for a plan review.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” step 4",
    },
    {
      part: "How", title: "Lab 1: check the chain and the test stage",
      body: [
        { cols: [[{ terminal: "07-5" }, { terminal: "07-7" }], [{ terminal: "07-6" }]], split: 0.5 },
        { callout: "a lab has no pre-flight or scheduled run, so those two steps fail and the command exits 1, which is what a go/no-go would see.", label: "Expected: ", icon: "FaListCheck", color: "amber" },
      ],
      sources: "Sources: examples/provider-notices (fictional fixtures). Chapter 07, “Lab 1: fixtures, no tenant,” steps 5–7.",
      say: `Step 5 checks the chain: twenty-five files match the sums, and three records, chain unbroken. Step 6 checks the test stage's coverage, and here a failure is the right answer. A lab has no pre-flight and no scheduled run, so those two steps fail, routing and the digest pass, and the command exits with an error. That's exactly what a go or no-go would see: the gap, by name. Step 7 reads the records' index: three records, collect, route and digest, each a pass, with the steps it covers.`,
      detail: `Step 5, check the chain: ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check. SUMS Pass, 25 files match SHA256SUMS; CHAIN Pass, 3 records, chain unbroken. Step 6, check the test stage's coverage: ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check -Stage test. A lab has no pre-flight or scheduled run, so those two steps fail and the command exits 1, which is what a go/no-go would see: STEP-PRE Fail, no passing record; STEP-RUN Fail; STEP-ROUTE Pass; STEP-DIGEST Pass; (exit code 1). Step 7, read the records' index: Import-Csv out/evidence/records.csv | Format-Table sequence, task, result, steps: 1 collect Pass; 2 route Pass; 3 digest Pass.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 5–7",
    },
    {
      part: "How", title: "Lab 1: change a recorded file; run every test",
      body: [
        { terminal: "07-8" },
        { cols: [[{ terminal: "07-9" }], [{ bullets: [
          "Both checks fail, and name the file",
          "Before step 8, an evidence folder whose SHA256SUMS you could hand to the ISSO",
          "Delete out when you're done",
        ], label: "Expected result", color: "navy", pt: 13.5 }]], split: 0.45 },
      ],
      sources: "Sources: examples/provider-notices (fictional fixtures; tests). Chapter 07, “Lab 1: fixtures, no tenant,” steps 8–9 and the expected result.",
      say: `Step 8 is the one to remember. Change a recorded file, by appending one line to the recorded digest, and check again. Both checks fail. The sums say the digest changed, and the chain says it no longer matches its record, naming the file. That's what protects the evidence from an edit after the fact. Step 9 runs the kit's whole test suite: a hundred and forty passed, none failed. Before step 8, you had an evidence folder whose sums file you could hand to the security officer. Delete the output folder when you're done.`,
      detail: `Step 8, change a recorded file and check again: Add-Content -Path out/evidence/runs/0003-digest/digest.md -Value 'edited after it was recorded'; ./Invoke-PnEvidence.ps1 -EvidencePath out/evidence -Check. Both checks fail, and name the file: SUMS Fail, runs/0003-digest/digest.md changed; CHAIN Fail, runs/0003-digest/digest.md doesn't match 0003-digest.json; (exit code 1). Step 9, run the kit's whole test suite: Invoke-Pester -Path tests -Output None -PassThru | Select-Object PassedCount, FailedCount. Expected result: PassedCount 140 and FailedCount 0, and an evidence folder whose SHA256SUMS you could hand to the ISSO, before step 8 changed it. Delete out when you're done: Remove-Item -Recurse -Force out.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 8–9; expected result",
    },
    {
      part: "How", title: "Lab 2: a test environment's runs",
      body: [
        { steps: [
          { title: "Route and digest the test collection", text: "A collection's output folder from an earlier chapter's Lab 2 (such as out/azure-test), the lab's routing and a new state file" },
          { title: "Record all three, with the change record", text: "Invoke-PnEvidence.ps1 -ChangeRecord <change-record> for the collection, the routing and the digest; then -Check" },
          { title: "Ask the owners", text: "Give the digest to the test environment's owners: did each action-required row reach the right person?" },
          { title: "Back it out", text: "The evidence of a test stage is kept with its change record; delete only the copies outside agency storage" },
        ], pt: 13.5 },
        { callout: "run folders from a test tenant, account, tenancy or project, never production, kept on agency storage.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: examples/provider-notices (Invoke-PnRoute.ps1, Invoke-PnDigest.ps1, Invoke-PnEvidence.ps1). Chapter 07, “Lab 2: a test environment's runs.”",
      say: `Lab 2 uses real run folders from any earlier chapter's second lab, in a test tenant, account, tenancy or project, never production, kept on agency storage. Route and digest the test collection with the lab's routing and a new state file. Record all three runs, this time with the test change record's number, and check the chain. Then give the digest to the test environment's owners, and ask whether each action-required row reached the right person. To back it out, keep the stage's evidence with its change record, and delete only the copies outside agency storage.`,
      detail: `Use the run folders from any earlier chapter's Lab 2 in a test tenant, account, tenancy or project, never production, kept on agency storage. Placeholders: <run-folder> (a collection's output folder from an earlier chapter's Lab 2, such as out/azure-test, kept until this lab is done), <evidence-folder>, <state-file> (a new routing state file, such as out/state-test.json) and <change-record>. 1 Route and digest the test collection: ./Invoke-PnRoute.ps1 -NoticesPath <run-folder>/notices.json -RoutingPath config/routing.json -StatePath <state-file> -OutputPath <run-folder>-route; ./Invoke-PnDigest.ps1 -NoticesPath <run-folder>/notices.json -StatePath <state-file> -OutputPath <run-folder>-digest. 2 Record all three with -ChangeRecord <change-record>, and ./Invoke-PnEvidence.ps1 -EvidencePath <evidence-folder> -Check. Give the digest to the test environment's owners and ask whether each action-required row reached the right person. 3 Back it out: the evidence of a test stage is kept with its change record; delete only the copies outside agency storage: Remove-Item -Recurse -Force <run-folder>-route, <run-folder>-digest.`,
      cite: [],
      ref: "“Lab 2: a test environment's runs”",
    },
    {
      part: "How", title: "Federal requirements and the evidence",
      body: [
        { table: { head: ["What the output proves", "Supports", "KSI", "Who keeps it"], w: [5.5, 2.3, 2.15, 2.2], rows: [
          ["The owners got the week's notices: what needs action, by when, who owns it (digest.md, digest.csv)", "SI-5 c; SA-9 c; RA-3 f", "SCR-MON, SCR-MIT", "Owners; ISSO files each digest"],
          ["Each run recorded with steps, controls, KSIs, every file's hash and the previous record's", "CA-7; AU-9", "MLA-EVC, MLA-OSM", "ISSO"],
          ["The folder is unchanged since recorded, and a change is caught (SHA256SUMS, -Check)", "AU-9", "MLA-OSM", "ISSO"],
          ["Each of the stage's steps has a passing record, or the gap is named (-Check -Stage)", "CA-7", "MLA-EVC", "ISSO, at the go/no-go"],
        ] }, pt: 12 },
        { lead: "AU-9 to KSI-MLA-OSM is the privileged access guide's mapping. Which output supports which indicator is the program's mapping (design guidance)." },
      ],
      sources: "Sources: NIST SP 800-53 Rev. 5 OSCAL catalog 5.2.0; FedRAMP, Key Security Indicators; kit config/requirements.json. Chapter 07, “Verified facts,” “Federal requirements.”",
      say: `Here's what this gate proves, against NIST's control catalog. The digest shows the owners got the week's notices, what needs action, by when and who owns it, which supports disseminating advisories, monitoring external services, and responding to risk. Each record, with its hashes and the chain, supports continuous monitoring and protecting audit information. A folder that's unchanged, and a change that's caught, is audit protection. And a stage check that names every gap supports continuous monitoring at the go or no-go. The indicators are FedRAMP's, mapped by the program. The records support these controls; the assessor decides them.`,
      detail: `The digest and the evidence are what the guide's G7 checks. The mappings are the kit's config/requirements.json. The owners got the week's notices, with what needs action, by when and who owns it (Lab 1, steps 2 and 3; Lab 2, step 1: digest.md, digest.csv): SI-5 c; SA-9 c; RA-3 f; KSI-SCR-MON, KSI-SCR-MIT; the owners, the ISSO files each week's digest. Each run is recorded with its steps, controls and KSIs, every file's hash and the previous record's hash (Lab 1, step 4; Lab 2, step 2: records/, records.csv): CA-7; AU-9; KSI-MLA-EVC, KSI-MLA-OSM; the ISSO. The folder is unchanged since it was recorded, and a change is caught (Lab 1, steps 5 and 8: SHA256SUMS, -Check): AU-9; KSI-MLA-OSM; the ISSO. The stage's steps each have a passing record, or the gap is named (Lab 1, step 6: -Check -Stage): CA-7; KSI-MLA-EVC; the ISSO, at the go/no-go. Verified facts: controls SA-9 c, SI-5 a/c/d, CM-3 b/f, CM-4, CP-2 e, SR-8, RA-3 f, CA-7 d–f, AU-9, statement parts as the kit's catalog paraphrases them; KSI-SCR-MON cites SA-9, SI-5, SR-8, RA-3; KSI-SCR-MIT cites SA-9 and RA-3; KSI-CMT-LMC and KSI-CMT-RVP cite CM-3; KSI-RPL-ARP cites CP-2; KSI-MLA-EVC cites CA-7 and RA-3; AU-9 to KSI-MLA-OSM is the privileged access guide's mapping. The catalog's text and the KSIs' related controls were read for the guide on November 9, 2026; this chapter adds none. KSIs are FedRAMP 20x indicators for cloud service providers; the agency lines its evidence up with them and doesn't report them. Each record carries that sentence as its claim. The kit's records support these controls; the agency's assessor decides them.`,
      cite: ["pn07-oscal", "pn07-ksi"],
      ref: "“Verified facts”; “Federal requirements and evidence”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.2, 3.9, 5.05], rows: [
          ["The weekly run stops silently", "No digest, no evidence, no tasks", "The chain shows the gap in dates; the go/no-go fails without a passing RUN record"],
          ["A recorded file edited later", "The evidence no longer shows what was read", "SHA256SUMS and each record's file hashes; -Check names the file"],
          ["A record removed from the middle", "A bad week disappears", "Each record holds the previous record's hash"],
          ["The digest sent outside the agency", "Which clouds and services matter, published", "Written for the agency's owners and kept on agency storage"],
          ["A pass read as a control decision", "Someone tells an auditor the control is done", "Each record's claim says it supports the controls and the assessor decides"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: examples/provider-notices (Invoke-PnEvidence.ps1). Chapter 07, “Dangers.”",
      say: `What breaks in production? The quietest failure is the weekly run stopping: no digest, no evidence, no tasks. The chain shows the gap in dates, and the go or no-go fails without a passing scheduled run. A recorded file edited later is caught by the sums and the record's hashes, and the check names the file. A record removed from the middle breaks the chain. A digest sent outside the agency publishes which clouds and services matter, so it stays on agency storage. And a pass is not a control decision: each record's claim says so.`,
      detail: `The weekly run stops silently: no digest, no evidence, no tasks; guard: the chain shows the gap in dates; the go/no-go fails without a passing RUN record. A recorded file edited later: the evidence no longer shows what was read; guard: SHA256SUMS and each record's file hashes; -Check names the file. A record removed from the middle: a bad week disappears; guard: each record holds the previous record's hash. The digest sent outside the agency: which clouds and services matter, published; guard: the digest is written for the agency's owners and kept on agency storage. A pass read as a control decision: someone tells an auditor the control is done; guard: each record's claim says it supports the controls and the assessor decides.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the chapter's checklist",
      body: [
        { cols: [[{ bullets: [
          "The digest reaches every owner the routing names, every week",
          "Every collection, routing run and digest is recorded, with the change record where there is one",
        ], label: "The digest and the records", color: "navy", pt: 14 }], [{ bullets: [
          "Invoke-PnEvidence.ps1 -Check passes on the evidence folder",
          "The stage check lists every step the go/no-go needs, each passing",
          "The evidence folder is on agency storage, with access the ISSO set",
        ], label: "The checks", color: "teal", pt: 14 }]] },
        { callout: "Chapter 08, Deploying to Test and Production, runs all of it, first in a test environment and then in production.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 07, “Checklist”; “Continue the book.”",
      say: `Here's what done looks like. The digest reaches every owner the routing names, every week. Every collection, routing run and digest is recorded, with the change record where there is one. The check passes on the evidence folder. The stage check lists every step the go or no-go needs, and each one passes. And the evidence folder lives on agency storage, with the access the security officer set. Next, Chapter 8 runs all of it, first in a test environment and then in production. Thanks for watching.`,
      detail: `Checklist: The digest reaches every owner the routing names, every week. Every collection, routing run and digest is recorded, with the change record where there is one. Invoke-PnEvidence.ps1 -Check passes on the evidence folder. The stage check lists every step the go/no-go needs, each passing. The evidence folder is on agency storage, with access the ISSO set. Next: Chapter 08 — Deploying to Test and Production.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
