# Copilot agent pack: Day-Two Automation Builder

> **Status: illustrative.** The pack has been checked against Microsoft's Agent Builder limits, but not yet built and run in a live tenant. Microsoft's facts were checked against Microsoft Learn on October 28, 2026. The pack isn't an endorsement of any product, and no agency has adopted it.

**Download:** [copilot-agent-pack.zip](https://whalermike.github.io/modernization-workbook/downloads/copilot-agent-pack.zip), rebuilt from this folder on every site deploy.

This pack turns Microsoft 365 Copilot into a drafting and review assistant for the method in [Book 15, Chapter 13 — Building Day-Two Automation In-House](../../docs/books/b15-day2-operations/13-building-day-two-automation-in-house.md). It's for an agency whose only approved AI tool is Copilot.

You can't retrain Copilot's model. What you can do is build a Copilot **agent**: a saved set of instructions, plus optional knowledge files, that Copilot follows every time. The agent drafts code, tests, review records and change-record text. It never runs code and never touches a system. A person reviews, tests and approves everything, which is the human-in-the-loop control the chapter requires.

Use the agent only under the agency's generative-AI policy (OMB M-25-21, Section 3(b)(iv)). If you aren't sure Copilot agents are covered, ask the agency's Chief AI Officer before you build one. Template 5 in `knowledge/03-templates.txt` drafts the note for them.

## What's in the pack

```
examples/copilot-agent-pack/
  README.md                  this file: setup and limits
  agent/name.txt             agent name (Agent Builder allows 30 characters)
  agent/description.txt      description (1,000 characters)
  agent/instructions.txt     instructions (8,000 characters): the rules, the path, how to answer
  agent/starter-prompts.md   six starter prompts, title and text
  knowledge/01-method.txt    the method, condensed from Chapter 13
  knowledge/02-gate1-review-checklist.txt
  knowledge/03-templates.txt design note, review record, ATF test plan, change record, AI-use note
  knowledge/04-patterns.txt  patterns from the workbook's example kits
  acceptance-test.md         17 tests to run before anyone relies on the agent
  tests/test_pack.py         checks the limits, file types and wording (pytest)
```

The instructions carry the whole method by themselves, and the knowledge files add detail. That matters in government tenants, because which knowledge sources an agent can use depends on the cloud and the license (see the next section).

## Before you start: what your tenant allows

| Question | Why it matters |
|---|---|
| Do you see **New agent** (or **Create an agent**) in Copilot Chat? | Agent Builder is available in GCC and GCC High, but not in DoD. Your administrator can also turn it off. If you don't see it, use [Option C](#option-c-no-agent-builder). |
| Do you have a **Microsoft 365 Copilot license**, or only the free Copilot Chat? | Without a license, an agent can use its instructions but not SharePoint or OneDrive knowledge. With a license, it can use SharePoint and OneDrive files as knowledge. |
| Is the tenant GCC? | GCC doesn't support **uploaded** (embedded) files as knowledge. Put the knowledge files in OneDrive or SharePoint and select them from there instead. Pay-as-you-go billing, which commercial tenants can use to add knowledge without a license, isn't available in GCC or GCC High. |
| Is web grounding on? | It's off by default in government clouds, so don't rely on the agent reading the public workbook site. |

Sources: Microsoft Learn, [Agent Builder regional availability](https://learn.microsoft.com/microsoft-365/copilot/extensibility/agent-builder-regional-availability), [Add knowledge sources in Agent Builder](https://learn.microsoft.com/microsoft-365/copilot/extensibility/agent-builder-add-knowledge), [Agent capabilities and licensing models](https://learn.microsoft.com/microsoft-365/copilot/extensibility/prerequisites#agent-capabilities-and-licensing-models), and the [Microsoft Copilot service description](https://learn.microsoft.com/office365/servicedescriptions/office-365-platform-service-description/microsoft-365-copilot#feature-availability) (all accessed October 28, 2026). Microsoft changes these often, so check them again before you plan around them.

## Option A: Agent with instructions only (any Copilot Chat user with Agent Builder)

1. In Copilot Chat, select **New agent**, then **Skip to configure**.
2. **Name:** paste `agent/name.txt`.
3. **Description:** paste `agent/description.txt`.
4. **Instructions:** paste all of `agent/instructions.txt`.
5. **Starter prompts:** add the six from `agent/starter-prompts.md`, each with its title and prompt.
6. Leave **Knowledge** empty. Turn off web search and any "reference people" option. The agent doesn't need them.
7. Select **Create**, then run [the acceptance test](acceptance-test.md) and mark T17 "N/A".

## Option B: Agent with knowledge files (Microsoft 365 Copilot license)

1. Do Option A steps 1 to 5.
2. Copy the four files in `knowledge/` to a OneDrive or SharePoint folder that only the team can reach. Agent Builder reads `.txt` files.
3. Under **Knowledge**, browse to the folder and select the four files. In GCC, use this route; uploading files from your device isn't supported there. Outside GCC, uploading them directly also works.
4. Turn on **Only use specified sources**. It makes the agent prefer your files for lookups; it doesn't block general knowledge.
5. Wait until the files no longer show **Preparing**, then run the whole [acceptance test](acceptance-test.md), including T17.

Don't add files that hold agency data. Anyone who can use the agent sees answers based on its knowledge.

## Option C: No Agent Builder

Start a new Copilot Chat. Paste `agent/instructions.txt` as your first message, adding "Follow these instructions for the rest of this chat." Then ask your question. You have to do this in every new chat. Run the BLOCKER tests (T1 to T6) once, so you know the pasted instructions hold.

## What the agent does and doesn't do

| It does | It doesn't |
|---|---|
| Draft scoped-application scripts, ATF test outlines, read-only Graph checks and synthetic fixtures | Run code, connect to ServiceNow or Entra ID, or change anything |
| List every platform API it used, for you to verify against vendor documentation | Guarantee an API exists; assistants invent plausible ones |
| Review pasted code against the gate-1 checklist | Approve anything; the named reviewer and the change advisory board decide |
| Draft the review record, change record and AI-use note | Decide what the agency's AI policy allows; the Chief AI Officer does |
| Refuse real data in prompts, secrets in code, skipped gates and tests in production | Catch every mistake; it supports human review and doesn't replace it |

Microsoft notes that knowledge files aren't a safe place for instructions. Text in a knowledge file is treated as content, and anyone who can edit the file could change how the agent behaves. That's why the rules live in `instructions.txt`, and why the knowledge folder should be editable by the team only.

## Changing the pack

Edit the files here, not only in the agent, so the repository holds every version. Then:

```bash
python -m pytest examples/copilot-agent-pack/tests -q
```

After the tests pass, paste the new text into the agent and rerun the acceptance test. Record the run in its results table.

---

*Original content for project use.*
