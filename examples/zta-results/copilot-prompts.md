# Copilot prompts for Zero Trust Assessment reviews and exceptions

Use these prompts at work to draft the two files the kit reads besides the tool's export: the manual reviews of Investigate results (`reviews.csv`) and the accepted findings (`exceptions.csv`). Each prompt is ready to copy. Paste it into Copilot, then paste what it asks for.

The kit reads what the Zero Trust Assessment wrote. The reviews and exceptions are the agency's decisions, so you write them at work, from [`templates/reviews.template.csv`](templates/reviews.template.csv) and [`templates/exceptions.template.csv`](templates/exceptions.template.csv).

## Before you use Copilot

- **Use only your agency's approved tools.** Use Microsoft 365 Copilot Chat signed in with your work account. If your license shows a Work and Web choice, choose Work. Use GitHub Copilot only in a repository your agency hosts inside its boundary. Never use a personal account, a personal repository or a public repository.
- **Check what your agency allows.** The report, the export folder and the kit's outputs describe where the tenant is weak. Microsoft says to share them only with authorized personnel. Ask your ISSO before you paste any of it into Copilot; paste test IDs and titles, never the tool's result text, object names or tenant IDs.
- **Copilot drafts. You decide.** A suggestion is not a review, an approval or evidence. The reviewer named in `reviews.csv` checks the tenant; the CISO or the authorizing official approves each exception.
- **Nothing comes back to the public workbook.** Your reviews, exceptions, exports and registers stay inside your agency.

## Prompt 1: draft the review record for Investigate results

```text
I am reviewing Zero Trust Assessment results with the status Investigate. For each test below,
draft one CSV row with the columns testId,decision,reviewer,reviewedOn,note. Leave decision as
<confirmed | dismissed> and reviewer as <role>: a person decides those after checking the tenant.
In note, write the one check the reviewer should make in the admin center to decide, in plain words.
Don't invent results. Tests (ID and title):
[paste the testId and title columns of the Investigate rows from results.csv]
```

## Prompt 2: check an exception against the approval rule

```text
These are proposed exceptions for Zero Trust Assessment findings, as CSV with the columns
testId,approverRole,approvedOn,expires,rationale,compensatingControl. Check each row against these
rules and list every row that breaks one, with the rule:
1. An exception with an expires date is approved by the CISO (or the authorizing official).
2. An exception with no expires date is a standing risk acceptance and is approved by the
   authorizing official only.
3. An expires date in the past is a lapsed acceptance: renew it or remediate the finding.
4. The rationale says why the finding is accepted for now, not that it is fixed.
5. compensatingControl names a control with its own evidence, or says none.
Don't approve anything. Rows:
[paste exceptions.csv]
```

## Prompt 3: explain a finding family to its owner

```text
Explain to an engineer, in five sentences or fewer, why this Zero Trust Assessment finding matters,
what attack it makes easier, and what evidence would show it is ready for closure. Use only what
I paste; say so if something is missing. Finding:
[paste one row of register.csv: title, family, attack path, readyForClosureEvidence]
```
