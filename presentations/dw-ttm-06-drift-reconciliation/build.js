// Building Ticket-to-Machine, Chapter 06 — Drift Reconciliation: the narrated tour.
// Every fact comes from docs/project-plans/developer-workbooks/ticket-to-machine/06-drift-reconciliation.md;
// cite names are that chapter's footnotes. Layout and notes: ../_build/devwb.js.
// Build (Git Bash): source /c/tmp/deckenv.sh && DATECODE="…" node presentations/dw-ttm-06-drift-reconciliation/build.js
require("../_build/devwb.js")({
  workbook: "ttm", chapter: 6, dir: __dirname,
  base: "DW_TTM_06_Drift_Reconciliation",
  title: "Drift Reconciliation",
  map: "Why events aren't enough · the join and its classes · run over run · who · a two-day lab · dangers",
  slides: [
    {
      say: `Welcome back to Building Ticket-to-Machine. This is Chapter 6: drift reconciliation, the kit's Build 3. Events tell you what changed. A reconciliation tells you what is wrong now, including what changed while nobody was listening. The drift client joins the HR extract, Microsoft Graph and SailPoint on the employee ID and measures Book 3's drift classes. This chapter adds a comparison of two runs, so a scheduled run raises only what's new, and shows what has stopped being measured. Then a two-day lab on a laptop.`,
      detail: `In this chapter: the kit's Build 3, the loop's steps 1 and 2: a read-only join of the HR extract, Microsoft Graph and ISC on employeeId that measures Book 03's drift classes. Events (Chapter 04) catch changes as they happen; the reconciliation catches the state, including drift whose event was missed. This chapter adds drift_compare.py, which compares two runs by their stable finding IDs, so a scheduled run raises only what is new, and shows what has stopped being measured. Lab 1 runs a two-day story on a laptop; Lab 2 runs the client against a test tenant and sandbox. Goal: by the end of this chapter you can run the reconciliation over saved exports, read its findings, compare two runs, and explain why a resolved finding doesn't close anything by itself.`,
      cite: [],
      ref: "“In this chapter”; “Goal and audience”",
    },
    {
      part: "Why", title: "Why measure the state, not just the events",
      body: [
        { lead: "Events tell you what changed. A reconciliation tells you what is wrong now." },
        { cols: [[{ bullets: [
          "Chapter 04's workflows catch changes as they happen",
          "A missed event is drift nobody raised",
          "A single run measures one moment",
        ], label: "Events alone", color: "red", pt: 15 }], [{ bullets: [
          "The reconciliation catches the state, including drift whose event was missed",
          "Comparing runs raises only what's new and says what disappeared",
          "A run that skipped a class says so, rather than implying it's clean",
        ], label: "With a reconciliation", color: "teal", pt: 15 }]] },
        { callout: "run it over saved exports, read the findings, compare two runs, and explain why a resolved finding doesn't close anything by itself.", label: "The goal: ", icon: "FaListCheck", color: "amber" },
      ],
      sources: "Sources: Chapter 06, epigraph, “In this chapter,” “What exists,” “Goal and audience.”",
      say: `Why a reconciliation as well as events? Because events only tell you about changes you heard. A missed event is drift nobody ever raised. The reconciliation measures the state itself, so it catches what changed while nobody was listening. But one run is one moment. Push every finding every night and you lean on de-duplication, and nothing tells you what disappeared. So this chapter compares runs, raises only what's new, and refuses to call something resolved just because a run didn't measure it.`,
      detail: `The epigraph: events tell you what changed. A reconciliation tells you what is wrong now, including what changed while nobody was listening. What existed: the client measured one moment. A scheduled run that pushed every finding every night would lean on the Scripted REST resource's de-duplication to avoid duplicates, and nothing reported what had disappeared. Goal: run the reconciliation over saved exports, read its findings, compare two runs, and explain why a resolved finding doesn't close anything by itself.`,
      cite: [],
      ref: "“In this chapter”; “What exists”",
    },
    {
      part: "What", title: "identity_drift.py: inputs, classes, IDs",
      body: [
        { table: { head: ["Piece", "What it is"], w: [2.3, 9.85], rows: [
          ["Inputs", "An HR extract (CSV, employeeId and status required); Graph users with employeeId, accountEnabled, department and the manager's employeeId; ISC identities from Search (accounts nested) and uncorrelated accounts; optionally the Entra directory audit. Each can be a saved export"],
          ["Classes", "Missing identity, stale access, orphan account and attribute drift (department and manager), High or Medium as Book 03, Chapter 11 sets them; an unauthorized write only when the audit is read"],
          ["Not computed", "Credential and schema drift, always: they need the card system, Intune and the provisioning middleware's output"],
          ["Finding IDs", "A hash of class, system, employee ID, object ID and attribute: the same drift gets the same ID every run; the PowerShell client produces the same IDs"],
          ["Outputs", "JSON (findings; classes computed and not) and CSV. --push-to-servicenow posts to the Scripted REST resource, and still writes nothing without --apply"],
        ] }, pt: 12.5 },
      ],
      sources: "Sources: Book 03, Chapter 11 (drift classes). Chapter 06, “What exists.”",
      say: `Here's the drift client. Its inputs are an HR extract, Graph users, SailPoint identities and uncorrelated accounts, and optionally the Entra directory audit; each can be a saved file, which is how the labs run. It measures four of Book 3's classes, and an unauthorized write only when it reads the audit. Credential and schema drift are always reported as not computed, because they need other systems. Each finding's ID is a hash of what it's about, so the same drift has the same ID every run. And pushing to ServiceNow still needs the apply flag.`,
      detail: `clients/python/identity_drift.py. Inputs: an HR extract (CSV, employeeId and status required); Graph users with employeeId, accountEnabled, department and the manager's employeeId; ISC identities from Search (accounts nested) and uncorrelated accounts from the Accounts API; and, optionally, the Entra directory audit. Each can be a saved export, which is how the labs run. Classes: missing identity, stale access, orphan account and attribute drift (department and manager), High or Medium as Book 03, Chapter 11 sets them; an unauthorized write only when the audit is read. Credential and schema drift are always reported as not computed, because they need the card system, Intune and the provisioning middleware's output. Finding IDs: each finding's ID is a hash of its class, system, employee ID, object ID and attribute, so the same drift gets the same ID on every run. The PowerShell client produces the same IDs from the same fixtures. Outputs: JSON (the findings, and which classes were and weren't computed) and CSV. --push-to-servicenow posts the findings to the Scripted REST resource, and still writes nothing without --apply.`,
      cite: [],
      ref: "“What exists”",
    },
    {
      part: "What", title: "drift_compare.py: new, persisting, resolved",
      body: [
        { cards: [
          { title: "New", text: "In this run, not the last: raise it", color: "red" },
          { title: "Persisting", text: "In both: already raised; the de-duplication adds a counter", color: "navy" },
          { title: "Resolved", text: "In the last run, not this one: no longer measured. A lead for the re-read, never a closure", color: "teal" },
        ], pt: 14 },
        { callout: "it refuses to compare runs that computed different classes, one with the audit and one without, because every finding of the skipped class would look resolved.", label: "The refusal: ", icon: "FaScaleBalanced", color: "amber" },
        { lead: "A resolved finding is printed with a reminder: its record still closes only on Chapter 05's re-read." },
      ],
      sources: "Sources: Chapter 06, “What this chapter adds.”",
      say: `The new tool compares two runs by finding ID and sorts every finding into three groups. New ones should be raised. Persisting ones are already raised, and de-duplication just adds a counter. Resolved ones are no longer measured, which is a lead for the re-read, never a closure. And it refuses to compare runs that computed different classes. If one run read the audit and the next didn't, every unauthorized write would look resolved. A resolved finding always prints with a reminder that only Chapter 5's re-read closes its record.`,
      detail: `clients/python/drift_compare.py compares two runs by finding ID: new (raise it), persisting (already raised; the de-duplication adds a counter) and resolved (no longer measured). It refuses to compare runs that computed different classes, one with the audit and one without, because every finding of the class the second run skipped would look resolved. A resolved finding is printed with a reminder that its record still closes only on Chapter 05's re-read.`,
      cite: [],
      ref: "“What this chapter adds” — drift_compare.py",
    },
    {
      part: "What", title: "Day two of the fictional estate",
      body: [
        { table: { head: ["Erin (E1004), department", "Day one", "Day two"], w: [3.4, 4.35, 4.4], rows: [
          ["HR extract", "HR", "Finance: HR has corrected it"],
          ["Entra ID (Graph)", "Finance, typed in by hand", "Finance: now agrees with HR"],
          ["SailPoint ISC", "HR", "HR: not yet re-aggregated"],
        ] }, pt: 14 },
        { bullets: [
          "tests/fixtures/hr_extract_day2.csv: the second day, with HR's correction",
          "tests/fixtures/config.fixtures.json: the authoritative HR source and the provisioning service's app ID, with no secrets",
          "The client now creates the folder for --out-json and --out-csv if it doesn't exist",
        ], pt: 14 },
      ],
      sources: "Sources: examples/servicenow-sailpoint fixtures (fictional). Chapter 06, “What this chapter adds”; “Lab 1,” step 2.",
      say: `To exercise the comparison, the chapter adds a second day to the fictional estate. On day one, HR says Erin works in HR, but someone has already typed Finance into Entra ID by hand, and SailPoint still says HR. On day two, HR corrects her department to Finance. Now Graph agrees with HR, but SailPoint, not yet re-aggregated, doesn't. The chapter also adds a fixture settings file with no secrets, and the client now creates its output folder if it's missing.`,
      detail: `tests/fixtures/hr_extract_day2.csv, the second day of the fictional estate: HR has corrected Erin's department from HR to Finance, the value someone had already typed into Entra ID by hand. Graph now agrees with HR; ISC, not yet re-aggregated, doesn't. tests/fixtures/config.fixtures.json, the fixture settings for an offline run (the authoritative HR source and the provisioning service's app ID), with no secrets. Output folders: the client now creates the folder for --out-json and --out-csv if it doesn't exist. Lab 1, step 2: Erin's Entra ID department is Finance where HR says HR, and the audit shows a help desk administrator made that change.`,
      cite: [],
      ref: "“What this chapter adds”; “Lab 1,” step 2",
    },
    {
      part: "What", title: "The tests: four new, thirteen unchanged",
      body: [
        { bullets: [
          "test_drift_compare.py, **4 tests**: the day-two story, identical runs, the refusal and the command line",
          "The kit's original 13 drift tests pass unchanged, including the shared finding IDs with the PowerShell client",
        ], label: "What proves the comparison", color: "navy", pt: 15.5 },
        { callout: "the commands run over fictional exports. The manager expansion and the ISC employee ID attribute are on the verify list. Expect a burst of High findings in the first month of a real run: Book 03 calls that the measurement working.", label: "Illustrative code: ", icon: "FaLightbulb", color: "amber" },
      ],
      sources: "Sources: Chapter 06, “The tests”; the “Illustrative code” callout.",
      say: `Four new tests cover the day-two story, identical runs, the refusal and the command line. The kit's original thirteen drift tests still pass, including the check that the Python and PowerShell clients produce the same finding IDs. One caution: these run over fictional exports, and two inputs, the manager expansion and the SailPoint employee ID attribute, are still on the verify list. And expect a burst of High findings in a real estate's first month. Book 3 calls that the measurement working.`,
      detail: `tests/python/test_drift_compare.py, 4 tests: the day-two story, identical runs, the refusal and the command line. The kit's original 13 drift tests pass unchanged, including the shared finding IDs with the PowerShell client. The "Illustrative code" callout: the commands run over fictional exports. They show the join and the comparison, not that your HR extract, Graph or ISC return these shapes; the manager expansion and the ISC employee ID attribute in particular are on the verify list. Expect a burst of High findings in the first month of a real run: Book 03 calls that the measurement working.`,
      cite: [],
      ref: "“The tests”; “Illustrative code”",
    },
    {
      part: "What", title: "The verified facts behind the join",
      body: [
        { table: { head: ["Item", "Value"], w: [2.9, 9.25], rows: [
          ["List users", "GET /v1.0/users, User.Read.All (application)"],
          ["Manager", "GET /users?$expand=manager documented; application permissions not supported on GET /users/{id}/manager"],
          ["Directory audit", "GET /v1.0/auditLogs/directoryAudits, AuditLog.Read.All (application); available in US Government L4 and L5"],
          ["ISC identities", "POST /v3/search, identities index, sp:search:read; searchAfter past 10,000"],
          ["Uncorrelated accounts", "GET /v3/accounts with the uncorrelated filter (eq), idn:accounts:read; limit at most 250"],
          ["GCC endpoints", "Microsoft 365 GCC uses the worldwide graph.microsoft.com"],
        ] }, pt: 13.5 },
      ],
      sources: "Sources: Learn, List users; List manager; List directoryAudits; Graph national cloud deployments; ISC v3 searchPost, listAccounts, limit. Chapter 06, “The verified facts.”",
      say: `The facts the join depends on, read on November first. Graph lists users with User dot Read dot All. For the manager, Learn documents expanding it on the users list, while the manager endpoint itself doesn't support application permissions. The audit needs AuditLog dot Read dot All and is available in the government clouds. SailPoint identities come from Search, paged past ten thousand, and uncorrelated accounts from the Accounts API with a filter, at most two hundred fifty a page. And GCC uses the worldwide Graph host.`,
      detail: `List users: GET /v1.0/users, User.Read.All (application). Manager: GET /users?$expand=manager documented; application permissions not supported on GET /users/{id}/manager. Directory audit: GET /v1.0/auditLogs/directoryAudits, AuditLog.Read.All (application); available in US Government L4 and L5. ISC identities: POST /v3/search, identities index, sp:search:read; searchAfter past 10,000. Uncorrelated accounts: GET /v3/accounts with the uncorrelated filter (eq), idn:accounts:read; limit at most 250. GCC endpoints: Microsoft 365 GCC uses the worldwide graph.microsoft.com.`,
      cite: ["ttm06-users", "ttm06-manager", "ttm06-audit", "ttm06-search", "ttm06-accounts", "ttm06-deployments"],
      ref: "“The verified facts”",
    },
    {
      part: "What", title: "What couldn't be verified about the join",
      body: [
        { bullets: [
          "**$expand=manager under an application permission** (verify list, item 14)",
          "**Which ISC identity attribute holds the HR key:** employeeNumber or attributes.employeeId (verify list, item 9)",
          "**The Entra audit's property display names** the client watches: Department, EmployeeId and others (verify list, item 15)",
        ], label: "Open points", color: "red", pt: 16 },
        { callout: "Lab 2 records whether Graph rejects $expand=manager, and Chapter 03's Lab 2 finds where your tenant keeps the HR key.", label: "Where they're settled: ", icon: "FaRoute", color: "teal" },
      ],
      sources: "Sources: Learn, List manager. Chapter 06, “What couldn't be verified”; “Lab 2,” step 3; Chapter 03, “Lab 2,” step 4.",
      say: `Three inputs aren't settled. Whether expanding the manager works under an application permission. Which SailPoint identity attribute holds the HR key, the employee number or an employee ID attribute. And the exact property names the Entra audit uses for the changes the client watches, such as department. Each is on the kit's verify list. Lab 2 records whether Graph rejects the manager expansion, and Chapter 3's lab finds where your tenant keeps the HR key.`,
      detail: `What couldn't be verified. $expand=manager under an application permission: verify list, item 14. Which ISC identity attribute holds the HR key (employeeNumber or attributes.employeeId): verify list, item 9. The Entra audit's property display names the client watches (Department, EmployeeId and others): verify list, item 15. Lab 2, step 3: if Graph rejects $expand=manager under the application permission, record it (verify list, item 14).`,
      cite: ["ttm06-manager"],
      ref: "“What couldn't be verified”",
    },
    {
      part: "What", title: "What the reconciliation proves, and for whom",
      body: [
        { table: { head: ["What the output proves", "Requirement it supports", "Who keeps it"], w: [4.7, 4.2, 3.25], rows: [
          ["Every active HR record has its accounts, every terminated one has none enabled, and every enabled account has a person", "NIST SP 800-53 AC-2 (account management) at Moderate; Book 03's leaver and orphan measures", "The drift JSON and CSV of each run"],
          ["Drift is measured on a schedule, and what changed between runs is reported", "CA-7 (continuous monitoring) and SI-4 at Moderate", "The comparison output, kept with each run"],
          ["What wasn't measured is said, not implied", "CA-7; Book 13's detection coverage measure", "not_computed in every run; the comparison's refusal"],
        ] }, pt: 13 },
      ],
      sources: "Sources: NIST SP 800-53B Moderate baseline (release 5.2.0). Chapter 06, “Federal requirements and evidence.”",
      say: `What this proves. Every active HR record has its accounts, every terminated one has none enabled, and every enabled account belongs to a person: account management, AC-2, and Book 3's leaver and orphan measures, kept as each run's output. Drift is measured on a schedule, and what changed between runs is reported: continuous monitoring and system monitoring. And what wasn't measured is stated, not implied, which feeds Book 13's detection coverage measure. The not-computed list and the refusal are that evidence.`,
      detail: `Every active HR record has its accounts, every terminated one has none enabled, and every enabled account has a person: NIST SP 800-53 AC-2 (account management) at Moderate; Book 03's leaver and orphan measures; kept as the drift JSON and CSV of each run. Drift is measured on a schedule, and what changed between runs is reported: CA-7 (continuous monitoring) and SI-4 at Moderate; kept as the comparison output, with each run. What wasn't measured is said, not implied: CA-7; Book 13's detection coverage measure; kept as not_computed in every run and the comparison's refusal.`,
      cite: ["ttm06-moderate"],
      ref: "“Federal requirements and evidence”",
    },
    {
      part: "Who", title: "Who schedules it and who reads it",
      body: [
        { cards: [
          { title: "Developers", text: "Who schedule the reconciliation and the comparison. Read Python and CSV. No tenant until Lab 2", color: "navy" },
          { title: "Identity engineers", text: "Who set the estate's settings: ISC_EMPLOYEE_ID_ATTRIBUTE, ISC_AUTHORITATIVE_SOURCES, ALLOWED_WRITER_APP_IDS", color: "teal" },
          { title: "The identity data steward", text: "Who reads the output, triages the first month's burst by class and severity, and sends decisions to people", color: "amber" },
        ], pt: 14 },
        { callout: "the reads from Chapter 03 only: User.Read.All (and AuditLog.Read.All if the audit is read) with a certificate; sp:search:read and idn:accounts:read. Checked with kit_calls.py --granted.", label: "What it may read: ", icon: "FaUserShield", color: "navy" },
      ],
      sources: "Sources: Chapter 06, “Goal and audience,” “Checklist,” “Lab 2,” step 1, “Dangers.”",
      say: `Who's involved? Developers and identity engineers who schedule the reconciliation and set the estate's settings: which SailPoint attribute holds the employee ID, which sources are authoritative, and which apps are allowed to write. And the identity data steward, who reads the output, triages the first month's burst by class and severity, and sends decisions to the right people. The client reads only what Chapter 3 granted: Graph user and audit reads with a certificate, and two SailPoint read scopes.`,
      detail: `Audience: developers and identity engineers who schedule the reconciliation, and the identity data steward who reads its output. You should read Python and CSV. You don't need a tenant until Lab 2. Checklist: ISC_EMPLOYEE_ID_ATTRIBUTE, ISC_AUTHORITATIVE_SOURCES and ALLOWED_WRITER_APP_IDS are set for this estate. Dangers: the first month's burst read as failure; triage by class and severity. Lab 2, step 1: grant the reads from Chapter 03: User.Read.All (and AuditLog.Read.All if you read the audit) on a test app registration with a certificate; sp:search:read and idn:accounts:read on a sandbox API client. Check both with kit_calls.py --granted.`,
      cite: [],
      ref: "“Goal and audience”; “Checklist”; “Lab 2,” step 1",
    },
    {
      part: "How", title: "Lab 1: day one and day two",
      body: [
        { terminal: "06-1" },
        { cols: [[{ terminal: "06-2", lines: "1,3-9" }], [{ terminal: "06-3", lines: "1,14-15"}]] },
        { lead: "Day one: Erin's Entra department is Finance where HR says HR; the audit shows a help desk administrator made the change. Carol, terminated, is still enabled." },
      ],
      sources: "Sources: examples/servicenow-sailpoint (fictional fixtures). Chapter 06, “Lab 1: fixtures, no tenant,” steps 1–3.",
      say: `Lab 1 tells the two-day story. Seventeen tests pass. Day one: run the reconciliation over all the fixtures, including the audit. It counts four attribute drifts, two missing identities, three orphan accounts, two stale accesses and one unauthorized write, and lists credential and schema drift as not computed. In the CSV, Erin's Entra department is Finance where HR says HR, and the audit shows a help desk administrator made the change. Carol, terminated, is still enabled. Day two, after HR's correction: exactly the same counts. The totals hide what moved.`,
      detail: `Work in examples/servicenow-sailpoint, with Python 3.10 or later, pytest and requests. Step 1: python -m pytest tests/python/test_identity_drift.py tests/python/test_drift_compare.py -q gives 17 passed. Step 2, day one: python clients/python/identity_drift.py --hr-csv tests/fixtures/hr_extract.csv --config tests/fixtures/config.fixtures.json --graph-users-json tests/fixtures/graph_users.json --isc-identities-json tests/fixtures/isc_identities.json --isc-accounts-json tests/fixtures/isc_uncorrelated_accounts.json --entra-audit-json tests/fixtures/entra_audit.json --out-json out/day1.json --out-csv out/day1.csv. The summary counts attribute_drift 4, missing_identity 2, orphan_account 3, stale_access 2, unauthorized_write 1, and lists credential and schema drift under not_computed. Open out/day1.csv: Erin's Entra ID department is Finance where HR says HR, and the audit shows a help desk administrator made that change. Carol, terminated, is still enabled in Entra ID and in Active Directory. Step 3, day two, after HR's correction: the same command with tests/fixtures/hr_extract_day2.csv and out/day2.json, out/day2.csv. The same counts. The totals hide what moved. Re-run on November 1, 2026 for this tour: same output.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 1–3",
    },
    {
      part: "How", title: "Lab 1: comparing the days, and the refusal",
      body: [
        { terminal: "06-4" },
        { terminal: "06-5", lines: "1,12,17-19" },
        { lead: "The unauthorized write persists: HR agreeing afterwards doesn't make the write authorized, and a person decides it." },
      ],
      sources: "Sources: examples/servicenow-sailpoint (fictional fixtures). Chapter 06, “Lab 1: fixtures, no tenant,” steps 4–5.",
      say: `Now compare the two days. One new, eleven persisting, one resolved. Entra ID now matches HR, so that finding is resolved, but SailPoint still holds the old value, so a new finding opens there. And notice what persists: the unauthorized write. HR agreeing afterwards doesn't make a hand-typed change authorized; a person decides that. Last, run day two without the audit and compare. The tool refuses, exiting with an error. Without that refusal, the unauthorized write would have looked resolved.`,
      detail: `Step 4, compare the two days: python clients/python/drift_compare.py --previous out/day1.json --current out/day2.json prints 1 new, 11 persisting, 1 resolved; new 6456e1f12a60e6be attribute_drift isc E1004 department: expected 'Finance', observed 'HR'; resolved 1f0e34ebf049f163 attribute_drift entra E1004 department: expected 'HR', observed 'Finance'; Resolved findings are leads for the re-read; their records close only on reread_verification.py. Entra ID now matches HR, so that finding is resolved; ISC still holds the old value until the next aggregation, so a new one opens. The unauthorized write persists: HR agreeing afterwards doesn't make the write authorized, and a person decides that finding. Step 5, see the refusal: run day two without the audit (the same command without --entra-audit-json, to out/day2-noaudit.json and out/day2-noaudit.csv), then python clients/python/drift_compare.py --previous out/day1.json --current out/day2-noaudit.json. The first command lists unauthorized_write under not_computed. The second prints error: The runs computed different drift classes (...) and exits 2: without the refusal, the unauthorized write would have shown as resolved.`,
      cite: [],
      ref: "“Lab 1: fixtures, no tenant,” steps 4–5",
    },
    {
      part: "How", title: "Lab 2: a live run on synthetic data",
      body: [
        { steps: [
          { title: "Grant the reads", text: "from Chapter 03, on a test app registration with a certificate and a sandbox API client; check both with kit_calls.py --granted" },
          { title: "Write a synthetic HR extract", text: "whose employeeId values match test users, with one terminated user still enabled and one department that differs" },
          { title: "Run the client live", text: "with --config and, for the audit, --include-audit <yesterday's date>; compare its counts with a hand count of the extract. If Graph rejects $expand=manager, record it (item 14)" },
          { title: "Run it again the next day", text: "after changing one department, and compare the runs. Push nothing: --push-to-servicenow without --apply only lists what it would send" },
          { title: "Back it out", text: "Delete out, the synthetic extract, the app's permissions and certificate, and the sandbox API client" },
        ], pt: 13.5 },
        { callout: "a test Entra tenant (worldwide or GCC) and a SailPoint sandbox, with synthetic HR data like the fixtures, never production. Not run by the authors.", label: "Where: ", icon: "FaTriangleExclamation", color: "red" },
      ],
      sources: "Sources: Learn, List users; List manager; List directoryAudits; ISC v3 searchPost, listAccounts. Chapter 06, “Lab 2: a test tenant and a SailPoint sandbox.”",
      say: `Lab 2 runs the client live, on a test tenant and a SailPoint sandbox with synthetic data, never production; the authors haven't run it. Grant only Chapter 3's reads. Write a small HR extract that matches test users, with one terminated user still enabled and one department that differs. Run the client, and check its counts against a hand count. Record whether Graph rejects the manager expansion. Run again the next day after changing one department, and compare. Push nothing. Then delete everything.`,
      detail: `Not run by the authors. Use a test Entra tenant in the worldwide or GCC cloud and a SailPoint sandbox, with synthetic HR data like the fixtures, never production. 1 Grant the reads from Chapter 03: User.Read.All (and AuditLog.Read.All if you read the audit) on a test app registration with a certificate; sp:search:read and idn:accounts:read on a sandbox API client. Check both with kit_calls.py --granted. 2 Write a synthetic HR extract whose employeeId values match test users, with one terminated user still enabled and one department that differs. 3 Run the client live with --config and, for the audit, --include-audit <yesterday's date>. Compare its counts with a hand count of the extract (the implementation example's proof step 4). If Graph rejects $expand=manager under the application permission, record it (verify list, item 14). 4 Run it again the next day after changing one department in the test HR extract, and compare the runs. Push nothing: --push-to-servicenow without --apply only lists what it would send. 5 Back it out: delete out, the synthetic extract, the app registration's permissions and certificate, and the sandbox API client.`,
      cite: ["ttm06-users", "ttm06-manager", "ttm06-audit", "ttm06-search", "ttm06-accounts"],
      ref: "“Lab 2: a test tenant and a SailPoint sandbox”",
    },
    {
      part: "How", title: "Dangers, and the guard for each",
      body: [
        { table: { head: ["Danger", "What happens", "The guard"], w: [3.5, 4.3, 4.35], rows: [
          ["A class one run skipped looks resolved", "Unauthorized writes “disappear” the night the audit read fails", "drift_compare.py refuses runs with different computed classes"],
          ["A resolved finding closes the record", "Drift that left the measurement, not the estate, is called fixed", "Resolved findings are leads; only the re-read closes"],
          ["Pushing every finding every night", "The tracker fills with repeats", "Push only the comparison's new findings; de-duplication counts the rest"],
          ["The first month's burst read as failure", "The pipeline is turned off before it is tuned", "Book 03 expects it; triage by class and severity"],
          ["A guest or the HR source's own accounts flagged", "Noise hides real drift", "Guests excluded; ISC_AUTHORITATIVE_SOURCES and ALLOWED_WRITER_APP_IDS"],
          ["An HR extract with names in a shared folder", "Personal data spreads", "The run folder is evidence: keep it where HR data is allowed; delete lab copies"],
        ] }, pt: 12 },
      ],
      sources: "Sources: Chapter 06, “Dangers.”",
      say: `The dangers. A class one run skipped would look resolved, so unauthorized writes would vanish the night the audit read fails; the refusal stops that. A resolved finding must never close a record, because drift can leave the measurement without leaving the estate. Pushing every finding every night fills the tracker, so push only what's new. The first month's burst isn't failure; triage it. Guests and the HR source's own accounts are excluded as noise. And an HR extract is personal data: keep it where HR data is allowed.`,
      detail: `A class one run skipped looks resolved: unauthorized writes "disappear" the night the audit read fails; guard: drift_compare.py refuses runs with different computed classes. A resolved finding closes the record: drift that left the measurement, not the estate, is called fixed; guard: resolved findings are leads; only the re-read closes. Pushing every finding every night: the tracker fills with repeats; guard: push only the comparison's new findings; the de-duplication counts the rest. The first month's burst read as failure: the pipeline is turned off before it is tuned; guard: Book 03 expects it; triage by class and severity. A guest or the HR source's own accounts flagged: noise hides real drift; guard: guests are excluded; ISC_AUTHORITATIVE_SOURCES and ALLOWED_WRITER_APP_IDS. An HR extract with names in a shared folder: personal data spreads; guard: the run folder is evidence; keep it where the HR data is allowed, and delete lab copies.`,
      cite: [],
      ref: "“Dangers”",
    },
    {
      part: "How", title: "Done when: the reconciliation checklist",
      body: [
        { bullets: [
          "The HR extract's statuses map to active and separated as the client expects",
          "ISC_EMPLOYEE_ID_ATTRIBUTE, ISC_AUTHORITATIVE_SOURCES and ALLOWED_WRITER_APP_IDS are set for this estate",
          "A live run's counts matched a hand count on a synthetic extract",
          "The scheduled job compares each run with the last and pushes only new findings",
          "Every run's computed classes are the same, or the comparison is rerun with the same inputs",
          "test_identity_drift.py and test_drift_compare.py pass, and the PowerShell client's finding IDs still match",
        ], label: "Checklist", color: "navy", pt: 14.5 },
        { callout: "Chapter 07 turns closed findings into the evidence records and the hash-chained package an ISSO keeps.", label: "Next: ", icon: "FaRoute", color: "amber" },
      ],
      sources: "Sources: Chapter 06, “Checklist,” “Continue the book.”",
      say: `Done looks like this. The HR extract's statuses map the way the client expects. The three estate settings are set. A live run matched a hand count on synthetic data. The scheduled job compares each run with the last and pushes only new findings. Every run computes the same classes, or the comparison is rerun. And the tests pass, with the PowerShell client's IDs still matching. Next, Chapter 7 turns closed findings into the evidence an I S S O keeps. Thanks for watching.`,
      detail: `Checklist: the HR extract's statuses map to active and separated as the client expects. ISC_EMPLOYEE_ID_ATTRIBUTE, ISC_AUTHORITATIVE_SOURCES and ALLOWED_WRITER_APP_IDS are set for this estate. A live run's counts matched a hand count on a synthetic extract. The scheduled job compares each run with the last and pushes only new findings. Every run's computed classes are the same, or the comparison is rerun with the same inputs. test_identity_drift.py and test_drift_compare.py pass, and the PowerShell client's finding IDs still match. Next: Chapter 07 — Evidence Records for Book 13 and the ISSO.`,
      cite: [],
      ref: "“Checklist”; “Continue the book”",
    },
  ],
});
